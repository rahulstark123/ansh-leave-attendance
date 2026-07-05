import type { Metadata } from "next";
import {
  COMPANY,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site-config";

const DEFAULT_OG_IMAGE = "/ANSH HR.jpg";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function createPageMetadata(options: PageMetadataOptions = {}): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    path = "/",
    noIndex = false,
    keywords = SITE_KEYWORDS,
  } = options;

  const canonical = absoluteUrl(path);
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(SITE_URL),
    title: title
      ? { absolute: fullTitle }
      : { default: fullTitle, template: `%s | ${SITE_NAME}` },
    description,
    keywords,
    authors: [{ name: COMPANY.name, url: COMPANY.parentSite }],
    creator: COMPANY.name,
    publisher: COMPANY.name,
    applicationName: SITE_NAME,
    category: "Business",
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
      creator: "@anshapps",
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
  };
}

export const rootMetadata = createPageMetadata();
