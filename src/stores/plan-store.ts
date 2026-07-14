import { create } from "zustand";
import type { PlanFeature, PlanFeatureId } from "@/lib/billing/features";
import { getPlanFeature } from "@/lib/billing/features";

export type CheckoutIntent = "upgrade" | "add_seats";

interface PlanState {
  loaded: boolean;
  hasProAccess: boolean;
  isTrialActive: boolean;
  hasScheduledPro: boolean;
  scheduledProStartsAt: string | null;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  plan: string;
  planName: string;
  isProActive: boolean;
  seatsCount: number;
  maxUsers: number;
  modalOpen: boolean;
  checkoutModalOpen: boolean;
  checkoutIntent: CheckoutIntent;
  checkoutOnSuccess: (() => void | Promise<void>) | null;
  blockedFeature: PlanFeature | null;
  fetchPlan: () => Promise<void>;
  requestUpgrade: (featureId: PlanFeatureId) => void;
  closeModal: () => void;
  openCheckoutModal: (
    onSuccess?: () => void | Promise<void>,
    intent?: CheckoutIntent
  ) => void;
  closeCheckoutModal: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  loaded: false,
  hasProAccess: true,
  isTrialActive: false,
  hasScheduledPro: false,
  scheduledProStartsAt: null,
  trialDaysRemaining: null,
  trialEndsAt: null,
  plan: "free",
  planName: "ANSH HR Free Edition",
  isProActive: false,
  seatsCount: 3,
  maxUsers: 3,
  modalOpen: false,
  checkoutModalOpen: false,
  checkoutIntent: "upgrade",
  checkoutOnSuccess: null,
  blockedFeature: null,

  fetchPlan: async () => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      if (!token) return;

      const res = await fetch("/api/billing/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      set({
        loaded: true,
        hasProAccess: Boolean(data.hasProAccess),
        isTrialActive: Boolean(data.isTrialActive),
        hasScheduledPro: Boolean(data.hasScheduledPro),
        scheduledProStartsAt: data.scheduledProStartsAt ?? null,
        trialDaysRemaining: data.trialDaysRemaining ?? null,
        trialEndsAt: data.trialEndsAt ?? null,
        plan: data.plan ?? "free",
        planName: data.planName ?? "ANSH HR Free Edition",
        isProActive: Boolean(data.isProActive),
        seatsCount: data.seatsCount ?? data.maxUsers ?? 3,
        maxUsers: data.maxUsers ?? 3,
      });
    } catch (err) {
      console.error("Failed to load plan status:", err);
      set({ loaded: true });
    }
  },

  requestUpgrade: (featureId) => {
    set({
      modalOpen: true,
      blockedFeature: getPlanFeature(featureId),
    });
  },

  closeModal: () => {
    set({ modalOpen: false, blockedFeature: null });
  },

  openCheckoutModal: (onSuccess, intent = "upgrade") => {
    set({
      checkoutModalOpen: true,
      checkoutIntent: intent,
      checkoutOnSuccess: onSuccess ?? null,
      modalOpen: false,
      blockedFeature: null,
    });
  },

  closeCheckoutModal: () => {
    set({
      checkoutModalOpen: false,
      checkoutOnSuccess: null,
      checkoutIntent: "upgrade",
    });
  },
}));
