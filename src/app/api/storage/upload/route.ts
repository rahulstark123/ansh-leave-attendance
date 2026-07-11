import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachment-compress";
import {
  buildObjectKey,
  sanitizeFilename,
  uploadToR2,
} from "@/lib/storage/r2";
import { getPublicObjectUrl } from "@/lib/storage/public-url";

const ALLOWED_FOLDERS = new Set(["leaves", "announcements", "support"]);

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;

    if (!file || !folder || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
    }

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, WebP, GIF, or PDF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: `File must be under 2 MB (received ${(file.size / (1024 * 1024)).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    const wid = employee.wid ?? 1;
    const originalName = (file as File & { name?: string }).name || "attachment";
    const cleanName = sanitizeFilename(originalName);
    const objectKey = buildObjectKey(
      folder,
      String(wid),
      employee.id,
      `${Date.now()}_${cleanName}`
    );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await uploadToR2(objectKey, buffer, file.type || "application/octet-stream");

    return NextResponse.json({
      url: getPublicObjectUrl(objectKey),
      key: objectKey,
    });
  } catch (error) {
    console.error("API /api/storage/upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
