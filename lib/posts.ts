import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";
import { getGitLastModified } from "./git-dates";
import type { Locale } from "./i18n/config";
import { locales, defaultLocale } from "./i18n/config";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "must be a parseable date (e.g. 2026-05-26)");

// The frontmatter contract. Parsing failures throw at build time so a typo'd
// or missing field breaks the build loudly instead of silently dropping a post.
const frontmatterSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required (non-empty)"),
  date: isoDate,
  updated: isoDate.optional(),
  tags: z.array(z.string().min(1)).optional(),
  series: z.string().min(1).optional(),
  thumbnail: z.string().min(1).optional(),
  draft: z.boolean().optional(),
});

export type PostFrontmatter = z.infer<typeof frontmatterSchema>;

export interface PostMeta extends PostFrontmatter {
  slug: string;
  locale: Locale;
  readingTimeMinutes: number;
  availableLocales: Locale[];
  // Effective last-modified ISO date, resolved at load time with priority:
  // frontmatter `updated` (explicit author override) → git commit date →
  // `date`. Consumers (JSON-LD dateModified, OG modifiedTime, sitemap
  // lastModified) should read this instead of `updated ?? date`.
  lastModified: string;
}

export interface Post extends PostMeta {
  content: string;
}

async function ensureDir() {
  try {
    await fs.access(POSTS_DIR);
  } catch {
    return false;
  }
  return true;
}

async function readPostFile(filename: string): Promise<Post | null> {
  const match = filename.match(/^(.+)\.(ko|en)\.mdx$/);
  if (!match) return null;
  const [, slug, locale] = match;
  const filePath = path.join(POSTS_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in content/posts/${filename}:\n${issues}`);
  }
  const fm = parsed.data;

  const stats = readingTime(content);

  // Effective last-modified date. Priority: explicit author `updated` override
  // → git last-commit date → publish `date`. On a shallow CI clone (Vercel
  // default) git history may be absent, so getGitLastModified returns null and
  // we cleanly fall back to `date` — never crashing the build.
  const lastModified = fm.updated ?? getGitLastModified(filePath) ?? fm.date;

  return {
    ...fm,
    slug,
    locale: locale as Locale,
    content,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
    availableLocales: [],
    lastModified,
  };
}

async function loadAllRawPosts(): Promise<Post[]> {
  if (!(await ensureDir())) return [];
  const files = await fs.readdir(POSTS_DIR);
  const posts = await Promise.all(
    files.filter((f) => f.endsWith(".mdx")).map(readPostFile),
  );
  return posts.filter((p): p is Post => p !== null);
}

function attachAvailableLocales(posts: Post[]): Post[] {
  const bySlug = new Map<string, Set<Locale>>();
  for (const p of posts) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, new Set());
    bySlug.get(p.slug)!.add(p.locale);
  }
  return posts.map((p) => ({
    ...p,
    availableLocales: locales.filter((l) => bySlug.get(p.slug)?.has(l)),
  }));
}

function sortByDateDesc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

const includeDrafts = process.env.NODE_ENV !== "production";

export async function getAllPosts(locale: Locale): Promise<PostMeta[]> {
  const all = attachAvailableLocales(await loadAllRawPosts());
  return sortByDateDesc(
    all
      .filter((p) => p.locale === locale && (includeDrafts || !p.draft))
      .map(({ content: _content, ...meta }) => meta),
  );
}

// Draft backlog for the dev-only /drafts page. Reuses the same file IO and
// schema validation as everything else; just filters to draft posts. In
// production `includeDrafts` is false so drafts are never loaded into the
// regular lists, but this helper surfaces them while authoring.
export async function getDraftPosts(locale: Locale): Promise<PostMeta[]> {
  const all = attachAvailableLocales(await loadAllRawPosts());
  return sortByDateDesc(
    all
      .filter((p) => p.locale === locale && p.draft === true)
      .map(({ content: _content, ...meta }) => meta),
  );
}

export async function getPost(
  locale: Locale,
  slug: string,
): Promise<Post | null> {
  const all = attachAvailableLocales(await loadAllRawPosts());
  return all.find((p) => p.locale === locale && p.slug === slug) ?? null;
}

export interface PostWithFallback {
  /** The resolved post content. When `isFallback` is true this is the
   *  available-locale version, not the requested one. */
  post: Post;
  /** True when the requested locale had no translation and we fell back. */
  isFallback: boolean;
  /** The locale the returned `post` is actually written in. Equals the
   *  requested locale when `isFallback` is false. */
  actualLocale: Locale;
}

/**
 * Resolve a post by slug with graceful cross-locale fallback.
 *
 * Tries the requested `locale` first. If that translation doesn't exist but
 * the post exists in another locale, returns the available version flagged as
 * a fallback (preferring the default locale when multiple exist — though in
 * practice a fallback only triggers when exactly one locale is present).
 *
 * Returns `null` only when the slug exists in NO locale (genuine 404).
 */
export async function getPostWithFallback(
  locale: Locale,
  slug: string,
): Promise<PostWithFallback | null> {
  const all = attachAvailableLocales(await loadAllRawPosts());
  const forSlug = all.filter((p) => p.slug === slug);
  if (forSlug.length === 0) return null;

  const exact = forSlug.find((p) => p.locale === locale);
  if (exact) {
    return { post: exact, isFallback: false, actualLocale: locale };
  }

  // No translation in the requested locale — fall back. Prefer the default
  // locale, otherwise take whatever exists (ordered by `locales`).
  const fallback =
    forSlug.find((p) => p.locale === defaultLocale) ??
    locales.map((l) => forSlug.find((p) => p.locale === l)).find(Boolean);
  if (!fallback) return null;

  return { post: fallback, isFallback: true, actualLocale: fallback.locale };
}

/**
 * (locale, slug) pairs to statically generate, INCLUDING cross-locale fallback
 * URLs. For every slug, emit a param for each site locale as long as the post
 * exists in at least one locale — so `/en/blog/<ko-only-slug>` is prerendered
 * and served by the fallback resolver instead of 404ing. Reuses the same
 * file IO as everything else (single load).
 */
export async function getAllSlugParams(): Promise<
  { slug: string; locale: Locale }[]
> {
  const all = await loadAllRawPosts();
  const slugs = new Set<string>();
  for (const p of all) {
    if (includeDrafts || !p.draft) slugs.add(p.slug);
  }
  const params: { slug: string; locale: Locale }[] = [];
  for (const slug of slugs) {
    for (const locale of locales) {
      params.push({ slug, locale });
    }
  }
  return params;
}

export async function getAllSlugs(): Promise<
  { slug: string; locale: Locale }[]
> {
  const all = await loadAllRawPosts();
  return all
    .filter((p) => includeDrafts || !p.draft)
    .map((p) => ({ slug: p.slug, locale: p.locale }));
}

export async function getAllTags(locale: Locale): Promise<string[]> {
  const posts = await getAllPosts(locale);
  const set = new Set<string>();
  for (const p of posts) p.tags?.forEach((t) => set.add(t));
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getAllSeries(locale: Locale): Promise<string[]> {
  const posts = await getAllPosts(locale);
  const set = new Set<string>();
  for (const p of posts) if (p.series) set.add(p.series);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getPostsByTag(
  locale: Locale,
  tag: string,
): Promise<PostMeta[]> {
  const posts = await getAllPosts(locale);
  return posts.filter((p) => p.tags?.includes(tag));
}

export async function getPostsBySeries(
  locale: Locale,
  series: string,
): Promise<PostMeta[]> {
  const posts = await getAllPosts(locale);
  return posts.filter((p) => p.series === series);
}
