import { create } from "zustand";
import type { PlanFeature, PlanFeatureId } from "@/lib/billing/features";
import { getPlanFeature } from "@/lib/billing/features";

interface PlanState {
  loaded: boolean;
  hasProAccess: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  plan: string;
  planName: string;
  modalOpen: boolean;
  checkoutModalOpen: boolean;
  checkoutOnSuccess: (() => void | Promise<void>) | null;
  blockedFeature: PlanFeature | null;
  fetchPlan: () => Promise<void>;
  requestUpgrade: (featureId: PlanFeatureId) => void;
  closeModal: () => void;
  openCheckoutModal: (onSuccess?: () => void | Promise<void>) => void;
  closeCheckoutModal: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  loaded: false,
  hasProAccess: true,
  isTrialActive: false,
  trialDaysRemaining: null,
  trialEndsAt: null,
  plan: "free",
  planName: "ANSH HR Free Edition",
  modalOpen: false,
  checkoutModalOpen: false,
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
        trialDaysRemaining: data.trialDaysRemaining ?? null,
        trialEndsAt: data.trialEndsAt ?? null,
        plan: data.plan ?? "free",
        planName: data.planName ?? "ANSH HR Free Edition",
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

  openCheckoutModal: (onSuccess) => {
    set({
      checkoutModalOpen: true,
      checkoutOnSuccess: onSuccess ?? null,
      modalOpen: false,
      blockedFeature: null,
    });
  },

  closeCheckoutModal: () => {
    set({ checkoutModalOpen: false, checkoutOnSuccess: null });
  },
}));
