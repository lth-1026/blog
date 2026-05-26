import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Locale } from "./i18n/config";
import { locales } from "./i18n/config";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export interface PostFrontmatter {
  title: string;
  description?: string;
  date: string;
  updated?: string;
  tags?: string[];
  series?: string;
  thumbnail?: string;
  draft?: boolean;
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
  locale: Locale;
  readingTimeMinutes: number;
  availableLocales: Locale[];
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
  const fm = data as PostFrontmatter;
  if (!fm.title || !fm.date) return null;
  const stats = readingTime(content);
  return {
    ...fm,
    slug,
    locale: locale as Locale,
    content,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
    availableLocales: [],
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

export async function getPost(
  locale: Locale,
  slug: string,
): Promise<Post | null> {
  const all = attachAvailableLocales(await loadAllRawPosts());
  return all.find((p) => p.locale === locale && p.slug === slug) ?? null;
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
