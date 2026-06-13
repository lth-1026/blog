"use client";

import { useEffect } from "react";

/**
 * Zero-markup copy-button island.
 *
 * rehype-pretty-code emits each code block as a server-rendered
 * `<figure data-rehype-pretty-code-figure>` (or a bare `<pre>`), so there is no
 * React component per block to attach a button to. Instead this single tiny
 * client island runs once on mount: it finds every `<pre>` inside `.prose`,
 * injects a copy button, and wires ONE delegated click listener on the article.
 * That keeps first-load JS to a single small island regardless of how many code
 * blocks a post has — the buttons themselves are plain DOM, not React nodes.
 */
export function CodeCopyButtons() {
  useEffect(() => {
    const article = document.querySelector<HTMLElement>(".prose");
    if (!article) return;

    const pres = article.querySelectorAll<HTMLPreElement>("pre");
    pres.forEach((pre) => {
      if (pre.querySelector("[data-copy-button]")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.copyButton = "";
      btn.setAttribute("aria-label", "Copy code");
      // Two icons swapped purely via CSS on the [data-copied] state.
      btn.innerHTML =
        '<span data-copy-icon aria-hidden="true"></span>' +
        '<span data-check-icon aria-hidden="true"></span>';
      pre.appendChild(btn);
    });

    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>("[data-copy-button]");
      if (!btn) return;
      const pre = btn.closest("pre");
      const code = pre?.querySelector("code");
      const text = code?.textContent ?? pre?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text.replace(/\n$/, ""));
        btn.dataset.copied = "";
        btn.setAttribute("aria-label", "Copied");
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          delete btn.dataset.copied;
          btn.setAttribute("aria-label", "Copy code");
        }, 1800);
      } catch {
        // Clipboard may be unavailable (insecure context); fail silently.
      }
    };

    article.addEventListener("click", onClick);
    return () => {
      clearTimeout(resetTimer);
      article.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
