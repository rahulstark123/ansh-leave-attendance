"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  allowAddNew?: boolean;
  addNewLabel?: string;
  onAddNew?: () => void;
}

export function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option",
  required = false,
  allowAddNew = false,
  addNewLabel = "Add New",
  onAddNew,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const selectRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    if (!selectRef.current) return;
    const rect = selectRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (selectRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const dropdownMenu =
    isOpen && menuPosition ? (
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
        }}
        className="z-[200] rounded-2xl border border-border bg-card/95 dark:bg-slate-950 shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-1.5 duration-200 max-h-64 overflow-y-auto"
      >
        <div className="p-1.5 space-y-0.5">
          {!required && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs transition-all cursor-pointer ${
                value === ""
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-slate-600 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
              }`}
            >
              <span>None / Unassigned</span>
              {value === "" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          )}
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value || "__empty__"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-slate-600 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {opt.description && (
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5 truncate leading-none">
                      {opt.description}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
          {allowAddNew && onAddNew && (
            <>
              <div className="h-px bg-border/50 my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10 transition-all cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{addNewLabel}</span>
              </button>
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative w-full" ref={selectRef}>
      {label ? (
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          {label}
        </label>
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer"
      >
        <span className={selectedOption ? "text-slate-700 dark:text-slate-200 font-semibold" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>

      {typeof document !== "undefined" && dropdownMenu
        ? createPortal(dropdownMenu, document.body)
        : null}
    </div>
  );
}
