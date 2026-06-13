"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

// @giscus/react is code-split into its own chunk and only fetched once the
// comments section scrolls into view. `ssr: false` is allowed here because this
// wrapper is a Client Component.
const GiscusPanel = dynamic(
  () => import("./giscus").then((m) => m.GiscusPanel),
  { ssr: false },
);

export function Comments({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Skip everything when giscus isn't configured (mirrors the panel's guard so
  // we never even observe / mount in that case).
  const enabled = Boolean(
    siteConfig.giscus.repo && siteConfig.giscus.repoId,
  );

  useEffect(() => {
    if (!enabled || inView) return;
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (or already visible): mount eagerly as a fallback.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // Start loading a little before it's fully on screen.
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, inView]);

  if (!enabled) return null;

  return <div ref={ref}>{inView && <GiscusPanel locale={locale} />}</div>;
}
