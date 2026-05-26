import { Feed } from "feed";
import { locales, defaultLocale, isLocale } from "@/lib/i18n/config";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const langParam = url.searchParams.get("lang") ?? defaultLocale;
  const locale = isLocale(langParam) ? langParam : defaultLocale;

  const posts = await getAllPosts(locale);

  const feed = new Feed({
    title: siteConfig.name[locale],
    description:
      locale === "ko"
        ? "프론트엔드 엔지니어 이태호의 기술 블로그입니다."
        : "A technical blog by frontend engineer Taeho Lee.",
    id: `${siteConfig.url}/${locale}`,
    link: `${siteConfig.url}/${locale}`,
    language: locale,
    copyright: `© ${new Date().getFullYear()} ${siteConfig.author.name[locale]}`,
    feedLinks: {
      rss2: `${siteConfig.url}/rss.xml?lang=${locale}`,
    },
    author: {
      name: siteConfig.author.name[locale],
      email: siteConfig.author.email,
      link: siteConfig.url,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${siteConfig.url}/${locale}/blog/${post.slug}`,
      link: `${siteConfig.url}/${locale}/blog/${post.slug}`,
      description: post.description,
      date: new Date(post.date),
      category: post.tags?.map((t) => ({ name: t })),
    });
  }

  // RSS includes other locales as alternate links via headers (limited support); we keep simple.
  void locales;

  return new Response(feed.rss2(), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
