"use client";

import { FileText, ImageIcon, ExternalLink } from "lucide-react";
import { resolveStorageUrl } from "@/lib/storage/public-url";

interface AttachmentLinksProps {
  attachments?: string[] | null;
  label?: string;
}

function fileLabel(url: string, index: number): string {
  try {
    const parsed = new URL(url, "http://localhost");
    const key = parsed.searchParams.get("key");
    const name = (key || parsed.pathname).split("/").pop() || `attachment-${index + 1}`;
    return decodeURIComponent(name.replace(/^\d+_/, ""));
  } catch {
    return `Attachment ${index + 1}`;
  }
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

export function AttachmentLinks({ attachments, label = "Attachments" }: AttachmentLinksProps) {
  if (!attachments?.length) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-border/40">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <ul className="space-y-2">
        {attachments.map((rawUrl, index) => {
          const url = resolveStorageUrl(rawUrl) ?? rawUrl;
          const name = fileLabel(url, index);
          const image = isImageUrl(url);

          return (
            <li key={`${rawUrl}-${index}`}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-primary/30 transition-colors"
              >
                {image ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="truncate flex-1">{name}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
