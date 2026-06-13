import type { Redirect } from "next/dist/lib/load-custom-routes";

/**
 * Permanent (301/308) redirects for renamed post slugs.
 *
 * When you rename a post file (e.g. `content/posts/old.ko.mdx` →
 * `content/posts/new.ko.mdx`), add an entry here so the old URL keeps working
 * and search engines transfer ranking to the new path. Always set
 * `permanent: true` for slug renames.
 *
 * Add one entry per locale, since URLs are locale-prefixed. Example — renaming
 * the slug `old` to `new`:
 *
 *   { source: "/ko/blog/old", destination: "/ko/blog/new", permanent: true },
 *   { source: "/en/blog/old", destination: "/en/blog/new", permanent: true },
 *
 * Start empty; add entries only when a slug actually changes.
 */
export const redirects: Redirect[] = [];
