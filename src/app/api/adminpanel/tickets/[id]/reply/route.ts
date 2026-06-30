import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminpanel/auth";
import { prisma } from "@/lib/db";

export async function POST(
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
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId: id,
        message: message.trim(),
        isAdmin: true,
        authorName: "ANSH Support",
      },
    });

    if (ticket.status === "Open") {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: "In_Progress" },
      });
    }

    return NextResponse.json({
      reply: {
        id: reply.id,
        message: reply.message,
        isAdmin: reply.isAdmin,
        authorName: reply.authorName,
        createdAt: reply.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin ticket reply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
