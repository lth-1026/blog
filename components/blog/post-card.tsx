import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { PostMeta } from "@/lib/posts";
import { cn, formatDate } from "@/lib/utils";

export function PostCard({
  post,
  locale,
  dict,
  className,
}: {
  post: PostMeta;
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className={cn(
        "group block py-2 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/50",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium tracking-tight group-hover:underline underline-offset-4 decoration-foreground/30">
          {post.title}
        </h3>
        <time
          dateTime={post.date}
          className="shrink-0 text-xs text-muted-foreground tabular-nums"
        >
          {formatDate(post.date, locale)}
        </time>
      </div>
      {post.description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {post.description}
        </p>
      )}
      {(post.tags?.length || post.series) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {post.series && (
            <span className="rounded-full border border-border px-2 py-0.5">
              {dict.blog.series}: {post.series}
            </span>
          )}
          {post.tags?.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
