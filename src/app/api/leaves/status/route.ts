import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const manager = await getAuthEmployee(req);
    if (!manager || (manager.role !== "Admin" && manager.role !== "HR Manager" && manager.role !== "Owner" && manager.role !== "Manager")) {
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

    // Verify reporting manager check if they are Manager or HR Manager and not Admin/Owner
    const isOwnerOrAdmin = manager.role === "Admin" || manager.role === "Owner";
    if (!isOwnerOrAdmin) {
      const requester = leave.employee;
      const managerName = manager.name.toLowerCase();
      const isReportingManager =
        (requester.reportingManager && requester.reportingManager.toLowerCase() === managerName) ||
        (requester.reportingHR && requester.reportingHR.toLowerCase() === managerName);
      if (!isReportingManager) {
        return NextResponse.json({ error: "Forbidden: You are not authorized to approve/reject leaves for this employee" }, { status: 403 });
      }
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
        const today = new Date().toISOString().split("T")[0];
        if (leave.startDate === today) {
          await tx.employee.update({
            where: { id: leave.employeeId },
            data: { status: "On Leave" },
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
