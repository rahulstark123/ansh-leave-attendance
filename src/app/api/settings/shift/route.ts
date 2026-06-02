import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

// Default rosters to seed when a workspace has none
const defaultShifts = [
  { name: "General Shift", startTime: "09:00 AM", endTime: "06:00 PM", gracePeriod: 15, workingHours: 9, branchId: "All" },
  { name: "Morning Shift", startTime: "07:00 AM", endTime: "04:00 PM", gracePeriod: 15, workingHours: 9, branchId: "All" },
  { name: "Night Shift", startTime: "10:00 PM", endTime: "07:00 AM", gracePeriod: 15, workingHours: 9, branchId: "All" }
];

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    // Fetch existing shifts for this workspace
    let shifts = await prisma.shift.findMany({
      where: { wid },
      orderBy: { createdAt: "asc" }
    });

    // Lazy seed default shifts if none exist in the database for this wid
    if (shifts.length === 0) {
      await prisma.shift.createMany({
        data: defaultShifts.map(shift => ({
          ...shift,
          wid
        }))
      });

      shifts = await prisma.shift.findMany({
        where: { wid },
        orderBy: { createdAt: "asc" }
      });
    }

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error("API /api/settings/shift GET error:", error);
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
    const { name, startTime, endTime, gracePeriod, workingHours, branchId } = body;

    if (!name || !startTime || !endTime || gracePeriod === undefined || workingHours === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        gracePeriod: Number(gracePeriod),
        workingHours: Number(workingHours),
        branchId: branchId || "All",
        wid
      }
    });

    return NextResponse.json({ shift });
  } catch (error) {
    console.error("API /api/settings/shift POST error:", error);
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
    const { id, name, startTime, endTime, gracePeriod, workingHours, branchId } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing shift ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.shift.findFirst({
      where: { id, wid }
    });

    if (!existing) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        startTime: startTime !== undefined ? startTime : existing.startTime,
        endTime: endTime !== undefined ? endTime : existing.endTime,
        gracePeriod: gracePeriod !== undefined ? Number(gracePeriod) : existing.gracePeriod,
        workingHours: workingHours !== undefined ? Number(workingHours) : existing.workingHours,
        branchId: branchId !== undefined ? branchId : existing.branchId
      }
    });

    return NextResponse.json({ shift: updated });
  } catch (error) {
    console.error("API /api/settings/shift PATCH error:", error);
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
    
    // Parse ID from query params
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
      return NextResponse.json({ error: "Missing shift ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.shift.findFirst({
      where: { id, wid }
    });

    if (!existing) {
      return NextResponse.json({ error: "Shift not found or unauthorized" }, { status: 404 });
    }

    await prisma.shift.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/settings/shift DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
