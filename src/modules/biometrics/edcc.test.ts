import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { signToken } from '../../shared/crypto/jwt.js';
import { env } from '../../env.js';

vi.mock('../../db/knex.js', () => {
  const mockInsert = vi.fn().mockResolvedValue(undefined);
  const mockUpdate = vi.fn().mockResolvedValue(1);
  const mockFirst = vi.fn().mockResolvedValue(null);
  const mockSelect = vi.fn().mockResolvedValue([]); // matcher gets empty templates
  const mockWhere = vi.fn().mockReturnValue({
    insert: mockInsert,
    first: mockFirst,
    update: mockUpdate,
    select: mockSelect,
  });
  const mockJoin = vi.fn().mockReturnValue({ where: mockWhere });
  return {
    db: vi.fn().mockImplementation((table: string) => {
      if (table === 'palm_templates') {
        return { join: mockJoin, where: mockWhere, insert: mockInsert };
      }
      return { where: mockWhere, insert: mockInsert };
    }),
    __mockFirst: mockFirst,
  };
});

import { __mockFirst } from '../../db/knex.js';
import edcc from './edcc.js';

describe('EDCC routes', () => {
  let app: Awaited<ReturnType<typeof Fastify>>;
  let token: string;

  beforeAll(async () => {
    token = signToken(
      { terminalId: 'term-1', schoolId: '550e8400-e29b-41d4-a716-446655440000', typ: 'terminal' },
      env.JWT_SECRET
    );
    app = Fastify({ logger: false });
    await app.register(cors, { origin: true });
    await app.register(edcc);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/biometrics/edcc/health-check-image', () => {
    it('returns 200 with valid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/health-check-image',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          rgbImage: Buffer.from('rgb').toString('base64'),
          irImage: Buffer.from('ir').toString('base64'),
        },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual({ ok: true });
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/health-check-image',
        payload: { rgbImage: 'a', irImage: 'b' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 with invalid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/health-check-image',
        headers: { Authorization: `Bearer ${token}` },
        payload: { rgbImage: 'a' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /v1/biometrics/edcc/enroll', () => {
    it('returns 404 when student not found', async () => {
      __mockFirst.mockResolvedValue(null);
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/enroll',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          externalId: 'unknown',
          hand: 'left',
          rgbEnc: Buffer.from('rgb').toString('base64'),
          irEnc: Buffer.from('ir').toString('base64'),
          quality: 85,
          rgbImage: Buffer.from('img').toString('base64'),
          irImage: Buffer.from('img').toString('base64'),
        },
      });
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).error).toContain('Student not found');
    });

    it('returns 404 when palm template not found', async () => {
      __mockFirst.mockResolvedValueOnce({ id: 'stu-1' }).mockResolvedValueOnce(null);
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/enroll',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          externalId: 's1',
          hand: 'left',
          rgbEnc: 'a',
          irEnc: 'b',
          quality: 80,
          rgbImage: Buffer.from('x').toString('base64'),
          irImage: Buffer.from('y').toString('base64'),
        },
      });
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).error).toContain('Palm template not found');
    });

    it('returns 200 and updates template when student and template exist', async () => {
      __mockFirst.mockResolvedValueOnce({ id: 'stu-1' }).mockResolvedValueOnce({ id: 'tpl-1' });
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/enroll',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          externalId: 's1',
          hand: 'left',
          rgbEnc: 'a',
          irEnc: 'b',
          quality: 85,
          rgbImage: Buffer.from('rgbimg').toString('base64'),
          irImage: Buffer.from('irimg').toString('base64'),
        },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual({ id: 'tpl-1' });
    });
  });

  describe('POST /v1/biometrics/edcc/identify', () => {
    it('returns 200 with NO_MATCH', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/biometrics/edcc/identify',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          rgbEnc: Buffer.from('rgb').toString('base64'),
          irEnc: Buffer.from('ir').toString('base64'),
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.matchStatus).toBe('NO_MATCH');
      expect(body.studentId == null || body.studentId === '').toBe(true);
      expect(body.confidence).toBe(0);
    });
  });
});
