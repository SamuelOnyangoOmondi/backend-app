import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getSupabase } from '../../supabase/client.js';
import { terminalAuth } from '../../shared/middleware/auth.js';

/**
 * GET /v1/supaschool/students
 * Returns students from Supa School (Supabase) for the terminal's school.
 * Used by the device to sync students so externalId = Supabase student id (for attendance/meal records).
 * Requires Supabase to be configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
export default async function (app: FastifyInstance) {
  app.get('/v1/supaschool/students', { preHandler: terminalAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const sb = getSupabase();
    if (!sb) {
      return reply.status(503).send({
        error: 'Supa School bridge not configured',
        hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the Supa School project in backend .env',
      });
    }
    const schoolId = (req as any).schoolId as string;
    const { data, error } = await sb
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('school_id', schoolId)
      .eq('is_active', true)
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
