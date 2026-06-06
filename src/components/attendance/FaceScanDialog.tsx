"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldAlert, Sparkles, Smile, VideoOff, RefreshCw, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaceScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (selfieBase64: string, lat: number | null, lng: number | null) => void;
  actionName: "punch-in" | "punch-out";
}

type ScanStatus = "initializing" | "ready" | "verifying" | "matched" | "failed" | "error";

export function FaceScanDialog({ isOpen, onClose, onSuccess, actionName }: FaceScanDialogProps) {
  const [status, setStatus] = useState<ScanStatus>("initializing");
  const [subStatus, setSubStatus] = useState("Opening camera...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const coordsRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      coordsRef.current = { lat: null, lng: null };
    } else {
      initScan();
    }
    return () => stopCamera();
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getCoordinates = (): Promise<{ lat: number | null; lng: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => resolve({ lat: null, lng: null }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(640, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const finishWithSelfie = async (selfieBase64: string) => {
    const coords = coordsRef.current;
    setStatus("matched");
    setTimeout(() => {
      stopCamera();
      onSuccess(selfieBase64, coords.lat, coords.lng);
      onClose();
    }, 400);
  };

  const initScan = async () => {
    setStatus("initializing");
    setSubStatus("Opening camera...");
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          /* autoplay blocked */
        }
      }
      setStatus("ready");
      setSubStatus("Allow location access if prompted, then tap Capture.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Could not access camera.");
      setStatus("error");
      stopCamera();
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || status !== "ready") return;

    const video = videoRef.current;
    if (video.paused || video.ended || video.readyState < 2 || video.videoWidth === 0) {
      setErrorMsg("Camera is still starting. Please wait a moment and try again.");
      setStatus("failed");
      return;
    }

    const selfieBase64 = captureFrame();
    if (!selfieBase64) {
      setErrorMsg("Could not capture photo. Please try again.");
      setStatus("failed");
      return;
    }

    setStatus("verifying");
    setSubStatus("Allow location if prompted — verifying face...");
    setErrorMsg(null);

    // Must request GPS on the Capture click (user gesture) — async face verify breaks permission otherwise.
    const coordsPromise = getCoordinates();

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const [coords, res] = await Promise.all([
        coordsPromise,
        fetch("/api/employee/face-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ selfie: selfieBase64 }),
        }),
      ]);

      coordsRef.current = coords;

      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        throw new Error(
          "Face profile not found. Please re-register your face photos in Profile Settings."
        );
      }
      if (res.status === 422) {
        setStatus("failed");
        setErrorMsg(
          data.error || "No face detected. Look directly at the camera and try again."
        );
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Face verification failed.");
      }

      if (data.matched) {
        await finishWithSelfie(selfieBase64);
      } else {
        setStatus("failed");
        setErrorMsg(
          `Face did not match (similarity ${Math.round((data.similarity ?? 0) * 100)}%). Adjust lighting or distance and retry.`
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed.");
      setStatus("failed");
    }
  };

  const showLiveFeed = status === "ready" || status === "verifying" || status === "matched";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            <span>Face Verification</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Action Required
            </span>
            <span className="block text-base font-black text-slate-800 dark:text-white mt-0.5 capitalize">
              Verify Face to {actionName.replace("-", " ")}
            </span>
          </div>

          <div
            className={`relative w-[280px] h-[280px] rounded-full overflow-hidden border-4 transition-all duration-300 shadow-xl ${
              status === "matched"
                ? "border-emerald-500 shadow-emerald-500/20"
                : status === "failed"
                  ? "border-rose-500 shadow-rose-500/20"
                  : "border-primary/40 shadow-primary/10"
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                showLiveFeed ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {status === "initializing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-950 text-slate-400 z-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold text-center px-4">{subStatus}</span>
              </div>
            )}

            {status === "ready" && (
              <div className="absolute inset-4 rounded-[50%] border border-dashed border-white/60 pointer-events-none z-10">
                <div className="absolute inset-0 rounded-[50%] border-2 border-primary/40" />
              </div>
            )}

            {status === "verifying" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-950/60 text-slate-200 z-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold">{subStatus}</span>
              </div>
            )}

            {status === "matched" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/70 text-emerald-400 z-10">
                <Sparkles className="h-12 w-12 animate-pulse" />
                <span className="text-sm font-extrabold mt-2.5 tracking-wider uppercase">Verified!</span>
              </div>
            )}

            {(status === "failed" || status === "error") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 text-rose-400 z-10 p-4">
                {status === "error" ? (
                  <VideoOff className="h-10 w-10 text-rose-500" />
                ) : (
                  <ShieldAlert className="h-10 w-10 text-rose-500" />
                )}
                <span className="text-xs font-bold text-center">{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="text-center px-6 min-h-[40px]">
            {status === "ready" && (
              <span className="text-xs font-bold text-slate-400">{subStatus}</span>
            )}
            {status === "matched" && (
              <span className="text-xs font-extrabold text-emerald-500">Logging your punch...</span>
            )}
          </div>

          {status === "ready" && (
            <Button
              onClick={handleCapture}
              className="btn-primary flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl"
            >
              <Camera className="h-4 w-4" />
              Capture & Verify
            </Button>
          )}

          {(status === "failed" || status === "error") && (
            <div className="flex gap-3">
              <Button onClick={initScan} className="btn-primary flex items-center gap-2 font-bold py-2.5 px-4">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={onClose} className="text-xs font-bold">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
