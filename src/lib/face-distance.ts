/** L2 (Euclidean) distance — used with face-api 128D descriptors. Lower is better. */
export function computeFaceDistance(
  v1: number[] | Float32Array,
  v2: number[] | Float32Array
): number {
  if (v1.length !== v2.length) {
    throw new Error("Face descriptors must be of the same length");
  }
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/** Cosine similarity — higher is better (1.0 = identical direction). */
export function cosineSimilarity(
  v1: number[] | Float32Array,
  v2: number[] | Float32Array
): number {
  if (v1.length !== v2.length) {
    throw new Error("Face descriptors must be of the same length");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** face-api L2 threshold (128D). Distance below this = match. */
export const FACE_L2_THRESHOLD = 0.55;

/** @deprecated Use FACE_L2_THRESHOLD */
export const FACE_MATCH_THRESHOLD = FACE_L2_THRESHOLD;

/** Cosine threshold for normalized 128D face-api vectors (~equivalent band). */
export const FACE_COSINE_THRESHOLD = 0.75;

export function faceDistanceToScore(distance: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - distance / 0.8) * 100)));
}

export function cosineToScore(similarity: number): number {
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
}

export function averageDescriptors(descriptors: (Float32Array | number[])[]): number[] {
  if (descriptors.length === 0) return [];
  const len = descriptors[0].length;
  const avg = new Array(len).fill(0);
  for (const desc of descriptors) {
    for (let i = 0; i < len; i++) {
      avg[i] += desc[i];
    }
  }
  for (let i = 0; i < len; i++) {
    avg[i] /= descriptors.length;
  }
  return avg;
}

export function isFaceMatch(
  distance: number,
  similarity: number,
  l2Threshold = FACE_L2_THRESHOLD,
  cosineThreshold = FACE_COSINE_THRESHOLD
): boolean {
  return distance < l2Threshold || similarity >= cosineThreshold;
}
