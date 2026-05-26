import Link from "next/link";
import { Mail, Rss } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { siteConfig } from "@/lib/site-config";
import { LocaleToggle } from "./locale-toggle";
import { ThemeToggle } from "./theme-toggle";

export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border/60 mt-24">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <Link
              href={`/${locale}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.nav.home}
            </Link>
            <Link
              href={`/${locale}/blog`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.nav.blog}
            </Link>
            <a
              href={siteConfig.author.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={dict.footer.github}
            >
              <GithubIcon className="size-3.5" />
              <span>{dict.footer.github}</span>
            </a>
            <a
              href={`mailto:${siteConfig.author.email}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={dict.footer.email}
            >
              <Mail aria-hidden className="size-3.5" />
              <span>{dict.footer.email}</span>
            </a>
            <Link
              href={`/rss.xml?lang=${locale}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={dict.footer.rss}
            >
              <Rss aria-hidden className="size-3.5" />
              <span>{dict.footer.rss}</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LocaleToggle currentLocale={locale} label={dict.locale.toggle} />
            <ThemeToggle label={dict.theme.toggle} />
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {dict.footer.rights.replace("{year}", String(year))}
        </p>
      </div>
    </footer>
  );
}
