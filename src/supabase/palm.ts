import { getSupabase } from './client.js';

/**
 * Write palm enrollment status to SupaSchool Supabase.
 * No template data - only metadata so profile can show "Palm registered".
 */
export async function upsertPalmEnrollmentToSupabase(
  studentId: string,
  deviceId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: true };

  const { error } = await sb
    .from('palm_enrollment')
    .upsert(
      {
        student_id: studentId,
        enrolled_at: new Date().toISOString(),
        device_id: deviceId ?? null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
