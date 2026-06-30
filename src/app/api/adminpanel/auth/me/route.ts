import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminpanel/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ email: session.email });
}
