import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { getAccessibleEmployeeIds } from "@/lib/team-scope";

const employeeInclude = {
  employee: {
    select: {
      name: true,
      role: true,
      avatarInitials: true,
      branch: true,
    },
  },
} as const;

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;
    const accessibleIds = await getAccessibleEmployeeIds(employee);

    const requests = await prisma.attendanceRegularization.findMany({
      where:
        accessibleIds === "all"
          ? { wid }
          : { wid, employeeId: { in: accessibleIds } },
      include: employeeInclude,
      orderBy: { appliedAt: "desc" },
    });

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      employeeRole: r.employee.role,
      avatarInitials: r.employee.avatarInitials,
      employeeBranch: r.employee.branch || "All",
      date: r.date,
      requestedIn: r.requestedIn,
      requestedOut: r.requestedOut,
      reason: r.reason,
      status: r.status,
      appliedAt: r.appliedAt.toISOString(),
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("API /api/attendance/regularization GET error:", error);
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
    const { date, requestedIn, requestedOut, reason } = body;

    if (!date || !requestedIn || !requestedOut || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;
    const existingPending = await prisma.attendanceRegularization.findFirst({
      where: {
        employeeId: employee.id,
        wid,
        date,
        status: "Pending",
      },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending regularization request for this date" },
        { status: 400 }
      );
    }

    const request = await prisma.attendanceRegularization.create({
      data: {
        employeeId: employee.id,
        date,
        requestedIn,
        requestedOut,
        reason,
        status: "Pending",
        wid,
      },
    });

    const formattedRequest = {
      id: request.id,
      employeeId: request.employeeId,
      employeeName: employee.name,
      employeeRole: employee.role,
      avatarInitials: employee.avatarInitials,
      employeeBranch: employee.branch || "All",
      date: request.date,
      requestedIn: request.requestedIn,
      requestedOut: request.requestedOut,
      reason: request.reason,
      status: request.status,
      appliedAt: request.appliedAt.toISOString(),
    };

    return NextResponse.json({ request: formattedRequest });
  } catch (error) {
    console.error("API /api/attendance/regularization POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
