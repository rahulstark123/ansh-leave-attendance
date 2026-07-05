import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Sign In",
  description:
    "Sign in to your ANSH HR workspace. Manage leave, attendance, face-verified punch-ins, and team HR operations.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
