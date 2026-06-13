import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { createWorkspaceWithTrial } from "@/lib/billing/workspace-billing";
import { getSystemSettings } from "@/lib/settings";

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

    // Check if an employee record already exists for this email
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: user.email! },
    });

    const isNewWorkspace = !existingEmployee || !existingEmployee.wid;

    let newWid: number;
    if (existingEmployee && existingEmployee.wid) {
      newWid = existingEmployee.wid;
    } else {
      const workspace = await createWorkspaceWithTrial(
        companyName || "New Workspace"
      );
      newWid = workspace.id;
    }

    const defaultBranch =
      getSystemSettings().branches?.[0]?.name ?? "Main HQ";

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
        // 1. Temporarily change the email of the existing employee to free up the unique constraint
        await tx.employee.update({
          where: { id: existingEmployee.id },
          data: { email: `temp-${Date.now()}-${existingEmployee.email}` },
        });

        // 2. Create the new employee with correct email
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
            companyName: isNewWorkspace ? companyName : null,
            companyAddress: isNewWorkspace ? companyAddress : null,
            employeeCount: isNewWorkspace ? employeeCount : null,
            wid: newWid,
            branch: isNewWorkspace ? defaultBranch : null,
          },
        });

        // 3. Update all related records
        await tx.leaveRequest.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        await tx.punchRecord.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        await tx.attendanceRegularization.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        await tx.wFHRequest.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        await tx.workspaceChannel.updateMany({
          where: { createdById: existingEmployee.id },
          data: { createdById: user.id },
        });

        await tx.channelMember.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        await tx.workspaceMessage.updateMany({
          where: { senderId: existingEmployee.id },
          data: { senderId: user.id },
        });

        await tx.workspaceMessage.updateMany({
          where: { receiverId: existingEmployee.id },
          data: { receiverId: user.id },
        });

        await tx.supportTicket.updateMany({
          where: { employeeId: existingEmployee.id },
          data: { employeeId: user.id },
        });

        // 4. Delete old seed employee record
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
          companyName: isNewWorkspace ? companyName : null,
          companyAddress: isNewWorkspace ? companyAddress : null,
          employeeCount: isNewWorkspace ? employeeCount : null,
          wid: newWid,
          branch: isNewWorkspace ? defaultBranch : null,
        },
      });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("API /api/auth/onboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
