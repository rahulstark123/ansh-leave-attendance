import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import {
  canAccessChannel,
  ensureDefaultChannel,
  formatChannel,
} from "@/lib/workspace-access";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;
    await ensureDefaultChannel(employee);

    const allChannels = await prisma.workspaceChannel.findMany({
      where: { wid },
      include: {
        members: {
          include: {
            employee: { select: { id: true, name: true, avatarInitials: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const visible = [];
    for (const channel of allChannels) {
      if (await canAccessChannel(employee.id, channel)) {
        visible.push(formatChannel(channel));
      }
    }

    return NextResponse.json({ channels: visible });
  } catch (error) {
    console.error("API /api/workspace/channels GET error:", error);
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
    const { name, description = "", isPublic = true, memberIds = [] } = body as {
      name?: string;
      description?: string;
      isPublic?: boolean;
      memberIds?: string[];
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/#/g, "");
    const wid = employee.wid ?? 1;
    const publicChannel = isPublic !== false;

    const uniqueMemberIds = Array.from(
      new Set(
        (Array.isArray(memberIds) ? memberIds : [])
          .filter((id): id is string => typeof id === "string" && id !== employee.id)
      )
    );

    if (!publicChannel && uniqueMemberIds.length === 0) {
      return NextResponse.json(
        { error: "Private channels require at least one member" },
        { status: 400 }
      );
    }

    const existing = await prisma.workspaceChannel.findUnique({
      where: { name_wid: { name: cleanName, wid } },
    });
    if (existing) {
      return NextResponse.json({ error: "A channel with this name already exists" }, { status: 409 });
    }

    if (!publicChannel && uniqueMemberIds.length > 0) {
      const validCount = await prisma.employee.count({
        where: { wid, id: { in: uniqueMemberIds } },
      });
      if (validCount !== uniqueMemberIds.length) {
        return NextResponse.json({ error: "One or more selected members are invalid" }, { status: 400 });
      }
    }

    const channel = await prisma.workspaceChannel.create({
      data: {
        name: cleanName,
        description: description.trim(),
        isPublic: publicChannel,
        createdById: employee.id,
        wid,
        members: publicChannel
          ? undefined
          : {
              create: uniqueMemberIds.map((employeeId) => ({ employeeId })),
            },
      },
      include: {
        members: {
          include: {
            employee: { select: { id: true, name: true, avatarInitials: true } },
          },
        },
      },
    });

    return NextResponse.json({ channel: formatChannel(channel) }, { status: 201 });
  } catch (error) {
    console.error("API /api/workspace/channels POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
