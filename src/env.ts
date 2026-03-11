export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  /** Use SUPABASE_DATABASE_URL to override Railway's auto-injected DATABASE_URL (from linked Postgres). */
  DATABASE_URL: process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgres://farmtopalm:farmtopalm_secret@localhost:5432/farmtopalm',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
  BIOMETRIC_ENC_KEY: process.env.BIOMETRIC_ENC_KEY ?? '0123456789abcdef0123456789abcdef',
  /** SupaSchool Supabase: URL and service role key for writing attendance/meal records from device. */
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  /** Override: use this Supabase school ID when fetching students (fixes mismatch between Neon school_id and Supabase). */
  SUPABASE_SCHOOL_ID: process.env.SUPABASE_SCHOOL_ID ?? '',
  /** Public URL of this backend (e.g. https://your-app.up.railway.app). Returned to devices on activation so they use Supabase by default without manually entering the link. */
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL ?? process.env.API_BASE_URL ?? '',
};
