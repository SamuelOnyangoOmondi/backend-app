#!/usr/bin/env node
/**
 * Test "Sync students from Supa School" endpoint.
 *
 * Prereqs:
 * - Backend running: npm run dev (or set API_BASE_URL to your Railway URL)
 * - Backend .env has SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (and optionally SUPABASE_SCHOOL_ID)
 * - For option A: backend DB seeded with activation code (npm run seed) so activate works
 *
 * Usage:
 *   node scripts/test-sync-students.mjs
 *   API_BASE_URL=https://your-app.railway.app node scripts/test-sync-students.mjs
 *
 * Uses activate to get a real terminal token, then GET /v1/supaschool/students.
 * Prints whether sync works and how many students were returned.
 */
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const BASE = process.env.API_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const SUPABASE_SCHOOL_ID = process.env.SUPABASE_SCHOOL_ID || '';

function signToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

async function main() {
  console.log('Testing Sync from Supa School');
  console.log('Base URL:', BASE);
  console.log('');

  let token;
  let schoolId = SUPABASE_SCHOOL_ID;

  // Try activate first (requires seeded DB with FARM-PALM-001)
  console.log('1. Getting terminal token (activate with FARM-PALM-001)...');
  const activateRes = await fetch(`${BASE.replace(/\/$/, '')}/v1/terminals/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activationCode: 'FARM-PALM-001' }),
  });

  if (activateRes.ok) {
    const data = await activateRes.json();
    token = data.token;
    schoolId = schoolId || data.schoolId;
    console.log('   OK. Token received, schoolId:', schoolId || '(from env)');
  } else {
    console.log('   Activate failed (', activateRes.status, '). Using test token with SUPABASE_SCHOOL_ID from env.');
    schoolId = schoolId || '00000000-0000-0000-0000-000000000000';
    token = signToken(
      { terminalId: 'test-sync', schoolId, typ: 'terminal' },
      JWT_SECRET
    );
  }

  console.log('');
  console.log('2. GET /v1/supaschool/students...');
  const res = await fetch(`${BASE.replace(/\/$/, '')}/v1/supaschool/students`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    console.error('   FAILED:', res.status, body.error || body);
    if (body.hint) console.error('   Hint:', body.hint);
    if (res.status === 404) {
      console.error('');
      console.error('   If backend is deployed, ensure the latest code is live (route is in src/index.ts).');
      console.error('   Check: curl', BASE + '/routes');
    }
    process.exit(1);
  }

  const students = body.students || [];
  console.log('   OK. Students returned:', students.length);
  if (students.length > 0) {
    console.log('');
    console.log('   First 3:');
    students.slice(0, 3).forEach((s, i) => {
      console.log('   ', i + 1, s.firstName, s.lastName, '| id:', s.id, '| admission:', s.admissionNumber || '-');
    });
  }
  console.log('');
  console.log('Sync from Supa School works.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
