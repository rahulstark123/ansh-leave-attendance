import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { calculatePunchStatus, formatPunchTime } from "@/lib/punch-utils";

function monthBounds(year: number, month: number) {
  const monthStr = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${monthStr}-01`,
    end: `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
  };
}

function holidayAppliesToBranch(branchId: string | null | undefined, userBranch?: string | null) {
  if (!branchId || branchId === "All") return true;
  if (!userBranch) return true;
  return branchId.toLowerCase() === userBranch.toLowerCase();
}

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;
    const { start: monthStart, end: monthEnd } = monthBounds(year, month);

    const [punches, leaves, allHolidays] = await Promise.all([
      prisma.punchRecord.findMany({
        where: {
          employeeId: employee.id,
          wid,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: [{ date: "desc" }, { id: "desc" }],
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId: employee.id,
          wid,
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
        orderBy: { appliedAt: "desc" },
      }),
      prisma.companyHoliday.findMany({
        where: {
          wid,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    if (employee.currentPunchIn) {
      const pinDate = new Date(employee.currentPunchIn).toISOString().split("T")[0];
      const hasOpenInMonth = punches.some((p) => p.punchOut === null);
      const pinInRange = pinDate >= monthStart && pinDate <= monthEnd;

      if (!hasOpenInMonth && pinInRange) {
        const pinTime = new Date(employee.currentPunchIn);
        const backfilled = await prisma.punchRecord.create({
          data: {
            employeeId: employee.id,
            date: pinDate,
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
    }

    const holidays = allHolidays
      .filter((h) => holidayAppliesToBranch(h.branchId, employee.branch))
      .map((h) => ({
        id: h.id,
        name: h.name,
        date: h.date,
        type: h.type,
        branchId: h.branchId,
      }));

    const formattedLeaves = leaves.map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      halfDay: l.halfDay,
      reason: l.reason,
      status: l.status,
      appliedAt: l.appliedAt.toISOString(),
    }));

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        branch: employee.branch,
        joiningDate: employee.joiningDate,
      },
      punchHistory: punches,
      leaves: formattedLeaves,
      holidays,
      month: { year, month },
    });
  } catch (error) {
    console.error("API /api/calendar GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
