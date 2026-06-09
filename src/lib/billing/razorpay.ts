import Razorpay from "razorpay";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  proMonthlyInrPaisa: number;
  proMonthlyUsdCents: number;
}

let cachedInstance: Razorpay | null = null;
let cachedConfig: RazorpayConfig | null = null;

export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!keyId || !keySecret) {
    return null;
  }

  return {
    keyId,
    keySecret,
    proMonthlyInrPaisa: parseInt(
      process.env.RAZORPAY_PRO_PLAN_AMOUNT_PAISA || "19900",
      10
    ),
    proMonthlyUsdCents: parseInt(
      process.env.RAZORPAY_PRO_PLAN_AMOUNT_CENTS || "200",
      10
    ),
  };
}

export function getRazorpayInstance(): Razorpay | null {
  const config = getRazorpayConfig();
  if (!config) return null;

  if (!cachedInstance || cachedConfig?.keyId !== config.keyId) {
    cachedInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
    cachedConfig = config;
  }

  return cachedInstance;
}
