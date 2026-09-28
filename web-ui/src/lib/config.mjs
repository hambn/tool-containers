import path from "node:path";
import { fileURLToPath } from "node:url";

export const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const repoRoot = path.resolve(uiRoot, "..");

export const SITE_NAME = "tool-containers";
const DEFAULT_SITE_URL = "https://tool-containers.hgh.dev";
const DEFAULT_REPOSITORY = "hambn/tool-containers";

/** A deployment setting the operator must fix; the build prints it verbatim. */
export class ConfigError extends Error {
  name = "ConfigError";
}

function parseSiteUrl(name, raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ConfigError(`${name} must be an absolute http(s) URL, got ${JSON.stringify(raw)}`);
  }
  if (!/^https?:$/.test(url.protocol) || url.search || url.hash || url.username || url.password) {
    throw new ConfigError(`${name} must be a plain http(s) URL without query, fragment, or credentials, got ${JSON.stringify(raw)}`);
  }
  return url.href.replace(/\/+$/, "");
}

function parseBasePath(raw) {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return "";
  const parts = trimmed.split("/");
  if (parts.some((part) => !/^[\w.~-]+$/.test(part) || /^\.+$/.test(part))) {
    throw new ConfigError(`BASE_PATH must be a plain URL path such as /tool-containers, got ${JSON.stringify(raw)}`);
  }
  return `/${trimmed}`;
}

function parseRepository(raw) {
  const value = raw.trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(value)) {
    throw new ConfigError(`GITHUB_REPOSITORY must look like owner/repo, got ${JSON.stringify(raw)}`);
  }
  return value;
}

/**
 * Deployment configuration, resolved once from the environment and passed
 * explicitly. `siteUrl` is the public address for canonical links, structured
 * data, the sitemap and robots.txt; `basePath` prefixes browser-navigable
 * links. They are independent so a custom domain and a project subpath both
 * work. The repository comes from `GITHUB_REPOSITORY` (set by Actions) rather
 * than `git remote`, so every clone builds the same artifact.
 */
export function resolveConfig(env = process.env) {
  const siteUrl = parseSiteUrl("SITE_URL", env.SITE_URL ?? env.SITE_ORIGIN ?? DEFAULT_SITE_URL);
  const basePath = parseBasePath(env.BASE_PATH ?? "");
  const server = parseSiteUrl("GITHUB_SERVER_URL", env.GITHUB_SERVER_URL || "https://github.com");
  const repoUrl = `${server}/${parseRepository(env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY)}`;

  return {
    siteUrl,
    basePath,
    repoUrl,
    /** Absolute public URL for a site-root-relative route. */
    canonical: (route) => `${siteUrl}${route}`,
    /** Browser-navigable href for a site-root-relative route. */
    href: (route) => `${basePath}${route}`,
    blobUrl: (repoPath) => `${repoUrl}/blob/HEAD/${repoPath}`,
    treeUrl: (repoPath) => `${repoUrl}/tree/HEAD/${repoPath}`,
    rawUrl: (repoPath) => `${repoUrl}/raw/HEAD/${repoPath}`,
    /** GitHub's editor needs a branch name, not HEAD; documents are edited on main. */
    editUrl: (repoPath) => `${repoUrl}/edit/main/${repoPath}`,
  };
}
