"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGlobalSearchStore } from "@/stores/global-search-store";
import {
  buildGlobalSearchIndex,
  filterSearchItems,
  groupSearchResults,
  type GlobalSearchItem,
} from "@/lib/global-search-index";
import { cn } from "@/lib/utils";
import { getFeatureForPath } from "@/lib/billing/features";
import { usePlanStore } from "@/stores/plan-store";

export function GlobalSearchModal() {
  const router = useRouter();
  const open = useGlobalSearchStore((s) => s.open);
  const setOpen = useGlobalSearchStore((s) => s.setOpen);
  const hasProAccess = usePlanStore((s) => s.hasProAccess);
  const loaded = usePlanStore((s) => s.loaded);
  const requestUpgrade = usePlanStore((s) => s.requestUpgrade);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => {
    if (!open) return [];
    return buildGlobalSearchIndex();
  }, [open]);

  const filtered = useMemo(
    () => filterSearchItems(allItems, query),
    [allItems, query]
  );
  const grouped = useMemo(() => groupSearchResults(filtered), [filtered]);
  const flatResults = useMemo(
    () => grouped.flatMap((g) => g.items),
    [grouped]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, [setOpen]);

  const navigateTo = useCallback(
    (item: GlobalSearchItem) => {
      close();
      const feature = getFeatureForPath(item.href);
      if (loaded && feature && !hasProAccess) {
        requestUpgrade(feature.id);
        return;
      }
      router.push(item.href);
    },
    [close, router, loaded, hasProAccess, requestUpgrade]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current || flatResults.length === 0) return;
    const el = listRef.current.querySelector(
      `[data-search-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flatResults.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(flatResults.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        i <= 0 ? Math.max(flatResults.length - 1, 0) : i - 1
      );
    } else if (e.key === "Enter" && flatResults[activeIndex]) {
      e.preventDefault();
      navigateTo(flatResults[activeIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  };

  let runningIndex = -1;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent
        className="flex max-h-[min(85vh,560px)] max-w-xl flex-col gap-0 overflow-hidden border border-border/60 p-0 shadow-2xl sm:mt-[10vh] sm:self-start bg-card text-card-foreground"
        showCloseButton={false}
      >
        <div className="flex items-center gap-3 border-b border-border/50 px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, employees, leave requests…"
            className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 focus-visible:ring-transparent focus:ring-0 focus:ring-transparent"
            aria-label="Global search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 bg-card"
          role="listbox"
          aria-label="Search results"
        >
          {flatResults.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </p>
          ) : (
            grouped.map((section) => (
              <div key={section.group} className="px-2 py-1">
                <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </p>
                <ul>
                  {section.items.map((item) => {
                    runningIndex += 1;
                    const index = runningIndex;
                    const Icon = item.icon;
                    const isActive = index === activeIndex;

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          data-search-index={index}
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => navigateTo(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
                            isActive
                              ? "bg-primary/10 text-foreground"
                              : "text-foreground hover:bg-muted/60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                          {isActive && (
                            <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/50 bg-muted/20 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 font-mono">
                ↑
              </kbd>
              <kbd className="rounded border border-border bg-background px-1 font-mono">
                ↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 font-mono">
                ↵
              </kbd>
              open
            </span>
          </span>
          <span>{flatResults.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
