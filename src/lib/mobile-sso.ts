const SSO_TTL_SEC = 60;

type MobileSsoPayload = {
  uid: string;
  accessToken: string;
  refreshToken?: string;
  exp: number;
  jti: string;
};

function getSsoSecret(): string {
  return (
    process.env.MOBILE_SSO_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 48) ||
    "ansh-mobile-sso-dev-secret"
  );
}

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSsoSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let match = true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) match = false;
  }
  return match;
}

export async function createMobileSsoToken(input: {
  userId: string;
  accessToken: string;
  refreshToken?: string;
}): Promise<{ token: string; expiresIn: number }> {
  const payload: MobileSsoPayload = {
    uid: input.userId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken || undefined,
    exp: Math.floor(Date.now() / 1000) + SSO_TTL_SEC,
    jti: crypto.randomUUID(),
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  const sig = await signPayload(encoded);
  return { token: `${encoded}.${sig}`, expiresIn: SSO_TTL_SEC };
}

export async function verifyMobileSsoToken(
  token: string
): Promise<{ accessToken: string; refreshToken?: string; userId: string } | null> {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = await signPayload(encoded);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as MobileSsoPayload;
    if (!payload?.accessToken || !payload?.uid || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      userId: payload.uid,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };
  } catch {
    return null;
  }
}

/** Only allow same-origin relative paths (e.g. /settings/billing). */
export function sanitizeMobileSsoRedirect(redirect: string | null | undefined): string {
  const fallback = "/settings/billing";
  if (!redirect) return fallback;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return fallback;
  if (redirect.includes("://")) return fallback;
  return redirect;
}
