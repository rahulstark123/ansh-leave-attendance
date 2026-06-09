function getClientIp(request: Request): string | null {
  const headerNames = [
    "cf-connecting-ip",
    "true-client-ip",
    "x-real-ip",
    "x-forwarded-for",
  ];

  for (const name of headerNames) {
    const value = request.headers.get(name)?.trim();
    if (!value) continue;
    const ip = name === "x-forwarded-for" ? value.split(",")[0]?.trim() : value;
    if (ip) return ip;
  }

  return null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) return true;
  if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
}

async function lookupCountryFromIp(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; country_code?: string };
      if (data.success && data.country_code) {
        return data.country_code.toUpperCase();
      }
    }
  } catch {
    /* try fallback */
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = (await res.json()) as { status?: string; countryCode?: string };
      if (data.status === "success" && data.countryCode) {
        return data.countryCode.toUpperCase();
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Fast path: CDN / edge country headers only. */
export function detectCountryFromHeaders(request: Request): string | null {
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

  return null;
}

/**
 * Resolve billing country from IP (headers first, then IP geolocation lookup).
 * India → INR (₹199/user/mo). All other countries → USD ($2/user/mo).
 */
export async function detectCountryFromRequest(request: Request): Promise<string> {
  const fromHeader = detectCountryFromHeaders(request);
  if (fromHeader) return fromHeader;

  const ip = getClientIp(request);
  if (ip && !isPrivateOrLocalIp(ip)) {
    const country = await lookupCountryFromIp(ip);
    if (country) return country;
  }

  const acceptLanguage = request.headers.get("accept-language") || "";
  const regionMatch = acceptLanguage.match(/[-_]([A-Z]{2})\b/i);
  if (regionMatch?.[1]) return regionMatch[1].toUpperCase();

  return "IN";
}
