import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import { rehypeImageSize } from "./rehype-image-size";
import { remarkPublicImages } from "./remark-public-images";
import rehypeMermaidBuild from "./rehype-mermaid-config";

const prettyCodeOptions: Partial<RehypePrettyCodeOptions> = {
  theme: {
    light: "github-light",
    dark: "github-dark-dimmed",
  },
  keepBackground: false,
  defaultLang: "plaintext",
};

export const mdxOptions: MDXRemoteProps["options"] = {
  parseFrontmatter: false,
  mdxOptions: {
    // remarkPublicImages runs before rehype so rehypeImageSize sees the
    // normalized "/images/…" src and can inject intrinsic width/height.
    remarkPlugins: [remarkGfm, remarkPublicImages],
    rehypePlugins: [
      // Mermaid → inline SVG at build time. MUST run before rehypePrettyCode
      // so Shiki never highlights mermaid blocks (this strips them first).
      rehypeMermaidBuild,
      rehypeImageSize,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["no-underline", "hover:underline"],
          },
        },
      ],
      [rehypePrettyCode, prettyCodeOptions],
    ],
  },
};
