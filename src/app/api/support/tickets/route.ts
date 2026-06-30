import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    let tickets;
    const isManagement =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager" ||
      employee.role === "Manager";

    const ticketInclude = {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          avatarInitials: true,
        },
      },
      replies: {
        orderBy: { createdAt: "asc" as const },
      },
    };

    if (isManagement) {
      tickets = await prisma.supportTicket.findMany({
        where: { wid },
        include: ticketInclude,
        orderBy: { createdAt: "desc" },
      });
    } else {
      tickets = await prisma.supportTicket.findMany({
        where: { employeeId: employee.id, wid },
        include: ticketInclude,
        orderBy: { createdAt: "desc" },
      });
    }

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      employeeId: t.employeeId,
      employeeName: t.employee.name,
      employeeEmail: t.employee.email,
      employeeRole: t.employee.role,
      avatarInitials: t.employee.avatarInitials,
      category: t.category,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      replies: t.replies.map((r) => ({
        id: r.id,
        message: r.message,
        isAdmin: r.isAdmin,
        authorName: r.authorName,
        createdAt: r.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error) {
    console.error("API /api/support/tickets GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, subject, description, priority } = body;

    if (!category || !subject || !description || !priority) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        employeeId: employee.id,
        category,
        subject,
        description,
        priority,
        status: "Open",
        wid: employee.wid ?? 1,
      },
    });

    const formattedTicket = {
      id: ticket.id,
      employeeId: ticket.employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      employeeRole: employee.role,
      avatarInitials: employee.avatarInitials,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };

    return NextResponse.json({ ticket: formattedTicket });
  } catch (error) {
    console.error("API /api/support/tickets POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, wid },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Access control: creator or management
    const isOwner = ticket.employeeId === employee.id;
    const isManagement =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager" ||
      employee.role === "Manager";

    if (!isOwner && !isManagement) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.supportTicket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/support/tickets DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
