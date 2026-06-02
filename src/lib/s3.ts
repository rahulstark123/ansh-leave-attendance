import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  forcePathStyle: true, // Required for Supabase S3 compatibility layer
  region: process.env.S3_REGION || "ap-south-1",
  endpoint: process.env.S3_ENDPOINT || "https://hjnqlybokoljhxyzsqqi.storage.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || "ansh-hr";
