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
    github: "https://github.com/leetaeho",
  },
  ogImage: "/og-default.png",
  giscus: {
    repo: "" as `${string}/${string}` | "",
    repoId: "",
    category: "Announcements",
    categoryId: "",
  },
} as const;

export function getSiteName(locale: Locale): string {
  return siteConfig.name[locale];
}

export function getAuthorName(locale: Locale): string {
  return siteConfig.author.name[locale];
}
