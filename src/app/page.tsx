import { LandingPage } from "@/components/landing/landing-page";
import { HomePageJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  description:
    "Run HR, leave & attendance in one workspace. Face-verified punch-ins, live shift clocks, leave approvals, and team analytics — built for Indian MSMEs. Start free.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HomePageJsonLd />
      <LandingPage />
    </>
  );
}
