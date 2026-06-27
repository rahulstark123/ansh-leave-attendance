"use client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  ALLOWED_ATTACHMENT_TYPES,
  formatFileSize,
  prepareAttachment,
} from "@/lib/attachment-compress";

interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function AttachmentPicker({
  files,
  onChange,
  disabled = false,
  maxFiles = MAX_ATTACHMENTS,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSelect = async (selected: FileList | null) => {
    if (!selected?.length || disabled) return;

    setError(null);
    setProcessing(true);

    try {
      const incoming = Array.from(selected);
      const remaining = maxFiles - files.length;

      if (remaining <= 0) {
        setError(`You can attach up to ${maxFiles} files.`);
        return;
      }

      if (incoming.length > remaining) {
        setError(`Only ${remaining} more file${remaining === 1 ? "" : "s"} can be added.`);
      }

      const next: File[] = [...files];

      for (const file of incoming.slice(0, remaining)) {
        if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
          throw new Error(
            `"${file.name}" is not supported. Use JPG, PNG, WebP, GIF, or PDF.`
          );
        }
        const prepared = await prepareAttachment(file);
        next.push(prepared);
      }

      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process attachment.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Attachments (optional)
        </label>
        <span className="text-[10px] text-slate-500 font-semibold">
          Max {maxFiles} · 2 MB each · images auto-compressed
        </span>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-xs"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-700 dark:text-slate-200">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled || processing}
                className="rounded-lg p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length < maxFiles && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || processing}
          onClick={() => inputRef.current?.click()}
          className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider border-dashed"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Compressing...
            </>
          ) : (
            <>
              <Paperclip className="mr-2 h-4 w-4" />
              Add attachment
            </>
          )}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,image/*,application/pdf"
        multiple
        className="hidden"
        disabled={disabled || processing}
        onChange={(e) => handleSelect(e.target.files)}
      />

      {error && (
        <p className="text-[11px] font-semibold text-rose-500">{error}</p>
      )}
    </div>
  );
}

export { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS };
