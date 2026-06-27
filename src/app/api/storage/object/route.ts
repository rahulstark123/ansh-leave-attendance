import { NextResponse } from "next/server";
import { fetchR2Object, isValidStorageKey } from "@/lib/storage/r2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || !isValidStorageKey(key)) {
      return new Response("Bad Request", { status: 400 });
    }

    const response = await fetchR2Object(key);
    const stream = response.Body;

    if (!stream) {
      return new Response("Not Found", { status: 404 });
    }

    const contentType = response.ContentType || "application/octet-stream";
    const isInline =
      contentType.startsWith("image/") || contentType === "application/pdf";
    const filename = key.split("/").pop() || "file";
    const disposition = isInline
      ? `inline; filename="${encodeURIComponent(filename)}"`
      : `attachment; filename="${encodeURIComponent(filename)}"`;

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("API /api/storage/object error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
