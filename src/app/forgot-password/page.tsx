"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setErrorMsg(decodeURIComponent(urlError.replace(/\+/g, " ")));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const trimmed = email.trim();
      if (!trimmed) {
        setErrorMsg("Please enter your email address.");
        setLoading(false);
        return;
      }

      // Must match an allowed Redirect URL in Supabase dashboard exactly.
      const redirectTo = `${window.location.origin}/auth/confirm`;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg(
        "Password reset link sent! Open the email from Supabase, click the link, and you will be taken to the reset password screen."
      );
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to send reset email. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AuthMarketingPanel />

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2 select-none">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-slate-900">
              Forgot password?
            </h2>
            <p className="mt-2.5 text-sm text-slate-500">
              Enter your workspace email and we&apos;ll send a Supabase password reset link.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-bold text-rose-600 animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-bold text-emerald-600 animate-in fade-in duration-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  disabled={!!successMsg}
                  className="block w-full rounded-xl border border-slate-250 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
