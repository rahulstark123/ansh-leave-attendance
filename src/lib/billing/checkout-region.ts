import { detectCountryFromRequest } from "./display-currency";

export type ChargeCurrency = "INR" | "USD";

export interface CheckoutRegion {
  countryCode: string;
  currency: ChargeCurrency;
}

export function resolveCheckoutFromRequest(
  request: Request,
  billingCountryOverride?: string | null
): CheckoutRegion {
  const countryCode = (
    billingCountryOverride?.trim().toUpperCase() ||
    detectCountryFromRequest(request)
  ).slice(0, 2);

  const currency: ChargeCurrency = countryCode === "IN" ? "INR" : "USD";

  return { countryCode, currency };
}
