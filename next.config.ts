import type { NextConfig } from "next";
import { redirects } from "./lib/redirects";

const nextConfig: NextConfig = {
  // Permanent slug-rename redirects, sourced from lib/redirects.ts.
  async redirects() {
    return redirects;
  },
  // Build-time Mermaid rendering (lib/rehype-mermaid-config.ts) drives a
  // headless Chromium via mermaid-isomorphic → playwright. These rely on
  // native Node resolution (require.resolve of browser binaries) that breaks
  // when bundled into the server graph, so opt them out of bundling and let
  // them load via native require during `next build`.
  serverExternalPackages: ["mermaid-isomorphic", "playwright", "playwright-core"],
  images: {
    // Modern formats served automatically; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // Allowlist remote hosts for MDX <img src="https://..."> usage.
    // Add hosts here as posts start referencing external images.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "user-images.githubusercontent.com" },
    ],
  },
  // The OG route reads Pretendard OTFs via fs at request time. Force-trace
  // them into the serverless bundle so Korean titles render on Vercel too.
  outputFileTracingIncludes: {
    "/[locale]/blog/[slug]/opengraph-image": ["./assets/fonts/**"],
  },
};

export default nextConfig;
