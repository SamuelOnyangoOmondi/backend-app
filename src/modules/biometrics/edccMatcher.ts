import { db } from '../../db/knex.js';
import { decrypt } from '../../shared/crypto/encrypt.js';
import { env } from '../../env.js';

/** Minimum score (0–1) to consider a match. Demo mode: more permissive for testing. */
const EDCC_IDENTIFY_MIN_SCORE = 0.7;

/** Minimum margin between top-1 and top-2 to avoid ambiguous matches. */
const EDCC_IDENTIFY_MIN_MARGIN = 0.07;

/** Single-scan override: if score and margin exceed these, no confirmation scan needed. */
const EDCC_HIGH_CERTAINTY_SCORE = 0.975;
const EDCC_HIGH_CERTAINTY_MARGIN = 0.12;

export interface MatchResult {
  studentId: string;
  externalId: string;
  confidence: number;
  matchStatus: 'VERIFIED' | 'LOW_CONFIDENCE' | 'NO_MATCH';
  /** When true, Android may mark attendance without two-scan consensus. */
  certaintyMode?: 'HIGH_CERTAINTY_SINGLE_SCAN' | 'REQUIRES_CONFIRMATION';
}

/**
 * Feature-based 1:N matcher.
 * Compares probe (rgbEnc, irEnc) against stored palm_templates using normalized correlation.
 * Replace this with a vendor EDCC/NPU SDK when available for production-grade accuracy.
 * @param classId - Optional. Reserved for future class-scoped identification (requires class_id on students).
 */
export async function matchPalm(
  schoolId: string,
  probeRgb: Buffer,
  probeIr: Buffer,
  _classId?: string | null
): Promise<MatchResult> {
  const templates = await db('palm_templates')
    .join('students', 'palm_templates.student_id', 'students.id')
    .where('students.school_id', schoolId)
    .select(
    'palm_templates.id',
    'palm_templates.student_id',
    'palm_templates.hand',
    'palm_templates.rgb_enc',
    'palm_templates.ir_enc',
    'students.external_id'
  );

  if (templates.length === 0) {
    return { studentId: '', externalId: '', confidence: 0, matchStatus: 'NO_MATCH' };
  }

  let bestScore = 0;
  let secondBestScore = 0;
  let bestStudentId = '';
  let bestExternalId = '';

  for (const row of templates) {
    let tRgb: Buffer;
    let tIr: Buffer;
    try {
      tRgb = decrypt(row.rgb_enc as Buffer, env.BIOMETRIC_ENC_KEY);
      tIr = decrypt(row.ir_enc as Buffer, env.BIOMETRIC_ENC_KEY);
    } catch {
      continue;
    }

    const score = computeSimilarity(probeRgb, probeIr, tRgb, tIr);
    if (score > bestScore) {
      secondBestScore = bestScore;
      bestScore = score;
      bestStudentId = row.student_id;
      bestExternalId = row.external_id ?? '';
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  }

  const margin = bestScore - secondBestScore;

  // Ambiguous: top match too close to second-best. Never leak a guessed student.
  if (secondBestScore > 0 && margin < EDCC_IDENTIFY_MIN_MARGIN) {
    return {
      studentId: '',
      externalId: '',
      confidence: bestScore,
      matchStatus: 'LOW_CONFIDENCE',
      certaintyMode: 'REQUIRES_CONFIRMATION',
    };
  }

  // Score too low
  if (bestScore < EDCC_IDENTIFY_MIN_SCORE) {
    return {
      studentId: '',
      externalId: '',
      confidence: bestScore,
      matchStatus: bestScore >= 0.15 ? 'LOW_CONFIDENCE' : 'NO_MATCH',
    };
  }

  const isHighCertaintySingleScan =
    bestScore >= EDCC_HIGH_CERTAINTY_SCORE && margin >= EDCC_HIGH_CERTAINTY_MARGIN;

  return {
    studentId: bestStudentId,
    externalId: bestExternalId,
    confidence: bestScore,
    matchStatus: 'VERIFIED',
    certaintyMode: isHighCertaintySingleScan ? 'HIGH_CERTAINTY_SINGLE_SCAN' : 'REQUIRES_CONFIRMATION',
  };
}

/**
 * Normalized correlation between probe and template feature vectors.
 * Treats rgb+ir as concatenated vectors. Same format as device capture.
 */
function computeSimilarity(
  probeRgb: Buffer,
  probeIr: Buffer,
  templateRgb: Buffer,
  templateIr: Buffer
): number {
  const probe = Buffer.concat([probeRgb, probeIr]);
  const template = Buffer.concat([templateRgb, templateIr]);
  if (probe.length !== template.length || probe.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < probe.length; i++) {
    const a = probe[i] & 0xff;
    const b = template[i] & 0xff;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  const sim = dot / denom;
  return Math.max(0, Math.min(1, sim));
}
