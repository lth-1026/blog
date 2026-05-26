import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Header } from "@/components/nav/header";
import { Footer } from "@/components/nav/footer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
      <Header locale={typedLocale} dict={dict} />
      <main className="flex-1 w-full">{children}</main>
      <Footer locale={typedLocale} dict={dict} />
    </>
  );
}
