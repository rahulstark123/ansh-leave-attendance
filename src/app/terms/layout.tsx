import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms and conditions for using ANSH HR leave and attendance software, subscriptions, and workspace services.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
