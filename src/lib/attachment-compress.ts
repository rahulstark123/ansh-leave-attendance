import { compressImage } from "@/lib/image-compress";

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function prepareAttachment(file: File): Promise<File> {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error(
      `"${file.name}" is not supported. Use JPG, PNG, WebP, GIF, or PDF.`
    );
  }

  if (file.type.startsWith("image/")) {
    return compressImageToMaxSize(file, MAX_ATTACHMENT_BYTES);
  }

  if (file.size <= MAX_ATTACHMENT_BYTES) {
    return file;
  }

  throw new Error(
    `"${file.name}" is ${formatFileSize(file.size)}. PDFs must be under 2 MB.`
  );
}

async function compressImageToMaxSize(file: File, maxBytes: number): Promise<File> {
  let quality = 0.85;
  let maxDimension = 1920;
  let result = await compressImage(file, maxDimension, quality);

  while (result.size > maxBytes && (quality > 0.35 || maxDimension > 640)) {
    if (quality > 0.4) {
      quality -= 0.1;
    } else {
      maxDimension = Math.round(maxDimension * 0.75);
      quality = 0.75;
    }
    result = await compressImage(file, maxDimension, quality);
  }

  if (result.size > maxBytes) {
    throw new Error(
      `Could not compress "${file.name}" below 2 MB. Try a smaller image.`
    );
  }

  return result;
}
