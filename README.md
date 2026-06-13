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

## Operations

### Analytics & Speed Insights

`app/[locale]/layout.tsx` mounts `<Analytics />` (`@vercel/analytics/next`) and
`<SpeedInsights />` (`@vercel/speed-insights/next`) inside `<body>`. Both are
cookieless and are **no-ops outside Vercel** — they detect the absence of the
Vercel runtime and inject nothing locally or in CI, so `npm run dev` /
`npm run build` are unaffected. The `/next` entrypoints are the App Router
variants: they subscribe to `next/navigation` and report client-side route
changes automatically, so no manual `route`/`pathname` wiring is needed.

### Performance budgets (Lighthouse CI)

`.github/workflows/lighthouse.yml` builds the app, starts it
(`npm run start`), and runs `@lhci/cli autorun` against the home page (`/ko`)
and a representative post (`/ko/blog/hello-world`). Budgets live in
`lighthouserc.json`:

- **`error` (deterministic):** `cumulative-layout-shift` ≤ 0.1,
  `unused-javascript` ≤ 200 KB, `resource-summary:script:size` ≤ 800 KB
  (the article page's eager first-load is ~676 KB raw — this is a sane ceiling
  with headroom, not a trap).
- **`warn` (timing, flaky on cold CI runners):** `largest-contentful-paint`,
  `total-blocking-time`, `total-byte-weight`.

Results upload to LHCI's temporary public storage — **no secret required**.

### Mermaid on Vercel (Chromium provisioning)

Build-time Mermaid rendering (`lib/rehype-mermaid-config.ts`) needs a headless
Chromium to rasterize diagrams to inline SVG. It only launches a browser when a
post actually contains a ` ```mermaid ` block **and** the diagram isn't already
in `.mermaid-cache/` — currently no post has a diagram, so no browser launches.

Vercel build images don't ship Chromium, so `vercel.json` overrides the build
command:

```json
"buildCommand": "npx playwright install chromium && next build"
```

This affects **only the Vercel build**. Local `npm run build` and the Lighthouse
CI `npm ci` deliberately skip the browser download to stay fast — the binary is
only needed once a post ships a diagram. `next.config.ts` keeps
`mermaid-isomorphic`/`playwright` in `serverExternalPackages` so they load via
native `require` instead of being bundled.

**Shallow-clone note (already handled in code):** Vercel clones at depth 1, so
`git log` finds no history and per-post git dates resolve to `null`
(`lib/git-dates.ts`); callers fall back to the frontmatter `date`. No build
config is needed for this — it's intentional.

### Rendering strategy: full SSG (when to revisit)

Every route is statically generated at build time (full SSG) — no per-request
rendering, no `revalidate`. This is correct while the blog is small: builds are
fast and every page is a cacheable static asset.

Revisit ISR **only when one of these thresholds is crossed:**

- **Post count** climbs into the low hundreds and full-rebuild time becomes
  annoying (rough rule of thumb: build > ~2 min, or you're rebuilding the whole
  site for a one-post typo fix).
- **Build minutes** on Vercel start mattering for cost/latency.
- A future feature needs **fresher-than-deploy** data (e.g. view counts, pulled
  comments) baked into the page.

Migration path (do **not** implement preemptively): add a per-post
`export const revalidate = <seconds>` to the post route and let stale-while-
revalidate regenerate pages on demand instead of all-at-once at build. This is a
small, localized change — defer it until a threshold above actually bites.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
