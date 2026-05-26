import type { Locale } from "./i18n/config";
import { siteConfig } from "./site-config";

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name[locale],
    url: siteConfig.url,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/${locale}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author.name[locale],
    url: siteConfig.url,
    email: `mailto:${siteConfig.author.email}`,
    sameAs: [siteConfig.author.github].filter(Boolean),
  };
}
