import { z } from 'zod';

export const activateBody = z.object({
  activationCode: z.string().min(1),
  deviceMeta: z.record(z.unknown()).optional(),
});

export const heartbeatBody = z.object({
  terminalId: z.string().uuid(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  lastError: z.string().optional(),
});

export const createStudentBody = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  schoolId: z.string().uuid().optional(),
});

export const palmBody = z.object({
  hand: z.string(),
  rgbEnc: z.string(), // base64
  irEnc: z.string(),
  quality: z.number().int().min(0).max(100),
});

/** Palm sync from device: uses externalId (Supabase student id or admission number) */
export const palmSyncBody = z.object({
  externalId: z.string().min(1),
  hand: z.string(),
  rgbEnc: z.string(),
  irEnc: z.string(),
  quality: z.number().int().min(0).max(100),
});

/** EDCC health-check: raw images for service validation */
export const edccHealthCheckBody = z.object({
  rgbImage: z.string(), // base64
  irImage: z.string(),
  rgbFormat: z.string().nullable().optional(),
  irFormat: z.string().nullable().optional(),
});

/** EDCC enroll: palm template + optional raw images for remote matching */
export const edccEnrollBody = z.object({
  externalId: z.string().min(1),
  hand: z.string(),
  rgbEnc: z.string(),
  irEnc: z.string(),
  quality: z.number().int().min(0).max(100),
  rgbImage: z.string().optional(),
  irImage: z.string().optional(),
  rgbImageFormat: z.string().nullable().optional(),
  irImageFormat: z.string().nullable().optional(),
});

/** EDCC identify: features + optional raw images. classId restricts search when provided. */
export const edccIdentifyBody = z.object({
  rgbEnc: z.string(),
  irEnc: z.string(),
  rgbImage: z.string().optional(),
  irImage: z.string().optional(),
  rgbImageFormat: z.string().nullable().optional(),
  irImageFormat: z.string().nullable().optional(),
  classId: z.string().nullable().optional(),
});

/** Log a palm scan attempt from device (local or EDCC). */
export const palmScanEventBody = z.object({
  matchStatus: z.enum(['VERIFIED', 'LOW_CONFIDENCE', 'NO_MATCH']),
  studentId: z.string().uuid().optional().nullable(),
  externalId: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  source: z.enum(['local', 'edcc']).optional().default('local'),
  ts: z.number().int().positive().optional(),
});

export const nfcBody = z.object({
  uid: z.string().min(1),
});

export const attendanceEventItem = z.object({
  eventId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  externalId: z.string().optional(),
  terminalId: z.string(),
  schoolId: z.string().uuid(),
  ts: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
}).refine((d) => d.studentId != null || d.externalId != null, { message: 'studentId or externalId required' });

export const attendanceBulkBody = z.object({
  events: z.array(attendanceEventItem),
});

export const mealTypeEnum = z.enum(['breakfast', 'lunch', 'supper', 'snack']);

export const mealEventItem = z.object({
  eventId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  externalId: z.string().optional(),
  terminalId: z.string(),
  schoolId: z.string().uuid(),
  ts: z.number().int().positive(),
  method: z.enum(['nfc', 'palm', 'nfc_palm']),
  mealType: mealTypeEnum.optional().default('lunch'),
}).refine((d) => d.studentId != null || d.externalId != null, { message: 'studentId or externalId required' });

export const mealBulkBody = z.object({
  events: z.array(mealEventItem),
});

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const dailyReportQuery = z.object({
  schoolId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const trendsQuery = z.object({
  schoolId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const exceptionsQuery = z.object({
  schoolId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const terminalsQuery = z.object({
  schoolId: z.string().uuid().optional(),
});

export const exportsQuery = z.object({
  schoolId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
