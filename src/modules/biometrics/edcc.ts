import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db/knex.js';
import {
  edccHealthCheckBody,
  edccEnrollBody,
  edccIdentifyBody,
} from '../../shared/validation/schemas.js';
import { terminalAuth } from '../../shared/middleware/auth.js';
import { encrypt } from '../../shared/crypto/encrypt.js';
import { env } from '../../env.js';
import { matchPalm } from './edccMatcher.js';

export default async function (app: FastifyInstance) {
  /**
   * Health-check for EDCC service using raw images.
   * Validates payload; returns 200 if images are present.
   */
  app.post(
    '/v1/biometrics/edcc/health-check-image',
    { preHandler: terminalAuth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = edccHealthCheckBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body', details: parsed.error.message });
      }
      return reply.send({ ok: true });
    }
  );

  /**
   * EDCC enroll: store raw images alongside palm template for remote matching.
   * Finds existing palm template (from /v1/students/palm sync) and updates with rgb_image_enc, ir_image_enc.
   */
  app.post(
    '/v1/biometrics/edcc/enroll',
    { preHandler: terminalAuth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = edccEnrollBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body', details: parsed.error.message });
      }
      const schoolId = (req as any).schoolId;
      const { externalId, hand, rgbEnc, irEnc, quality, rgbImage, irImage } = parsed.data;
      const handNorm = hand.trim().toLowerCase();

      const student = await db('students')
        .where({ school_id: schoolId, external_id: externalId })
        .first();
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      const existing = await db('palm_templates')
        .where({ student_id: student.id, hand: handNorm })
        .first();
      if (!existing) {
        return reply.status(404).send({ error: 'Palm template not found; run palm sync first' });
      }

      const updates: Record<string, unknown> = { updated_at: new Date() };
      if (rgbImage && irImage) {
        const rgbBuf = Buffer.from(rgbImage, 'base64');
        const irBuf = Buffer.from(irImage, 'base64');
        updates.rgb_image_enc = encrypt(rgbBuf, env.BIOMETRIC_ENC_KEY);
        updates.ir_image_enc = encrypt(irBuf, env.BIOMETRIC_ENC_KEY);
      }

      await db('palm_templates').where({ id: existing.id }).update(updates);
      return reply.send({ id: existing.id });
    }
  );

  /**
   * EDCC identify: match palm against stored templates.
   * Uses feature-based 1:N matcher (normalized correlation). Replace with vendor EDCC/NPU SDK for production.
   */
  app.post(
    '/v1/biometrics/edcc/identify',
    { preHandler: terminalAuth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = edccIdentifyBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body', details: parsed.error.message });
      }
      const terminalId = (req as any).terminalId;
      const schoolId = (req as any).schoolId;
      const now = Date.now();
      const classId = parsed.data.classId ?? null;

      const probeRgb = Buffer.from(parsed.data.rgbEnc, 'base64');
      const probeIr = Buffer.from(parsed.data.irEnc, 'base64');
      const result = await matchPalm(schoolId, probeRgb, probeIr, classId);

      await db('palm_scan_events').insert({
        terminal_id: terminalId,
        school_id: schoolId,
        ts: now,
        match_status: result.matchStatus,
        student_id: result.studentId || null,
        external_id: result.externalId || null,
        confidence: result.confidence,
        source: 'edcc',
      });

      return reply.send({
        studentId: result.studentId || null,
        externalId: result.externalId || null,
        confidence: result.confidence,
        matchStatus: result.matchStatus,
        certaintyMode: result.certaintyMode ?? 'REQUIRES_CONFIRMATION',
      });
    }
  );
}
