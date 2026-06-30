import type { NextRequest } from "next/server";

export const COOKIE_NAME = "adminpanel_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 12;

function getSecret(): string {
  return (
    process.env.ADMINPANEL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    "ansh-adminpanel-dev-secret"
  );
}

function getCredentials() {
  return {
    email: (process.env.ADMINPANEL_EMAIL || "hr@anshapps.com").toLowerCase().trim(),
    password: process.env.ADMINPANEL_PASSWORD || "Rahul@123",
    passcode: process.env.ADMINPANEL_PASSCODE || "Khushi@Simran",
    pin: process.env.ADMINPANEL_PIN || "30042026",
  };
}

export function verifyAdminCredentials(
  email: string,
  password: string,
  passcode: string,
  pin: string
): boolean {
  const creds = getCredentials();
  const normalizedPin = pin.replace(/\D/g, "");
  return (
    email.toLowerCase().trim() === creds.email &&
    password === creds.password &&
    passcode === creds.passcode &&
    normalizedPin === creds.pin.replace(/\D/g, "")
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = btoa(JSON.stringify({ email, exp }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const sig = await signPayload(payload);
  return `${payload}.${sig}`;
}

async function parseSessionToken(
  token: string
): Promise<{ email: string; exp: number } | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = await signPayload(payload);
  if (sig.length !== expected.length) return null;

  let match = true;
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] !== expected[i]) match = false;
  }
  if (!match) return null;

  try {
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { email: string; exp: number };
    if (!data.email || !data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(
  req: NextRequest | Request
): Promise<{ email: string } | null> {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) return null;

  const session = await parseSessionToken(decodeURIComponent(match[1]));
  return session ? { email: session.email } : null;
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await parseSessionToken(token);
  return session ? { email: session.email } : null;
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
