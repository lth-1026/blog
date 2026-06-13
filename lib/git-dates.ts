import { execFileSync } from "node:child_process";

/**
 * Returns a file's last git commit date as an ISO 8601 string, or `null` when
 * unavailable. Used at build time to derive an accurate `dateModified` without
 * authors having to hand-maintain an `updated` frontmatter field.
 *
 * Fails gracefully (returns `null`) when:
 *   - git is not installed / not a git repo
 *   - the file has no commit history yet (e.g. a brand-new untracked post)
 *   - the output is empty for any other reason
 *
 * IMPORTANT: Vercel's default build uses a *shallow* clone (depth 1), so the
 * per-file commit history may be missing on CI even though it exists locally.
 * In that case `git log` prints nothing and we return `null` — callers must
 * fall back to the frontmatter `date`. Never let this crash the build.
 */
export function getGitLastModified(filePath: string): string | null {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", filePath],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}
