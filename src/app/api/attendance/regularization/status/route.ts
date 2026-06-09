import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { calculateShiftDuration } from "@/lib/regularization-utils";

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner" || employee.role === "Manager";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wid = employee.wid ?? 1;
    const body = await req.json();
    const { id, status } = body; // status: "Approved" | "Rejected"

    if (!id || !status || (status !== "Approved" && status !== "Rejected")) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Verify ownership/existence in current workspace
    const request = await prisma.attendanceRegularization.findFirst({
      where: { id, wid },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "Pending") {
      return NextResponse.json({ error: "Regularization request already processed" }, { status: 400 });
    }

    // Admin, Owner, and HR Manager can approve any workspace request.
    // Managers may only approve their direct reports.
    const canApproveAny =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager";
    if (!canApproveAny) {
      const requester = await prisma.employee.findUnique({
        where: { id: request.employeeId },
      });
      if (!requester) {
        return NextResponse.json({ error: "Requester not found" }, { status: 404 });
      }
      const managerName = employee.name.toLowerCase();
      const isReportingManager =
        (requester.reportingManager && requester.reportingManager.toLowerCase() === managerName) ||
        (requester.reportingHR && requester.reportingHR.toLowerCase() === managerName);
      if (!isReportingManager) {
        return NextResponse.json({ error: "Forbidden: You are not authorized to approve/reject regularizations for this employee" }, { status: 403 });
      }
    }

    // Update regularization request status
    const updatedRequest = await prisma.attendanceRegularization.update({
      where: { id },
      data: { status },
    });

    // If approved, set that day's punch log to the employee's requested times.
    if (status === "Approved") {
      const duration = calculateShiftDuration(request.requestedIn, request.requestedOut);
      const punchStatus = "Regularized";

      // Find if punch record already exists for that employee on that date
      const existingPunch = await prisma.punchRecord.findFirst({
        where: {
          employeeId: request.employeeId,
          date: request.date,
          wid,
        },
      });

      if (existingPunch) {
        // Update existing punch log
        await prisma.punchRecord.update({
          where: { id: existingPunch.id },
          data: {
            punchIn: request.requestedIn,
            punchOut: request.requestedOut,
            duration,
            status: punchStatus,
          },
        });
      } else {
        // Create new punch log (e.g., if employee forgot to check in at all)
        await prisma.punchRecord.create({
          data: {
            employeeId: request.employeeId,
            date: request.date,
            punchIn: request.requestedIn,
            punchOut: request.requestedOut,
            duration,
            status: punchStatus,
            wid,
          },
        });
      }
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("API /api/attendance/regularization/status POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
