function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) return true;
  if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
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

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,lat,lon`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return { lat: clientLat, lng: clientLng };
    const data = (await res.json()) as { status?: string; lat?: number; lon?: number };
    if (data.status === "success" && typeof data.lat === "number" && typeof data.lon === "number") {
      return { lat: data.lat, lng: data.lon };
    }
  } catch {
    /* ignore — coords stay null */
  }

  return { lat: clientLat, lng: clientLng };
}
