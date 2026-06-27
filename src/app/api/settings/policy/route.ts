import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";
import { buildObjectKey, deleteFromR2, sanitizeFilename, uploadToR2 } from "@/lib/storage/r2";

// 1. GET: Retrieve list of policy documents
export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = getSystemSettings();
    return NextResponse.json({ policyDocuments: settings.leaveSettings.policyDocuments || [] });
  } catch (error) {
    console.error("API /api/settings/policy GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Upload a new policy document (R2 + system-settings.json registry)
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
      s3Key: objectKey,
    };

    const updatedDocs = [...currentDocs, newDoc];
    const updated = saveSystemSettings({
      leaveSettings: {
        ...settings.leaveSettings,
        policyDocuments: updatedDocs,
      },
    });

    return NextResponse.json({ settings: updated, policyDocuments: updatedDocs });
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

    const settings = getSystemSettings();
    const currentDocs = settings.leaveSettings.policyDocuments || [];
    const targetDocIndex = currentDocs.findIndex((d) => d.id === id);

    if (targetDocIndex === -1) {
      return NextResponse.json({ error: "Document Not Found" }, { status: 404 });
    }

    const doc = currentDocs[targetDocIndex];
    // Keep file extension from current name if not explicitly specified
    const extension = doc.name.split(".").pop() || "pdf";
    let newSavedName = name.trim();
    if (!newSavedName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
      newSavedName = `${newSavedName}.${extension}`;
    }

    // Update document name while retaining s3Key and size
    currentDocs[targetDocIndex] = {
      ...doc,
      name: newSavedName,
    };

    const updated = saveSystemSettings({
      leaveSettings: {
        ...settings.leaveSettings,
        policyDocuments: currentDocs,
      },
    });

    return NextResponse.json({ settings: updated, policyDocuments: currentDocs });
  } catch (error) {
    console.error("API /api/settings/policy PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 4. DELETE: Remove policy document from settings database and R2
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

    const settings = getSystemSettings();
    const currentDocs = settings.leaveSettings.policyDocuments || [];
    const doc = currentDocs.find((d) => d.id === id);

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

    // Update system settings database
    const updatedDocs = currentDocs.filter((d) => d.id !== id);
    const updated = saveSystemSettings({
      leaveSettings: {
        ...settings.leaveSettings,
        policyDocuments: updatedDocs,
      },
    });

    return NextResponse.json({ settings: updated, policyDocuments: updatedDocs });
  } catch (error) {
    console.error("API /api/settings/policy DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
