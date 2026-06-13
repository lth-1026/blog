"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
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
import { formatDate } from "@/lib/utils";

/**
 * The heavy half of the command palette: cmdk dialog + fuse.js fuzzy search +
 * the lazily-fetched search index. Code-split out of the eager bundle and only
 * imported (via `next/dynamic`, `ssr: false`) once the user opens search.
 *
 * Open state lives in the lightweight wrapper so the ⌘K shortcut and the
 * trigger button keep working before this chunk has loaded.
 */
export function CommandPalettePanel({
  locale,
  open,
  onOpenChange,
  placeholder,
  noResults,
}: {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder: string;
  noResults: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (index) return;
    fetch("/api/search")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, [index]);

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
    onOpenChange(false);
    setQuery("");
    router.push(url);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
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
  );
}
