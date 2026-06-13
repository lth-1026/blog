import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Locale } from "@/lib/i18n/config";
import { getPost } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";
import { formatDate } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = siteConfig.name.ko;

// Pretendard covers Hangul; without it Satori renders Korean as tofu (□).
// Read once per module load (cached across renders on the same worker).
const fontDir = join(process.cwd(), "assets", "fonts");
const [pretendardRegular, pretendardSemiBold] = await Promise.all([
  readFile(join(fontDir, "Pretendard-Regular.otf")),
  readFile(join(fontDir, "Pretendard-SemiBold.otf")),
]);

export default async function OG({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "72px",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#a3a3a3",
          }}
        >
          <span>{siteConfig.name[locale]}</span>
          {post && <span>{formatDate(post.date, locale)}</span>}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {post?.title ?? siteConfig.name[locale]}
          </h1>
          {post?.description && (
            <p
              style={{
                marginTop: 24,
                fontSize: 28,
                color: "#a3a3a3",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {post.description}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#a3a3a3",
          }}
        >
          {post?.tags?.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: pretendardRegular, weight: 400, style: "normal" },
        { name: "Pretendard", data: pretendardSemiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
