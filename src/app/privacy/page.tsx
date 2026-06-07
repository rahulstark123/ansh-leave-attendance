"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Calendar, Mail, FileText } from "lucide-react";

export default function PrivacyPage() {
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
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                Data Protection
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Privacy Policy
            </h1>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last updated: 16 April 2026</span>
            </div>
          </header>

          <div className="space-y-8 text-sm leading-relaxed text-slate-400">
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">1.</span> Introduction
              </h2>
              <p>
                This Privacy Policy explains how ANSH HR collects, uses, stores, and protects personal data when you use our website and services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">2.</span> Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-200">Account information:</strong> name, email address, profile details.
                </li>
                <li>
                  <strong className="text-slate-200">Workspace information:</strong> projects, tasks, team members, documents, support tickets, and collaboration activity.
                </li>
                <li>
                  <strong className="text-slate-200">Payment metadata:</strong> transaction IDs, subscription status, billing timestamps.
                </li>
                <li>
                  <strong className="text-slate-200">Technical data:</strong> device/browser data, IP-derived region, logs, and diagnostics.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">3.</span> How We Use Data
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide task management, collaboration, and account features.</li>
                <li>To process subscriptions and payment verification.</li>
                <li>To send confirmations, service updates, and support communications.</li>
                <li>To improve reliability, security, and product experience.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">4.</span> Legal Basis and Consent
              </h2>
              <p>
                Where required, we process personal data based on consent, contractual necessity, legal obligations, or legitimate business interests. You may withdraw consent where applicable.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">5.</span> Data Sharing
              </h2>
              <p>
                We may share data with trusted service providers required to deliver core features (for example, authentication, hosting, email, calendar, or payments), subject to contractual safeguards.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">6.</span> Data Retention
              </h2>
              <p>
                We retain personal data only as long as necessary for service delivery, legal compliance, dispute resolution, and security. Data may be deleted or anonymized when no longer required.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">7.</span> Your Rights
              </h2>
              <p>
                Subject to applicable law, you may request access, correction, or deletion of your personal data.
              </p>
              <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4 flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-350">
                  For any personal data requests, please contact us at:{" "}
                  <a href="mailto:support@anshapps.com" className="font-extrabold text-emerald-400 hover:underline">
                    support@anshapps.com
                  </a>
                </span>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">8.</span> Security
              </h2>
              <p>
                We implement reasonable technical and organizational safeguards to protect personal data from unauthorized access, loss, misuse, or alteration.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">9.</span> India-Specific Compliance Note
              </h2>
              <p>
                We aim to align privacy operations with applicable Indian law, including relevant requirements under the Information Technology Act, 2000 and India's evolving digital personal data protection framework.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">10.</span> Billing and Refund Clarification
              </h2>
              <p>
                Payment and subscription terms (including cancellation and refund position) are described in our{" "}
                <Link href="/terms" className="font-bold text-emerald-400 hover:underline decoration-emerald-400/30 underline-offset-2">
                  Terms & Conditions
                </Link>
                . For clarity, ANSH HR does not provide refunds for user-initiated subscription cancellation or account deletion.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-emerald-400">11.</span> Policy Updates
              </h2>
              <p>
                We may update this policy from time to time. Material updates will be reflected on this page with a revised "Last updated" date.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
