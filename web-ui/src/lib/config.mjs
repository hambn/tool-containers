import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_SITE_URL = "https://hambn.github.io/tool-containers";
const DEFAULT_REPO = { owner: "hambn", repo: "tool-containers" };

export const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const repoRoot = path.resolve(uiRoot, "..");

/** `owner/repo` from the Git remote, so the build never hardcodes a fork's URLs. */
function detectRepository() {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const parts = remote.replace(/\.git$/, "").split(/[/:]/);
    const [owner, repo] = [parts.at(-2), parts.at(-1)];
    return owner && repo ? { owner, repo } : DEFAULT_REPO;
  } catch {
    return DEFAULT_REPO;
  }
}

/**
 * Deployment configuration, resolved once and threaded through the build as an
 * explicit argument. `siteUrl` is the public address used by canonical links,
 * structured data, the sitemap and robots.txt; `basePath` prefixes internal
 * links and local assets. The two are independent: a site served from a
 * subpath sets both, a custom domain sets only `siteUrl`.
 */
export function resolveConfig(env = process.env) {
  const siteUrl = (env.SITE_URL ?? env.SITE_ORIGIN ?? DEFAULT_SITE_URL).trim().replace(/\/+$/, "");
  const trimmed = (env.BASE_PATH ?? "").trim().replace(/^\/+|\/+$/g, "");
  const basePath = trimmed ? `/${trimmed}` : "";
  const { owner, repo } = detectRepository();
  const repoUrl = `https://github.com/${owner}/${repo}`;

  return {
    siteUrl,
    basePath,
    owner,
    repo,
    repoUrl,
    /** Absolute public URL for a site-root-relative route. */
    canonical: (route) => `${siteUrl}${route}`,
    /** Browser-navigable href for a site-root-relative route. */
    href: (route) => `${basePath}${route}`,
    blobUrl: (repoPath) => `${repoUrl}/blob/HEAD/${repoPath}`,
    treeUrl: (repoPath) => `${repoUrl}/tree/HEAD/${repoPath}`,
  };
}

/** Commit date of the last change to a tracked file, for honest sitemap lastmod. */
export function lastModified(repoRelPath) {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cI", "--", repoRelPath], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : "";
  } catch {
    return "";
  }
}
