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
    const punches = await prisma.punchRecord.findMany({
      where: { employeeId: employee.id, wid },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      currentPunchIn: employee.currentPunchIn,
      punchHistory: punches,
    });
  } catch (error) {
    console.error("API /api/attendance/punch GET error:", error);
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
    const { action } = body; // "punch-in" | "punch-out"

    if (action === "punch-in") {
      if (employee.currentPunchIn) {
        return NextResponse.json({ error: "Already punched in" }, { status: 400 });
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          currentPunchIn: new Date().toISOString(),
          status: "Active",
        },
      });

      return NextResponse.json({
        currentPunchIn: updatedEmployee.currentPunchIn,
        status: updatedEmployee.status,
      });
    } else if (action === "punch-out") {
      if (!employee.currentPunchIn) {
        return NextResponse.json({ error: "Not punched in" }, { status: 400 });
      }

      const pinTime = new Date(employee.currentPunchIn);
      const poutTime = new Date();
      const diffMs = poutTime.getTime() - pinTime.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      };

      const { getSystemSettings } = require("@/lib/settings");
      const settings = getSystemSettings();
      const { shiftStartTime, gracePeriod } = settings.attendanceSettings;

      // Parse shiftStartTime e.g. "09:00 AM"
      const [timeStr, modifier] = shiftStartTime.split(" ");
      let [hours, minutes] = timeStr.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      // Create a date object for the shift start time on the check-in day
      const shiftDate = new Date(pinTime);
      shiftDate.setHours(hours, minutes, 0, 0);

      // Add grace period in milliseconds
      const lateThreshold = new Date(shiftDate.getTime() + gracePeriod * 60 * 1000);

      const status = pinTime.getTime() > lateThreshold.getTime() ? "Late" : "On-time";


      const punchRecord = await prisma.$transaction(async (tx) => {
        const record = await tx.punchRecord.create({
          data: {
            employeeId: employee.id,
            date: pinTime.toISOString().split("T")[0],
            punchIn: formatTime(pinTime),
            punchOut: formatTime(poutTime),
            duration: `${diffHrs}h ${diffMins}m`,
            status: status,
            wid: employee.wid ?? 1,
          },
        });

        await tx.employee.update({
          where: { id: employee.id },
          data: {
            currentPunchIn: null,
          },
        });

        return record;
      });

      return NextResponse.json({
        punchRecord,
        currentPunchIn: null,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("API /api/attendance/punch POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
