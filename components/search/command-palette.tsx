"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Heavy half (cmdk + fuse.js + search index) is code-split into its own chunk
// and only fetched once the user actually opens search. `ssr: false` is allowed
// here because this wrapper is a Client Component.
const CommandPalettePanel = dynamic(
  () =>
    import("./command-palette-panel").then((m) => m.CommandPalettePanel),
  { ssr: false },
);

export function CommandPalette({
  locale,
  placeholder,
  noResults,
  hint,
  openLabel,
}: {
  locale: Locale;
  placeholder: string;
  noResults: string;
  hint: string;
  openLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // Once true, the panel chunk has been requested and stays mounted (it manages
  // its own visibility via `open`), so re-opening is instant.
  const [mountPanel, setMountPanel] = useState(false);

  // ⌘K / Ctrl+K toggles search even before the panel chunk has loaded.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setMountPanel(true);
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warm the panel chunk during idle time so the first open feels instant,
  // without competing with first paint.
  useEffect(() => {
    const ric =
      typeof window !== "undefined" &&
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : null;
    if (!ric) return;
    const id = ric(() => setMountPanel(true));
    return () => window.cancelIdleCallback?.(id);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMountPanel(true);
          setOpen(true);
        }}
        aria-label={openLabel}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md text-xs",
          "text-muted-foreground hover:text-foreground transition-colors",
          "px-2 py-1",
        )}
      >
        <Search aria-hidden className="size-3.5" />
        <span className="hidden sm:inline">{hint}</span>
      </button>

      {mountPanel && (
        <CommandPalettePanel
          locale={locale}
          open={open}
          onOpenChange={setOpen}
          placeholder={placeholder}
          noResults={noResults}
        />
      )}
    </>
  );
}
