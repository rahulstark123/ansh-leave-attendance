import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  toolbar?: React.ReactNode;
  action?: { label: string; icon?: LucideIcon; onClick?: () => void };
}

export function PageHeader({
  title,
  description,
  eyebrow,
  toolbar,
  action,
}: PageHeaderProps) {
  const ActionIcon = action?.icon;
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="page-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {(toolbar || action) && (
        <div className="flex flex-wrap items-center gap-3">
          {toolbar}
          {action && (
            <Button
              className="btn-primary shrink-0 gap-2 border-0"
              onClick={action.onClick}
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
