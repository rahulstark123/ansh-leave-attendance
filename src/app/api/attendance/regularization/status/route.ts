import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

// Helper to parse time string e.g. "09:05 AM" into minutes from midnight
const parseTimeStr = (timeStr: string) => {
  const parts = timeStr.split(" ");
  if (parts.length !== 2) return 0;
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

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

    // Verify reporting manager check if they are Manager or HR Manager and not Admin/Owner
    const isOwnerOrAdmin = employee.role === "Admin" || employee.role === "Owner";
    if (!isOwnerOrAdmin) {
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

    // If approved, update or insert the corresponding PunchRecord
    if (status === "Approved") {
      const { getSystemSettings } = require("@/lib/settings");
      const settings = getSystemSettings();
      const { shiftStartTime, gracePeriod } = settings.attendanceSettings;

      // 1. Determine Late / On-time status
      const checkInMinutes = parseTimeStr(request.requestedIn);
      const shiftStartMinutes = parseTimeStr(shiftStartTime);
      const lateThresholdMinutes = shiftStartMinutes + gracePeriod;

      const punchStatus = checkInMinutes > lateThresholdMinutes ? "Late" : "On-time";

      // 2. Calculate duration
      const checkOutMinutes = parseTimeStr(request.requestedOut);
      const diffMinutes = Math.max(0, checkOutMinutes - checkInMinutes);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      const duration = `${hours}h ${minutes.toString().padStart(2, "0")}m`;

      // 3. Find if punch record already exists for that employee on that date
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
