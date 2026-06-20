"use client";

import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, UserX } from "lucide-react";

export default function DeleteAccountPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Account Settings"
        title="Delete Account"
        description="Request permanent deletion of your ANSH HR account and associated data."
      />

      <div className="max-w-2xl">
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <UserX className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white">
                Delete Your ANSH HR Account
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              If you would like to delete your ANSH HR account and associated data, please send an email from your registered email address to:
            </p>

            <div className="flex flex-col gap-4">
              <a
                href="mailto:support@anshapps.com?subject=Account%20Deletion%20Request"
                className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary w-fit hover:bg-primary/10 transition-all shadow-sm"
              >
                <Mail className="h-4 w-4" />
                support@anshapps.com
              </a>

              <div className="space-y-1.5">
                <p className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Subject:</span>{" "}
                  <span className="text-slate-400 dark:text-slate-500">Account Deletion Request</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Our team will verify your request and process account deletion within 7 business days.
                </p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                Upon successful deletion:
              </h4>

              <ul className="space-y-3 text-xs text-slate-500 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>Your account will be permanently deleted.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>Your profile information will be removed.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>Your authentication credentials will be deleted.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>Any active subscription will be cancelled and revoked.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>Any personal data associated with your account will be removed from our systems.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-border/40 pt-6 space-y-3">
              <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
                If you have any questions regarding account deletion, please contact us at{" "}
                <a href="mailto:support@anshapps.com" className="text-primary font-semibold hover:underline">
                  support@anshapps.com
                </a>.
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                Last Updated: June 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
