import {
  COMPANY,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site-config";

const FAQ_ITEMS = [
  {
    question: "What is included in the Free plan?",
    answer:
      "Free workspaces include up to 3 teammates and 50 punch-ins per month with punch in/out attendance, default leave pools, basic approvals, and an employee directory.",
  },
  {
    question: "What does the Pro plan unlock?",
    answer:
      "Pro is billed at ₹199 per user per month and includes unlimited punch-ins, custom shifts, leave categories, holiday calendars, policy uploads, and team analytics.",
  },
  {
    question: "Do new workspaces get a Pro trial?",
    answer:
      "Yes. Every new workspace starts with a 14-day Pro trial. Subscribe anytime during the trial; otherwise the workspace continues on the Free plan.",
  },
  {
    question: "Is facial recognition safe and private?",
    answer:
      "Face matching runs in the browser. Reference photos are downscaled before upload and stored in a private bucket. Users can delete biometric data anytime.",
  },
] as const;

function JsonLdScript({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function HomePageJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: COMPANY.parentSite,
    logo: absoluteUrl("/logoAnshapps.png"),
    email: COMPANY.email,
    telephone: COMPANY.phone,
    sameAs: [COMPANY.parentSite, SITE_URL],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@type": "Organization", name: COMPANY.name },
    inLanguage: "en-IN",
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: "Free plan for up to 3 teammates",
      },
      {
        "@type": "Offer",
        price: "199",
        priceCurrency: "INR",
        description: "Pro plan per user per month",
      },
    ],
    featureList: [
      "Facial recognition punch-in",
      "Leave management",
      "Attendance tracking",
      "Team directory",
      "HR analytics",
    ],
    provider: { "@type": "Organization", name: COMPANY.name },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLdScript data={organization} />
      <JsonLdScript data={website} />
      <JsonLdScript data={software} />
      <JsonLdScript data={faq} />
    </>
  );
}
