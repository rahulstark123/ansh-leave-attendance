import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getWFHBranchError, resolveEmployeeBranch } from "@/lib/branch-utils";
import { prisma } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";

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

function formatWFHRequest(
  r: {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    halfDay: boolean;
    reason: string;
    status: string;
    appliedAt: Date;
    employee: {
      name: string;
      role: string;
      avatarInitials: string;
      branch: string | null;
    };
  }
) {
  return {
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
  };
}

async function canAccessWFHRequest(
  employee: { id: string; name: string; role: string; wid?: number | null },
  requestEmployeeId: string
) {
  if (requestEmployeeId === employee.id) return true;
  if (employee.role === "Admin" || employee.role === "Owner") return true;

  if (employee.role === "Manager" || employee.role === "HR Manager") {
    const requester = await prisma.employee.findUnique({
      where: { id: requestEmployeeId },
    });
    if (!requester) return false;
    const managerName = employee.name.toLowerCase();
    return (
      (requester.reportingManager &&
        requester.reportingManager.toLowerCase() === managerName) ||
      (requester.reportingHR &&
        requester.reportingHR.toLowerCase() === managerName)
    );
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    let requests;
    if (
      employee.role === "Admin" ||
      employee.role === "HR Manager" ||
      employee.role === "Owner"
    ) {
      requests = await prisma.wFHRequest.findMany({
        where: { wid },
        include: employeeInclude,
        orderBy: { appliedAt: "desc" },
      });
    } else if (employee.role === "Manager") {
      const reports = await prisma.employee.findMany({
        where: {
          wid,
          OR: [
            { id: employee.id },
            { reportingManager: { equals: employee.name, mode: "insensitive" } },
            { reportingHR: { equals: employee.name, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      const accessibleIds = reports.map((r) => r.id);

      requests = await prisma.wFHRequest.findMany({
        where: { wid, employeeId: { in: accessibleIds } },
        include: employeeInclude,
        orderBy: { appliedAt: "desc" },
      });
    } else {
      requests = await prisma.wFHRequest.findMany({
        where: { employeeId: employee.id, wid },
        include: employeeInclude,
        orderBy: { appliedAt: "desc" },
      });
    }

    return NextResponse.json({
      requests: requests.map(formatWFHRequest),
    });
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

    const branches = getSystemSettings().branches ?? [];
    const resolved = resolveEmployeeBranch(employee, branches);
    const branchError = getWFHBranchError(resolved);
    if (branchError) {
      return NextResponse.json({ error: branchError }, { status: 400 });
    }

    if (!employee.branch && resolved.branchName && resolved.usedFallback) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { branch: resolved.branchName },
      });
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
      include: employeeInclude,
    });

    return NextResponse.json({ request: formatWFHRequest(request) });
  } catch (error) {
    console.error("API /api/attendance/wfh POST error:", error);
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
    const { id, startDate, endDate, totalDays, halfDay, reason } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing WFH request ID" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;

    const existing = await prisma.wFHRequest.findFirst({
      where: { id, wid },
    });

    if (!existing) {
      return NextResponse.json({ error: "WFH request not found" }, { status: 404 });
    }

    const isAuthorized = await canAccessWFHRequest(employee, existing.employeeId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing.status !== "Pending") {
      return NextResponse.json(
        { error: "Only pending WFH requests can be modified" },
        { status: 400 }
      );
    }

    const updated = await prisma.wFHRequest.update({
      where: { id },
      data: {
        startDate: startDate !== undefined ? startDate : existing.startDate,
        endDate: endDate !== undefined ? endDate : existing.endDate,
        totalDays:
          totalDays !== undefined ? parseFloat(totalDays) : existing.totalDays,
        halfDay: halfDay !== undefined ? !!halfDay : existing.halfDay,
        reason: reason !== undefined ? reason : existing.reason,
      },
      include: employeeInclude,
    });

    return NextResponse.json({ request: formatWFHRequest(updated) });
  } catch (error) {
    console.error("API /api/attendance/wfh PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
