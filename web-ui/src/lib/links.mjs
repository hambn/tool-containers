import path from "node:path";

const SCHEME = /^[a-z][a-z\d+.-]*:/i;
// Anything else (javascript:, data:) would run or embed content on the site.
const SAFE_SCHEME = /^(?:https?|mailto):/i;

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Split `path?query#fragment` without decoding; missing parts are "". */
function splitTarget(target) {
  const hashAt = target.indexOf("#");
  const beforeHash = hashAt === -1 ? target : target.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : target.slice(hashAt);
  const queryAt = beforeHash.indexOf("?");
  return {
    pathname: queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt),
    query: queryAt === -1 ? "" : beforeHash.slice(queryAt),
    hash,
  };
}

/**
 * Link resolution for documents written against GitHub's rendering. A
 * repository-relative link becomes the site route of the document it names,
 * an in-page anchor for a recipe file shown inline, or a GitHub URL for
 * anything else in the repository. Absolute links into the public site become
 * internal links so they follow `BASE_PATH`.
 *
 * @param {{ config: ReturnType<import("./config.mjs").resolveConfig>, routeBySource: Map<string, string>, files: string[] }} site
 */
export function createLinkResolver({ config, routeBySource, files }) {
  const tracked = new Set(files);
  const directories = new Set([""]);
  for (const file of files) {
    for (let dir = path.posix.dirname(file); dir !== "." && !directories.has(dir); dir = path.posix.dirname(dir)) {
      directories.add(dir);
    }
  }
  const sitePrefix = `${config.siteUrl}/`;

  function absolute(target) {
    let url;
    try {
      url = new URL(target);
    } catch {
      return target;
    }
    if (!/^https?:$/.test(url.protocol)) return target;
    if (url.href !== config.siteUrl && !url.href.startsWith(sitePrefix)) return target;
    return config.href(`/${url.href.slice(sitePrefix.length)}`.replace(/^\/\/?/, "/"));
  }

  /**
   * @param {string} target the href as written in the document
   * @param {{ source: string, anchors?: Map<string, string>, image?: boolean }} context
   *   `source` is the document's repository path; `anchors` maps repository
   *   paths of inline recipe files (and their directories) to in-page ids
   * @returns {string} the href to publish
   * @throws {Error} when a relative link climbs out of the repository or uses an unsafe scheme
   */
  return function resolve(target, { source, anchors = new Map(), image = false }) {
    if (!target || target.startsWith("#")) return target;
    if (SCHEME.test(target) && !SAFE_SCHEME.test(target)) throw new Error(`link "${target}" uses an unsupported scheme`);
    if (target.startsWith("//") || SCHEME.test(target)) return absolute(target);

    const { pathname, query, hash } = splitTarget(target);
    const decoded = safeDecode(pathname);
    const joined = decoded.startsWith("/") ? decoded.slice(1) : path.posix.join(path.posix.dirname(source), decoded);
    const normalized = path.posix.normalize(joined || ".");
    if (normalized === ".." || normalized.startsWith("../")) {
      throw new Error(`link "${target}" points outside the repository`);
    }
    const repoPath = normalized === "." ? "" : normalized.replace(/\/$/, "");
    const encoded = encodeURI(repoPath);

    if (image) return `${config.rawUrl(encoded)}${query}`;
    if (!query) {
      const route = routeBySource.get(repoPath) ?? routeBySource.get(repoPath ? `${repoPath}/README.md` : "README.md");
      if (route) return `${config.href(route)}${hash}`;
      // A fragment points into the file itself (for example a line anchor), which only GitHub can show.
      if (!hash && anchors.has(repoPath)) return `#${anchors.get(repoPath)}`;
    }
    const isDirectory = directories.has(repoPath) || (!tracked.has(repoPath) && decoded.endsWith("/"));
    return `${isDirectory ? config.treeUrl(encoded) : config.blobUrl(encoded)}${query}${hash}`;
  };
}
