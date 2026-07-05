import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Sign Up Free",
  description:
    "Create your free ANSH HR workspace in minutes. 14-day Pro trial, face-verified attendance, leave management for up to 3 teammates — no credit card required.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
