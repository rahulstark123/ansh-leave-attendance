import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { isFaceEnrolled } from "@/lib/face-enrollment";

function buildAvatarInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const facePhotos = employee.facePhotos ?? [];
    const faceEnrolled = isFaceEnrolled(facePhotos, employee.faceEmbedding);
    const hasFacePhotos = facePhotos.length >= 3;

    return NextResponse.json({
      profile: employee,
      faceEnrolled,
      hasFacePhotos,
      facePhotos,
    });
  } catch (error) {
    console.error("API /api/profile GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: Record<string, string | null> = {};

    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = trimmed;
      updateData.avatarInitials = buildAvatarInitials(trimmed);
    }

    if (body.phoneNumber !== undefined) {
      updateData.phoneNumber = body.phoneNumber || null;
    }
    if (body.personalEmail !== undefined) {
      updateData.personalEmail = body.personalEmail
        ? String(body.personalEmail).trim().toLowerCase()
        : null;
    }
    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = body.dateOfBirth || null;
    }
    if (body.emergencyContactName !== undefined) {
      updateData.emergencyContactName = body.emergencyContactName
        ? String(body.emergencyContactName).trim()
        : null;
    }
    if (body.emergencyContactPhone !== undefined) {
      updateData.emergencyContactPhone = body.emergencyContactPhone || null;
    }
    if (body.bloodGroup !== undefined) {
      updateData.bloodGroup = body.bloodGroup || null;
    }

    const hasPersonalUpdate = Object.keys(updateData).length > 0;
    if (!hasPersonalUpdate) {
      return NextResponse.json({ error: "No profile fields to update" }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: updateData,
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("API /api/profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
