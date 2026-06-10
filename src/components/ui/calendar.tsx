"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayButtonProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-bold text-slate-800 dark:text-slate-100",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-slate-600 transition-colors hover:bg-muted dark:text-slate-300"
        ),
        button_next: cn(
          "absolute right-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-slate-600 transition-colors hover:bg-muted dark:text-slate-300"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-slate-400 rounded-md w-full font-bold text-[10px] uppercase tracking-widest",
        week: "flex w-full mt-1",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:z-10",
        day_button: cn(
          "inline-flex h-11 w-full items-center justify-center rounded-xl p-0 font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:opacity-100"
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "ring-2 ring-primary/30 font-bold",
        outside:
          "text-slate-300 dark:text-slate-600 aria-selected:text-slate-300",
        disabled: "text-slate-300 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: DayButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-11 w-full rounded-xl p-0 font-medium aria-selected:opacity-100",
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
