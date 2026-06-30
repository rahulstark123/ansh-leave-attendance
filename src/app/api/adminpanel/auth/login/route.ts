import { NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/adminpanel/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, passcode, pin } = body;

    if (!email || !password || !passcode || pin === undefined || pin === null || pin === "") {
      return NextResponse.json(
        { error: "Email, password, passcode, and PIN are required" },
        { status: 400 }
      );
    }

    const normalizedPin = String(pin).replace(/\D/g, "");
    if (!normalizedPin) {
      return NextResponse.json(
        { error: "PIN must contain numbers only" },
        { status: 400 }
      );
    }

    if (!verifyAdminCredentials(email, password, passcode, normalizedPin)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken(email.toLowerCase().trim());
    const cookie = sessionCookieOptions(token);
    const res = NextResponse.json({ success: true, email: email.toLowerCase().trim() });
    res.cookies.set(cookie);
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
