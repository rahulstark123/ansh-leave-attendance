export function detectCountryFromRequest(request: Request): string {
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

  const acceptLanguage = request.headers.get("accept-language") || "";
  const regionMatch = acceptLanguage.match(/[-_]([A-Z]{2})\b/i);
  if (regionMatch?.[1]) return regionMatch[1].toUpperCase();

  return "IN";
}
