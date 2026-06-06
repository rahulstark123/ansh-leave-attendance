"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getFaceDescriptor, computeDistance, loadFaceApiModels } from "@/lib/face-api-helper";
import { Loader2, ShieldAlert, Sparkles, Smile, VideoOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaceScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionName: "punch-in" | "punch-out";
}

export function FaceScanDialog({ isOpen, onClose, onSuccess, actionName }: FaceScanDialogProps) {
  const [status, setStatus] = useState<"initializing" | "fetching" | "scanning" | "matched" | "failed" | "error">("initializing");
  const [subStatus, setSubStatus] = useState("Loading face detection engine...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const referenceEmbeddingRef = useRef<number[] | null>(null);
  const loopActiveRef = useRef(false);

  // Stop camera when closed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    } else {
      initScan();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    loopActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const initScan = async () => {
    setStatus("initializing");
    setSubStatus("Loading face models...");
    setErrorMsg(null);
    setAttempts(0);
    referenceEmbeddingRef.current = null;

    try {
      // 0. Pre-load face-api models before starting camera/fetching reference
      await loadFaceApiModels();

      // 1. Fetch camera stream
      setSubStatus("Accessing camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Auto-play blocked or failed, waiting for user interaction:", playErr);
        }
      }

      // 2. Fetch reference face embedding
      setSubStatus("Downloading face profile...");
      setStatus("fetching");
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/employee/face-embedding", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Could not retrieve your registered face scan. Please register your face in Profile Settings first.");
      }

      const data = await res.json();
      referenceEmbeddingRef.current = data.faceEmbedding;

      // 3. Start scanning loop
      setStatus("scanning");
      loopActiveRef.current = true;
      startScanLoop();
    } catch (err: any) {
      console.error("Face scan initialization failed:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus("error");
      stopCamera();
    }
  };

  const startScanLoop = async () => {
    let failedMatches = 0;

    const scan = async () => {
      if (!loopActiveRef.current || !videoRef.current || !referenceEmbeddingRef.current) return;

      try {
        const video = videoRef.current;
        // Ensure the video element is initialized, playing, and has valid dimensions before processing
        if (video.paused || video.ended || video.readyState < 2 || video.videoWidth === 0) {
          if (loopActiveRef.current) {
            setTimeout(scan, 250);
          }
          return;
        }

        const liveDescriptor = await getFaceDescriptor(video);

        if (liveDescriptor) {
          const distance = computeDistance(liveDescriptor, referenceEmbeddingRef.current);
          console.log(`Face match distance: ${distance.toFixed(4)}`);

          if (distance < 0.55) {
            // MATCH SUCCESS!
            setStatus("matched");
            loopActiveRef.current = false;
            
            // Wait 600ms for user feedback animation before completing
            setTimeout(() => {
              stopCamera();
              onSuccess();
              onClose();
            }, 600);
            return;
          } else {
            failedMatches++;
            setAttempts(failedMatches);
            
            if (failedMatches >= 20) { // ~5-6 seconds of active mismatch at 250ms interval
              setStatus("failed");
              loopActiveRef.current = false;
              stopCamera();
              return;
            }
          }
        }
      } catch (err) {
        console.error("Scan loop error:", err);
      }

      // Check face again in 250ms (more relaxed interval prevents CPU starvation and keeps UI responsive)
      if (loopActiveRef.current) {
        setTimeout(scan, 250);
      }
    };

    scan();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            <span>Facial Recognition Verification</span>
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

          {/* Scanner frame */}
          <div className={`relative w-[280px] h-[280px] rounded-full overflow-hidden border-4 transition-all duration-300 shadow-xl ${
            status === "matched" 
              ? "border-emerald-500 shadow-emerald-500/20" 
              : status === "failed" 
                ? "border-rose-500 shadow-rose-500/20" 
                : "border-primary/40 shadow-primary/10"
          }`}>
            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                status === "scanning" || status === "matched" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Status overlays */}
            {status === "initializing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-950 text-slate-400 z-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold">{subStatus}</span>
              </div>
            )}

            {status === "fetching" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-950 text-slate-400 z-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold">Downloading face profile...</span>
              </div>
            )}

            {status === "scanning" && (
              <>
                {/* Dashed alignment ellipse */}
                <div className="absolute inset-4 rounded-[50%] border border-dashed border-white/60 pointer-events-none z-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-[50%] border-2 border-primary/40 animate-pulse" />
                </div>
                {/* Laser scan line animation */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-bounce top-1/3 z-10" />
              </>
            )}

            {status === "matched" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/70 text-emerald-400 z-10 animate-fade-in">
                <Sparkles className="h-12 w-12 animate-pulse" />
                <span className="text-sm font-extrabold mt-2.5 tracking-wider uppercase">Face Verified!</span>
              </div>
            )}

            {status === "failed" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 text-rose-400 z-10">
                <ShieldAlert className="h-10 w-10 text-rose-500" />
                <span className="text-xs font-bold text-center px-4">Verification Timeout.<br/>Face does not match profile.</span>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-rose-400 z-10 p-4 text-center">
                <VideoOff className="h-10 w-10 text-rose-500 mb-2" />
                <span className="text-xs font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Subtext info */}
          <div className="text-center px-6 min-h-[40px]">
            {status === "scanning" && (
              <span className="text-xs font-bold text-slate-400 animate-pulse">
                Please look directly into the camera. Checking identity...
              </span>
            )}
            {status === "scanning" && attempts > 4 && (
              <span className="block text-[11px] font-semibold text-amber-500 mt-1">
                Tip: Adjust your distance or improve lighting.
              </span>
            )}
            {status === "matched" && (
              <span className="text-xs font-extrabold text-emerald-500">
                Success! Logging your punch...
              </span>
            )}
          </div>

          {/* Retry buttons */}
          {(status === "failed" || status === "error") && (
            <div className="flex gap-3">
              <Button
                onClick={initScan}
                className="btn-primary flex items-center gap-2 font-bold py-2.5 px-4"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Verification
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:bg-slate-50 border-slate-200"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
