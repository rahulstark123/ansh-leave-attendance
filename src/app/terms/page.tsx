"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Mail, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#04080F] font-sans text-slate-100 relative overflow-hidden select-none selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Symmetrical Background Glow Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[160px]" />
        <div className="absolute -right-1/4 top-1/4 h-[650px] w-[650px] rounded-full bg-sky-500/5 blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {/* Home Back Navigation Link */}
        <div className="mb-8 flex justify-center sm:justify-start">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        {/* Content Card Wrapper */}
        <article className="rounded-3xl border border-white/10 bg-[#070D14]/80 backdrop-blur-xl px-6 py-10 shadow-2xl shadow-[#04080F] sm:px-12 sm:py-14 space-y-10">
          <header className="border-b border-white/5 pb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                Legal Agreement
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Terms & Conditions
            </h1>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last updated: 16 April 2026</span>
            </div>
          </header>

          <div className="space-y-8 text-sm leading-relaxed text-slate-400">
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">1.</span> Acceptance of Terms
              </h2>
              <p>
                These Terms & Conditions govern your use of ANSH HR, including our website, web application, and related services. By using ANSH HR, you agree to these terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">2.</span> Service Description
              </h2>
              <p>
                ANSH HR is a leave, attendance, and HR workspace management platform for scaling teams and MSMEs. Features may include check-in logs, biometric face scans, active stopwatches, leave allowance management, team spaces, role scoping, approvals pipelines, and reports analytics.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">3.</span> Account Responsibility
              </h2>
              <p>
                You are responsible for all activity under your account, including the security of your credentials and the accuracy of information you provide. You must promptly report unauthorized access.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">4.</span> Subscription, Billing, and Renewal
              </h2>
              <p>
                Paid plans are billed in advance via our payment partner. You authorize us (and our payment processor) to charge applicable subscription fees, taxes, and related charges. Pricing, feature limits, and plan terms may be updated with prior notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">5.</span> Cancellation and No-Refund Policy
              </h2>
              <p>
                You may cancel your subscription at any time. Your access to paid features continues until the end of the current billing cycle. However, all fees paid are non-refundable.
              </p>
              <div className="mt-4 rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-extrabold text-rose-500 uppercase tracking-wider block">Important No-Refunds Notice</span>
                  <span className="text-slate-400 font-semibold block leading-relaxed mt-1">
                    No refunds are provided for subscription cancellations, account deletions, or partial usage of paid plans.
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">6.</span> Acceptable Use
              </h2>
              <p>
                You must not misuse the service, attempt unauthorized access, reverse engineer critical components, distribute malware, or use the platform in violation of applicable law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">7.</span> Data, Privacy, and Compliance
              </h2>
              <p>
                Your use of the service is also governed by our{" "}
                <Link href="/privacy" className="font-bold text-emerald-400 hover:underline decoration-emerald-400/30 underline-offset-2">
                  Privacy Policy
                </Link>
                . We follow applicable Indian legal requirements, including relevant provisions under the Information Technology Act, 2000 and evolving requirements under India's Digital Personal Data Protection framework.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">8.</span> Service Availability
              </h2>
              <p>
                We aim for reliable availability but do not guarantee uninterrupted service. We may perform maintenance, updates, and emergency fixes that can temporarily affect access.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">9.</span> Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, ANSH HR is not liable for indirect, incidental, special, or consequential damages. Our aggregate liability for claims related to paid services is limited to the subscription fees paid by you for the affected billing cycle.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">10.</span> Governing Law and Jurisdiction
              </h2>
              <p>
                These terms are governed by the laws of India. Courts with competent jurisdiction in India will have jurisdiction over disputes arising out of these terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">11.</span> Contact
              </h2>
              <p>
                For legal, billing, or policy questions, contact us at:{" "}
                <a href="mailto:support@anshapps.com" className="font-extrabold text-emerald-400 hover:underline">
                  support@anshapps.com
                </a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
