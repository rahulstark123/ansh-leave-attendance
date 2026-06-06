import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { hasFaceEmbedding } from "@/lib/face-enrollment";
import { verifyFaceFromBase64, verifyFaceFromUrl } from "@/lib/face-api-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { selfie, selfieUrl, employeeId: queryEmployeeId } = body as {
      selfie?: string;
      selfieUrl?: string;
      employeeId?: string;
    };

    if (!selfie && !selfieUrl) {
      return NextResponse.json({ error: "Missing selfie image" }, { status: 400 });
    }

    let targetEmployeeId = employee.id;
    if (queryEmployeeId && queryEmployeeId !== employee.id) {
      const isAuthorized =
        employee.role === "Admin" ||
        employee.role === "HR Manager" ||
        employee.role === "Owner";
      if (!isAuthorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      targetEmployeeId = queryEmployeeId;
    }

    const dbEmployee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { faceEmbedding: true },
    });

    if (!dbEmployee || !hasFaceEmbedding(dbEmployee.faceEmbedding)) {
      return NextResponse.json({ error: "Face embedding not found" }, { status: 404 });
    }

    const result = selfie
      ? await verifyFaceFromBase64(selfie, dbEmployee.faceEmbedding)
      : await verifyFaceFromUrl(selfieUrl!, dbEmployee.faceEmbedding);

    if (result.distance === Infinity) {
      return NextResponse.json(
        {
          matched: false,
          distance: null,
          similarity: null,
          score: 0,
          error: "No face detected in the photo. Make sure your face is clearly visible.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      matched: result.matched,
      distance: result.distance,
      similarity: result.similarity,
      score: result.score,
    });
  } catch (error) {
    console.error("API /api/employee/face-verify POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
