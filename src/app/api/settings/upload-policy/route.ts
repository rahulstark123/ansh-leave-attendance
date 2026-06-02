import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
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

    // 3. Parse request payload
    const formData = await req.formData();
    const file = formData.get("file") as Blob | File | null;
    const documentName = formData.get("documentName") as string | null;

    if (!file || !documentName || !documentName.trim()) {
      return NextResponse.json({ error: "Bad Request: Missing file or document name" }, { status: 400 });
    }

    // 4. Determine multi-tenant upload key based on workspace ID (wid)
    const wid = employee.wid ?? 1;
    const originalName = (file as any).name || "document.pdf";
    const extension = originalName.split(".").pop() || "pdf";
    const cleanOriginalName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const s3Key = `${wid}/${Date.now()}_${cleanOriginalName}`;

    // 5. Convert file to buffer and execute S3 upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || "application/pdf",
    });

    await s3Client.send(uploadCommand);

    // 6. Format document details and save to local system settings JSON
    const settings = getSystemSettings();
    const currentDocs = settings.leaveSettings.policyDocuments || [];
    
    // Ensure file name ends with the correct extension
    let savedName = documentName.trim();
    if (!savedName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
      savedName = `${savedName}.${extension}`;
    }

    const fileSizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: savedName,
      uploadedAt: new Date().toISOString().split("T")[0],
      size: fileSizeFormatted,
      s3Key: s3Key,
    };

    const updatedDocs = [...currentDocs, newDoc];
    const updated = saveSystemSettings({
      leaveSettings: {
        ...settings.leaveSettings,
        policyDocuments: updatedDocs,
      },
    });

    return NextResponse.json({ settings: updated, document: newDoc });
  } catch (error) {
    console.error("API /api/settings/upload-policy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
