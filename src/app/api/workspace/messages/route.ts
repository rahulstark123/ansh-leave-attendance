import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { canAccessChannel, formatMessage } from "@/lib/workspace-access";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const receiverId = searchParams.get("receiverId");
    const listDmPartners = searchParams.get("listDmPartners") === "true";
    const wid = employee.wid ?? 1;

    if (listDmPartners) {
      const dmMessages = await prisma.workspaceMessage.findMany({
        where: {
          wid,
          channelId: null,
          OR: [{ senderId: employee.id }, { receiverId: employee.id }],
        },
        select: { senderId: true, receiverId: true },
      });

      const partnerIds = new Set<string>();
      for (const msg of dmMessages) {
        if (msg.senderId === employee.id && msg.receiverId) {
          partnerIds.add(msg.receiverId);
        } else if (msg.receiverId === employee.id) {
          partnerIds.add(msg.senderId);
        }
      }

      const partners = await prisma.employee.findMany({
        where: { wid, id: { in: Array.from(partnerIds) } },
        select: { id: true, name: true, role: true, department: true, avatarInitials: true, status: true },
      });

      return NextResponse.json({ partners });
    }

    if (channelId) {
      const channel = await prisma.workspaceChannel.findFirst({
        where: { id: channelId, wid },
        include: { members: { select: { employeeId: true } } },
      });

      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      }

      if (!(await canAccessChannel(employee.id, channel))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const messages = await prisma.workspaceMessage.findMany({
        where: { channelId, wid },
        include: {
          sender: { select: { name: true, avatarInitials: true } },
        },
        orderBy: { sentAt: "asc" },
      });

      return NextResponse.json({
        messages: messages.map(formatMessage),
      });
    }

    if (receiverId) {
      if (receiverId === employee.id) {
        return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });
      }

      const partner = await prisma.employee.findFirst({
        where: { id: receiverId, wid },
      });
      if (!partner) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      const messages = await prisma.workspaceMessage.findMany({
        where: {
          wid,
          channelId: null,
          OR: [
            { senderId: employee.id, receiverId },
            { senderId: receiverId, receiverId: employee.id },
          ],
        },
        include: {
          sender: { select: { name: true, avatarInitials: true } },
        },
        orderBy: { sentAt: "asc" },
      });

      return NextResponse.json({
        messages: messages.map(formatMessage),
      });
    }

    return NextResponse.json(
      { error: "Provide channelId or receiverId query parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("API /api/workspace/messages GET error:", error);
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
    const { content, channelId, receiverId } = body as {
      content?: string;
      channelId?: string;
      receiverId?: string;
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (!channelId && !receiverId) {
      return NextResponse.json(
        { error: "Provide channelId or receiverId" },
        { status: 400 }
      );
    }

    if (channelId && receiverId) {
      return NextResponse.json(
        { error: "Message must be either a channel post or a DM, not both" },
        { status: 400 }
      );
    }

    const wid = employee.wid ?? 1;

    if (channelId) {
      const channel = await prisma.workspaceChannel.findFirst({
        where: { id: channelId, wid },
        include: { members: { select: { employeeId: true } } },
      });

      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      }

      if (!(await canAccessChannel(employee.id, channel))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (receiverId) {
      if (receiverId === employee.id) {
        return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });
      }

      const partner = await prisma.employee.findFirst({
        where: { id: receiverId, wid },
      });
      if (!partner) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
    }

    const message = await prisma.workspaceMessage.create({
      data: {
        content: content.trim(),
        senderId: employee.id,
        channelId: channelId ?? null,
        receiverId: receiverId ?? null,
        wid,
      },
      include: {
        sender: { select: { name: true, avatarInitials: true } },
      },
    });

    return NextResponse.json({ message: formatMessage(message) }, { status: 201 });
  } catch (error) {
    console.error("API /api/workspace/messages POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
