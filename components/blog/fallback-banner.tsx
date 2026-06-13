import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeNames } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

/**
 * Server-rendered (0 client JS) notice shown atop a post when the requested UI
 * locale has no translation and we fell back to the post's actual language.
 * The message is written in the requested `uiLocale`, naming the content's
 * `actualLocale` (e.g. EN UI → "...only available in Korean.").
 */
export function FallbackBanner({
  uiLocale,
  actualLocale,
  dict,
}: {
  uiLocale: Locale;
  actualLocale: Locale;
  dict: Dictionary;
}) {
  const notice = dict.blog.fallbackNotice.replace(
    "{language}",
    localeNames[actualLocale],
  );

  return (
    <aside
      role="note"
      lang={uiLocale}
      className="mb-8 rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground flex gap-3"
    >
      <Languages aria-hidden className="size-4 mt-0.5 shrink-0" />
      <p className="flex-1">{notice}</p>
    </aside>
  );
}
