import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { isFaceEnrolled } from "@/lib/face-enrollment";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const queryId = url.searchParams.get("employeeId");
    let targetEmployeeId = employee.id;

    if (queryId && queryId !== employee.id) {
      const isAuthorized =
        employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
      if (!isAuthorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      targetEmployeeId = queryId;
    }

    const dbEmployee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { faceEmbedding: true, facePhotos: true },
    });

    if (!dbEmployee || !isFaceEnrolled(dbEmployee.facePhotos, dbEmployee.faceEmbedding)) {
      return NextResponse.json({ error: "Face profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      facePhotos: dbEmployee.facePhotos,
      faceEmbedding: dbEmployee.faceEmbedding,
    });
  } catch (error) {
    console.error("API /api/employee/face-embedding GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
