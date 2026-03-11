import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getSupabase } from '../../supabase/client.js';
import { terminalAuth } from '../../shared/middleware/auth.js';
import { env } from '../../env.js';

/**
 * GET /v1/supaschool/students
 * Returns students from Supa School (Supabase) for the terminal's school.
 * Used by the device to sync students so externalId = Supabase student id (for attendance/meal records).
 * Requires Supabase to be configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
export default async function (app: FastifyInstance) {
  /** Test Supabase write: try inserting attendance + meal for a student. No auth. GET /v1/supaschool/test-write?student_id=UUID&school_id=UUID */
  app.get('/v1/supaschool/test-write', async (req: FastifyRequest, reply: FastifyReply) => {
    const q = (req.query as Record<string, string | undefined>) ?? {};
    const studentId = q.student_id;
    const schoolId = q.school_id || env.SUPABASE_SCHOOL_ID;
    if (!studentId || !schoolId) {
      return reply.status(400).send({
        error: 'Missing student_id or school_id',
        hint: 'Add ?student_id=<uuid>&school_id=<uuid> (or set SUPABASE_SCHOOL_ID in .env)',
      });
    }
    const sb = getSupabase();
    if (!sb) {
      return reply.send({ ok: false, error: 'Supabase not configured' });
    }
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    try {
      const { error: attErr } = await sb.from('attendance_records').upsert(
        { student_id: studentId, school_id: schoolId, attendance_date: today, status: 'present', source: 'farm_to_feed', recorded_at: now },
        { onConflict: 'student_id,attendance_date', ignoreDuplicates: false }
      );
      const { error: mealErr } = await sb.from('meal_records').upsert(
        { student_id: studentId, school_id: schoolId, meal_date: today, meal_type: 'lunch', served: true, source: 'farm_to_feed', recorded_at: now },
        { onConflict: 'student_id,meal_date,meal_type', ignoreDuplicates: false }
      );
      if (attErr || mealErr) {
        return reply.send({
          ok: false,
          attendanceError: attErr?.message ?? null,
          mealError: mealErr?.message ?? null,
          hint: 'Check that student_id and school_id exist in Supabase (students.id, schools.id). Run Sync students from Supa School on device first.',
        });
      }
      return reply.send({ ok: true, message: 'Test write succeeded. Check SupaSchool student profile.' });
    } catch (e: any) {
      return reply.status(500).send({ ok: false, error: e?.message ?? String(e) });
    }
  });

  /** Debug endpoint: test Supabase connection. No auth. GET /v1/supaschool/debug */
  app.get('/v1/supaschool/debug', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const sb = getSupabase();
      if (!sb) {
        return reply.send({
          ok: false,
          error: 'Supabase not configured',
          hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway Variables',
        });
      }
      const { data: schools, error: schoolsErr } = await sb.from('schools').select('id, name').limit(5);
      const { data: studentsSample, error: studentsErr } = await sb.from('students').select('id, school_id, first_name').limit(2);
      return reply.send({
        ok: !schoolsErr && !studentsErr,
        schoolsError: schoolsErr ? { message: schoolsErr.message, code: schoolsErr.code } : null,
        studentsError: studentsErr ? { message: studentsErr.message, code: studentsErr.code } : null,
        schoolsCount: schools?.length ?? 0,
        studentsSample: studentsSample ?? [],
      });
    } catch (e: any) {
      return reply.status(500).send({
        ok: false,
        error: 'Debug endpoint threw',
        details: e?.message ?? String(e),
      });
    }
  });

  app.get('/v1/supaschool/students', { preHandler: terminalAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const sb = getSupabase();
    if (!sb) {
      return reply.status(503).send({
        error: 'Supa School bridge not configured',
        hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the Supa School project in backend .env',
      });
    }
    // Use SUPABASE_SCHOOL_ID if set (fixes Neon school_id ≠ Supabase school_id mismatch)
    const schoolId = env.SUPABASE_SCHOOL_ID || ((req as any).schoolId as string);
    const { data, error } = await sb
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('school_id', schoolId)
      .order('last_name', { ascending: true });

    if (error) {
      req.log?.error({ err: error, schoolId }, 'Supabase students query failed');
      return reply.status(502).send({
        error: 'Failed to fetch students',
        details: error.message,
        hint: 'Check SUPABASE_SERVICE_ROLE_KEY (use service_role, not anon). Ensure terminal schoolId exists in Supabase schools.',
      });
    }

    const students = (data ?? []).map((row: { id: string; first_name: string; last_name: string; admission_number: string }) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      admissionNumber: row.admission_number ?? '',
    }));

    return reply.send({ students });
  });
}
