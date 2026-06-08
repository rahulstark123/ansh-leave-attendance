export interface RazorpayPrefill {
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  readonly: {
    email?: boolean;
    contact?: boolean;
  };
}

function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export function buildRazorpayPrefill(user: {
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}): RazorpayPrefill {
  const prefill: RazorpayPrefill["prefill"] = {};
  const readonly: RazorpayPrefill["readonly"] = {};

  if (user.name) prefill.name = user.name;
  if (user.email) {
    prefill.email = user.email;
    readonly.email = true;
  }

  const contact = normalizePhone(user.phoneNumber);
  if (contact) {
    prefill.contact = contact;
    readonly.contact = true;
  }

  return { prefill, readonly };
}
