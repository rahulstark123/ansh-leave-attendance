import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminpanel/auth";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["Open", "In_Progress", "Resolved"] as const;
const VALID_PRIORITIES = ["Low", "Medium", "High"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, priority } = body;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const data: { status?: string; priority?: string } = {};
    if (status && VALID_STATUSES.includes(status)) data.status = status;
    if (priority && VALID_PRIORITIES.includes(priority)) data.priority = priority;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ticket: {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin ticket status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
