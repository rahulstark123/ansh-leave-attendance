import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/adminpanel/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(clearSessionCookieOptions());
  return res;
}
