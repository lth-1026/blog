import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";

export async function generateStaticParams() {
  const params: { locale: Locale; tag: string }[] = [];
  for (const locale of locales) {
    const tags = await getAllTags(locale);
    for (const tag of tags) {
      // Raw value — Next encodes for the path. Pre-encoding double-encodes and
      // 404s on click for any non-ASCII/spaced tag (ASCII tags happened to work).
      params.push({ locale, tag: tag });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded}`,
    alternates: {
      canonical: `/${locale}/blog/tag/${tag}`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: Locale; tag: string }>;
}) {
  const { locale, tag } = await params;
  const decoded = decodeURIComponent(tag);
  const dict = await getDictionary(locale);
  const posts = await getPostsByTag(locale, decoded);
  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {dict.blog.tags}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          #{decoded}
        </h1>
      </header>

      <ul className="flex flex-col gap-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <PostCard post={p} locale={locale} dict={dict} />
          </li>
        ))}
      </ul>

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
