"use client";

import { useEffect, useState } from "react";
import { resolveStorageUrl } from "@/lib/storage/public-url";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image as ImageIcon, Loader2, ShieldCheck, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelfieVerifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selfieUrl: string | null;
  employeeId: string;
  employeeName: string;
  punchTime: string;
  punchDate: string;
  type: "Check-in" | "Check-out";
}

type VerifyState = "idle" | "loading" | "done" | "error";

export function SelfieVerifyDialog({
  isOpen,
  onClose,
  selfieUrl,
  employeeId,
  employeeName,
  punchTime,
  punchDate,
  type,
}: SelfieVerifyDialogProps) {
  const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [aiResult, setAiResult] = useState<{
    matched: boolean;
    similarity: number;
    score: number;
  } | null>(null);
  const [manualResult, setManualResult] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReferencePhotos([]);
      setLoadError(null);
      setVerifyState("idle");
      setAiResult(null);
      setManualResult(null);
      return;
    }

    (async () => {
      setLoadingRefs(true);
      setVerifyState("idle");
      setAiResult(null);
      setLoadError(null);

      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        const refsRes = await fetch(`/api/employee/face-embedding?employeeId=${employeeId}`, { headers });
        if (!refsRes.ok) throw new Error("No enrolled reference photos found.");
        const refsData = await refsRes.json();
        setReferencePhotos(Array.isArray(refsData.facePhotos) ? refsData.facePhotos : []);

        if (selfieUrl) {
          setVerifyState("loading");
          const verifyRes = await fetch("/api/employee/face-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ selfieUrl, employeeId }),
          });
          const verifyData = await verifyRes.json().catch(() => ({}));

          if (verifyRes.status === 404) {
            setLoadError("No face profile — employee must re-enroll with 3 photos.");
            setVerifyState("error");
          } else if (verifyRes.status === 422) {
            setAiResult({ matched: false, similarity: 0, score: 0 });
            setLoadError(verifyData.error || "No face detected in punch selfie.");
            setVerifyState("done");
          } else if (!verifyRes.ok) {
            throw new Error(verifyData.error || "Server verification failed.");
          } else {
            setAiResult({
              matched: Boolean(verifyData.matched),
              similarity: verifyData.similarity ?? 0,
              score: verifyData.score ?? 0,
            });
            setVerifyState("done");
          }
        }
      } catch (e: unknown) {
        setLoadError(e instanceof Error ? e.message : "Failed to load verification data.");
        setVerifyState("error");
      } finally {
        setLoadingRefs(false);
      }
    })();
  }, [isOpen, employeeId, selfieUrl]);

  const similarityPct = aiResult ? Math.round(aiResult.similarity * 100) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Selfie Verification
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4 space-y-4 text-xs">
          <p>
            <strong>{employeeName}</strong> · {type} · {punchDate} {punchTime}
          </p>

          <div className="aspect-video rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-900">
            {selfieUrl ? (
              <img src={resolveStorageUrl(selfieUrl) ?? selfieUrl} alt="Punch selfie" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No selfie</div>
            )}
          </div>

          {(loadingRefs || verifyState === "loading") && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {verifyState === "loading" ? "Running server face match..." : "Loading reference photos..."}
            </div>
          )}

          {verifyState === "done" && aiResult && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 ${
                aiResult.matched
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              {aiResult.matched ? (
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {aiResult.matched ? "AI match — same person" : "AI no-match — review recommended"}
                </p>
                <p className="mt-0.5 opacity-90">
                  Similarity {similarityPct}% · score {aiResult.score}/100
                </p>
              </div>
            </div>
          )}

          {loadError && <p className="text-amber-600 dark:text-amber-400">{loadError}</p>}

          {referencePhotos.length > 0 && (
            <div>
              <p className="text-slate-500 mb-2">Enrolled reference photos</p>
              <div className="grid grid-cols-3 gap-2">
                {referencePhotos.slice(0, 3).map((u) => (
                  <img key={u} src={resolveStorageUrl(u) ?? u} alt="" className="aspect-[3/4] object-cover rounded-lg border" />
                ))}
              </div>
            </div>
          )}

          <p className="text-slate-500">HR can confirm or override the AI result:</p>
          <div className="flex gap-2.5">
            <Button
              onClick={() => setManualResult("approved")}
              className="modal-action-btn flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              <UserCheck className="h-4 w-4 shrink-0" />
              Same person
            </Button>
            <Button
              onClick={() => setManualResult("rejected")}
              variant="outline"
              className="modal-action-btn flex-1 text-rose-600"
            >
              <UserX className="h-4 w-4 shrink-0" />
              Mismatch
            </Button>
          </div>

          {manualResult === "approved" && (
            <p className="text-emerald-600 font-bold">Manually verified.</p>
          )}
          {manualResult === "rejected" && (
            <p className="text-rose-600 font-bold">Flagged for follow-up.</p>
          )}

          <Button onClick={onClose} variant="outline" className="w-full text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
