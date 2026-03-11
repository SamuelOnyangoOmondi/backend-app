#!/usr/bin/env node
/**
 * Fails fast in production if SUPABASE_DATABASE_URL is not set.
 * Railway auto-injects DATABASE_URL from linked Postgres; we need Supabase instead.
 */
if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_DATABASE_URL?.trim()) {
  console.error('');
  console.error('ERROR: SUPABASE_DATABASE_URL is not set.');
  console.error('');
  console.error('Add it in Railway → Backend service → Variables:');
  console.error('  Name:  SUPABASE_DATABASE_URL');
  console.error('  Value: Your Supabase connection string');
  console.error('');
  console.error('Get it from: Supabase Dashboard → Project Settings → Database → Connection string (Transaction pooler, port 6543)');
  console.error('');
  process.exit(1);
}
