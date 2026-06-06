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

    const wid = employee.wid ?? 1;

    // 1. Fetch all employees in the workspace to filter based on roles
    const allEmployees = await prisma.employee.findMany({
      where: { wid },
      orderBy: { name: "asc" },
    });

    let scopedEmployees = [];
    if (employee.role === "Admin" || employee.role === "Owner") {
      scopedEmployees = allEmployees;
    } else if (employee.role === "Manager" || employee.role === "HR Manager") {
      // Find employees reporting to this manager/HR, plus the manager themselves
      const managerName = employee.name.toLowerCase();
      scopedEmployees = allEmployees.filter(
        (emp) =>
          emp.id === employee.id ||
          (emp.reportingManager && emp.reportingManager.toLowerCase() === managerName) ||
          (emp.reportingHR && emp.reportingHR.toLowerCase() === managerName)
      );
    } else {
      // Standard employee sees only themselves
      scopedEmployees = allEmployees.filter((emp) => emp.id === employee.id);
    }

    // 2. Fetch leave requests in the workspace and filter them
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

    const accessibleEmployeeIds = new Set(scopedEmployees.map((e) => e.id));
    const scopedLeaves = allLeaves
      .filter((l) => accessibleEmployeeIds.has(l.employeeId))
      .map((l) => ({
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

    // 3. Fetch personal punch history for the logged-in employee
    const punches = await prisma.punchRecord.findMany({
      where: { employeeId: employee.id, wid },
      orderBy: { date: "desc" },
    });

    const faceEnrolled = isFaceEnrolled(employee.facePhotos, employee.faceEmbedding);

    return NextResponse.json({
      currentUser: employee,
      employees: scopedEmployees,
      leaves: scopedLeaves,
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
