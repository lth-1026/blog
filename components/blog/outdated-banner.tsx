import { AlertTriangle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { formatDate } from "@/lib/utils";

// Posts older than this (measured from publish `date`) are flagged as
// potentially outdated — unless they were meaningfully updated more recently
// (effective lastModified also within the window).
export const OUTDATED_THRESHOLD_MONTHS = 18;

function isOlderThanMonths(iso: string, months: number): boolean {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return then.getTime() < cutoff.getTime();
}

/** True when the post should show the outdated notice. */
export function isPostOutdated(date: string, lastModified: string): boolean {
  return (
    isOlderThanMonths(date, OUTDATED_THRESHOLD_MONTHS) &&
    isOlderThanMonths(lastModified, OUTDATED_THRESHOLD_MONTHS)
  );
}

/**
 * Server-rendered (0 client JS) notice shown atop old articles. Mirrors the
 * Callout "warning" style. Renders nothing when the post isn't outdated.
 */
export function OutdatedBanner({
  date,
  lastModified,
  locale,
  dict,
}: {
  date: string;
  lastModified: string;
  locale: Locale;
  dict: Dictionary;
}) {
  if (!isPostOutdated(date, lastModified)) return null;

  const notice = dict.blog.outdatedNotice.replace(
    "{date}",
    formatDate(date, locale),
  );

  return (
    <aside
      role="note"
      className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-foreground flex gap-3"
    >
      <AlertTriangle aria-hidden className="size-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <strong className="font-semibold">{dict.blog.outdatedTitle}</strong>
        <p className="mt-1 text-muted-foreground">{notice}</p>
      </div>
    </aside>
  );
}
