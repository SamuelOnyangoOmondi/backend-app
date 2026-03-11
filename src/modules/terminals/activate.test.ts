import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';

vi.mock('../../db/knex.js', () => {
  const mockUpdate = vi.fn().mockResolvedValue(1);
  const mockFirst = vi.fn()
    // terminals row
    .mockResolvedValueOnce({ id: 'term-1', school_id: 'school-1', activation_code: 'FARM-PALM-001' })
    // schools row
    .mockResolvedValueOnce({ id: 'school-1', name: 'Test School' });
  const mockWhere = vi.fn().mockReturnValue({
    first: mockFirst,
    update: mockUpdate,
  });
  return {
    db: Object.assign(vi.fn().mockImplementation(() => ({ where: mockWhere })), {
      fn: { now: vi.fn().mockReturnValue('now') },
    }),
    __mockFirst: mockFirst,
  };
});

import activate from './activate.js';

describe('POST /v1/terminals/activate', () => {
  let app: Awaited<ReturnType<typeof Fastify>>;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(cors, { origin: true });
    await app.register(activate);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns apiBaseUrl derived from x-forwarded headers when BACKEND_PUBLIC_URL is empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/terminals/activate',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'backend-app-production-fa21.up.railway.app',
        'x-forwarded-proto': 'https',
      },
      payload: { activationCode: 'FARM-PALM-001' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.apiBaseUrl).toBe('https://backend-app-production-fa21.up.railway.app');
    expect(body.token).toBeTruthy();
  });
});

