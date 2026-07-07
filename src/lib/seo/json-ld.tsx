import {
  COMPANY,
  SITE_ALTERNATE_NAMES,
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

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function HomePageJsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/logoAnshapps.png"),
          width: 500,
          height: 500,
        },
        image: absoluteUrl("/logoAnshapps.png"),
        email: COMPANY.email,
        telephone: COMPANY.phone,
        parentOrganization: {
          "@type": "Organization",
          name: COMPANY.name,
          url: COMPANY.parentSite,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
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
        provider: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return <JsonLdScript data={structuredData} />;
}
