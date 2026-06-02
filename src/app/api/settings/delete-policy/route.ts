import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(req: Request) {
  try {
    // 1. Authenticate employee
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate permissions
    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse document ID to delete
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bad Request: Missing document ID" }, { status: 400 });
    }

    // 4. Find document in settings database
    const settings = getSystemSettings();
    const doc = (settings.leaveSettings.policyDocuments || []).find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json({ error: "Document Not Found" }, { status: 404 });
    }

    // 5. Delete associated file from S3 bucket (if present)
    if (doc.s3Key) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: doc.s3Key,
        });
        await s3Client.send(deleteCommand);
      } catch (err) {
        console.error("Failed to delete S3 file:", err);
      }
    }

    // 6. Update local system settings database
    const updatedDocs = (settings.leaveSettings.policyDocuments || []).filter((d) => d.id !== id);
    const updated = saveSystemSettings({
      leaveSettings: {
        ...settings.leaveSettings,
        policyDocuments: updatedDocs,
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("API /api/settings/delete-policy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
