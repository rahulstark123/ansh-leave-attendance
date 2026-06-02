import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("API /api/settings GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { leaveSettings, attendanceSettings, billingSettings, branches } = body;

    const updated = saveSystemSettings({
      leaveSettings,
      attendanceSettings,
      billingSettings,
      branches,
    });

    // If leaveSettings were updated, let's update all employees' baseline balances
    if (leaveSettings) {
      const annualLimit = parseFloat(leaveSettings.annualLimit);
      const sickLimit = parseFloat(leaveSettings.sickLimit);
      const casualLimit = parseFloat(leaveSettings.casualLimit);

      if (!isNaN(annualLimit) && !isNaN(sickLimit) && !isNaN(casualLimit)) {
        await prisma.employee.updateMany({
          data: {
            annualBalance: annualLimit,
            sickBalance: sickLimit,
            casualBalance: casualLimit,
          },
        });
      }
    }

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("API /api/settings POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
