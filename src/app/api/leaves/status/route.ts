import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const manager = await getAuthEmployee(req);
    if (!manager || (manager.role !== "Admin" && manager.role !== "HR Manager" && manager.role !== "Owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || (status !== "Approved" && status !== "Rejected")) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (leave.wid !== manager.wid) {
      return NextResponse.json({ error: "Forbidden: Cross-workspace access not allowed" }, { status: 403 });
    }

    if (leave.status !== "Pending") {
      return NextResponse.json({ error: "Leave request already processed" }, { status: 400 });
    }

    const updatedLeave = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: { status },
      });

      if (status === "Approved") {
        const type = leave.type;
        const days = leave.totalDays;
        const employee = leave.employee;

        let balanceField: "annualBalance" | "sickBalance" | "casualBalance" | null = null;
        if (type === "Annual") balanceField = "annualBalance";
        else if (type === "Sick") balanceField = "sickBalance";
        else if (type === "Casual") balanceField = "casualBalance";

        if (balanceField) {
          const currentBalance = Number(employee[balanceField]);
          const newBalance = Math.max(0, currentBalance - days);

          await tx.employee.update({
            where: { id: employee.id },
            data: {
              [balanceField]: newBalance,
              status: leave.startDate === new Date().toISOString().split("T")[0] ? "On Leave" : employee.status,
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ leave: updatedLeave });
  } catch (error) {
    console.error("API /api/leaves/status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
