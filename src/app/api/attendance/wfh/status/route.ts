import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

// Helper to generate an array of YYYY-MM-DD date strings between start and end dates (inclusive)
const getDatesInRange = (startDateStr: string, endDateStr: string) => {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const current = new Date(start);

  while (current <= end) {
    // Format as YYYY-MM-DD in local time zone
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export async function POST(req: Request) {
  return handleWFHStatusUpdate(req);
}

export async function PATCH(req: Request) {
  return handleWFHStatusUpdate(req);
}

async function handleWFHStatusUpdate(req: Request) {
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
    const request = await prisma.wFHRequest.findFirst({
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
        return NextResponse.json({ error: "Forbidden: You are not authorized to approve/reject WFH for this employee" }, { status: 403 });
      }
    }

    // Update WFH request status
    const updatedRequest = await prisma.wFHRequest.update({
      where: { id },
      data: { status },
    });

    // If approved, create or update corresponding PunchRecord for each workday in range
    if (status === "Approved") {
      const dates = getDatesInRange(request.startDate, request.endDate);
      
      // Fetch holidays to exclude
      const holidays = await prisma.companyHoliday.findMany({
        where: { wid },
      });
      const holidayDates = new Set(holidays.map((h) => h.date));

      for (const dateStr of dates) {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();

        // Skip Saturday (6) and Sunday (0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }

        // Skip official holidays
        if (holidayDates.has(dateStr)) {
          continue;
        }

        // Find if punch record already exists for that employee on that date
        const existingPunch = await prisma.punchRecord.findFirst({
          where: {
            employeeId: request.employeeId,
            date: dateStr,
            wid,
          },
        });

        // WFH punch settings
        const punchInTime = "09:00 AM";
        const punchOutTime = request.halfDay ? "01:00 PM" : "06:00 PM";
        const duration = request.halfDay ? "4h 00m" : "9h 00m";
        const punchStatus = request.halfDay ? "Half-day" : "WFH";

        if (existingPunch) {
          // If the record exists and is "Absent", overwrite it.
          // Otherwise, we can still mark it as WFH.
          await prisma.punchRecord.update({
            where: { id: existingPunch.id },
            data: {
              punchIn: punchInTime,
              punchOut: punchOutTime,
              duration: duration,
              status: punchStatus,
            },
          });
        } else {
          // Create new punch log as WFH
          await prisma.punchRecord.create({
            data: {
              employeeId: request.employeeId,
              date: dateStr,
              punchIn: punchInTime,
              punchOut: punchOutTime,
              duration: duration,
              status: punchStatus,
              wid,
            },
          });
        }
      }
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("API /api/attendance/wfh/status POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
