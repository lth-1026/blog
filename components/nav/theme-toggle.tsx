"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md",
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        "transition-colors",
      )}
    >
      <Sun
        aria-hidden
        className={cn(
          "size-3.5 transition-all",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0",
          "absolute",
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          "size-3.5 transition-all",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
    </button>
  );
}
