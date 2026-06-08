import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceAccess } from "@/lib/billing/workspace-access";
import { FREE_MAX_USERS } from "@/lib/billing/plans";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default current user's wid if not set
    let wid = employee.wid;
    if (wid === null || wid === undefined) {
      wid = 1;
      await prisma.employee.update({
        where: { id: employee.id },
        data: { wid },
      });
    }

    const allEmployees = await prisma.employee.findMany({
      where: { wid },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees: allEmployees });
  } catch (error) {
    console.error("API /api/employees GET error:", error);
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
    const {
      name,
      email,
      password,
      department,
      role,
      status,
      employeeCode,
      phoneNumber,
      joiningDate,
      designation,
      employmentType,
      reportingManager,
      reportingHR,
      workLocation,
      branch,
      rosterShift,
      personalEmail,
      dateOfBirth,
  emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
    } = body;

    if (!name || !email || !department || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required and must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Default current user's wid if not set
    let wid = employee.wid;
    if (wid === null || wid === undefined) {
      wid = 1;
      await prisma.employee.update({
        where: { id: employee.id },
        data: { wid },
      });
    }

    const access = await getWorkspaceAccess(wid);
    const teamCount = await prisma.employee.count({ where: { wid } });
    if (!access.hasProAccess && teamCount >= access.effectiveMaxUsers) {
      return NextResponse.json(
        {
          error: `Free plan allows up to ${FREE_MAX_USERS} team members. Upgrade to Pro to add more.`,
          code: "TEAM_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existing = await prisma.employee.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({ error: "Employee with this email already exists" }, { status: 400 });
    }

    // Create Supabase Auth user first so employee ID maps to auth ID.
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const createResult = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        name,
        department,
        role,
        wid,
      },
    });

    if (createResult.error || !createResult.data.user?.id) {
      const message = createResult.error?.message || "Failed to create Supabase account";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const authUserId = createResult.data.user.id;

    // Get baseline leave settings
    const settings = getSystemSettings();
    const annualLimit = settings.leaveSettings?.annualLimit ?? 15;
    const sickLimit = settings.leaveSettings?.sickLimit ?? 8;
    const casualLimit = settings.leaveSettings?.casualLimit ?? 6;

    const avatarInitials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Create new employee with detailed parameters
    const newEmp = await prisma.employee.create({
      data: {
        id: authUserId,
        name,
        email,
        role,
        department,
        avatarInitials,
        status: status || "Active",
        annualBalance: annualLimit,
        sickBalance: sickLimit,
        casualBalance: casualLimit,
        wid,
        employeeCode: employeeCode || null,
        phoneNumber: phoneNumber || null,
        joiningDate: joiningDate || null,
        designation: designation || null,
        employmentType: employmentType || null,
        reportingManager: reportingManager || null,
        reportingHR: reportingHR || null,
        workLocation: workLocation || null,
        branch: branch || null,
        rosterShift: rosterShift || null,
        personalEmail: personalEmail || null,
        dateOfBirth: dateOfBirth || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        bloodGroup: bloodGroup || null,
      },
    });

    return NextResponse.json({ employee: newEmp });
  } catch (error) {
    console.error("API /api/employees POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
