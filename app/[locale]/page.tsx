import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";
import { PostCard } from "@/components/blog/post-card";
import Link from "next/link";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const posts = (await getAllPosts(locale)).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <section className="mb-16 sm:mb-20">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {siteConfig.name[locale]}
        </h1>
        <p className="mt-2 text-muted-foreground">{dict.site.role}</p>
        <p className="mt-6 leading-relaxed">{dict.site.description}</p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight">
            {dict.blog.title}
          </h2>
          <Link
            href={`/${locale}/blog`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {dict.blog.allPosts} →
          </Link>
        </div>
        <ul className="flex flex-col gap-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} locale={locale} dict={dict} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
