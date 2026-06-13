#!/usr/bin/env node
// Scaffolds a new MDX post at content/posts/<slug>.<locale>.mdx with prefilled
// frontmatter. Usage: npm run new "글 제목" [--locale ko|en] [--slug my-slug]
import fs from "node:fs/promises";
import path from "node:path";

const LOCALES = ["ko", "en"];
const DEFAULT_LOCALE = "ko";
const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

// ascii kebab-case: lowercase, drop non-ascii, collapse runs of non-alphanumeric
// into a single dash, trim leading/trailing dashes. Korean titles → "".
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\x00-\x7f]/g, "") // strip non-ascii (e.g. Korean)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const title = positional[0];

  if (!title || typeof title !== "string") {
    fail('Title is required.\n  Usage: npm run new "글 제목" [--locale ko|en] [--slug my-slug]');
  }

  const locale = flags.locale ?? DEFAULT_LOCALE;
  if (!LOCALES.includes(locale)) {
    fail(`Invalid --locale "${locale}". Must be one of: ${LOCALES.join(", ")}`);
  }

  let slug = typeof flags.slug === "string" ? slugify(flags.slug) : slugify(title);
  if (!slug) {
    fail(
      `Could not derive a slug from "${title}".\n` +
        "  Non-ascii titles (e.g. Korean) produce broken URLs.\n" +
        '  Pass an explicit ascii slug: npm run new "글 제목" --slug my-slug',
    );
  }

  const filename = `${slug}.${locale}.mdx`;
  const filePath = path.join(POSTS_DIR, filename);

  // Refuse to clobber.
  try {
    await fs.access(filePath);
    fail(`File already exists: content/posts/${filename}`);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    'description: ""',
    `date: ${todayISO()}`,
    "tags: []",
    "draft: true",
    "---",
    "",
    locale === "ko" ? "여기에 내용을 작성하세요." : "Write your content here.",
    "",
  ].join("\n");

  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.writeFile(filePath, frontmatter, "utf-8");

  console.log(`✔ Created content/posts/${filename}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
