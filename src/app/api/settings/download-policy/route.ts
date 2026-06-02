import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getSystemSettings } from "@/lib/settings";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: Request) {
  try {
    // 1. Authenticate employee
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse request query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response("Bad Request: Missing document ID", { status: 400 });
    }

    // 3. Find document inside settings JSON database
    const settings = getSystemSettings();
    const doc = (settings.leaveSettings.policyDocuments || []).find((d) => d.id === id);

    if (!doc) {
      return new Response("Document Not Found", { status: 404 });
    }

    // Handle legacy documents that were just simulated/mocked (no s3Key)
    if (!doc.s3Key) {
      return new Response("This is a simulated document with no actual S3 file attached.", { status: 400 });
    }

    // 4. Fetch the file stream from S3 bucket
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: doc.s3Key,
    });

    const response = await s3Client.send(getCommand);
    const stream = response.Body as any;

    if (!stream) {
      return new Response("Failed to fetch stream from S3", { status: 500 });
    }

    // 5. Stream response back to user
    const isPdf = doc.name.toLowerCase().endsWith(".pdf");
    const disposition = isPdf 
      ? `inline; filename="${encodeURIComponent(doc.name)}"` 
      : `attachment; filename="${encodeURIComponent(doc.name)}"`;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Disposition": disposition,
      },
    });
  } catch (error) {
    console.error("API /api/settings/download-policy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
