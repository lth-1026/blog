import { readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

const PUBLIC_DIR = path.join(process.cwd(), "public");

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * Inject intrinsic width/height into <img> nodes that point at a local file
 * under /public. next/image then reserves exact layout space → zero CLS.
 * Remote images (no leading "/") are left untouched and fall back to the
 * responsive auto-height path in <MdxImage>.
 */
export function rehypeImageSize() {
  return (tree: HastNode) => walk(tree);
}

function walk(node: HastNode) {
  if (node.type === "element" && node.tagName === "img") {
    const props = node.properties ?? (node.properties = {});
    const src = props.src;
    if (
      typeof src === "string" &&
      src.startsWith("/") &&
      props.width == null &&
      props.height == null
    ) {
      try {
        const buf = readFileSync(path.join(PUBLIC_DIR, src));
        const { width, height } = imageSize(buf);
        if (width && height) {
          props.width = width;
          props.height = height;
        }
      } catch {
        // Missing or unsupported image — leave unset; component degrades gracefully.
      }
    }
  }
  if (node.children) for (const child of node.children) walk(child);
}
