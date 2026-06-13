import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getAllSlugParams, getPostWithFallback } from "@/lib/posts";
import { PostBody } from "@/components/blog/post-body";
import { OutdatedBanner } from "@/components/blog/outdated-banner";
import { FallbackBanner } from "@/components/blog/fallback-banner";
import { Comments } from "@/components/blog/comments-lazy";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export async function generateStaticParams() {
  // Includes cross-locale fallback URLs: every slug × every site locale, so a
  // ko-only post is still prerendered (and served via fallback) at /en/...
  return getAllSlugParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolved = await getPostWithFallback(locale, slug);
  if (!resolved) return { title: "Not found" };
  const { post, actualLocale } = resolved;

  // SEO: canonical always points to the post's ACTUAL language URL. On a
  // fallback page (requested locale lacks a translation) this de-duplicates
  // the content against its real-language original. hreflang alternates list
  // only the locales the post genuinely exists in — never a bogus alternate.
  const canonical = `/${actualLocale}/blog/${slug}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    if (post.availableLocales.includes(l)) {
      languages[l] = `/${l}/blog/${slug}`;
    }
  }
  // x-default: where to send a searcher whose language we don't target.
  // Prefer the default-locale version; fall back to whatever this post is.
  languages["x-default"] = post.availableLocales.includes(defaultLocale)
    ? `/${defaultLocale}/blog/${slug}`
    : `/${actualLocale}/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical, languages },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: canonical,
      siteName: siteConfig.name[locale],
      // Reflect the content's actual language, not the requested UI locale.
      locale: actualLocale,
      publishedTime: post.date,
      modifiedTime: post.lastModified,
      tags: post.tags,
      authors: [siteConfig.author.name[actualLocale]],
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
  const resolved = await getPostWithFallback(locale, slug);
  if (!resolved) notFound();
  const { post, isFallback, actualLocale } = resolved;

  const dict = await getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.lastModified,
    author: {
      "@type": "Person",
      name: siteConfig.author.name[actualLocale],
      url: siteConfig.url,
    },
    // Content's real language + canonical URL, even on a fallback page.
    inLanguage: actualLocale,
    mainEntityOfPage: `${siteConfig.url}/${actualLocale}/blog/${slug}`,
  };

  // Cross-locale link only makes sense when a genuine translation exists in a
  // different locale than the one we're rendering. On a fallback page the post
  // exists in a single locale, so there's nothing to link to.
  const otherLocale = locales.find(
    (l) => l !== actualLocale && post.availableLocales.includes(l),
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

      {isFallback && (
        <FallbackBanner
          uiLocale={locale}
          actualLocale={actualLocale}
          dict={dict}
        />
      )}

      <OutdatedBanner
        date={post.date}
        lastModified={post.lastModified}
        locale={locale}
        dict={dict}
      />

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
