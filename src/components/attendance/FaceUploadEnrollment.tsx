"use client";

import { useState, useRef } from "react";
import { useLeaveStore } from "@/stores/leave-store";
import { getFaceDescriptor, averageDescriptors, compressImage } from "@/lib/face-api-helper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle2, Loader2, Trash2, ShieldAlert, Image as ImageIcon, Smile } from "lucide-react";

interface FaceUploadEnrollmentProps {
  employeeId?: string; // Optional: Admin can override to enroll another employee
  onEnrollComplete?: (photos: string[]) => void; // Optional callback for admin modal
}

type PhotoSlot = "front" | "left" | "right";

interface UploadedPhoto {
  file: File;
  previewUrl: string;
  descriptor: Float32Array | null;
  error: string | null;
  isValidating: boolean;
}

export function FaceUploadEnrollment({ employeeId, onEnrollComplete }: FaceUploadEnrollmentProps) {
  const { currentUser, faceEnrolled, setFaceEnrolled } = useLeaveStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Separate states for the three slots
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

    // Set initial loading state with an empty previewUrl to avoid flashes of broken images
    setPhotoState({
      file,
      previewUrl: "",
      descriptor: null,
      error: null,
      isValidating: true,
    });

    try {
      // 1. Compress image to max 800px dimension and convert to JPEG (85% quality)
      const compressedFile = await compressImage(file, 800, 0.85);
      const previewUrl = URL.createObjectURL(compressedFile);

      setPhotoState({
        file: compressedFile,
        previewUrl,
        descriptor: null,
        error: null,
        isValidating: true,
      });

      // 2. Extract face descriptor client-side from compressed image
      const img = new Image();
      img.onload = async () => {
        try {
          const descriptor = await getFaceDescriptor(img);
          if (!descriptor) {
            setPhotoState({
              file: compressedFile,
              previewUrl,
              descriptor: null,
              error: "No face detected. Please upload a clear photo with your face in full view.",
              isValidating: false,
            });
          } else {
            setPhotoState({
              file: compressedFile,
              previewUrl,
              descriptor,
              error: null,
              isValidating: false,
            });
          }
        } catch (err) {
          console.error("Face detection error:", err);
          setPhotoState({
            file: compressedFile,
            previewUrl,
            descriptor: null,
            error: "Failed to process image.",
            isValidating: false,
          });
        }
      };
      img.onerror = () => {
        setPhotoState({
          file: compressedFile,
          previewUrl,
          descriptor: null,
          error: "Failed to load compressed image.",
          isValidating: false,
        });
      };
      // Set src AFTER onload and onerror are registered to prevent race condition
      img.src = previewUrl;
    } catch (err) {
      console.error("Image compression error, falling back to original:", err);
      const previewUrl = URL.createObjectURL(file);
      setPhotoState({
        file,
        previewUrl,
        descriptor: null,
        error: null,
        isValidating: true,
      });

      const img = new Image();
      img.onload = async () => {
        try {
          const descriptor = await getFaceDescriptor(img);
          if (!descriptor) {
            setPhotoState({
              file,
              previewUrl,
              descriptor: null,
              error: "No face detected. Please upload a clear photo.",
              isValidating: false,
            });
          } else {
            setPhotoState({
              file,
              previewUrl,
              descriptor,
              error: null,
              isValidating: false,
            });
          }
        } catch (e) {
          setPhotoState({
            file,
            previewUrl,
            descriptor: null,
            error: "Failed to process image.",
            isValidating: false,
          });
        }
      };
      img.onerror = () => {
        setPhotoState({
          file,
          previewUrl,
          descriptor: null,
          error: "Failed to load image.",
          isValidating: false,
        });
      };
      // Set src AFTER onload and onerror are registered to prevent race condition
      img.src = previewUrl;
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
    if (!frontPhoto?.descriptor || !leftPhoto?.descriptor || !rightPhoto?.descriptor) {
      setGlobalError("Please upload all 3 valid photos first.");
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      // 1. Average the vectors client-side
      const avgVector = averageDescriptors([
        frontPhoto.descriptor,
        leftPhoto.descriptor,
        rightPhoto.descriptor,
      ]);

      // 2. Build Multipart FormData
      const formData = new FormData();
      formData.append("faceEmbedding", JSON.stringify(avgVector));
      formData.append("photo1", frontPhoto.file);
      formData.append("photo2", leftPhoto.file);
      formData.append("photo3", rightPhoto.file);
      
      if (employeeId) {
        formData.append("employeeId", employeeId);
      }

      // 3. Post to API
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
      
      // 4. Update Zustand state if registering for current user
      if (!employeeId || employeeId === currentUser.id) {
        setFaceEnrolled(true);
      }

      setSuccess(true);
      
      if (onEnrollComplete && responseData.employee?.facePhotos) {
        onEnrollComplete(responseData.employee.facePhotos);
      }
    } catch (err: any) {
      console.error("Register face error:", err);
      setGlobalError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    frontPhoto?.descriptor &&
    !frontPhoto.isValidating &&
    leftPhoto?.descriptor &&
    !leftPhoto.isValidating &&
    rightPhoto?.descriptor &&
    !rightPhoto.isValidating;

  const renderSlot = (slot: PhotoSlot, label: string, ref: React.RefObject<HTMLInputElement | null>, photo: UploadedPhoto | null) => {
    return (
      <div className="flex flex-col space-y-2.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
          {label}
        </label>
        
        <input
          type="file"
          ref={ref as any}
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
              {/* Preview image */}
              {photo.previewUrl && (
                <img
                  src={photo.previewUrl}
                  alt={label}
                  className="w-full h-full object-cover rounded-xl scale-x-[-1]"
                />
              )}
              
              {/* Overlay states */}
              {photo.isValidating && (
                <div className="absolute inset-1.5 bg-slate-950/75 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1.5 z-10 animate-fade-in">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Checking face...</span>
                </div>
              )}

              {photo.error && (
                <div className="absolute inset-1.5 bg-rose-950/80 text-rose-300 rounded-xl flex flex-col items-center justify-center p-2.5 text-center gap-1 z-10 animate-fade-in">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  <span className="text-[9px] leading-normal font-semibold">{photo.error}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(slot);
                    }}
                    className="mt-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Replace
                  </button>
                </div>
              )}

              {photo.descriptor && (
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
              )}

              {/* Verified Badge */}
              {photo.descriptor && (
                <div className="absolute bottom-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-20 border border-white/15">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 pointer-events-none select-none text-slate-400 dark:text-slate-500">
              <div className="flex justify-center">
                <UploadCloud className="h-7 w-7 text-slate-350 dark:text-slate-650" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">Click to Upload</span>
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
            Facial Recognition Setup
          </CardTitle>
        </div>
        <CardDescription className="text-[11px] text-slate-400 leading-normal mt-1">
          Upload 3 clear images (Front, Left Angle, Right Angle) to register your face scan profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {success ? (
          <div className="w-full text-center space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Face Registered successfully!</h4>
              <p className="text-xs text-slate-400">Photos uploaded and database vector profile saved.</p>
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
              Update / Enroll Again
            </Button>
          </div>
        ) : (
          <>
            {globalError && (
              <div className="flex items-start gap-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-xs font-bold text-rose-500 animate-in fade-in">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            {/* Dropzones Row */}
            <div className="grid gap-4.5 grid-cols-3">
              {renderSlot("front", "Front View", fileInputRefFront, frontPhoto)}
              {renderSlot("left", "Left Profile", fileInputRefLeft, leftPhoto)}
              {renderSlot("right", "Right Profile", fileInputRefRight, rightPhoto)}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
              {/* Back to default view if admin/modal context */}
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="btn-primary flex items-center gap-2 font-bold px-5 h-9 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Register Face Profile
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
