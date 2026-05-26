import type { Locale } from "./i18n/config";
import { locales } from "./i18n/config";
import { getAllPosts } from "./posts";

export interface SearchEntry {
  slug: string;
  locale: Locale;
  title: string;
  description?: string;
  tags?: string[];
  series?: string;
  date: string;
  url: string;
}

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const all: SearchEntry[] = [];
  for (const locale of locales) {
    const posts = await getAllPosts(locale);
    for (const p of posts) {
      all.push({
        slug: p.slug,
        locale,
        title: p.title,
        description: p.description,
        tags: p.tags,
        series: p.series,
        date: p.date,
        url: `/${locale}/blog/${p.slug}`,
      });
    }
  }
  return all;
}
