import type { Locale } from "./i18n/config";

export const siteConfig = {
  name: {
    ko: "이태호",
    en: "Taeho Lee",
  },
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000",
  author: {
    name: {
      ko: "이태호",
      en: "Taeho Lee",
    },
    email: "th20001026@gmail.com",
    github: "https://github.com/lth-1026",
  },
  ogImage: "/og-default.png",
  giscus: {
    repo: "lth-1026/blog" as `${string}/${string}` | "",
    repoId: "R_kgDOS5bOug",
    category: "Announcements",
    categoryId: "DIC_kwDOS5bOus4C_EZI",
  },
} as const;

export function getSiteName(locale: Locale): string {
  return siteConfig.name[locale];
}

export function getAuthorName(locale: Locale): string {
  return siteConfig.author.name[locale];
}
