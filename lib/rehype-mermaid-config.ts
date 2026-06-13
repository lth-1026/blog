import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { createMermaidRenderer } from "mermaid-isomorphic";
import { visit } from "unist-util-visit";
import type { Element, ElementContent, Root } from "hast";
import type { MermaidConfig } from "mermaid";

/**
 * Build-time Mermaid → inline SVG.
 *
 * Authors write a plain ```mermaid fenced block. At build time (this plugin
 * runs inside `next build`, since posts are statically generated) each block is
 * rendered to inline `<svg>` via a headless Chromium (mermaid needs a DOM).
 *
 * Result: zero client-side JS for diagrams, SVG lives in the HTML (crawlable,
 * works without JS). The trade-off — builds need Chromium and are slower — is
 * deliberate and accepted.
 *
 * Dark mode: every diagram is rendered TWICE — a light variant (mermaid
 * "neutral" theme) and a dark variant (mermaid "dark" theme), both on a
 * transparent background. Both inline SVGs are emitted; CSS in app/globals.css
 * shows exactly one based on `html.dark`. No runtime theme switching, no JS.
 *
 * Caching: each diagram source is hashed; the rendered light+dark SVG pair is
 * persisted under .mermaid-cache/ (gitignored). Unchanged diagrams are read
 * from disk and never re-rendered, so warm builds don't pay the Chromium cost.
 *
 * Ordering: this plugin MUST run before rehype-pretty-code so Shiki never
 * touches mermaid blocks (it strips them out of the tree first).
 */

const CACHE_DIR = path.join(process.cwd(), ".mermaid-cache");
// Bump when the rendering pipeline changes so stale entries are invalidated.
const CACHE_VERSION = "v1";

const LIGHT_CONFIG: MermaidConfig = {
  theme: "neutral",
  themeVariables: { background: "transparent" },
};
const DARK_CONFIG: MermaidConfig = {
  theme: "dark",
  darkMode: true,
  themeVariables: { background: "transparent" },
};

interface CachedDiagram {
  light: string;
  dark: string;
}

/** A mermaid `<pre>` block located in the tree, with its replacement slot. */
interface MermaidTarget {
  parent: Element | Root;
  index: number;
  source: string;
}

function hashSource(source: string): string {
  return createHash("sha256")
    .update(`${CACHE_VERSION} ${source}`)
    .digest("hex")
    .slice(0, 16);
}

function cachePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

function readCache(hash: string): CachedDiagram | undefined {
  try {
    const parsed = JSON.parse(
      readFileSync(cachePath(hash), "utf8"),
    ) as CachedDiagram;
    if (typeof parsed.light === "string" && typeof parsed.dark === "string") {
      return parsed;
    }
  } catch {
    // Cache miss or unreadable entry → re-render.
  }
  return undefined;
}

function writeCache(hash: string, value: CachedDiagram): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath(hash), JSON.stringify(value), "utf8");
  } catch {
    // A failed cache write must never break the build; just skip it.
  }
}

function getClassNames(node: Element): string[] {
  const cn = node.properties?.className;
  if (Array.isArray(cn)) return cn.map(String);
  if (typeof cn === "string") return cn.split(/\s+/);
  return [];
}

function extractText(node: Element): string {
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") text += child.value;
    else if (child.type === "element") text += extractText(child);
  }
  return text;
}

/** Parse a rendered SVG string into a hast node tagged with its color scheme. */
function svgToNode(svg: string, scheme: "light" | "dark"): ElementContent {
  const fragment = fromHtmlIsomorphic(svg, { fragment: true });
  const svgEl = fragment.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "svg",
  );
  if (svgEl) {
    svgEl.properties = svgEl.properties ?? {};
    svgEl.properties["data-mermaid-theme"] = scheme;
    return svgEl;
  }
  // Fallback: keep raw markup so a malformed SVG still surfaces something.
  return {
    type: "element",
    tagName: "div",
    properties: { "data-mermaid-theme": scheme },
    children: fragment.children as ElementContent[],
  };
}

export default function rehypeMermaidBuild() {
  return async (tree: Root): Promise<void> => {
    // 1. Collect every `<pre><code class="language-mermaid">` block.
    const targets: MermaidTarget[] = [];
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || parent == null || index == null) return;
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code",
      );
      if (!code || !getClassNames(code).includes("language-mermaid")) return;
      targets.push({
        parent: parent as Element | Root,
        index,
        source: extractText(code).replace(/\n$/, ""),
      });
    });
    if (targets.length === 0) return;

    // 2. Resolve each diagram from cache; batch-render the cold ones through a
    //    single headless browser (light + dark variants in parallel).
    const entries: (CachedDiagram | undefined)[] = targets.map((t) =>
      readCache(hashSource(t.source)),
    );
    const cold = entries
      .map((entry, i) => (entry ? -1 : i))
      .filter((i) => i >= 0);

    if (cold.length > 0) {
      const renderer = createMermaidRenderer();
      const coldSources = cold.map((i) => targets[i].source);
      const [lightResults, darkResults] = await Promise.all([
        renderer(coldSources, { mermaidConfig: LIGHT_CONFIG, prefix: "mmd-l" }),
        renderer(coldSources, { mermaidConfig: DARK_CONFIG, prefix: "mmd-d" }),
      ]);

      cold.forEach((targetIdx, k) => {
        const light = lightResults[k];
        const dark = darkResults[k];
        if (light.status !== "fulfilled" || dark.status !== "fulfilled") {
          const reason =
            light.status === "rejected"
              ? light.reason
              : (dark as PromiseRejectedResult).reason;
          throw new Error(
            `rehype-mermaid: failed to render diagram:\n${targets[targetIdx].source}\n${String(reason)}`,
          );
        }
        const entry: CachedDiagram = {
          light: light.value.svg,
          dark: dark.value.svg,
        };
        entries[targetIdx] = entry;
        writeCache(hashSource(targets[targetIdx].source), entry);
      });
    }

    // 3. Swap each <pre> for a <div class="mermaid"> holding both inline SVGs.
    //    Splicing shifts sibling indexes, so apply highest-index-first per
    //    parent.
    const byParent = new Map<
      Element | Root,
      { index: number; node: Element }[]
    >();
    targets.forEach((t, i) => {
      const entry = entries[i];
      if (!entry) return;
      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["mermaid"] },
        children: [
          svgToNode(entry.light, "light"),
          svgToNode(entry.dark, "dark"),
        ],
      };
      const list = byParent.get(t.parent) ?? [];
      list.push({ index: t.index, node: wrapper });
      byParent.set(t.parent, list);
    });

    for (const [parent, edits] of byParent) {
      edits
        .sort((a, b) => b.index - a.index)
        .forEach(({ index, node }) => {
          parent.children.splice(index, 1, node);
        });
    }
  };
}
