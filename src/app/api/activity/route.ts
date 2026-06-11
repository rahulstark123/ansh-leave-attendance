import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

interface ActivityFeedItem {
  id: string;
  category: "leaves" | "attendance" | "wfh" | "regularization" | "ticket" | "announcement" | "member";
  action: "created" | "approved" | "rejected" | "punched-in" | "punched-out" | "joined" | "posted" | "status-changed";
  title: string;
  description: string;
  actorName: string;
  timestamp: string; // ISO string
  link: string;
}

function parseDateTime(dateStr: string, timeStr: string): Date {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return new Date(dateStr);
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes);
  } catch {
    return new Date(dateStr);
  }
}

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all"; // all, leaves, attendance, support, announcements, team
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const items: ActivityFeedItem[] = [];

    // 1. Fetch Employees (Member Joined)
    if (filter === "all" || filter === "team") {
      const members = await prisma.employee.findMany({
        where: { wid },
        take: 50,
        orderBy: { createdAt: "desc" },
      });
      members.forEach((m) => {
        items.push({
          id: `member-${m.id}`,
          category: "member",
          action: "joined",
          title: "New Team Member Joined",
          description: `${m.name} joined the organization as a ${m.role} in the ${m.department} department.`,
          actorName: m.name,
          timestamp: m.createdAt.toISOString(),
          link: "/team",
        });
      });
    }

    // 2. Fetch LeaveRequests
    if (filter === "all" || filter === "leaves") {
      const leaves = await prisma.leaveRequest.findMany({
        where: { wid },
        take: 50,
        orderBy: { appliedAt: "desc" },
        include: { employee: true },
      });
      leaves.forEach((l) => {
        // Creation event
        items.push({
          id: `leave-apply-${l.id}`,
          category: "leaves",
          action: "created",
          title: "Leave Requested",
          description: `${l.employee.name} requested ${l.totalDays} day(s) of ${l.type} Leave. Reason: "${l.reason}"`,
          actorName: l.employee.name,
          timestamp: l.appliedAt.toISOString(),
          link: "/leave",
        });

        // Approved/Rejected event (simulated from status)
        if (l.status !== "Pending") {
          items.push({
            id: `leave-status-${l.id}`,
            category: "leaves",
            action: l.status === "Approved" ? "approved" : "rejected",
            title: `Leave Request ${l.status}`,
            description: `The leave request for ${l.employee.name} (${l.totalDays} days of ${l.type}) was ${l.status.toLowerCase()}.`,
            actorName: "HR Manager",
            timestamp: new Date(l.appliedAt.getTime() + 1000 * 60 * 60).toISOString(), // Shifted slightly for demo flow
            link: "/leave",
          });
        }
      });
    }

    // 3. Fetch WFHRequests
    if (filter === "all" || filter === "leaves") {
      const wfhs = await prisma.wFHRequest.findMany({
        where: { wid },
        take: 50,
        orderBy: { appliedAt: "desc" },
        include: { employee: true },
      });
      wfhs.forEach((w) => {
        items.push({
          id: `wfh-apply-${w.id}`,
          category: "wfh",
          action: "created",
          title: "WFH Requested",
          description: `${w.employee.name} requested WFH from ${w.startDate} to ${w.endDate} (${w.totalDays} day(s)). Reason: "${w.reason}"`,
          actorName: w.employee.name,
          timestamp: w.appliedAt.toISOString(),
          link: "/attendance/wfh",
        });
      });
    }

    // 4. Fetch PunchRecords
    if (filter === "all" || filter === "attendance") {
      const punches = await prisma.punchRecord.findMany({
        where: { wid },
        take: 100,
        include: { employee: true },
      });
      punches.forEach((p) => {
        const inTime = parseDateTime(p.date, p.punchIn);
        items.push({
          id: `punch-in-${p.id}`,
          category: "attendance",
          action: "punched-in",
          title: "Employee Checked In",
          description: `${p.employee.name} punched in at ${p.punchIn}. Status: ${p.status}.`,
          actorName: p.employee.name,
          timestamp: inTime.toISOString(),
          link: "/attendance",
        });

        if (p.punchOut) {
          const outTime = parseDateTime(p.date, p.punchOut);
          items.push({
            id: `punch-out-${p.id}`,
            category: "attendance",
            action: "punched-out",
            title: "Employee Checked Out",
            description: `${p.employee.name} punched out at ${p.punchOut}. Worked duration: ${p.duration || "N/A"}.`,
            actorName: p.employee.name,
            timestamp: outTime.toISOString(),
            link: "/attendance",
          });
        }
      });
    }

    // 5. Fetch AttendanceRegularizations
    if (filter === "all" || filter === "attendance") {
      const regs = await prisma.attendanceRegularization.findMany({
        where: { wid },
        take: 50,
        orderBy: { appliedAt: "desc" },
        include: { employee: true },
      });
      regs.forEach((r) => {
        items.push({
          id: `reg-apply-${r.id}`,
          category: "regularization",
          action: "created",
          title: "Regularization Requested",
          description: `${r.employee.name} requested regularization for ${r.date} (In: ${r.requestedIn}, Out: ${r.requestedOut}). Reason: "${r.reason}"`,
          actorName: r.employee.name,
          timestamp: r.appliedAt.toISOString(),
          link: "/attendance/regularization",
        });
      });
    }

    // 6. Fetch SupportTickets
    if (filter === "all" || filter === "support") {
      const tickets = await prisma.supportTicket.findMany({
        where: { wid },
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { employee: true },
      });
      tickets.forEach((t) => {
        items.push({
          id: `ticket-apply-${t.id}`,
          category: "ticket",
          action: "created",
          title: "Support Ticket Raised",
          description: `${t.employee.name} raised a ticket: "${t.subject}" under ${t.category} category.`,
          actorName: t.employee.name,
          timestamp: t.createdAt.toISOString(),
          link: "/help",
        });
      });
    }

    // 7. Fetch Announcements
    if (filter === "all" || filter === "announcements") {
      const announcements = await prisma.announcement.findMany({
        where: { wid, archived: false },
        take: 50,
        orderBy: { createdAt: "desc" },
      });
      announcements.forEach((a) => {
        items.push({
          id: `announcement-post-${a.id}`,
          category: "announcement",
          action: "posted",
          title: "New Announcement Posted",
          description: `"${a.title}" posted by ${a.authorName}.`,
          actorName: a.authorName,
          timestamp: a.createdAt.toISOString(),
          link: "/announcements",
        });
      });
    }

    // Merge, sort desc by timestamp
    const sorted = items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Slice for pagination
    const paginated = sorted.slice(offset, offset + limit);

    return NextResponse.json({
      activity: paginated,
      totalCount: sorted.length,
    });
  } catch (error) {
    console.error("API /api/activity GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
