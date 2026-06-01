import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      include: {
        leaves: true,
        punches: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ onboardingRequired: true, email: user.email });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("API /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
