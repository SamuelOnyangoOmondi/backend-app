import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt } from '../../shared/crypto/encrypt.js';
import { env } from '../../env.js';

const templates: any[] = [];
vi.mock('../../db/knex.js', () => ({
  db: vi.fn().mockImplementation((table: string) => {
    if (table === 'palm_templates') {
      return {
        join: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            select: vi.fn().mockImplementation(() => Promise.resolve([...templates])),
          }),
        }),
      };
    }
    return {};
  }),
}));

import { matchPalm } from './edccMatcher.js';

describe('edccMatcher', () => {
  const schoolId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    templates.length = 0;
  });

  it('returns NO_MATCH when no templates', async () => {
    const result = await matchPalm(schoolId, Buffer.from('abc'), Buffer.from('def'));
    expect(result.matchStatus).toBe('NO_MATCH');
    expect(result.studentId).toBe('');
    expect(result.confidence).toBe(0);
  });

  it('returns VERIFIED when probe matches template', async () => {
    const rgb = Buffer.from('identical-rgb-feature-bytes-123');
    const ir = Buffer.from('identical-ir-feature-bytes-456');
    const rgbEnc = encrypt(rgb, env.BIOMETRIC_ENC_KEY);
    const irEnc = encrypt(ir, env.BIOMETRIC_ENC_KEY);

    templates.push({
      id: 'tpl-1',
      student_id: 'stu-1',
      hand: 'left',
      rgb_enc: rgbEnc,
      ir_enc: irEnc,
      external_id: 'ext-1',
    });

    const result = await matchPalm(schoolId, rgb, ir);
    expect(result.matchStatus).toBe('VERIFIED');
    expect(result.studentId).toBe('stu-1');
    expect(result.externalId).toBe('ext-1');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('returns NO_MATCH when probe differs from template', async () => {
    const rgb = Buffer.from('template-rgb');
    const ir = Buffer.from('template-ir');
    const rgbEnc = encrypt(rgb, env.BIOMETRIC_ENC_KEY);
    const irEnc = encrypt(ir, env.BIOMETRIC_ENC_KEY);

    templates.push({
      id: 'tpl-1',
      student_id: 'stu-1',
      hand: 'left',
      rgb_enc: rgbEnc,
      ir_enc: irEnc,
      external_id: 'ext-1',
    });

    const result = await matchPalm(schoolId, Buffer.from('different-probe'), Buffer.from('different-ir'));
    expect(result.matchStatus).toBe('NO_MATCH');
    expect(result.studentId).toBe('');
  });
});
