import NextImage from "next/image";

interface MdxImageProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
}

// Maps markdown `![alt](src)` to an optimized, lazy-loaded next/image.
// Local images get exact width/height from the build-time rehype plugin
// (zero CLS); remote/unknown images fall back to a responsive 16:9 reserve.
export function MdxImage({ src, alt, width, height, title }: MdxImageProps) {
  if (!src) return null;

  const w = width != null ? Number(width) : undefined;
  const h = height != null ? Number(height) : undefined;
  const known = Boolean(w && h);

  return (
    <NextImage
      src={src}
      alt={alt ?? ""}
      title={title}
      width={known ? (w as number) : 1600}
      height={known ? (h as number) : 900}
      sizes="(max-width: 768px) 100vw, 768px"
      className="rounded-lg"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
