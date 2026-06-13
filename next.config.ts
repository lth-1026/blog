import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
