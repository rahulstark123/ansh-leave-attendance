import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { buildObjectKey, deleteFromR2, sanitizeFilename, uploadToR2 } from "@/lib/storage/r2";

// 1. GET: Retrieve list of policy documents for this workspace
export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;
    const policyDocuments = await prisma.policyDocument.findMany({
      where: { wid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ policyDocuments });
  } catch (error) {
    console.error("API /api/settings/policy GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Upload a new policy document (R2 + workspace-scoped DB registry)
export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | File | null;
    const documentName = formData.get("documentName") as string | null;

    if (!file || !documentName || !documentName.trim()) {
      return NextResponse.json({ error: "Bad Request: Missing file or document name" }, { status: 400 });
    }

    // Determine multi-tenant upload key based on workspace ID (wid)
    const wid = employee.wid ?? 1;
    const originalName = (file as any).name || "document.pdf";
    const extension = originalName.split(".").pop() || "pdf";
    const cleanOriginalName = sanitizeFilename(originalName);
    const objectKey = buildObjectKey(String(wid), `${Date.now()}_${cleanOriginalName}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await uploadToR2(objectKey, buffer, file.type || "application/pdf");

    // Ensure file name ends with the correct extension
    let savedName = documentName.trim();
    if (!savedName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
      savedName = `${savedName}.${extension}`;
    }

    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    await prisma.policyDocument.create({
      data: {
        name: savedName,
        uploadedAt: new Date().toISOString().split("T")[0],
        size: fileSizeFormatted,
        s3Key: objectKey,
        wid,
      },
    });

    const policyDocuments = await prisma.policyDocument.findMany({
      where: { wid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ policyDocuments });
  } catch (error) {
    console.error("API /api/settings/policy POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. PATCH: Rename an existing policy document's display name
export async function PATCH(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: "Bad Request: Missing document ID or name" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;
    const doc = await prisma.policyDocument.findFirst({ where: { id, wid } });

    if (!doc) {
      return NextResponse.json({ error: "Document Not Found" }, { status: 404 });
    }

    // Keep file extension from current name if not explicitly specified
    const extension = doc.name.split(".").pop() || "pdf";
    let newSavedName = name.trim();
    if (!newSavedName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
      newSavedName = `${newSavedName}.${extension}`;
    }

    await prisma.policyDocument.update({
      where: { id },
      data: { name: newSavedName },
    });

    const policyDocuments = await prisma.policyDocument.findMany({
      where: { wid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ policyDocuments });
  } catch (error) {
    console.error("API /api/settings/policy PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 4. DELETE: Remove policy document from the workspace registry and R2
export async function DELETE(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bad Request: Missing document ID" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;
    const doc = await prisma.policyDocument.findFirst({ where: { id, wid } });

    if (!doc) {
      return NextResponse.json({ error: "Document Not Found" }, { status: 404 });
    }

    if (doc.s3Key) {
      try {
        await deleteFromR2(doc.s3Key);
      } catch (err) {
        console.error("Failed to delete storage file during cleanup:", err);
      }
    }

    await prisma.policyDocument.delete({ where: { id } });

    const policyDocuments = await prisma.policyDocument.findMany({
      where: { wid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ policyDocuments });
  } catch (error) {
    console.error("API /api/settings/policy DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
