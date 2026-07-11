import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

function normalizeAttachments(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .slice(0, 3);
}

/**
 * Ticket creator can chat while status is Open or In_Progress.
 * Platform support replies via /api/adminpanel/tickets/[id]/reply.
 */
export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const ticketId = typeof body?.ticketId === "string" ? body.ticketId.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const attachments = normalizeAttachments(body?.attachments);

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    if (!message && attachments.length === 0) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
        { status: 400 }
      );
    }

    const wid = employee.wid ?? 1;
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, wid },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.employeeId !== employee.id) {
      return NextResponse.json(
        { error: "Only the ticket creator can send messages" },
        { status: 403 }
      );
    }

    if (ticket.status === "Resolved") {
      return NextResponse.json(
        { error: "This ticket is resolved. You can no longer send messages." },
        { status: 400 }
      );
    }

    if (ticket.status !== "Open" && ticket.status !== "In_Progress") {
      return NextResponse.json(
        { error: "Chat is only available while the ticket is Open or In Progress" },
        { status: 400 }
      );
    }

    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId: ticket.id,
        message: message || "(Attachment)",
        attachments,
        isAdmin: false,
        authorName: employee.name,
      },
    });

    return NextResponse.json({
      reply: {
        id: reply.id,
        message: reply.message,
        attachments: reply.attachments ?? [],
        isAdmin: reply.isAdmin,
        authorName: reply.authorName,
        createdAt: reply.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API /api/support/tickets/reply POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
