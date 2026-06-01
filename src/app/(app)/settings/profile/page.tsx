"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import { Loader2, User, Mail, Shield, Briefcase, CheckCircle } from "lucide-react";

export default function ProfileSettingPage() {
  const { currentUser, initialize } = useLeaveStore();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Name cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          department: currentUser.department,
          role: currentUser.role,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      await initialize();
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Account Settings"
        title="Profile Setting"
        description="Manage your account profile details, avatar representation, and workplace identifiers."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card Summary */}
        <Card className="crm-card h-fit lg:col-span-1">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary font-black text-2xl shadow-xl shadow-primary/5">
                {currentUser?.avatarInitials}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {currentUser?.name}
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                {currentUser?.role}
              </p>
            </div>
            <div className="border-t border-border/40 pt-4 flex justify-between text-xs text-slate-500 font-medium">
              <span>Department</span>
              <span className="font-bold text-slate-700 dark:text-slate-350">{currentUser?.department}</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="crm-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-400 mb-6 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-400 mb-6">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Full Name
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-2xl border border-border bg-transparent pl-11 pr-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Email Address
                </label>
                <div className="mt-2 relative opacity-60">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email}
                    className="block w-full rounded-2xl border border-border bg-slate-100/50 dark:bg-slate-900/40 pl-11 pr-4 py-3.5 text-sm text-foreground cursor-not-allowed"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Email addresses are secured and cannot be modified directly.
                </p>
              </div>

              {/* Role and Department info (Readonly) */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Assigned Role
                  </label>
                  <div className="mt-2 relative opacity-60">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Shield className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.role}
                      className="block w-full rounded-2xl border border-border bg-slate-100/50 dark:bg-slate-900/40 pl-11 pr-4 py-3.5 text-sm text-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Department
                  </label>
                  <div className="mt-2 relative opacity-60">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.department}
                      className="block w-full rounded-2xl border border-border bg-slate-100/50 dark:bg-slate-900/40 pl-11 pr-4 py-3.5 text-sm text-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full md:w-auto font-bold text-xs uppercase tracking-wider h-11 px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
