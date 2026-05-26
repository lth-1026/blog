"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export function Comments({ locale }: { locale: Locale }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!siteConfig.giscus.repo || !siteConfig.giscus.repoId) {
    return null;
  }

  const theme = mounted && resolvedTheme === "dark" ? "dark_dimmed" : "light";

  return (
    <Giscus
      id="comments"
      repo={siteConfig.giscus.repo as `${string}/${string}`}
      repoId={siteConfig.giscus.repoId}
      category={siteConfig.giscus.category}
      categoryId={siteConfig.giscus.categoryId}
      mapping="pathname"
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={theme}
      lang={locale}
      loading="lazy"
    />
  );
}
