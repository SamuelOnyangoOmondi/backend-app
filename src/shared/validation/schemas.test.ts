import { describe, it, expect } from 'vitest';
import {
  edccHealthCheckBody,
  edccEnrollBody,
  edccIdentifyBody,
  palmSyncBody,
} from './schemas.js';

describe('edccHealthCheckBody', () => {
  it('accepts valid rgb and ir images', () => {
    const result = edccHealthCheckBody.safeParse({
      rgbImage: Buffer.from('rgb').toString('base64'),
      irImage: Buffer.from('ir').toString('base64'),
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional format fields', () => {
    const result = edccHealthCheckBody.safeParse({
      rgbImage: Buffer.from('rgb').toString('base64'),
      irImage: Buffer.from('ir').toString('base64'),
      rgbFormat: 'raw',
      irFormat: 'raw',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing rgbImage', () => {
    const result = edccHealthCheckBody.safeParse({
      irImage: Buffer.from('ir').toString('base64'),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing irImage', () => {
    const result = edccHealthCheckBody.safeParse({
      rgbImage: Buffer.from('rgb').toString('base64'),
    });
    expect(result.success).toBe(false);
  });
});

describe('edccEnrollBody', () => {
  it('accepts valid enroll payload', () => {
    const result = edccEnrollBody.safeParse({
      externalId: 'student-123',
      hand: 'left',
      rgbEnc: Buffer.from('rgb').toString('base64'),
      irEnc: Buffer.from('ir').toString('base64'),
      quality: 85,
    });
    expect(result.success).toBe(true);
  });

  it('accepts non-UUID externalId', () => {
    const result = edccEnrollBody.safeParse({
      externalId: 'ADM-001',
      hand: 'right',
      rgbEnc: 'abc',
      irEnc: 'def',
      quality: 90,
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional raw images', () => {
    const result = edccEnrollBody.safeParse({
      externalId: 's1',
      hand: 'left',
      rgbEnc: 'a',
      irEnc: 'b',
      quality: 80,
      rgbImage: Buffer.from('img').toString('base64'),
      irImage: Buffer.from('img').toString('base64'),
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty externalId', () => {
    const result = edccEnrollBody.safeParse({
      externalId: '',
      hand: 'left',
      rgbEnc: 'a',
      irEnc: 'b',
      quality: 80,
    });
    expect(result.success).toBe(false);
  });
});

describe('edccIdentifyBody', () => {
  it('accepts valid identify payload', () => {
    const result = edccIdentifyBody.safeParse({
      rgbEnc: Buffer.from('rgb').toString('base64'),
      irEnc: Buffer.from('ir').toString('base64'),
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional raw images', () => {
    const result = edccIdentifyBody.safeParse({
      rgbEnc: 'a',
      irEnc: 'b',
      rgbImage: Buffer.from('x').toString('base64'),
      irImage: Buffer.from('y').toString('base64'),
    });
    expect(result.success).toBe(true);
  });
});

describe('palmSyncBody', () => {
  it('accepts non-UUID externalId', () => {
    const result = palmSyncBody.safeParse({
      externalId: 'ADM-001',
      hand: 'left',
      rgbEnc: 'a',
      irEnc: 'b',
      quality: 75,
    });
    expect(result.success).toBe(true);
  });

  it('accepts UUID externalId', () => {
    const result = palmSyncBody.safeParse({
      externalId: '550e8400-e29b-41d4-a716-446655440000',
      hand: 'right',
      rgbEnc: 'a',
      irEnc: 'b',
      quality: 80,
    });
    expect(result.success).toBe(true);
  });
});
