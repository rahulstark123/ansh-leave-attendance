import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { isFaceEnrolled } from "@/lib/face-enrollment";
import { calculatePunchStatus, formatPunchTime } from "@/lib/punch-utils";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    // 1. Fetch all employees in the workspace
    const allEmployees = await prisma.employee.findMany({
      where: { wid },
      orderBy: { name: "asc" },
    });

    // Scoped list for dashboard calculations
    let scopedEmployees = [];
    if (employee.role === "Admin" || employee.role === "Owner") {
      scopedEmployees = allEmployees;
    } else if (employee.role === "Manager" || employee.role === "HR Manager") {
      const managerName = employee.name.toLowerCase();
      scopedEmployees = allEmployees.filter(
        (emp) =>
          emp.id === employee.id ||
          (emp.reportingManager && emp.reportingManager.toLowerCase() === managerName) ||
          (emp.reportingHR && emp.reportingHR.toLowerCase() === managerName)
      );
    } else {
      scopedEmployees = allEmployees.filter((emp) => emp.id === employee.id);
    }

    // 2. Fetch all leave requests in the workspace
    const allLeaves = await prisma.leaveRequest.findMany({
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

    // Format all leaves
    const formattedAllLeaves = allLeaves.map((l) => ({
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

    // Filter leaves for general store state based on standard leaves route logic
    let generalLeaves = [];
    if (employee.role === "Admin" || employee.role === "Owner") {
      generalLeaves = formattedAllLeaves;
    } else if (employee.role === "Manager" || employee.role === "HR Manager") {
      const managerName = employee.name.toLowerCase();
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
      const accessibleEmployeeIds = new Set(accessibleIds);
      generalLeaves = formattedAllLeaves.filter((l) => accessibleEmployeeIds.has(l.employeeId));
    } else {
      generalLeaves = formattedAllLeaves.filter((l) => l.employeeId === employee.id);
    }

    // Filter dashboard scoped leaves
    const accessibleEmployeeIds = new Set(scopedEmployees.map((e) => e.id));
    const scopedLeaves = formattedAllLeaves.filter((l) => accessibleEmployeeIds.has(l.employeeId));

    // 3. Fetch personal punch history for the logged-in employee
    const punches = await prisma.punchRecord.findMany({
      where: { employeeId: employee.id, wid },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });

    if (employee.currentPunchIn && !punches.some((p) => p.punchOut === null)) {
      const pinTime = new Date(employee.currentPunchIn);
      const backfilled = await prisma.punchRecord.create({
        data: {
          employeeId: employee.id,
          date: pinTime.toISOString().split("T")[0],
          punchIn: formatPunchTime(pinTime),
          punchOut: null,
          duration: null,
          status: calculatePunchStatus(pinTime),
          wid,
          punchInPhoto: employee.currentPunchInPhoto,
          punchInLat: employee.currentPunchInLat,
          punchInLng: employee.currentPunchInLng,
        },
      });
      punches.unshift(backfilled);
    }

    const faceEnrolled = isFaceEnrolled(employee.facePhotos, employee.faceEmbedding);

    return NextResponse.json({
      currentUser: employee,
      employees: allEmployees,               // Full list for Team Page / Workspace DMs
      leaves: generalLeaves,                 // General list for Leave Manager Page
      dashboardEmployees: scopedEmployees,   // Scoped list for Dashboard metrics
      dashboardLeaves: scopedLeaves,         // Scoped list for Dashboard metrics
      punchHistory: punches,
      currentPunchIn: employee.currentPunchIn,
      currentPunchInPhoto: employee.currentPunchInPhoto,
      currentPunchInLat: employee.currentPunchInLat,
      currentPunchInLng: employee.currentPunchInLng,
      faceEnrolled,
    });
  } catch (error) {
    console.error("API /api/dashboard GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
