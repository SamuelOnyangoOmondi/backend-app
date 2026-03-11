import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db/knex.js';
import { palmBody, palmScanEventBody, palmSyncBody } from '../../shared/validation/schemas.js';
import { terminalAuth } from '../../shared/middleware/auth.js';
import { upsertPalmEnrollmentToSupabase } from '../../supabase/palm.js';
import crypto from 'crypto';
import { encrypt } from '../../shared/crypto/encrypt.js';
import { env } from '../../env.js';

export default async function (app: FastifyInstance) {
  /** Legacy: palm by student id in URL */
  app.post('/v1/students/:id/palm', { preHandler: terminalAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const studentId = (req.params as { id: string }).id;
    const parsed = palmBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body' });
    }
    const student = await db('students').where({ id: studentId }).first();
    if (!student) {
      return reply.status(404).send({ error: 'Student not found' });
    }
    const palmId = await insertPalmTemplate(studentId, parsed.data);
    const supabaseResult = await upsertPalmEnrollmentToSupabase(student.external_id ?? studentId, (req as any).terminalId);
    if (!supabaseResult.ok) {
      req.log?.error({ err: supabaseResult.error }, 'Supabase palm enrollment upsert failed');
      return reply.status(503).send({ error: 'Failed to update SupaSchool', details: supabaseResult.error });
    }
    return reply.send({ id: palmId });
  });

  /**
   * Palm sync from device: uses externalId (Supabase student id).
   * Finds or creates backend student, stores template, writes status to Supabase.
   */
  app.post('/v1/students/palm', { preHandler: terminalAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = palmSyncBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body' });
    }
    const schoolId = (req as any).schoolId;
    const terminalId = (req as any).terminalId;
    const { externalId, hand, rgbEnc, irEnc, quality } = parsed.data;

    let student = await db('students').where({ school_id: schoolId, external_id: externalId }).first();
    if (!student) {
      const [row] = await db('students')
        .insert({
          school_id: schoolId,
          external_id: externalId,
          name: '',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      student = row;
    }

    const palmId = await insertPalmTemplate(student.id, { hand, rgbEnc, irEnc, quality });

    const supabaseResult = await upsertPalmEnrollmentToSupabase(externalId, terminalId);
    if (!supabaseResult.ok) {
      req.log?.error({ err: supabaseResult.error, externalId }, 'Supabase palm enrollment upsert failed - SupaSchool will not show status');
      return reply.status(503).send({ error: 'Failed to update SupaSchool', details: supabaseResult.error });
    }

    return reply.send({ id: palmId });
  });

  /**
   * Log a palm scan attempt (local device match or EDCC remote match).
   * This enables unified audit reporting in `palm_scan_events`.
   */
  app.post('/v1/biometrics/palm/scan-event', { preHandler: terminalAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = palmScanEventBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.message });
    }
    const terminalId = (req as any).terminalId;
    const schoolId = (req as any).schoolId;
    const now = Date.now();
    const { matchStatus, studentId, externalId, confidence, source, ts } = parsed.data;

    await db('palm_scan_events').insert({
      terminal_id: terminalId,
      school_id: schoolId,
      ts: ts ?? now,
      match_status: matchStatus,
      student_id: studentId ?? null,
      external_id: externalId ?? null,
      confidence: confidence ?? null,
      source,
    });

    return reply.send({ ok: true });
  });
}

async function insertPalmTemplate(
  studentId: string,
  data: { hand: string; rgbEnc: string; irEnc: string; quality: number }
): Promise<string> {
  const rgbBuf = Buffer.from(data.rgbEnc, 'base64');
  const irBuf = Buffer.from(data.irEnc, 'base64');
  const rgbEnc = encrypt(rgbBuf, env.BIOMETRIC_ENC_KEY);
  const irEnc = encrypt(irBuf, env.BIOMETRIC_ENC_KEY);
  const id = crypto.randomUUID();
  await db('palm_templates').insert({
    id,
    student_id: studentId,
    hand: data.hand,
    rgb_enc: rgbEnc,
    ir_enc: irEnc,
    quality: data.quality,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return id;
}
