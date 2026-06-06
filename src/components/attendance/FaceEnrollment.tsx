"use client";

import { useState, useRef, useEffect } from "react";
import { useLeaveStore } from "@/stores/leave-store";
import { averageDescriptors } from "@/lib/face-api-helper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Sparkles, Smile } from "lucide-react";

export function FaceEnrollment() {
  const { faceEnrolled, setFaceEnrolled } = useLeaveStore();
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "front" | "left" | "right" | "processing" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Scans captured so far
  const [frontDescriptor, setFrontDescriptor] = useState<Float32Array | null>(null);
  const [leftDescriptor, setLeftDescriptor] = useState<Float32Array | null>(null);
  const [rightDescriptor, setRightDescriptor] = useState<Float32Array | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    try {
      const { loadFaceApiModels } = await import("@/lib/face-api-helper");
      await loadFaceApiModels();

      if (streamRef.current) {
        stopCamera();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
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
      setHasCameraAccess(true);
      return true;
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg("Failed to access camera. Please allow camera permissions in your browser.");
      setHasCameraAccess(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCameraAccess(false);
  };

  const runEnrollmentFlow = async () => {
    const cameraOk = await startCamera();
    if (!cameraOk) return;

    setFrontDescriptor(null);
    setLeftDescriptor(null);
    setRightDescriptor(null);
    setErrorMsg(null);
    
    // Step 1: Capture Front
    setCurrentStep("front");
    await startCaptureStep(
      "Look directly into the camera.",
      (desc) => setFrontDescriptor(desc),
      async () => {
        // Step 2: Capture Left
        setCurrentStep("left");
        await startCaptureStep(
          "Turn your head slightly to the left.",
          (desc) => setLeftDescriptor(desc),
          async () => {
            // Step 3: Capture Right
            setCurrentStep("right");
            await startCaptureStep(
              "Turn your head slightly to the right.",
              (desc) => setRightDescriptor(desc),
              async (finalRight) => {
                // Done capturing all three, now process
                setCurrentStep("processing");
                stopCamera();
              }
            );
          }
        );
      }
    );
  };

  const startCaptureStep = async (
    instruction: string,
    saveDescriptor: (desc: Float32Array) => void,
    onStepComplete: (desc: Float32Array) => void
  ) => {
    setStatusText(instruction);
    
    // Countdown
    for (let c = 3; c > 0; c--) {
      setCountdown(c);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);
    setStatusText("Analyzing face... keep still!");
    
    // Try to capture
    let attempts = 0;
    let descriptor: Float32Array | null = null;
    
    while (attempts < 5) {
      if (!videoRef.current) break;
      const video = videoRef.current;
      // Ensure the video element is initialized, playing, and has valid dimensions before processing
      if (video.paused || video.ended || video.readyState < 2 || video.videoWidth === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      
      descriptor = await (async () => {
        const { getFaceDescriptor } = await import("@/lib/face-api-helper");
        return getFaceDescriptor(video);
      })();
      if (descriptor) break;
      
      attempts++;
      setStatusText(`Positioning error. Retrying... (Attempt ${attempts}/5)`);
      await new Promise((r) => setTimeout(r, 400));
    }

    if (descriptor) {
      saveDescriptor(descriptor);
      setStatusText("Angle captured successfully!");
      await new Promise((r) => setTimeout(r, 1000));
      onStepComplete(descriptor);
    } else {
      stopCamera();
      setErrorMsg("We lost track of your face. Please stand in a well-lit area and align your face inside the circle guide.");
      setCurrentStep("idle");
    }
  };

  // Perform average and submit to DB when descriptors are ready
  useEffect(() => {
    if (currentStep === "processing" && frontDescriptor && leftDescriptor && rightDescriptor) {
      const saveToDatabase = async () => {
        try {
          const averagedVector = averageDescriptors([frontDescriptor, leftDescriptor, rightDescriptor]);
          
          const token = sessionStorage.getItem("ansh_auth_token");
          const res = await fetch("/api/employee/face-enroll", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ faceEmbedding: averagedVector }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to save face embedding");
          }

          setFaceEnrolled(true);
          setCurrentStep("success");
        } catch (err: any) {
          console.error("Save embedding error:", err);
          setErrorMsg(err.message || "An error occurred while saving your face data.");
          setCurrentStep("idle");
        }
      };

      saveToDatabase();
    }
  }, [currentStep, frontDescriptor, leftDescriptor, rightDescriptor, setFaceEnrolled]);

  return (
    <Card className="crm-card border border-border/50 relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">
            Facial Recognition Sign-in
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-400 font-semibold mt-1">
          Enroll your face to log attendance seamlessly using your webcam with zero latency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current status display */}
        {faceEnrolled && currentStep === "idle" && (
          <div className="flex items-center gap-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-slate-700 dark:text-emerald-400">
                Face Registered successfully
              </span>
              <span className="block text-xs text-slate-400">
                Your face embedding is stored in the database. You will be prompted to scan your face when punching in/out.
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4.5">
            <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-rose-600 dark:text-rose-400">
                Enrollment Failed
              </span>
              <span className="block text-xs text-slate-400">
                {errorMsg}
              </span>
            </div>
          </div>
        )}

        {/* Video / Guide Panel */}
        {currentStep !== "idle" && currentStep !== "success" && (
          <div className="relative mx-auto max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl flex items-center justify-center">
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-950/90 z-20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold tracking-wide">Starting Webcam...</span>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />

            {/* Guide overlay */}
            <div className="absolute inset-0 border-[30px] border-slate-950/60 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-[180px] h-[220px] rounded-[50%] border-2 border-dashed border-primary/70 bg-transparent relative shadow-[0_0_0_9999px_rgba(2,6,23,0.3)]">
                {/* Scanner line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse top-1/2" />
              </div>
            </div>

            {/* Step Wizard Info overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/80 border border-slate-800/50 backdrop-blur-md rounded-xl p-3 text-center">
              <span className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">
                Step {currentStep === "front" ? "1/3: Front" : currentStep === "left" ? "2/3: Left Profile" : currentStep === "right" ? "3/3: Right Profile" : "Processing"}
              </span>
              <span className="block text-sm font-extrabold text-white">
                {statusText}
              </span>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px] z-10">
                <span className="text-7xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-ping">
                  {countdown}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step dots */}
        {currentStep !== "idle" && currentStep !== "success" && (
          <div className="flex justify-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${frontDescriptor ? "bg-emerald-500 scale-110" : currentStep === "front" ? "bg-primary animate-pulse scale-125" : "bg-slate-200 dark:bg-slate-800"}`} />
            <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${leftDescriptor ? "bg-emerald-500 scale-110" : currentStep === "left" ? "bg-primary animate-pulse scale-125" : "bg-slate-200 dark:bg-slate-800"}`} />
            <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${rightDescriptor ? "bg-emerald-500 scale-110" : currentStep === "right" ? "bg-primary animate-pulse scale-125" : "bg-slate-200 dark:bg-slate-800"}`} />
          </div>
        )}

        {/* Action Panel */}
        <div className="flex justify-end gap-3 pt-2">
          {currentStep === "idle" ? (
            <Button
              onClick={runEnrollmentFlow}
              className="btn-primary flex items-center gap-2 font-bold px-5"
            >
              <Camera className="h-4 w-4" />
              {faceEnrolled ? "Re-enroll Face Scan" : "Enroll Face Scan"}
            </Button>
          ) : currentStep === "success" ? (
            <div className="w-full text-center space-y-4 py-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-800 dark:text-white">Face Setup Completed!</h4>
                <p className="text-xs text-slate-400">You are all set to use face scan punch-in on your dashboard.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep("idle");
                  setErrorMsg(null);
                }}
                className="mt-2 text-xs font-bold"
              >
                Back to Settings
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                stopCamera();
                setCurrentStep("idle");
                setErrorMsg(null);
              }}
              className="text-xs font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              Cancel Setup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
