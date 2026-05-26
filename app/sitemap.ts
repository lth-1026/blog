import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getAllPosts, getAllTags, getAllSeries } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${base}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${base}/${l}`]),
        ),
      },
    });
    entries.push({
      url: `${base}/${locale}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${base}/${l}/blog`]),
        ),
      },
    });

    const posts = await getAllPosts(locale);
    for (const post of posts) {
      const languages = Object.fromEntries(
        post.availableLocales.map((l) => [l, `${base}/${l}/blog/${post.slug}`]),
      );
      entries.push({
        url: `${base}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.updated ?? post.date),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }

    const tags = await getAllTags(locale);
    for (const t of tags) {
      entries.push({
        url: `${base}/${locale}/blog/tag/${encodeURIComponent(t)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }

    const series = await getAllSeries(locale);
    for (const s of series) {
      entries.push({
        url: `${base}/${locale}/series/${encodeURIComponent(s)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
