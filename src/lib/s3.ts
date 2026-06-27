/** @deprecated Import from `@/lib/storage/r2` instead. */
export {
  s3Client,
  BUCKET_NAME,
  uploadToR2,
  fetchR2Object,
  deleteFromR2,
  buildObjectKey,
  sanitizeFilename,
} from "@/lib/storage/r2";

export { getPublicObjectUrl, resolveStorageUrl, extractKeyFromUrl } from "@/lib/storage/public-url";
