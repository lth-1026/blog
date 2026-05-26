"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Locale } from "@/lib/i18n/config";
import type { SearchEntry } from "@/lib/search-index";
import { cn, formatDate } from "@/lib/utils";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || index) return;
    fetch("/api/search")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, [open, index]);

  const fuse = useMemo(() => {
    if (!index) return null;
    return new Fuse(index, {
      keys: [
        { name: "title", weight: 0.6 },
        { name: "description", weight: 0.25 },
        { name: "tags", weight: 0.1 },
        { name: "series", weight: 0.05 },
      ],
      includeScore: true,
      threshold: 0.4,
      minMatchCharLength: 1,
    });
  }, [index]);

  const results = useMemo(() => {
    if (!fuse || !index) return [];
    const q = query.trim();
    if (!q) {
      return index
        .filter((e) => e.locale === locale)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 8);
    }
    return fuse
      .search(q)
      .map((r) => r.item)
      .filter((e) => e.locale === locale)
      .slice(0, 10);
  }, [fuse, index, query, locale]);

  function go(url: string) {
    setOpen(false);
    setQuery("");
    router.push(url);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{noResults}</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup>
              {results.map((r) => (
                <CommandItem
                  key={`${r.locale}-${r.slug}`}
                  value={`${r.title} ${r.description ?? ""} ${(r.tags ?? []).join(" ")}`}
                  onSelect={() => go(r.url)}
                  className="flex flex-col items-start gap-1"
                >
                  <span className="font-medium">{r.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {r.description}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {formatDate(r.date, locale)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
