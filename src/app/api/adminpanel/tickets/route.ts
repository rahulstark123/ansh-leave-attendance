import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminpanel/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            role: true,
            avatarInitials: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workspaces = await prisma.workspace.findMany({
      select: { id: true, name: true },
    });
    const workspaceMap = new Map(workspaces.map((w) => [w.id, w.name || `Workspace #${w.id}`]));

    const formatted = tickets.map((t) => ({
      id: t.id,
      wid: t.wid,
      workspaceName: workspaceMap.get(t.wid) || `Workspace #${t.wid}`,
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

    return NextResponse.json({ tickets: formatted });
  } catch (error) {
    console.error("Admin tickets GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
