import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    // Fetch existing holidays for this workspace.
    // New workspaces start with no holidays by default — admins add their own.
    const holidays = await prisma.companyHoliday.findMany({
      where: { wid },
      orderBy: { date: "desc" }
    });

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error("API /api/settings/holiday GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const wid = employee.wid ?? 1;
    const body = await req.json();
    const { name, date, type, branchId } = body;

    if (!name || !date || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const holiday = await prisma.companyHoliday.create({
      data: {
        name,
        date,
        type,
        branchId: branchId || "All",
        wid
      }
    });

    return NextResponse.json({ holiday });
  } catch (error) {
    console.error("API /api/settings/holiday POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const wid = employee.wid ?? 1;
    const body = await req.json();
    const { id, name, date, type, branchId } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing holiday ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.companyHoliday.findFirst({
      where: { id, wid }
    });

    if (!existing) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    const updated = await prisma.companyHoliday.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        date: date !== undefined ? date : existing.date,
        type: type !== undefined ? type : existing.type,
        branchId: branchId !== undefined ? branchId : existing.branchId
      }
    });

    return NextResponse.json({ holiday: updated });
  } catch (error) {
    console.error("API /api/settings/holiday PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const wid = employee.wid ?? 1;
    
    // Parse ID from query params or body
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // Body parser failed
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing holiday ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.companyHoliday.findFirst({
      where: { id, wid }
    });

    if (!existing) {
      return NextResponse.json({ error: "Holiday not found or unauthorized" }, { status: 404 });
    }

    await prisma.companyHoliday.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/settings/holiday DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
