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
    const whereClause: any = {
      wid,
      archived: false,
    };

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: [
        { pinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("API /api/announcements GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManagement =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager";

    if (!isManagement) {
      return NextResponse.json({ error: "Forbidden: Admins, Owners, and HR Managers only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, body: announcementBody, pinned } = body;

    if (!title || !announcementBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: announcementBody,
        pinned: Boolean(pinned),
        archived: false,
        wid: employee.wid ?? 1,
        authorId: employee.id,
        authorName: employee.name,
      },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("API /api/announcements POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManagement =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager";

    if (!isManagement) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, body: announcementBody, pinned, archived } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing announcement ID" }, { status: 400 });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing || existing.wid !== (employee.wid ?? 1)) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (announcementBody !== undefined) updateData.body = announcementBody;
    if (pinned !== undefined) updateData.pinned = Boolean(pinned);
    if (archived !== undefined) updateData.archived = Boolean(archived);

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ announcement: updated });
  } catch (error) {
    console.error("API /api/announcements PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManagement =
      employee.role === "Admin" ||
      employee.role === "Owner" ||
      employee.role === "HR Manager";

    if (!isManagement) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing announcement ID" }, { status: 400 });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing || existing.wid !== (employee.wid ?? 1)) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/announcements DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
