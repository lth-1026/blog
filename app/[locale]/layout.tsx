import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Header } from "@/components/nav/header";
import { Footer } from "@/components/nav/footer";
import { siteConfig } from "@/lib/site-config";
import { personJsonLd, websiteJsonLd } from "@/lib/jsonld";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) return {};
  const typed = locale as Locale;
  const dict = await getDictionary(typed);
  return {
    title: { default: siteConfig.name[typed], template: `%s — ${siteConfig.name[typed]}` },
    description: dict.site.description,
    openGraph: {
      type: "website",
      siteName: siteConfig.name[typed],
      locale: typed,
      url: `${siteConfig.url}/${typed}`,
      title: siteConfig.name[typed],
      description: dict.site.description,
    },
    alternates: {
      canonical: `/${typed}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) {
    notFound();
  }
  const typedLocale = locale as Locale;
  const dict = await getDictionary(typedLocale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            websiteJsonLd(typedLocale),
            personJsonLd(typedLocale),
          ]),
        }}
      />
      <Header locale={typedLocale} dict={dict} />
      <main className="flex-1 w-full">{children}</main>
      <Footer locale={typedLocale} dict={dict} />
    </>
  );
}
