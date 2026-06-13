import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getDraftPosts } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";

// Dev-only backlog of draft posts. The [locale] layout already supplies
// generateStaticParams for locales, so this route inherits both ko/en.

export const metadata: Metadata = {
  title: "Drafts",
  robots: { index: false, follow: false },
};

export default async function DraftsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  // Never expose the draft backlog in production builds.
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const dict = await getDictionary(locale);
  const drafts = await getDraftPosts(locale);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ko"
            ? "개발 환경에서만 보이는 초안 목록입니다."
            : "Draft posts, visible only in development."}
        </p>
      </header>

      {drafts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {drafts.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} locale={locale} dict={dict} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{dict.blog.noResults}</p>
      )}
    </div>
  );
}
