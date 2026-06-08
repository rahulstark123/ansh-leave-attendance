import type { RazorpayConfig } from "./razorpay";
import type { BillingCycle } from "./plans";
import type { ChargeCurrency } from "./checkout-region";

const YEARLY_DISCOUNT = 0.81; // 19% off

export interface CheckoutAmount {
  amountMinor: number;
  currency: ChargeCurrency;
  monthlyEquivalentMajor: number;
}

function monthlyMinor(currency: ChargeCurrency, cfg: RazorpayConfig): number {
  return currency === "INR" ? cfg.proMonthlyInrPaisa : cfg.proMonthlyUsdCents;
}

export function computeUpgradeCheckoutMinor(params: {
  currency: ChargeCurrency;
  billingCycle: BillingCycle;
  cfg: RazorpayConfig;
  seats?: number;
}): CheckoutAmount {
  const { currency, billingCycle, cfg } = params;
  const seats = Math.max(params.seats ?? 1, 1);
  const perSeatMonthly = monthlyMinor(currency, cfg);
  const monthly = perSeatMonthly * seats;

  if (billingCycle === "yearly") {
    const yearlyTotal = Math.round(monthly * 12 * YEARLY_DISCOUNT);
    const monthlyEquivalent = Math.round((yearlyTotal / 12) * 100) / 100;
    const monthlyEquivalentMajor =
      currency === "INR"
        ? Math.round(yearlyTotal / 12 / 100)
        : Math.round((yearlyTotal / 12 / 100) * 100) / 100;

    return {
      amountMinor: yearlyTotal,
      currency,
      monthlyEquivalentMajor,
    };
  }

  return {
    amountMinor: monthly,
    currency,
    monthlyEquivalentMajor:
      currency === "INR" ? monthly / 100 : monthly / 100,
  };
}

export function formatMajorAmount(
  amountMinor: number,
  currency: ChargeCurrency
): string {
  const major = amountMinor / 100;
  if (currency === "INR") {
    return `₹${major.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `$${major.toFixed(2)}`;
}

export function getFxDisplay(cfg: RazorpayConfig, countryCode: string) {
  const currency: ChargeCurrency = countryCode === "IN" ? "INR" : "USD";
  const monthly = monthlyMinor(currency, cfg);
  const yearly = computeUpgradeCheckoutMinor({
    currency,
    billingCycle: "yearly",
    cfg,
  });

  return {
    countryCode,
    chargeCurrency: currency,
    monthlyPriceMajor: monthly / 100,
    yearlyMonthlyEquivalentMajor: yearly.monthlyEquivalentMajor,
    yearlyTotalMajor: yearly.amountMinor / 100,
    disclaimer:
      currency === "USD"
        ? "International pricing in USD per user per month. Razorpay International must be enabled on your merchant account."
        : "Pricing in INR per user per month for India.",
    priceUnit: "user" as const,
  };
}
