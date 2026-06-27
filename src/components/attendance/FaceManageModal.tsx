"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FaceUploadEnrollment } from "./FaceUploadEnrollment";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ShieldAlert, Smile, CheckCircle, RefreshCw } from "lucide-react";
import { resolveStorageUrl } from "@/lib/storage/public-url";

interface Employee {
  id: string;
  name: string;
  avatarInitials: string;
  role: string;
  department: string;
  facePhotos?: string[];
  faceEnrolled?: boolean;
}

interface FaceManageModalProps {
  employee: Employee | null;
  onClose: () => void;
  onUpdateComplete: (employeeId: string, facePhotos: string[]) => void;
  onDeleteComplete: (employeeId: string) => void;
}

export function FaceManageModal({ employee, onClose, onUpdateComplete, onDeleteComplete }: FaceManageModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!employee) return null;

  const hasPhotos = Array.isArray(employee.facePhotos) && employee.facePhotos.length === 3;

  const handleDeleteFace = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/employee/face-enroll?employeeId=${employee.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove face profile");
      }

      onDeleteComplete(employee.id);
      onClose();
    } catch (err: any) {
      console.error("Delete face error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during removal.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEnrollSuccess = (newPhotos: string[]) => {
    onUpdateComplete(employee.id, newPhotos);
    // Give user a brief visual feedback and close
    setTimeout(() => {
      onClose();
      setIsUpdating(false);
    }, 1200);
  };

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/40">
          <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            <span>Manage Face Profile</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 mt-0.5">
            Configure facial recognition settings, photos, and databases for <strong className="text-slate-700 dark:text-slate-200">{employee.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Employee Mini Card */}
          <div className="flex items-center gap-3 bg-slate-50/60 dark:bg-slate-950/40 p-4.5 rounded-2xl border border-border/60">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-sm shadow-sm">
              {employee.avatarInitials}
            </div>
            <div>
              <span className="block text-sm font-extrabold text-slate-800 dark:text-white leading-normal">
                {employee.name}
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {employee.role} · {employee.department}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-xs font-bold text-rose-500">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* If they already have photos registered and we aren't explicitly updating */}
          {hasPhotos && !isUpdating ? (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Registered Face Profiles
                </span>
                
                <div className="grid grid-cols-3 gap-3">
                  {employee.facePhotos?.map((url, idx) => {
                    const label = idx === 0 ? "Front" : idx === 1 ? "Left" : "Right";
                    return (
                      <div key={url} className="space-y-1.5 text-center">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border bg-slate-900 flex items-center justify-center relative shadow-sm">
                          <img
                            src={resolveStorageUrl(url) ?? url}
                            alt={`${label} photo`}
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-4 border-t border-border/40">
                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => setIsUpdating(true)}
                    className="modal-action-btn flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4 shrink-0" />
                    Upload New Photos
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={handleDeleteFace}
                    disabled={isDeleting}
                    className="modal-action-btn flex-1 border-0"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Face Profile
                      </>
                    )}
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full text-xs font-bold uppercase tracking-wider h-9 rounded-xl cursor-pointer border-slate-200 text-slate-500"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            /* Upload new images flow */
            <div className="space-y-4">
              <FaceUploadEnrollment
                employeeId={employee.id}
                onEnrollComplete={handleEnrollSuccess}
              />
              
              {isUpdating && (
                <Button
                  variant="outline"
                  onClick={() => setIsUpdating(false)}
                  className="w-full text-xs font-bold uppercase tracking-wider h-9 rounded-xl cursor-pointer border-slate-200 text-slate-500"
                >
                  Back to Face Gallery
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
