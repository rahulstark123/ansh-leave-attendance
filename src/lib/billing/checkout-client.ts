export interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  readonly?: {
    email?: boolean;
    contact?: boolean;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay checkout"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export function getCheckoutLogoUrl(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${siteUrl.replace(/\/$/, "")}/logoAnshapps.png`;
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable");
  }

  return new Promise((resolve, reject) => {
    const instance = new window.Razorpay!({
      ...options,
      modal: {
        ...options.modal,
        ondismiss: () => {
          options.modal?.ondismiss?.();
          reject(new Error("Payment cancelled"));
        },
      },
      handler: async (response) => {
        try {
          await options.handler(response);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    });

    instance.open();
  });
}
