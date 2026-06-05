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

    let requests;
    if (employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner") {
      // Admins and HR Managers see all WFH requests in the workspace
      requests = await prisma.wFHRequest.findMany({
        where: { wid },
        include: {
          employee: {
            select: {
              name: true,
              role: true,
              avatarInitials: true,
              branch: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      });
    } else {
      // Regular employees only see their own requests
      requests = await prisma.wFHRequest.findMany({
        where: { employeeId: employee.id, wid },
        include: {
          employee: {
            select: {
              name: true,
              role: true,
              avatarInitials: true,
              branch: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      });
    }

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      employeeRole: r.employee.role,
      avatarInitials: r.employee.avatarInitials,
      employeeBranch: r.employee.branch || "All",
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.totalDays,
      halfDay: r.halfDay,
      reason: r.reason,
      status: r.status,
      appliedAt: r.appliedAt.toISOString(),
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("API /api/attendance/wfh GET error:", error);
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
    const { startDate, endDate, totalDays, halfDay, reason } = body;

    if (!startDate || !endDate || totalDays === undefined || halfDay === undefined || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const request = await prisma.wFHRequest.create({
      data: {
        employeeId: employee.id,
        startDate,
        endDate,
        totalDays: parseFloat(totalDays),
        halfDay,
        reason,
        status: "Pending",
        wid: employee.wid ?? 1,
      },
    });

    const formattedRequest = {
      id: request.id,
      employeeId: request.employeeId,
      employeeName: employee.name,
      employeeRole: employee.role,
      avatarInitials: employee.avatarInitials,
      employeeBranch: employee.branch || "All",
      startDate: request.startDate,
      endDate: request.endDate,
      totalDays: request.totalDays,
      halfDay: request.halfDay,
      reason: request.reason,
      status: request.status,
      appliedAt: request.appliedAt.toISOString(),
    };

    return NextResponse.json({ request: formattedRequest });
  } catch (error) {
    console.error("API /api/attendance/wfh POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
