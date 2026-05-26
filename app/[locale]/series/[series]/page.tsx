import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getAllSeries, getPostsBySeries } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";

export async function generateStaticParams() {
  const params: { locale: Locale; series: string }[] = [];
  for (const locale of locales) {
    const series = await getAllSeries(locale);
    for (const s of series) {
      params.push({ locale, series: encodeURIComponent(s) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; series: string }>;
}): Promise<Metadata> {
  const { locale, series } = await params;
  const decoded = decodeURIComponent(series);
  return {
    title: decoded,
    alternates: {
      canonical: `/${locale}/series/${series}`,
    },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ locale: Locale; series: string }>;
}) {
  const { locale, series } = await params;
  const decoded = decodeURIComponent(series);
  const dict = await getDictionary(locale);
  const posts = await getPostsBySeries(locale, decoded);
  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {dict.blog.series}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {decoded}
        </h1>
      </header>

      <ul className="flex flex-col gap-3">
        {posts.map((p, idx) => (
          <li key={p.slug}>
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-muted-foreground tabular-nums w-6">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <PostCard post={p} locale={locale} dict={dict} />
              </div>
            </div>
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
