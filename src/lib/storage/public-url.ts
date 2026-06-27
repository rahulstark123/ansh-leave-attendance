import { BUCKET_NAME } from "@/lib/storage/r2";

function isPrivateS3Endpoint(url: string): boolean {
  return (
    url.includes(".r2.cloudflarestorage.com") ||
    url.includes(".storage.supabase.co/storage/v1/s3") ||
    url.includes(".storage.supabase.co/storage/v1")
  );
}

function getConfiguredPublicBase(): string {
  return (
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ||
    ""
  ).replace(/\/+$/, "");
}

function hasUsablePublicBase(): boolean {
  const base = getConfiguredPublicBase();
  return Boolean(base) && !isPrivateS3Endpoint(base);
}

function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function getPublicObjectUrl(key: string): string {
  if (hasUsablePublicBase()) {
    return `${getConfiguredPublicBase()}/${key}`;
  }

  const origin = getSiteOrigin();
  if (!origin) {
    return `/api/storage/object?key=${encodeURIComponent(key)}`;
  }

  return `${origin}/api/storage/object?key=${encodeURIComponent(key)}`;
}

export function extractKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname.endsWith("/api/storage/object")) {
      const key = parsed.searchParams.get("key");
      if (key) return decodeURIComponent(key);
    }
  } catch {
    // ignore malformed URLs
  }

  const supabaseMarker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const supabaseIdx = url.indexOf(supabaseMarker);
  if (supabaseIdx !== -1) {
    return decodeURIComponent(url.slice(supabaseIdx + supabaseMarker.length).split("?")[0]);
  }

  const publicBase = getConfiguredPublicBase();
  if (publicBase && url.startsWith(`${publicBase}/`)) {
    return decodeURIComponent(url.slice(publicBase.length + 1).split("?")[0]);
  }

  const bucketMarker = `/${BUCKET_NAME}/`;
  const bucketIdx = url.indexOf(bucketMarker);
  if (bucketIdx !== -1) {
    return decodeURIComponent(url.slice(bucketIdx + bucketMarker.length).split("?")[0]);
  }

  return null;
}

export function resolveStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const key = extractKeyFromUrl(url);
  if (!key) return url;

  return getPublicObjectUrl(key);
}
