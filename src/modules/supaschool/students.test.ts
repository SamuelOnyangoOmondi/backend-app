import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { signToken } from '../../shared/crypto/jwt.js';
import { env } from '../../env.js';
import { terminalAuth } from '../../shared/middleware/auth.js';
import { handleGetStudents } from './students.js';

const mockGetSupabase = vi.fn();
vi.mock('../../supabase/client.js', () => ({
  getSupabase: () => mockGetSupabase(),
}));

const mockEnvSchoolId = vi.fn();
vi.mock('../../env.js', () => ({
  env: {
    get JWT_SECRET() {
      return process.env.JWT_SECRET ?? 'test-secret';
    },
    get SUPABASE_SCHOOL_ID() {
      return mockEnvSchoolId();
    },
  },
}));

describe('GET /v1/supaschool/students (sync from Supa School)', () => {
  let app: Awaited<ReturnType<typeof Fastify>>;
  let token: string;

  beforeAll(async () => {
    token = signToken(
      { terminalId: 'term-1', schoolId: '550e8400-e29b-41d4-a716-446655440000', typ: 'terminal' },
      env.JWT_SECRET
    );
    mockEnvSchoolId.mockReturnValue('');
    app = Fastify({ logger: false });
    await app.register(cors, { origin: true });
    app.get('/v1/supaschool/students', { preHandler: terminalAuth }, handleGetStudents);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/supaschool/students',
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.payload);
    expect(body.error).toMatch(/token|Missing/i);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/supaschool/students',
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.payload);
    expect(body.error).toBeDefined();
  });

  it('returns 503 when Supabase is not configured (getSupabase returns null)', async () => {
    mockGetSupabase.mockReturnValueOnce(null);
    const res = await app.inject({
      method: 'GET',
      url: '/v1/supaschool/students',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.payload);
    expect(body.error).toMatch(/not configured|bridge/i);
    expect(body.hint).toMatch(/SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i);
  });

  it('returns 502 when Supabase query fails', async () => {
    mockGetSupabase.mockReturnValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'Permission denied' } }),
          }),
        }),
      }),
    });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/supaschool/students',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(502);
    const body = JSON.parse(res.payload);
    expect(body.error).toMatch(/Failed to fetch students/i);
    expect(body.details).toBe('Permission denied');
  });

  it('returns 200 with students array when Supabase returns data', async () => {
    const mockStudents = [
      {
        id: 'stu-uuid-1',
        first_name: 'Jane',
        last_name: 'Doe',
        admission_number: 'ADM001',
      },
      {
        id: 'stu-uuid-2',
        first_name: 'John',
        last_name: 'Smith',
        admission_number: null,
      },
    ];
    mockGetSupabase.mockReturnValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockStudents, error: null }),
          }),
        }),
      }),
    });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/supaschool/students',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('students');
    expect(Array.isArray(body.students)).toBe(true);
    expect(body.students).toHaveLength(2);
    expect(body.students[0]).toEqual({
      id: 'stu-uuid-1',
      firstName: 'Jane',
      lastName: 'Doe',
      admissionNumber: 'ADM001',
    });
    expect(body.students[1]).toEqual({
      id: 'stu-uuid-2',
      firstName: 'John',
      lastName: 'Smith',
      admissionNumber: '',
    });
  });

  it('returns 200 with empty students array when Supabase returns no rows', async () => {
    mockGetSupabase.mockReturnValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/supaschool/students',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.students).toEqual([]);
  });
});
