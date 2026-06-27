import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || "ansh-hr";

const STORAGE_PREFIX = (process.env.S3_STORAGE_PREFIX || "").replace(/^\/+|\/+$/g, "");

export const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export function buildObjectKey(...parts: string[]): string {
  const segments = parts
    .flatMap((part) => part.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (STORAGE_PREFIX) {
    return [STORAGE_PREFIX, ...segments].join("/");
  }

  return segments.join("/");
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

export async function fetchR2Object(key: string) {
  return s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

export function isValidStorageKey(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/")) {
    return false;
  }

  if (STORAGE_PREFIX) {
    if (key.startsWith(`${STORAGE_PREFIX}/`)) {
      return true;
    }
  }

  return /^(faces|punches|leaves|announcements|\d+)\//.test(key);
}
