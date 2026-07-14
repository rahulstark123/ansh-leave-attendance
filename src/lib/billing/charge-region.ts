import type { RazorpayConfig } from "./razorpay";
import { GST_RATE, type BillingCycle } from "./plans";
import type { ChargeCurrency } from "./checkout-region";

const YEARLY_DISCOUNT = 0.81; // 19% off
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface CheckoutAmount {
  /** Pre-tax amount in minor units */
  amountMinor: number;
  /** GST portion (INR only) */
  gstMinor: number;
  /** amountMinor + gstMinor — what Razorpay is charged */
  totalMinor: number;
  currency: ChargeCurrency;
  monthlyEquivalentMajor: number;
  gstRate: number;
}

function monthlyMinor(currency: ChargeCurrency, cfg: RazorpayConfig): number {
  return currency === "INR" ? cfg.proMonthlyInrPaisa : cfg.proMonthlyUsdCents;
}

/** Apply 18% GST on INR amounts; USD is unchanged. */
export function withGst(baseMinor: number, currency: ChargeCurrency) {
  if (currency !== "INR" || baseMinor <= 0) {
    return {
      amountMinor: baseMinor,
      gstMinor: 0,
      totalMinor: baseMinor,
      gstRate: 0,
    };
  }
  const gstMinor = Math.round(baseMinor * GST_RATE);
  return {
    amountMinor: baseMinor,
    gstMinor,
    totalMinor: baseMinor + gstMinor,
    gstRate: GST_RATE,
  };
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

  let baseMinor: number;
  let monthlyEquivalentMajor: number;

  if (billingCycle === "yearly") {
    baseMinor = Math.round(monthly * 12 * YEARLY_DISCOUNT);
    monthlyEquivalentMajor =
      currency === "INR"
        ? Math.round(baseMinor / 12 / 100)
        : Math.round((baseMinor / 12 / 100) * 100) / 100;
  } else {
    baseMinor = monthly;
    monthlyEquivalentMajor = monthly / 100;
  }

  const tax = withGst(baseMinor, currency);
  return {
    ...tax,
    currency,
    monthlyEquivalentMajor,
  };
}

/**
 * Charge only for remaining days in the current billing period when adding seats mid-cycle.
 */
export function computeProratedAdditionalSeatsMinor(params: {
  currency: ChargeCurrency;
  billingCycle: BillingCycle;
  cfg: RazorpayConfig;
  additionalSeats: number;
  periodStartsAt: Date;
  periodExpiresAt: Date;
  now?: Date;
}): CheckoutAmount & {
  daysRemaining: number;
  periodDays: number;
  fraction: number;
} {
  const now = params.now ?? new Date();
  const additionalSeats = Math.max(Math.floor(params.additionalSeats), 1);

  const full = computeUpgradeCheckoutMinor({
    currency: params.currency,
    billingCycle: params.billingCycle,
    cfg: params.cfg,
    seats: additionalSeats,
  });

  const startMs = params.periodStartsAt.getTime();
  const endMs = params.periodExpiresAt.getTime();
  const nowMs = now.getTime();

  const periodMs = Math.max(endMs - startMs, MS_PER_DAY);
  const remainingMs = Math.max(endMs - nowMs, 0);
  const fraction = Math.min(1, remainingMs / periodMs);

  const daysRemaining = Math.max(1, Math.ceil(remainingMs / MS_PER_DAY));
  const periodDays = Math.max(1, Math.round(periodMs / MS_PER_DAY));

  // Prorate the pre-tax base, then apply GST on the prorated base.
  const baseProrated =
    remainingMs <= 0
      ? 0
      : Math.max(1, Math.round(full.amountMinor * fraction));
  const tax = withGst(baseProrated, params.currency);

  return {
    ...tax,
    currency: params.currency,
    monthlyEquivalentMajor: full.monthlyEquivalentMajor,
    daysRemaining,
    periodDays,
    fraction,
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
    gstRate: currency === "INR" ? GST_RATE : 0,
    disclaimer:
      currency === "USD"
        ? "International pricing: $2 per user per month (detected outside India)."
        : "India pricing: ₹199 per user per month + 18% GST (detected from your IP region).",
    priceUnit: "user" as const,
  };
}
