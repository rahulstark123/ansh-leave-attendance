"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { createClient } from "@/lib/supabase/client";

function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const handled = useRef(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = createClient();
    const fromRecoveryLink =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("recovery") === "1";

    const finishRecoveryCheck = async (isRecovery: boolean) => {
      if (!isRecovery) {
        setSessionReady(false);
        setCheckingSession(false);
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setSessionReady(false);
      } else {
        setSessionReady(true);
      }
      setCheckingSession(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        void finishRecoveryCheck(true);
      }
    });

    const bootstrap = async () => {
      // Hash tokens from older Supabase email links (#access_token=...)
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        await supabase.auth.getSession();
      }

      if (fromRecoveryLink) {
        await finishRecoveryCheck(true);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await finishRecoveryCheck(true);
        return;
      }

      setSessionReady(false);
      setCheckingSession(false);
    };

    void bootstrap();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      sessionStorage.removeItem("ansh_auth_session");
      sessionStorage.removeItem("ansh_auth_token");

      router.push("/login?reset=success");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update password. Please try again.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Opening reset password window...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen bg-white">
        <AuthMarketingPanel />
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-[420px] text-center space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Reset link expired</h2>
            <p className="text-sm text-slate-500">
              Open the password reset link from your email to reach this screen. If the link expired, request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AuthMarketingPanel />

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2 select-none">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-slate-900">
              Reset your password
            </h2>
            <p className="mt-2.5 text-sm text-slate-500">
              Your reset link was verified. Enter a new password below to finish.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-bold text-rose-600 animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                New Password
              </label>
              <div className="mt-2 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="block w-full rounded-xl border border-slate-250 bg-white pl-4 pr-10 py-3.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Confirm Password
              </label>
              <div className="mt-2 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full rounded-xl border border-slate-250 bg-white pl-4 pr-10 py-3.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Save new password"
              )}
            </button>
          </form>

          <Link
            href="/login"
            className="block text-center text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
