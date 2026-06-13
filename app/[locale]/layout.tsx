import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Header } from "@/components/nav/header";
import { Footer } from "@/components/nav/footer";
import { siteConfig } from "@/lib/site-config";
import { personJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

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
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name[typed],
      template: `%s — ${siteConfig.name[typed]}`,
    },
    description: dict.site.description,
    icons: { icon: "/favicon.ico" },
    authors: [{ name: siteConfig.author.name[typed] }],
    creator: siteConfig.author.name[typed],
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
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
        "x-default": `/${defaultLocale}`,
      },
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
    <html
      lang={typedLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Pretendard dynamic subset — self-hosted; browser fetches only the
            glyph chunks present on the page (~tens of KB), not the full font. */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
