import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

// Default leave categories to seed when a workspace has none
const defaultCategories = [
  {
    name: "Maternity Leave",
    days: 90,
    color: "purple",
    allowRollover: false,
    description: "Paid time off for expecting mothers before and after childbirth.",
    applicableGender: "Female",
    accrualPolicy: "One-time",
    requiresProof: true
  },
  {
    name: "Paternity Leave",
    days: 15,
    color: "indigo",
    allowRollover: false,
    description: "Paid time off for new fathers following childbirth or adoption.",
    applicableGender: "Male",
    accrualPolicy: "One-time",
    requiresProof: true
  },
  {
    name: "Marriage Leave",
    days: 5,
    color: "pink",
    allowRollover: false,
    description: "Paid days off granted to employees celebrating their own marriage.",
    applicableGender: "All",
    accrualPolicy: "One-time",
    requiresProof: true
  },
  {
    name: "Bereavement Leave",
    days: 7,
    color: "slate",
    allowRollover: false,
    description: "Compassionate paid leave granted upon the loss of an immediate family member.",
    applicableGender: "All",
    accrualPolicy: "One-time",
    requiresProof: false
  }
];

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;

    // Fetch existing leave categories for this workspace
    let leaveCategories = await prisma.leaveCategory.findMany({
      where: { wid },
      orderBy: { createdAt: "asc" }
    });

    // Lazy seed default categories if none exist in the database for this wid
    if (leaveCategories.length === 0) {
      await prisma.leaveCategory.createMany({
        data: defaultCategories.map(cat => ({
          ...cat,
          wid
        }))
      });

      leaveCategories = await prisma.leaveCategory.findMany({
        where: { wid },
        orderBy: { createdAt: "asc" }
      });
    }

    return NextResponse.json({ leaveCategories });
  } catch (error) {
    console.error("API /api/settings/leave-category GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wid = employee.wid ?? 1;
    const body = await req.json();
    const {
      name,
      days,
      color,
      allowRollover,
      description,
      applicableGender,
      accrualPolicy,
      requiresProof
    } = body;

    if (!name || days === undefined || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const leaveCategory = await prisma.leaveCategory.create({
      data: {
        name,
        days: parseInt(days) || 0,
        color,
        allowRollover: !!allowRollover,
        description: description || null,
        applicableGender: applicableGender || "All",
        accrualPolicy: accrualPolicy || "One-time",
        requiresProof: !!requiresProof,
        wid
      }
    });

    return NextResponse.json({ leaveCategory });
  } catch (error) {
    console.error("API /api/settings/leave-category POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wid = employee.wid ?? 1;
    const body = await req.json();
    const {
      id,
      name,
      days,
      color,
      allowRollover,
      description,
      applicableGender,
      accrualPolicy,
      requiresProof
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.leaveCategory.findFirst({
      where: { id, wid }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave category not found" }, { status: 404 });
    }

    const updated = await prisma.leaveCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        days: days !== undefined ? (parseInt(days) || 0) : existing.days,
        color: color !== undefined ? color : existing.color,
        allowRollover: allowRollover !== undefined ? !!allowRollover : existing.allowRollover,
        description: description !== undefined ? description : existing.description,
        applicableGender: applicableGender !== undefined ? applicableGender : existing.applicableGender,
        accrualPolicy: accrualPolicy !== undefined ? accrualPolicy : existing.accrualPolicy,
        requiresProof: requiresProof !== undefined ? !!requiresProof : existing.requiresProof
      }
    });

    return NextResponse.json({ leaveCategory: updated });
  } catch (error) {
    console.error("API /api/settings/leave-category PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = employee.role === "Admin" || employee.role === "HR Manager" || employee.role === "Owner";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const wid = employee.wid ?? 1;
    
    // Parse ID from query params or body
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // Body parser failed, ID remains empty
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.leaveCategory.findFirst({
      where: { id, wid }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave category not found or unauthorized" }, { status: 404 });
    }

    await prisma.leaveCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/settings/leave-category DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
