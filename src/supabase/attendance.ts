import { getSupabase } from './client.js';
import { env } from '../env.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function asUuidOrNull(s: string | null | undefined): string | null {
  if (!s || typeof s !== 'string') return null;
  return UUID_REGEX.test(s) ? s : null;
}

export type AttendanceEventItem = {
  eventId: string;
  studentId?: string;
  externalId?: string;
  terminalId: string;
  schoolId: string;
  ts: number;
  confidence: number;
};

/**
 * Resolve SupaSchool student id from event. Prefer externalId (device sends SupaSchool student uuid); fallback to studentId.
 */
function getSupabaseStudentId(e: AttendanceEventItem): string | null {
  const id = e.externalId ?? e.studentId ?? null;
  if (!id || typeof id !== 'string') return null;
  return id;
}

/**
 * Write device attendance events to SupaSchool Supabase as attendance_records.
 * One record per (student_id, attendance_date); status = 'present', source = 'farm_to_feed'.
 * No-op if Supabase is not configured.
 */
export async function upsertAttendanceToSupabase(
  events: AttendanceEventItem[],
  schoolIdFromToken: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: true };

  const schoolId = env.SUPABASE_SCHOOL_ID || schoolIdFromToken;

  const byKey = new Map<string, { student_id: string; school_id: string; attendance_date: string; device_id: string | null; ts: number }>();
  for (const e of events) {
    const studentId = getSupabaseStudentId(e);
    if (!studentId) continue;
    const attendanceDate = new Date(e.ts).toISOString().slice(0, 10);
    const key = `${studentId}:${attendanceDate}`;
    const existing = byKey.get(key);
    if (!existing || e.ts > existing.ts) {
      byKey.set(key, {
        student_id: studentId,
        school_id: schoolId,
        attendance_date: attendanceDate,
        device_id: asUuidOrNull(e.terminalId),
        ts: e.ts,
      });
    }
  }

  if (byKey.size === 0) {
    if (events.length > 0) {
      return { ok: false, error: 'No valid Supabase student IDs in events. Device must run Sync students from Supa School first, then enroll palms.' };
    }
    return { ok: true };
  }

  const rows = Array.from(byKey.values()).map((r) => ({
    student_id: r.student_id,
    school_id: r.school_id,
    class_id: null,
    attendance_date: r.attendance_date,
    status: 'present' as const,
    notes: null,
    recorded_by: null,
    source: 'farm_to_feed' as const,
    device_id: r.device_id,
  }));

  const { error } = await sb
    .from('attendance_records')
    .upsert(rows, { onConflict: 'student_id,attendance_date', ignoreDuplicates: false });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
