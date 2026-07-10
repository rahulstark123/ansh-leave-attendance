import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";

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
    const { leaveSettings, attendanceSettings, billingSettings, branches, companyProfile } = body;

    // Billing plan changes must go through Razorpay checkout — block direct upgrades
    if (billingSettings) {
      const current = getSystemSettings().billingSettings;
      const isPaidUpgrade =
        (billingSettings.price ?? 0) > 0 &&
        (billingSettings.price ?? 0) > (current.price ?? 0);
      if (isPaidUpgrade) {
        return NextResponse.json(
          { error: "Use the billing page to upgrade via Razorpay checkout" },
          { status: 400 }
        );
      }
    }

    const updated = saveSystemSettings({
      leaveSettings,
      attendanceSettings,
      billingSettings,
      branches,
      companyProfile,
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("API /api/settings POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
