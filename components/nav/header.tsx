import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { siteConfig } from "@/lib/site-config";

export function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
        <Link
          href={`/${locale}`}
          className="font-semibold tracking-tight text-sm hover:opacity-70 transition-opacity"
        >
          {siteConfig.name[locale]}
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link
            href={`/${locale}/blog`}
            className="hover:text-foreground transition-colors"
          >
            {dict.nav.blog}
          </Link>
        </nav>
      </div>
    </header>
  );
}
