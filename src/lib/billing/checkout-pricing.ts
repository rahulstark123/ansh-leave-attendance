import { GST_RATE, type BillingCycle } from "./plans";

export interface CheckoutFxPricing {
  countryCode: string;
  chargeCurrency: "INR" | "USD";
  monthlyPriceMajor: number;
  yearlyMonthlyEquivalentMajor: number;
  yearlyTotalMajor: number;
  gstRate?: number;
}

export function computeCheckoutTotals(
  fx: CheckoutFxPricing,
  seats: number,
  billingCycle: BillingCycle
) {
  const safeSeats = Math.max(1, Math.floor(seats));
  const perSeatMonthly =
    billingCycle === "yearly" ? fx.yearlyMonthlyEquivalentMajor : fx.monthlyPriceMajor;
  const subtotal =
    billingCycle === "yearly"
      ? fx.yearlyTotalMajor * safeSeats
      : fx.monthlyPriceMajor * safeSeats;

  const applyGst = fx.chargeCurrency === "INR";
  const gstRate = applyGst ? (fx.gstRate ?? GST_RATE) : 0;
  const gst =
    applyGst
      ? fx.chargeCurrency === "INR"
        ? Math.round(subtotal * gstRate)
        : Math.round(subtotal * gstRate * 100) / 100
      : 0;
  const total = subtotal + gst;

  return {
    seats: safeSeats,
    perSeatMonthly,
    /** Pre-tax */
    subtotal,
    gst,
    gstRate,
    /** Inclusive of GST when applicable */
    total,
  };
}

/** Apply GST to an already-computed pre-tax major amount. */
export function applyGstToMajor(
  subtotal: number,
  currency: "INR" | "USD",
  gstRate = GST_RATE
) {
  if (currency !== "INR" || subtotal <= 0) {
    return { subtotal, gst: 0, gstRate: 0, total: subtotal };
  }
  const gst = Math.round(subtotal * gstRate);
  return { subtotal, gst, gstRate, total: subtotal + gst };
}

export function formatCheckoutPrice(amount: number, currency: "INR" | "USD") {
  if (currency === "USD") {
    const decimals = amount % 1 !== 0 ? 2 : 0;
    return `$${amount.toFixed(decimals)}`;
  }
  return `₹${Math.round(amount)}`;
}
