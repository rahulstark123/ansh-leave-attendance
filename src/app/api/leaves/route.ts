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

    let leaves;
    if (employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner") {
      leaves = await prisma.leaveRequest.findMany({
        where: { wid },
        include: {
          employee: {
            select: {
              name: true,
              role: true,
              avatarInitials: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      });
    } else {
      leaves = await prisma.leaveRequest.findMany({
        where: { employeeId: employee.id, wid },
        include: {
          employee: {
            select: {
              name: true,
              role: true,
              avatarInitials: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      });
    }

    const formattedLeaves = leaves.map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      employeeName: l.employee.name,
      employeeRole: l.employee.role,
      avatarInitials: l.employee.avatarInitials,
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      halfDay: l.halfDay,
      reason: l.reason,
      status: l.status,
      appliedAt: l.appliedAt.toISOString(),
    }));

    return NextResponse.json({ leaves: formattedLeaves });
  } catch (error) {
    console.error("API /api/leaves GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, startDate, endDate, totalDays, halfDay, reason } = body;

    if (!type || !startDate || !endDate || totalDays === undefined || halfDay === undefined || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type,
        startDate,
        endDate,
        totalDays,
        halfDay,
        reason,
        status: "Pending",
        wid: employee.wid ?? 1,
      },
    });

    const formattedLeave = {
      id: leave.id,
      employeeId: leave.employeeId,
      employeeName: employee.name,
      employeeRole: employee.role,
      avatarInitials: employee.avatarInitials,
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      halfDay: leave.halfDay,
      reason: leave.reason,
      status: leave.status,
      appliedAt: leave.appliedAt.toISOString(),
    };

    return NextResponse.json({ leave: formattedLeave });
  } catch (error) {
    console.error("API /api/leaves POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
