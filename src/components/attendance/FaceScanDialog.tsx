"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldAlert, Sparkles, Smile, VideoOff, RefreshCw, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaceScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (selfieBase64: string, lat: number | null, lng: number | null) => void;
  actionName: "punch-in" | "punch-out";
}

type ScanStatus = "initializing" | "ready" | "verifying" | "matched" | "failed" | "error";
type LocationStatus = "idle" | "requesting" | "acquired" | "denied" | "unavailable";

export function FaceScanDialog({ isOpen, onClose, onSuccess, actionName }: FaceScanDialogProps) {
  const [status, setStatus] = useState<ScanStatus>("initializing");
  const [subStatus, setSubStatus] = useState("Opening camera...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const coordsRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const geoWatchIdRef = useRef<number | null>(null);

  const stopLocationCapture = useCallback(() => {
    if (geoWatchIdRef.current != null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const getGpsCoordinates = (): Promise<{ lat: number | null; lng: number | null }> => {
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
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    });
  };

  const getIpCoordinates = async (): Promise<{ lat: number | null; lng: number | null }> => {
    try {
      const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return { lat: null, lng: null };
      const data = (await res.json()) as { success?: boolean; latitude?: number; longitude?: number };
      if (data.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
        return { lat: data.latitude, lng: data.longitude };
      }
    } catch {
      /* ignore */
    }
    return { lat: null, lng: null };
  };

  const prefetchIpLocation = useCallback(async () => {
    const ipCoords = await getIpCoordinates();
    if (ipCoords.lat != null && ipCoords.lng != null) {
      if (coordsRef.current.lat == null) {
        coordsRef.current = ipCoords;
      }
      setLocationStatus("acquired");
      return;
    }
    if (coordsRef.current.lat == null) {
      setLocationStatus((prev) => (prev === "requesting" ? prev : "unavailable"));
    }
  }, []);

  const startLocationCapture = useCallback(() => {
    coordsRef.current = { lat: null, lng: null };
    setLocationStatus("idle");

    if (!navigator.geolocation) {
      void prefetchIpLocation();
      return;
    }

    setLocationStatus("requesting");
    stopLocationCapture();
    void prefetchIpLocation();

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        coordsRef.current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocationStatus("acquired");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus("denied");
        } else {
          setLocationStatus("unavailable");
        }
        void prefetchIpLocation();
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
  }, [stopLocationCapture, prefetchIpLocation]);

  const resolveCoordinates = async (): Promise<{ lat: number | null; lng: number | null }> => {
    if (coordsRef.current.lat != null && coordsRef.current.lng != null) {
      return coordsRef.current;
    }

    const gps = await getGpsCoordinates();
    if (gps.lat != null && gps.lng != null) {
      coordsRef.current = gps;
      setLocationStatus("acquired");
      return gps;
    }

    const ipCoords = await getIpCoordinates();
    if (ipCoords.lat != null && ipCoords.lng != null) {
      coordsRef.current = ipCoords;
      setLocationStatus("acquired");
      return ipCoords;
    }

    if (locationStatus === "denied") {
      setLocationStatus("denied");
    } else {
      setLocationStatus("unavailable");
    }

    return { lat: null, lng: null };
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      stopLocationCapture();
      coordsRef.current = { lat: null, lng: null };
      setLocationStatus("idle");
    } else {
      initScan();
    }
    return () => {
      stopCamera();
      stopLocationCapture();
    };
  }, [isOpen, stopCamera, stopLocationCapture]);

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
    startLocationCapture();

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
    setSubStatus("Getting your location...");
    setErrorMsg(null);

    const coords = await resolveCoordinates();
    coordsRef.current = coords;

    setSubStatus("Verifying face...");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/employee/face-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ selfie: selfieBase64 }),
      });

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
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                locationStatus === "acquired"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : locationStatus === "denied"
                    ? "bg-amber-500/10 text-amber-600"
                    : locationStatus === "requesting"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-slate-500/10 text-slate-500"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {locationStatus === "acquired" && "Location captured"}
              {locationStatus === "requesting" && "Acquiring GPS location..."}
              {locationStatus === "denied" && "Location blocked — approximate IP location will be used"}
              {locationStatus === "unavailable" && "GPS unavailable — approximate IP location will be used"}
              {locationStatus === "idle" && "Location will be captured on punch"}
            </div>
          )}

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
