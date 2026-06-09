import { detectCountryFromRequest } from "./display-currency";

export type ChargeCurrency = "INR" | "USD";

export interface CheckoutRegion {
  countryCode: string;
  currency: ChargeCurrency;
}

export async function resolveCheckoutFromRequest(
  request: Request,
  billingCountryOverride?: string | null
): Promise<CheckoutRegion> {
  const countryCode = (
    billingCountryOverride?.trim().toUpperCase() ||
    (await detectCountryFromRequest(request))
  ).slice(0, 2);

  const currency: ChargeCurrency = countryCode === "IN" ? "INR" : "USD";

  return { countryCode, currency };
}
