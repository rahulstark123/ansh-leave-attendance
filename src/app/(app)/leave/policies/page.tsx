"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import {
  FileText,
  Download,
  Eye,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PolicyDocument {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
  s3Key?: string;
}

export default function LeavePoliciesPage() {
  const { currentUser } = useLeaveStore();
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [fetching, setFetching] = useState(true);
  const [authToken, setAuthToken] = useState("");

  // Reader Modal State
  const [previewDoc, setPreviewDoc] = useState<PolicyDocument | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token") || "";
        setAuthToken(token);
        const res = await fetch("/api/settings/policy", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPolicyDocuments(data.policyDocuments || []);
        }
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchPolicies();
  }, []);

  if (fetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading policy guidelines...
          </p>
        </div>
      </div>
    );
  }

  // Sample Corporate Handbook mock text for seeded files
  const renderMockHandbookText = () => (
    <div className="space-y-6 text-xs text-slate-600 dark:text-slate-350 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin select-text">
      <div className="border-b border-border/60 pb-4">
        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
          ANSH Apps Corporate Leave Policy Handbook
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">
          Effective Date: January 1, 2026 · Rev: 4.2
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          1. Objectives & Overview
        </h3>
        <p>
          This document establishes corporate guidelines for team member attendance, holiday calendars,
          and general leave entitlements. ANSH Apps believes in providing competitive, paid time-off
          balances to support rest, family care, and physical recovery.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          2. Leave Entitlements
        </h3>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Annual Leave (15 days):</strong>
            {" "}Granted at the start of the fiscal year. Designed for leisure, tourism, and general rest. Requires reporting manager approval at least 5 business days in advance.
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Sick Leave (8 days):</strong>
            {" "}Reserved for times of illness or medical emergencies. A medical practitioner certificate is required if sick leave extends past 2 consecutive working days.
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Casual Leave (6 days):</strong>
            {" "}Available for sudden, unavoidable personal emergencies. Short-notice approvals are acceptable for casual time-off.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          3. Attendance & Remote Work Policies
        </h3>
        <p>
          Standard office hours are from 09:00 AM to 06:00 PM. A grace period of 15 minutes is allowed for late check-in.
          Employees completing shifts from hybrid locations must check-in and check-out via the Attendance Punch Clock
          dashboard.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          4. Holidays & Branch Adjustments
        </h3>
        <p>
          ANSH Apps schedules official Gazetted Holidays matching national frameworks. Restricted Holidays
          allow optional religious or regional festival bookings and can be scheduled upon individual requests.
        </p>
      </section>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Guidelines & Handbooks"
        title="Leave Policies"
        description="Official company handbook documents detailing corporate holiday packages, terms, and guidelines."
      />

      <Card className="crm-card">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Document Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-0">
          <p className="text-xs text-slate-400 px-6 mb-4">
            Below is the document directory containing all company-wide policy handbooks. Click the preview button to read any document online or download it to your device.
          </p>

          {policyDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No policy documents found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Official guidelines will appear here once uploaded by HR.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40 px-6">
              {policyDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        {doc.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-semibold">
                        Uploaded on {doc.uploadedAt} · {doc.size}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="h-8 w-16 gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider"
                      title="Preview Document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Read
                    </button>
                    <button
                      onClick={() => {
                        if (doc.s3Key) {
                          window.open(
                            `/api/settings/download-policy?id=${doc.id}&token=${encodeURIComponent(
                              authToken
                            )}`,
                            "_blank"
                          );
                        } else {
                          alert(`Simulating download for: ${doc.name}`);
                        }
                      }}
                      className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DOCUMENT READER DIALOG */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl select-none flex flex-col h-[80vh] !overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border/40 pb-4">
            <div>
              <DialogTitle className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2 pr-6">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
                {previewDoc?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-0.5">
                Official Guideline Document Reader
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 py-4 flex flex-col justify-center">
            {previewDoc && (
              previewDoc.s3Key ? (
                /* Native PDF Reader IFrame */
                <iframe
                  src={`/api/settings/download-policy?id=${previewDoc.id}&token=${encodeURIComponent(
                    authToken
                  )}`}
                  className="w-full h-full rounded-2xl border border-border"
                  title={previewDoc.name}
                />
              ) : (
                /* Premium Mock HTML Reader */
                <div className="p-6 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-border/80 h-full flex flex-col justify-between">
                  {renderMockHandbookText()}
                  <div className="flex justify-end pt-4 border-t border-border/40 shrink-0">
                    <Button
                      onClick={() => {
                        alert(`Simulating download for: ${previewDoc.name}`);
                      }}
                      className="text-xs font-bold uppercase tracking-wider !h-9 rounded-xl flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Copy
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
