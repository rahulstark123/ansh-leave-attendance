import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hjnqlybokoljhxyzsqqi.supabase.co";

// Helper to clean up existing photos in S3
async function cleanupS3Photos(photoUrls: string[]) {
  for (const url of photoUrls) {
    const parts = url.split(`/${BUCKET_NAME}/`);
    if (parts.length > 1) {
      const key = parts[1];
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });
        await s3Client.send(deleteCommand);
      } catch (err) {
        console.error("Failed to delete face photo from S3:", key, err);
      }
    }
  }
}

import { extractAverageDescriptorFromBuffers } from "@/lib/face-api-server";
import { isFaceEnrolled } from "@/lib/face-enrollment";
export async function POST(req: Request) {
  try {
    const loggedInEmployee = await getAuthEmployee(req);
    if (!loggedInEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const targetEmployeeId = formData.get("employeeId") as string | null;
    const faceEmbeddingStr = formData.get("faceEmbedding") as string | null;

    const photo1 = formData.get("photo1") as File | null;
    const photo2 = formData.get("photo2") as File | null;
    const photo3 = formData.get("photo3") as File | null;

    // Determine target employee ID (default to self)
    const employeeId = targetEmployeeId || loggedInEmployee.id;

    // Authorization check: standard users can only edit their own face.
    if (employeeId !== loggedInEmployee.id) {
      const isAuthorized = loggedInEmployee.role === "Admin" || loggedInEmployee.role === "HR Manager" || loggedInEmployee.role === "Owner";
      if (!isAuthorized) {
        return NextResponse.json({ error: "Forbidden: Only HR or Admins can enroll other employees" }, { status: 403 });
      }
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 444 });
    }

    // Optional client-provided embedding; otherwise computed on the server from photos.
    let faceEmbedding: number[] = [];
    if (faceEmbeddingStr) {
      try {
        faceEmbedding = JSON.parse(faceEmbeddingStr);
      } catch {
        return NextResponse.json({ error: "Invalid faceEmbedding JSON string" }, { status: 400 });
      }
      if (
        !Array.isArray(faceEmbedding) ||
        (faceEmbedding.length > 0 &&
          (faceEmbedding.length !== 128 || faceEmbedding.some((val) => typeof val !== "number")))
      ) {
        return NextResponse.json(
          { error: "faceEmbedding must be an array of 128 numbers when provided" },
          { status: 400 }
        );
      }
    }

    if (!photo1 || !photo2 || !photo3) {
      return NextResponse.json({ error: "Please upload all 3 photos (Front, Left, Right)" }, { status: 400 });
    }

    // Clean up existing face photos in S3 before replacing
    if (employee.facePhotos && employee.facePhotos.length > 0) {
      await cleanupS3Photos(employee.facePhotos);
    }

    // Upload 3 photos to S3
    const photos = [photo1, photo2, photo3];
    const labels = ["front", "left", "right"];
    const publicUrls: string[] = [];

    for (let i = 0; i < 3; i++) {
      const file = photos[i];
      const label = labels[i];
      const wid = employee.wid ?? 1;
      
      const originalName = file.name || `${label}.jpg`;
      const extension = originalName.split(".").pop() || "jpg";
      const s3Key = `faces/${employeeId}/${Date.now()}_${label}.${extension}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      });

      await s3Client.send(uploadCommand);
      
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${s3Key}`;
      publicUrls.push(publicUrl);
    }

    if (faceEmbedding.length !== 128) {
      const buffers = await Promise.all(
        photos.map(async (file) => Buffer.from(await file.arrayBuffer()))
      );
      const avgDescriptor = await extractAverageDescriptorFromBuffers(buffers);
      if (!avgDescriptor) {
        return NextResponse.json(
          {
            error:
              "Could not detect a face in the uploaded photos. Use clear, front-facing images with good lighting.",
          },
          { status: 422 }
        );
      }
      faceEmbedding = Array.from(avgDescriptor);
    }

    // Update Employee record
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        faceEmbedding: faceEmbedding,
        facePhotos: publicUrls,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Facial sign-in enrolled successfully",
      employee: {
        id: updatedEmployee.id,
        faceEnrolled: isFaceEnrolled(updatedEmployee.facePhotos, updatedEmployee.faceEmbedding),
        facePhotos: updatedEmployee.facePhotos,
      }
    });
  } catch (error) {
    console.error("API /api/employee/face-enroll POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove Employee Face Profile & Clean S3 Photos
export async function DELETE(req: Request) {
  try {
    const loggedInEmployee = await getAuthEmployee(req);
    if (!loggedInEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetEmployeeId = searchParams.get("employeeId");

    const employeeId = targetEmployeeId || loggedInEmployee.id;

    // Auth check: standard employee can only delete their own face
    if (employeeId !== loggedInEmployee.id) {
      const isAuthorized = loggedInEmployee.role === "Admin" || loggedInEmployee.role === "HR Manager" || loggedInEmployee.role === "Owner";
      if (!isAuthorized) {
        return NextResponse.json({ error: "Forbidden: Only HR or Admins can modify other employees" }, { status: 403 });
      }
    }

    // Fetch employee record
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Clean up S3 photos
    if (employee.facePhotos && employee.facePhotos.length > 0) {
      await cleanupS3Photos(employee.facePhotos);
    }

    // Reset database fields
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        faceEmbedding: [],
        facePhotos: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Face enrollment removed successfully",
    });
  } catch (error) {
    console.error("API /api/employee/face-enroll DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
