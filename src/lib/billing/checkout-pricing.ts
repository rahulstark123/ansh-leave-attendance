import type { BillingCycle } from "./plans";

export interface CheckoutFxPricing {
  countryCode: string;
  chargeCurrency: "INR" | "USD";
  monthlyPriceMajor: number;
  yearlyMonthlyEquivalentMajor: number;
  yearlyTotalMajor: number;
}

export function computeCheckoutTotals(
  fx: CheckoutFxPricing,
  seats: number,
  billingCycle: BillingCycle
) {
  const safeSeats = Math.max(1, Math.floor(seats));
  const perSeatMonthly =
    billingCycle === "yearly" ? fx.yearlyMonthlyEquivalentMajor : fx.monthlyPriceMajor;
  const total =
    billingCycle === "yearly"
      ? fx.yearlyTotalMajor * safeSeats
      : fx.monthlyPriceMajor * safeSeats;

  return { seats: safeSeats, perSeatMonthly, total };
}

export function formatCheckoutPrice(amount: number, currency: "INR" | "USD") {
  if (currency === "USD") {
    const decimals = amount % 1 !== 0 ? 2 : 0;
    return `$${amount.toFixed(decimals)}`;
  }
  return `₹${Math.round(amount)}`;
}
