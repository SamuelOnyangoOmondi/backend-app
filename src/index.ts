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
import { handleGetStudents } from './modules/supaschool/students.js';
import { terminalAuth } from './shared/middleware/auth.js';

async function main() {
  const app = Fastify({ logger: true });
  const routesList: { method: string; url: string }[] = [];
  app.addHook('onRoute', (routeOptions) => {
    routesList.push({ method: routeOptions.method as string, url: routeOptions.url });
  });
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
  app.get('/v1/supaschool/students', { preHandler: terminalAuth }, handleGetStudents);

  app.get('/health', async () => ({ ok: true }));
  app.get('/', async () => ({ ok: true, message: 'FarmToPalm API. Use /health or /v1/...' }));
  // Debug: list all registered routes (proves what is deployed)
  app.get('/routes', async (_req, reply) => {
    const supaschool = routesList.filter((r) => r.url.includes('supaschool'));
    return reply.send({
      total: routesList.length,
      supaschoolRoutes: supaschool,
      allRoutes: routesList,
    });
  });

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`Backend listening on http://0.0.0.0:${env.PORT} (reachable on your LAN IP, e.g. http://192.168.1.128:3000)`);
  const hasStudents = routesList.some((r) => r.url === '/v1/supaschool/students' && r.method === 'GET');
  console.log(`GET /v1/supaschool/students registered: ${hasStudents}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
