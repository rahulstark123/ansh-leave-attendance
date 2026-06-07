"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import type { PunchRecord } from "@/stores/leave-store";

interface PunchLocationMapDialogProps {
  punch: PunchRecord | null;
  onClose: () => void;
}

type MapTab = "punch-in" | "punch-out";

function hasCoords(lat?: number | null, lng?: number | null) {
  return lat != null && lng != null;
}

export function PunchLocationMapDialog({ punch, onClose }: PunchLocationMapDialogProps) {
  const [mapTab, setMapTab] = useState<MapTab>("punch-in");

  useEffect(() => {
    if (punch) {
      setMapTab(hasCoords(punch.punchInLat, punch.punchInLng) ? "punch-in" : "punch-out");
    }
  }, [punch]);

  const checkInHasLocation = punch ? hasCoords(punch.punchInLat, punch.punchInLng) : false;
  const checkOutHasLocation = punch ? hasCoords(punch.punchOutLat, punch.punchOutLng) : false;
  const isShiftActive = punch ? !punch.punchOut : false;

  const activeLat = mapTab === "punch-in" ? punch?.punchInLat : punch?.punchOutLat;
  const activeLng = mapTab === "punch-in" ? punch?.punchInLng : punch?.punchOutLng;
  const showMap = hasCoords(activeLat, activeLng);

  return (
    <Dialog open={punch !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary animate-pulse" />
            <span>Punch Geotag Location Map</span>
          </DialogTitle>
        </DialogHeader>

        {punch && (
          <div className="space-y-6 pt-4">
            <div className="flex border border-border/60 rounded-xl p-1 bg-slate-50 dark:bg-slate-950 text-xs font-bold gap-1">
              <button
                onClick={() => setMapTab("punch-in")}
                className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                  mapTab === "punch-in"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm border border-border/40"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                Check-in
                {checkInHasLocation && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                )}
              </button>
              <button
                onClick={() => setMapTab("punch-out")}
                className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                  mapTab === "punch-out"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm border border-border/40"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                Check-out
                {checkOutHasLocation && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                )}
              </button>
            </div>

            {showMap ? (
              <div className="space-y-4">
                <div className="relative w-full h-[280px] rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-950 shadow-inner">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title={`${mapTab} location map`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng! - 0.005}%2C${activeLat! - 0.005}%2C${activeLng! + 0.005}%2C${activeLat! + 0.005}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
                    className="absolute inset-0"
                  />
                </div>
                <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-border/20 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/10">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Event</span>
                    <span className="font-bold text-primary capitalize">
                      {mapTab === "punch-in" ? "Check-in" : "Check-out"} · {mapTab === "punch-in" ? punch.punchIn : punch.punchOut}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/10">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Coordinates</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {activeLat?.toFixed(6)}, {activeLng?.toFixed(6)}
                    </span>
                  </div>
                  <div className="pt-2.5 flex items-center justify-between gap-4">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer text-center"
                    >
                      Open in Google Maps
                    </a>
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                {mapTab === "punch-out" && isShiftActive ? (
                  <>
                    <p className="font-bold text-slate-500 dark:text-slate-300">Shift still active</p>
                    <p>Check-out location will appear after you punch out.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-slate-500 dark:text-slate-300">No location logged</p>
                    <p>
                      {mapTab === "punch-in"
                        ? "No check-in coordinates were captured for this shift."
                        : "No check-out coordinates were captured for this shift."}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
