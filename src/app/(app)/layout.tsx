import { AppLayoutClient } from "./app-layout-client";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Workspace",
  description: "Private ANSH HR workspace.",
  noIndex: true,
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
