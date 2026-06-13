This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authoring

### New post

```bash
npm run new -- "글 제목" [--locale ko|en] [--slug my-slug]
```

> Note the `--` before the arguments: npm needs it to forward flags to the
> script.

Creates `content/posts/<slug>.<locale>.mdx` with frontmatter prefilled
(`title`, empty `description`, today's `date`, empty `tags`, `draft: true`).

- `--locale` defaults to `ko`.
- The slug is derived as an ascii kebab-case from the title. A title with no
  ascii characters (e.g. a Korean-only title) produces an empty slug — the
  command fails and asks you to pass `--slug` explicitly, so you don't end up
  with a broken URL.
- It refuses to overwrite an existing file.

### Pasting / dragging images

Pasting a screenshot (or dragging an image file) into an MDX post in VS Code
just works:

1. Place the cursor in a post under `content/posts/` and paste (or drag) the
   image.
2. VS Code saves the file under `public/images/<post-file-basename>/` (see
   `.vscode/settings.json`) and inserts a markdown image link.
3. The link VS Code writes is document-relative
   (`../../public/images/<post>/shot.png`). At build time the remark plugin
   `lib/remark-public-images.ts` rewrites any image URL pointing into
   `/public` to a root-absolute `/images/...` URL, which then flows through the
   `next/image` pipeline (`rehypeImageSize` injects intrinsic width/height for
   zero layout shift).

So you never have to hand-edit the path — paste and keep writing.

### Draft backlog (dev only)

Visit `/<locale>/drafts` (e.g. `http://localhost:3000/ko/drafts`) to see all
posts with `draft: true`. This route returns 404 in production builds.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
