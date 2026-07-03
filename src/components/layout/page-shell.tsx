import { cn } from "@/lib/utils";

/** Full-width shell with modern responsive side gutters (not edge-to-edge). */
export const PAGE_SHELL =
  "mx-auto w-full px-8 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
};

export function PageShell({
  children,
  className,
  as: Component = "div",
}: PageShellProps) {
  return <Component className={cn(PAGE_SHELL, className)}>{children}</Component>;
}
