/**
 * Rewrite markdown image URLs that point into the workspace `/public` folder
 * into the root-absolute URL the browser (and next/image) actually serves.
 *
 * Why this exists: VS Code's "paste image" / drag-drop feature saves the file
 * under `public/images/<slug>/…` (see .vscode/settings.json) but inserts a
 * *document-relative* link such as `../../public/images/post/shot.png`.
 * next/image needs `/images/post/shot.png` (the `/public` prefix is implicit
 * and the path must be root-absolute). Authoring posts also occasionally
 * produces `/public/…` or an OS-absolute path that still contains `/public/`.
 *
 * Strategy: anything containing a `public/` (or `/public/`) path segment is
 * rewritten to everything *after* that segment, made root-absolute. The
 * `/public/` marker is unambiguous in this repo, so we don't need the source
 * file's location — which the MDX compiler doesn't hand us anyway.
 *
 * Runs as a remark (mdast) plugin BEFORE rehype, so the downstream
 * `rehypeImageSize` plugin sees the already-normalized `/images/…` src and can
 * read the file from `/public` to inject width/height (zero CLS).
 */
import type { Plugin } from "unified";

interface MdastNode {
  type: string;
  url?: string;
  children?: MdastNode[];
}

// Matches a leading `../` / `./` / `/` prefix followed by a `public/` segment,
// capturing the remainder of the path. Examples that match:
//   ../../public/images/a.png  ->  images/a.png
//   ./public/images/a.png      ->  images/a.png
//   /public/images/a.png       ->  images/a.png
//   public/images/a.png        ->  images/a.png
//   /Users/me/blog/public/images/a.png -> images/a.png
const PUBLIC_RE = /^(?:[^?#]*\/)?public\/(.+)$/;

function toPublicUrl(url: string): string | null {
  // Leave absolute http(s), data:, and already-root-absolute non-public URLs alone.
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("data:")) return null;

  // Split off any query/hash so we don't corrupt it.
  const hashIdx = url.search(/[?#]/);
  const pathPart = hashIdx === -1 ? url : url.slice(0, hashIdx);
  const suffix = hashIdx === -1 ? "" : url.slice(hashIdx);

  const match = pathPart.match(PUBLIC_RE);
  if (!match) return null;

  return `/${match[1]}${suffix}`;
}

function walk(node: MdastNode) {
  if (node.type === "image" && typeof node.url === "string") {
    const rewritten = toPublicUrl(node.url);
    if (rewritten) node.url = rewritten;
  }
  if (node.children) for (const child of node.children) walk(child);
}

export const remarkPublicImages: Plugin<[], MdastNode> = () => {
  return (tree) => {
    walk(tree);
  };
};
