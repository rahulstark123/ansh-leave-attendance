import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { createWorkspaceWithTrial } from "@/lib/billing/workspace-billing";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, department, role, companyName, companyAddress, employeeCount } = body;

    if (!name || !department || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isManagerOrAdmin = role === "Admin" || role === "HR Manager" || role === "Owner";

    // Check if an employee record already exists for this email
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: user.email! },
    });

    let newWid: number;
    if (existingEmployee && existingEmployee.wid) {
      newWid = existingEmployee.wid;
    } else if (isManagerOrAdmin) {
      const workspace = await createWorkspaceWithTrial(
        companyName || "New Workspace"
      );
      newWid = workspace.id;
    } else {
      newWid = 1;
    }

    let employee;
    const avatarInitials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    if (existingEmployee) {
      // Migrate relations to new Supabase ID transactionally
      employee = await prisma.$transaction(async (tx) => {
        const newEmp = await tx.employee.create({
          data: {
            id: user.id,
            name: name,
            email: user.email!,
            role: role,
            department: department,
            avatarInitials: avatarInitials,
            status: existingEmployee.status || "Active",
            annualBalance: existingEmployee.annualBalance,
            sickBalance: existingEmployee.sickBalance,
            casualBalance: existingEmployee.casualBalance,
            companyName: isManagerOrAdmin ? companyName : null,
            companyAddress: isManagerOrAdmin ? companyAddress : null,
            employeeCount: isManagerOrAdmin ? employeeCount : null,
            wid: newWid,
          },
        });

        // Update related records
        await tx.leaveRequest.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        await tx.punchRecord.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        // Delete old seed employee record
        await tx.employee.delete({
          where: { id: existingEmployee.id },
        });

        return newEmp;
      });
    } else {
      // Create brand new employee profile
      employee = await prisma.employee.create({
        data: {
          id: user.id,
          name: name,
          email: user.email!,
          role: role,
          department: department,
          avatarInitials: avatarInitials,
          status: "Active",
          annualBalance: 15,
          sickBalance: 8,
          casualBalance: 6,
          companyName: isManagerOrAdmin ? companyName : null,
          companyAddress: isManagerOrAdmin ? companyAddress : null,
          employeeCount: isManagerOrAdmin ? employeeCount : null,
          wid: newWid,
        },
      });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("API /api/auth/onboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
