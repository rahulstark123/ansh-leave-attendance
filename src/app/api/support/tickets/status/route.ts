import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const wid = employee.wid ?? 1;

    // Find the ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, wid },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Access control check: Must be owner or management role
    const isOwner = ticket.employeeId === employee.id;
    const isManagement =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager" ||
      employee.role === "Manager";

    if (!isOwner && !isManagement) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Formulate update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            role: true,
            avatarInitials: true,
          },
        },
      },
    });

    const formattedTicket = {
      id: updatedTicket.id,
      employeeId: updatedTicket.employeeId,
      employeeName: updatedTicket.employee.name,
      employeeEmail: updatedTicket.employee.email,
      employeeRole: updatedTicket.employee.role,
      avatarInitials: updatedTicket.employee.avatarInitials,
      category: updatedTicket.category,
      subject: updatedTicket.subject,
      description: updatedTicket.description,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      createdAt: updatedTicket.createdAt.toISOString(),
      updatedAt: updatedTicket.updatedAt.toISOString(),
    };

    return NextResponse.json({ ticket: formattedTicket });
  } catch (error) {
    console.error("API /api/support/tickets/status PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
