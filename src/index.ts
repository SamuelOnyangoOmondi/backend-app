import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.ENV' }); // Windows: .ENV (capital) often used
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.js';
import activate from './modules/terminals/activate.js';
import heartbeat from './modules/terminals/heartbeat.js';
import students from './modules/students/students.js';
import palm from './modules/biometrics/palm.js';
import edcc from './modules/biometrics/edcc.js';
import nfc from './modules/students/nfc.js';
import attendanceBulk from './modules/events/attendance.js';
import mealsBulk from './modules/events/meals.js';
import daily from './modules/reports/daily.js';
import trends from './modules/reports/trends.js';
import exceptions from './modules/reports/exceptions.js';
import terminalsReport from './modules/reports/terminals.js';
import eventsCsv from './modules/exports/events.js';
import login from './modules/auth/login.js';
import supaschoolStudents from './modules/supaschool/students.js';
import { getSupabase } from './supabase/client.js';
import { terminalAuth } from './shared/middleware/auth.js';

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(activate);
  await app.register(heartbeat);
  await app.register(students);
  await app.register(palm);
  await app.register(edcc);
  await app.register(nfc);
  await app.register(attendanceBulk);
  await app.register(mealsBulk);
  await app.register(daily);
  await app.register(trends);
  await app.register(exceptions);
  await app.register(terminalsReport);
  await app.register(eventsCsv);
  await app.register(login);
  await app.register(supaschoolStudents);

  // Guarantee sync-students route exists (avoids 404 if plugin load order or build differs on Railway)
  app.get('/v1/supaschool/ping', async (_req, reply) => {
    return reply.send({ ok: true, message: 'Supa School routes active' });
  });
  app.get('/v1/supaschool/students', { preHandler: terminalAuth }, async (req: any, reply) => {
    const sb = getSupabase();
    if (!sb) {
      return reply.status(503).send({
        error: 'Supa School bridge not configured',
        hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway Variables',
      });
    }
    const schoolId = env.SUPABASE_SCHOOL_ID || req.schoolId;
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
        hint: 'Check SUPABASE_SERVICE_ROLE_KEY and terminal schoolId in Supabase schools.',
      });
    }
    const studentsList = (data ?? []).map((row: { id: string; first_name: string; last_name: string; admission_number: string }) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      admissionNumber: row.admission_number ?? '',
    }));
    return reply.send({ students: studentsList });
  });

  app.get('/health', async () => ({ ok: true }));
  app.get('/', async () => ({ ok: true, message: 'FarmToPalm API. Use /health or /v1/...' }));
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`Backend listening on http://0.0.0.0:${env.PORT} (reachable on your LAN IP, e.g. http://192.168.1.128:3000)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
