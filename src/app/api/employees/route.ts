import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";

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

    const employees = await prisma.employee.findMany({
      where: { wid },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
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
      department,
      role,
      status,
      employeeCode,
      phoneNumber,
      joiningDate,
      designation,
      employmentType,
      reportingManager,
      workLocation,
      branch,
      personalEmail,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    if (!name || !email || !department || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Check if email already exists
    const existing = await prisma.employee.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({ error: "Employee with this email already exists" }, { status: 400 });
    }

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
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
        workLocation: workLocation || null,
        branch: branch || null,
        personalEmail: personalEmail || null,
        dateOfBirth: dateOfBirth || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
      },
    });

    return NextResponse.json({ employee: newEmp });
  } catch (error) {
    console.error("API /api/employees POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
