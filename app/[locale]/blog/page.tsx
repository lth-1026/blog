import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getAllPosts, getAllSeries } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.blog.title,
    description: dict.blog.description,
    alternates: {
      languages: {
        ko: "/ko/blog",
        en: "/en/blog",
      },
      canonical: `/${locale}/blog`,
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const posts = await getAllPosts(locale);
  const series = await getAllSeries(locale);

  const grouped = new Map<string | null, typeof posts>();
  for (const p of posts) {
    const key = p.series ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const standalone = grouped.get(null) ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.blog.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{dict.blog.description}</p>
      </header>

      {series.length > 0 && (
        <section className="mb-12">
          {series.map((s) => {
            const seriesPosts = grouped.get(s) ?? [];
            return (
              <div key={s} className="mb-10">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
                    {dict.blog.series}: {s}
                  </h2>
                  <Link
                    href={`/${locale}/series/${encodeURIComponent(s)}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    →
                  </Link>
                </div>
                <ul className="flex flex-col gap-3">
                  {seriesPosts.map((p) => (
                    <li key={p.slug}>
                      <PostCard post={p} locale={locale} dict={dict} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {standalone.length > 0 && (
        <section>
          {series.length > 0 && (
            <h2 className="mb-4 text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              {dict.blog.allPosts}
            </h2>
          )}
          <ul className="flex flex-col gap-3">
            {standalone.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length === 0 && (
        <p className="text-muted-foreground">{dict.blog.noResults}</p>
      )}
    </div>
  );
}
