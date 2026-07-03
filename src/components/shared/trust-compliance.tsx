import { BadgeCheck, Building2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const TRUST_COMPLIANCE_SECTION_ID = "trust-compliance";
export const TRUST_COMPLIANCE_HREF = `/#${TRUST_COMPLIANCE_SECTION_ID}`;

const UDYAM_REGISTRATION_NUMBER = "UDYAM-BR-23-0127857";

type TrustComplianceProps = {
  showDescription?: boolean;
  compact?: boolean;
  className?: string;
  variant?: "theme" | "landing";
};

export function TrustCompliance({
  showDescription = true,
  compact = false,
  className,
  variant = "theme",
}: TrustComplianceProps) {
  const isLanding = variant === "landing";

  return (
    <section
      id={TRUST_COMPLIANCE_SECTION_ID}
      className={cn(
        "scroll-mt-24",
        compact ? "py-10 sm:py-12" : "py-16 sm:py-20",
        className
      )}
      aria-labelledby="trust-compliance-heading"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
          isLanding
            ? "border-zinc-200/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/40"
            : "border-zinc-200/80 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/40",
          compact ? "p-6 sm:p-8" : "p-8 sm:p-10"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(77, 196, 255, 0.04) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(232, 121, 249, 0.03) 100%)",
          }}
        />

        <div
          className={cn(
            "relative",
            compact
              ? "flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
              : "space-y-8"
          )}
        >
          <div className={cn("space-y-5", compact && "lg:max-w-xl")}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl border",
                  "border-violet-500/20 bg-violet-500/10 text-violet-500",
                  "dark:text-violet-400",
                  compact ? "h-9 w-9" : "h-10 w-10"
                )}
              >
                <ShieldCheck className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                  Trust & Compliance
                </p>
                <h2
                  id="trust-compliance-heading"
                  className={cn(
                    "font-extrabold tracking-tight",
                    isLanding ? "text-zinc-900 dark:text-white" : "text-zinc-900 dark:text-white",
                    compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                  )}
                >
                  Built from Bharat, Ready for the World
                </h2>
              </div>
            </div>

            {showDescription && (
              <p
                className={cn(
                  "leading-relaxed",
                  isLanding ? "text-zinc-600 dark:text-slate-400" : "text-zinc-600 dark:text-slate-400",
                  compact ? "text-xs sm:text-sm" : "text-sm"
                )}
              >
                ANSH Apps is a Government of India MSME-registered software company
                building simple, affordable, and modern business software for teams,
                startups, and growing businesses.
              </p>
            )}
          </div>

          <div
            className={cn(
              "relative grid gap-4",
              compact ? "sm:grid-cols-2 lg:min-w-[22rem]" : "sm:grid-cols-2"
            )}
          >
            <div
              className={cn(
                "rounded-xl border p-4",
                isLanding
                  ? "border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/30"
                  : "border-zinc-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/30"
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <Building2
                  className={cn(
                    "h-4 w-4",
                    isLanding ? "text-violet-600 dark:text-violet-400" : "text-violet-500 dark:text-violet-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isLanding ? "text-zinc-500 dark:text-slate-500" : "text-zinc-500 dark:text-slate-500"
                  )}
                >
                  MSME Registered
                </span>
              </div>
              <p
                className={cn(
                  "text-sm font-bold",
                  isLanding ? "text-zinc-900 dark:text-slate-200" : "text-zinc-900 dark:text-slate-200"
                )}
              >
                MSME Registered Enterprise
              </p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  isLanding ? "text-slate-500" : "text-zinc-500 dark:text-slate-500"
                )}
              >
                Government of India Udyam Registered
              </p>
            </div>

            <div
              className={cn(
                "rounded-xl border p-4",
                isLanding
                  ? "border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/30"
                  : "border-zinc-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/30"
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <BadgeCheck
                  className={cn(
                    "h-4 w-4",
                    isLanding ? "text-violet-600 dark:text-violet-400" : "text-violet-500 dark:text-violet-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isLanding ? "text-zinc-500 dark:text-slate-500" : "text-zinc-500 dark:text-slate-500"
                  )}
                >
                  Udyam Number
                </span>
              </div>
              <p
                className={cn(
                  "font-mono text-xs font-semibold tracking-wide sm:text-sm",
                  isLanding ? "text-zinc-700 dark:text-slate-300" : "text-zinc-700 dark:text-slate-300"
                )}
              >
                {UDYAM_REGISTRATION_NUMBER}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
