import { NextResponse } from "next/server";
import { getBillingAuthorizedEmployee, getEmployeeWorkspaceId } from "@/lib/billing/auth";
import { downgradeWorkspaceToFree, ensureWorkspaceBilling } from "@/lib/billing/workspace-billing";
import { planDisplayName, FREE_MAX_USERS } from "@/lib/billing/plans";

export async function POST(req: Request) {
  try {
    const employee = await getBillingAuthorizedEmployee(req);
    if (!employee) {
      return NextResponse.json(
        { error: "Unauthorized or insufficient permissions" },
        { status: 403 }
      );
    }

    const workspaceId = getEmployeeWorkspaceId(employee);
    await ensureWorkspaceBilling(workspaceId);
    await downgradeWorkspaceToFree(workspaceId);

    return NextResponse.json({
      success: true,
      plan: "free",
      planName: planDisplayName("free"),
      maxUsers: FREE_MAX_USERS,
    });
  } catch (error) {
    console.error("POST /api/billing/downgrade error:", error);
    return NextResponse.json({ error: "Failed to downgrade plan" }, { status: 500 });
  }
}
