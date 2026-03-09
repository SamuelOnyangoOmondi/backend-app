// Must load env first so Knex sees DATABASE_URL (see: backend/.env or .ENV)
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.ENV') });

// Use SUPABASE_DATABASE_URL to override Railway's auto-injected DATABASE_URL (from linked Postgres).
// Set SUPABASE_DATABASE_URL in Railway Variables with your Supabase connection string.
const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

module.exports = {
  development: {
    client: 'pg',
    connection: dbUrl || 'postgres://farmtopalm:farmtopalm_secret@localhost:5432/farmtopalm',
    migrations: { directory: './src/db/migrations', extension: 'cjs' },
  },
  production: {
    client: 'pg',
    connection: dbUrl,
    migrations: { directory: './src/db/migrations', extension: 'cjs' },
  },
};
