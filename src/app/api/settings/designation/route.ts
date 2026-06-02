import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

const fallbackDesignations = [
  "Software Intern",
  "Software Engineer",
  "Senior Software Engineer",
  "Tech Lead",
  "Engineering Manager",
  "HR Executive",
  "HR Manager",
  "Product Manager",
  "Product Designer",
  "UI/UX Designer",
  "QA Engineer",
  "DevOps Engineer",
  "Data Analyst",
];

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    // Ensure workspace has a designation list. Seed from existing employees first.
    let designations = await prisma.designation.findMany({
      where: { wid },
      orderBy: { name: "asc" },
    });

    if (designations.length === 0) {
      const existingEmployeeDesignations = await prisma.employee.findMany({
        where: {
          wid,
          designation: {
            not: null,
          },
        },
        select: {
          designation: true,
        },
      });

      const uniqueNames = Array.from(
        new Set(
          existingEmployeeDesignations
            .map((item) => item.designation?.trim())
            .filter((name): name is string => !!name)
        )
      );

      const seedList = uniqueNames.length > 0 ? uniqueNames : fallbackDesignations;

      await prisma.designation.createMany({
        data: seedList.map((name) => ({ name, wid })),
        skipDuplicates: true,
      });

      designations = await prisma.designation.findMany({
        where: { wid },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ designations });
  } catch (error) {
    console.error("API /api/settings/designation GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wid = employee.wid ?? 1;
    const body = await req.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Designation name is required" }, { status: 400 });
    }

    const designation = await prisma.designation.create({
      data: {
        name,
        wid,
      },
    });

    return NextResponse.json({ designation });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Designation already exists in this workspace" }, { status: 400 });
    }
    console.error("API /api/settings/designation POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wid = employee.wid ?? 1;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing designation id" }, { status: 400 });
    }

    const target = await prisma.designation.findFirst({
      where: { id, wid },
    });
    if (!target) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    await prisma.designation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/settings/designation DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
