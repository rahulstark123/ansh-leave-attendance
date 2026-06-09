import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { detectCountryFromRequest } from "@/lib/billing/display-currency";
import { getFxDisplay } from "@/lib/billing/charge-region";
import { getRazorpayConfig } from "@/lib/billing/razorpay";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cfg = getRazorpayConfig();
    if (!cfg) {
      return NextResponse.json(
        { error: "Payment gateway is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const countryOverride = searchParams.get("country");
    const countryCode = (
      countryOverride?.toUpperCase() || (await detectCountryFromRequest(req))
    ).slice(0, 2);

    return NextResponse.json(getFxDisplay(cfg, countryCode));
  } catch (error) {
    console.error("GET /api/billing/fx error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
