import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbEmployee = await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { faceEmbedding: true },
    });

    if (!dbEmployee || !dbEmployee.faceEmbedding || dbEmployee.faceEmbedding.length === 0) {
      return NextResponse.json({ error: "Face embedding not found" }, { status: 404 });
    }

    return NextResponse.json({
      faceEmbedding: dbEmployee.faceEmbedding,
    });
  } catch (error) {
    console.error("API /api/employee/face-embedding GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
