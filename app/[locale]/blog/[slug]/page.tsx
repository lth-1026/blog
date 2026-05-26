import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getAllSlugs, getPost } from "@/lib/posts";
import { PostBody } from "@/components/blog/post-body";
import { Comments } from "@/components/blog/giscus";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export async function generateStaticParams() {
  const all = await getAllSlugs();
  return all.map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  if (!post) return { title: "Not found" };

  const url = `/${locale}/blog/${slug}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    if (post.availableLocales.includes(l)) {
      languages[l] = `/${l}/blog/${slug}`;
    }
  }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      siteName: siteConfig.name[locale],
      locale,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      authors: [siteConfig.author.name[locale]],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  if (!post) notFound();

  const dict = await getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: siteConfig.author.name[locale],
      url: siteConfig.url,
    },
    inLanguage: locale,
    mainEntityOfPage: `${siteConfig.url}/${locale}/blog/${slug}`,
  };

  const otherLocale = locales.find(
    (l) => l !== locale && post.availableLocales.includes(l),
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-10">
        {post.series && (
          <Link
            href={`/${locale}/series/${encodeURIComponent(post.series)}`}
            className="inline-block text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {dict.blog.series}: {post.series}
          </Link>
        )}
        <h1 className="text-3xl font-semibold tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.description && (
          <p className="mt-3 text-lg text-muted-foreground">
            {post.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
          <span aria-hidden>·</span>
          <span>
            {post.readingTimeMinutes} {dict.blog.minRead}
          </span>
          {post.tags && post.tags.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <ul className="flex flex-wrap gap-x-2">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/${locale}/blog/tag/${encodeURIComponent(t)}`}
                      className="hover:text-foreground transition-colors"
                    >
                      #{t}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {otherLocale && (
          <p className="mt-4 text-xs text-muted-foreground">
            <Link
              href={`/${otherLocale}/blog/${slug}`}
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              {otherLocale.toUpperCase()} →
            </Link>
          </p>
        )}
      </header>

      <PostBody content={post.content} />

      <section className="mt-16 pt-8 border-t border-border/60">
        <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-6">
          {dict.comments.title}
        </h2>
        <Comments locale={locale} />
      </section>

      <footer className="mt-16 pt-8 border-t border-border/60">
        <Link
          href={`/${locale}/blog`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {dict.blog.allPosts}
        </Link>
      </footer>
    </div>
  );
}
