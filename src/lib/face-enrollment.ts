/** Employee has a valid 128D face embedding for server-side verification. */
export function hasFaceEmbedding(faceEmbedding?: number[] | null): boolean {
  return Array.isArray(faceEmbedding) && faceEmbedding.length === 128;
}

/** Employee is fully enrolled: reference photos + embedding vector. */
export function isFaceEnrolled(
  facePhotos?: string[] | null,
  faceEmbedding?: number[] | null
): boolean {
  return (
    Array.isArray(facePhotos) &&
    facePhotos.length >= 3 &&
    hasFaceEmbedding(faceEmbedding)
  );
}
