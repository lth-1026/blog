"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleToggle({
  currentLocale,
  label,
}: {
  currentLocale: Locale;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(nextLocale: Locale) {
    if (nextLocale === currentLocale) return;
    const rest = pathname.replace(new RegExp(`^/${currentLocale}`), "");
    const next = `/${nextLocale}${rest || ""}`;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.push(next));
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        isPending && "opacity-60",
      )}
    >
      <Languages aria-hidden className="size-3.5 text-muted-foreground" />
      {locales.map((l, idx) => (
        <span key={l} className="contents">
          <button
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={l === currentLocale}
            className={cn(
              "uppercase tracking-wide transition-colors",
              l === currentLocale
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
          {idx < locales.length - 1 && (
            <span aria-hidden className="text-muted-foreground/50">
              /
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
