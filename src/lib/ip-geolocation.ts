function getClientIp(req: Request): string | null {
  const headerNames = [
    "cf-connecting-ip",
    "true-client-ip",
    "x-real-ip",
    "x-forwarded-for",
  ];

  for (const name of headerNames) {
    const value = req.headers.get(name)?.trim();
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

async function lookupIpCoords(ip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; latitude?: number; longitude?: number };
    if (data.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
      return { lat: data.latitude, lng: data.longitude };
    }
  } catch {
    /* try legacy HTTP provider next */
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,lat,lon`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; lat?: number; lon?: number };
    if (data.status === "success" && typeof data.lat === "number" && typeof data.lon === "number") {
      return { lat: data.lat, lng: data.lon };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Fallback when browser geolocation is unavailable — approximate coords from client IP. */
export async function resolveCoordsFromRequest(
  req: Request,
  clientLat: number | null,
  clientLng: number | null
): Promise<{ lat: number | null; lng: number | null }> {
  if (clientLat != null && clientLng != null) {
    return { lat: clientLat, lng: clientLng };
  }

  const ip = getClientIp(req);
  if (!ip || isPrivateOrLocalIp(ip)) {
    return { lat: clientLat, lng: clientLng };
  }

  const coords = await lookupIpCoords(ip);
  if (coords) return coords;

  return { lat: clientLat, lng: clientLng };
}
