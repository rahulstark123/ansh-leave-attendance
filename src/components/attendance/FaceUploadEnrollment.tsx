"use client";

import { useState, useRef } from "react";
import { useLeaveStore } from "@/stores/leave-store";
import { compressImage } from "@/lib/image-compress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle2, Loader2, Trash2, ShieldAlert, Image as ImageIcon, Smile } from "lucide-react";

interface FaceUploadEnrollmentProps {
  employeeId?: string;
  onEnrollComplete?: (photos: string[]) => void;
}

type PhotoSlot = "front" | "left" | "right";

interface UploadedPhoto {
  file: File;
  previewUrl: string;
  isProcessing: boolean;
}

export function FaceUploadEnrollment({ employeeId, onEnrollComplete }: FaceUploadEnrollmentProps) {
  const { currentUser, setFaceEnrolled } = useLeaveStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [frontPhoto, setFrontPhoto] = useState<UploadedPhoto | null>(null);
  const [leftPhoto, setLeftPhoto] = useState<UploadedPhoto | null>(null);
  const [rightPhoto, setRightPhoto] = useState<UploadedPhoto | null>(null);

  const fileInputRefFront = useRef<HTMLInputElement>(null);
  const fileInputRefLeft = useRef<HTMLInputElement>(null);
  const fileInputRefRight = useRef<HTMLInputElement>(null);

  const handleFileChange = async (slot: PhotoSlot, file: File | null) => {
    if (!file) return;
    setGlobalError(null);

    const setPhotoState = slot === "front" ? setFrontPhoto : slot === "left" ? setLeftPhoto : setRightPhoto;

    setPhotoState({
      file,
      previewUrl: "",
      isProcessing: true,
    });

    try {
      const compressedFile = await compressImage(file, 800, 0.85);
      const previewUrl = URL.createObjectURL(compressedFile);

      setPhotoState({
        file: compressedFile,
        previewUrl,
        isProcessing: false,
      });
    } catch {
      setPhotoState(null);
      setGlobalError("Failed to process image. Please try another photo.");
    }
  };

  const handleRemove = (slot: PhotoSlot) => {
    const photo = slot === "front" ? frontPhoto : slot === "left" ? leftPhoto : rightPhoto;
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl);
    }

    if (slot === "front") setFrontPhoto(null);
    else if (slot === "left") setLeftPhoto(null);
    else setRightPhoto(null);

    setGlobalError(null);
  };

  const handleSubmit = async () => {
    if (!frontPhoto || !leftPhoto || !rightPhoto) {
      setGlobalError("Please upload all 3 photos first.");
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const formData = new FormData();
      formData.append("photo1", frontPhoto.file);
      formData.append("photo2", leftPhoto.file);
      formData.append("photo3", rightPhoto.file);

      if (employeeId) {
        formData.append("employeeId", employeeId);
      }

      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/employee/face-enroll", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register face photos");
      }

      const responseData = await res.json();

      if (!employeeId || employeeId === currentUser.id) {
        setFaceEnrolled(true);
      }

      setSuccess(true);

      if (onEnrollComplete && responseData.employee?.facePhotos) {
        onEnrollComplete(responseData.employee.facePhotos);
      }
    } catch (err: unknown) {
      console.error("Register face error:", err);
      setGlobalError(err instanceof Error ? err.message : "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    frontPhoto &&
    !frontPhoto.isProcessing &&
    leftPhoto &&
    !leftPhoto.isProcessing &&
    rightPhoto &&
    !rightPhoto.isProcessing;

  const renderSlot = (
    slot: PhotoSlot,
    label: string,
    ref: React.RefObject<HTMLInputElement | null>,
    photo: UploadedPhoto | null
  ) => {
    return (
      <div className="flex flex-col space-y-2.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
          {label}
        </label>

        <input
          type="file"
          ref={ref as React.RefObject<HTMLInputElement>}
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(slot, e.target.files?.[0] || null)}
        />

        <div
          onClick={() => !photo && ref.current?.click()}
          className={`relative aspect-[4/3] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all ${
            photo
              ? "border-solid border-border bg-slate-50/50 dark:bg-slate-900/30"
              : "border-slate-200 hover:border-primary/50 bg-slate-50/30 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:border-primary/30 dark:bg-slate-900/20 cursor-pointer"
          }`}
        >
          {photo ? (
            <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
              {photo.previewUrl && (
                <img
                  src={photo.previewUrl}
                  alt={label}
                  className="w-full h-full object-cover rounded-xl scale-x-[-1]"
                />
              )}

              {photo.isProcessing && (
                <div className="absolute inset-1.5 bg-slate-950/75 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1.5 z-10">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
                    Processing...
                  </span>
                </div>
              )}

              {!photo.isProcessing && (
                <>
                  <div className="absolute inset-1.5 bg-emerald-950/40 text-emerald-400 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[1px] z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(slot);
                      }}
                      className="bg-slate-900/90 hover:bg-slate-950 text-white p-2 rounded-full shadow-lg transition-colors cursor-pointer border border-white/10"
                      title="Remove Photo"
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-20 border border-white/15">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 pointer-events-none select-none text-slate-400 dark:text-slate-500">
              <div className="flex justify-center">
                <UploadCloud className="h-7 w-7 text-slate-350 dark:text-slate-650" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Click to Upload
                </span>
                <span className="block text-[9px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="crm-card border border-border/50 relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-bold text-slate-800 dark:text-white">
            Selfie Attendance Setup
          </CardTitle>
        </div>
        <CardDescription className="text-[11px] text-slate-400 leading-normal mt-1">
          Upload 3 clear photos (Front, Left, Right). The server generates your face embedding once — no AI models load in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {success ? (
          <div className="w-full text-center space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Photos registered!</h4>
              <p className="text-xs text-slate-400">You can now punch in/out with a quick selfie capture.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setFrontPhoto(null);
                setLeftPhoto(null);
                setRightPhoto(null);
                setGlobalError(null);
              }}
              className="mt-2 text-xs font-bold"
            >
              Update Photos
            </Button>
          </div>
        ) : (
          <>
            {globalError && (
              <div className="flex items-start gap-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-xs font-bold text-rose-500">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            <div className="grid gap-4.5 grid-cols-3">
              {renderSlot("front", "Front View", fileInputRefFront, frontPhoto)}
              {renderSlot("left", "Left Profile", fileInputRefLeft, leftPhoto)}
              {renderSlot("right", "Right Profile", fileInputRefRight, rightPhoto)}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="btn-primary flex items-center gap-2 font-bold px-5 h-9 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Save Face Photos
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
