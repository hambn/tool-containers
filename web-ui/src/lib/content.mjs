import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { repoRoot, trackedFiles } from "./config.mjs";

/**
 * Content discovery: turns the tracked repository documents into a typed
 * catalog. Everything the site publishes starts here, so this module is the
 * only place that knows the `tools/<category>/<tool>/docs/<platform>/` layout.
 */

/** A content problem the author must fix; the build prints it verbatim. */
export class ContentError extends Error {
  name = "ContentError";
}

const TOOL_README = /^tools\/([^/]+)\/([^/]+)\/README\.md$/;
const PLATFORM_README = /^tools\/([^/]+)\/([^/]+)\/docs\/([^/]+)\/README\.md$/;

/**
 * Deployment recipes read best from simplest to most involved; any platform
 * not listed here sorts after these, alphabetically, so new ones need no edit.
 */
const PLATFORM_ORDER = ["docker", "docker-compose", "podman", "kubernetes", "helm"];

const REQUIRED = {
  tool: ["name", "description"],
  platform: ["name", "description", "usecase"],
};
const OPTIONAL_STRINGS = ["upstream", "image", "usecase"];

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * Split a document into its YAML frontmatter and markdown body. A document
 * without frontmatter yields `{}` so the caller decides whether that is legal.
 * @param {string} source
 * @param {string} file repository path, used in error messages
 * @returns {{ data: Record<string, unknown>, body: string }}
 */
export function parseFrontmatter(source, file) {
  const match = source.match(FRONTMATTER);
  if (!match) return { data: {}, body: source };
  let data;
  try {
    data = parseYaml(match[1]) ?? {};
  } catch (error) {
    throw new ContentError(`${file}: invalid YAML frontmatter: ${error.message}`);
  }
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new ContentError(`${file}: frontmatter must be a YAML mapping`);
  }
  return { data, body: source.slice(match[0].length) };
}

/**
 * Validate frontmatter against the schema for its document kind and return
 * normalised metadata. Problems are collected rather than thrown one at a
 * time so a single build reports every file that needs fixing.
 * @param {Record<string, unknown>} data
 * @param {"tool" | "platform"} kind
 * @param {string} file
 * @param {string[]} problems accumulator
 */
export function validateFrontmatter(data, kind, file, problems) {
  for (const key of REQUIRED[kind]) {
    if (typeof data[key] !== "string" || !data[key].trim()) {
      problems.push(`${file}: frontmatter is missing required key "${key}"`);
    }
  }
  for (const key of OPTIONAL_STRINGS) {
    if (data[key] !== undefined && typeof data[key] !== "string") {
      problems.push(`${file}: frontmatter key "${key}" must be a string`);
    }
  }
  const keywords = data.keywords ?? [];
  if (!Array.isArray(keywords) || keywords.some((word) => typeof word !== "string")) {
    problems.push(`${file}: frontmatter key "keywords" must be a list of strings`);
  }
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  return {
    name: text(data.name),
    description: text(data.description).replace(/\s+/g, " "),
    usecase: text(data.usecase),
    upstream: text(data.upstream),
    image: text(data.image),
    keywords: Array.isArray(keywords) ? keywords.map(String) : [],
  };
}

const byName = (a, b) => a.localeCompare(b);
const platformRank = (slug) => {
  const index = PLATFORM_ORDER.indexOf(slug);
  return index === -1 ? PLATFORM_ORDER.length : index;
};

/**
 * Order paths the way a file tree lists them: files before subdirectories at
 * each level, then by name. Inline files on a recipe page follow this order.
 */
function treeOrder(a, b) {
  const left = a.split("/");
  const right = b.split("/");
  for (let i = 0; ; i += 1) {
    const leftIsFile = i === left.length - 1;
    const rightIsFile = i === right.length - 1;
    if (leftIsFile !== rightIsFile) return leftIsFile ? -1 : 1;
    if (left[i] !== right[i]) return byName(left[i], right[i]);
  }
}

/**
 * @typedef {object} Platform
 * @property {string} slug  directory name under `docs/`
 * @property {string} source repository path of the README
 * @property {string} body   markdown without frontmatter
 * @property {ReturnType<typeof validateFrontmatter>} meta
 * @property {string[]} files sibling file paths, relative to the recipe directory
 *
 * @typedef {object} Tool
 * @property {string} category
 * @property {string} slug
 * @property {string} source
 * @property {string} body
 * @property {ReturnType<typeof validateFrontmatter>} meta
 * @property {Platform[]} platforms
 */

/**
 * Build the catalog from a list of repository paths. Taking the file list and
 * reader as arguments keeps discovery pure, so tests can feed it a fixture
 * tree instead of the real repository.
 * @param {{ files?: string[], read?: (file: string) => string }} [input]
 * @returns {{ readme: { source: string, body: string }, categories: { name: string, tools: Tool[] }[] }}
 */
export function discover({
  files = trackedFiles(),
  read = (file) => fs.readFileSync(path.join(repoRoot, file), "utf8"),
} = {}) {
  const problems = [];
  const tools = new Map();

  const load = (file, kind) => {
    const { data, body } = parseFrontmatter(read(file), file);
    return { source: file, body, meta: validateFrontmatter(data, kind, file, problems) };
  };

  for (const file of files) {
    const match = file.match(TOOL_README);
    if (!match) continue;
    const [, category, slug] = match;
    tools.set(`${category}/${slug}`, { category, slug, ...load(file, "tool"), platforms: [] });
  }

  for (const file of files) {
    const match = file.match(PLATFORM_README);
    if (!match) continue;
    const [, category, toolSlug, slug] = match;
    const tool = tools.get(`${category}/${toolSlug}`);
    // A recipe without its tool README has no page to hang from.
    if (!tool) continue;
    const dir = path.posix.dirname(file);
    const siblings = files
      .filter((other) => other.startsWith(`${dir}/`) && other !== file)
      .map((other) => other.slice(dir.length + 1))
      .sort(treeOrder);
    tool.platforms.push({ slug, ...load(file, "platform"), files: siblings });
  }

  if (problems.length) {
    throw new ContentError(`Invalid document frontmatter:\n  - ${problems.join("\n  - ")}`);
  }

  const categories = new Map();
  for (const tool of [...tools.values()].sort((a, b) => byName(a.slug, b.slug))) {
    tool.platforms.sort((a, b) => platformRank(a.slug) - platformRank(b.slug) || byName(a.slug, b.slug));
    if (!categories.has(tool.category)) categories.set(tool.category, []);
    categories.get(tool.category).push(tool);
  }

  const readme = files.includes("README.md") ? parseFrontmatter(read("README.md"), "README.md").body : "";
  return {
    readme: { source: "README.md", body: readme },
    categories: [...categories.entries()]
      .sort(([a], [b]) => byName(a, b))
      .map(([name, list]) => ({ name, tools: list })),
  };
}

const MAX_INLINE_BYTES = 128 * 1024;
const utf8 = new TextDecoder("utf-8", { fatal: true });

/**
 * Read the recipe files that can be shown inline. Binary, oversized, and
 * non-UTF-8 files stay on GitHub only; the page still links to them.
 * @param {string} dir repository path of the recipe directory
 * @param {string[]} names paths relative to `dir`
 */
export function readInlineFiles(dir, names, root = repoRoot) {
  const files = [];
  for (const name of names) {
    const absolute = path.join(root, dir, name);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.statSync(absolute);
    if (!stat.isFile() || stat.size > MAX_INLINE_BYTES) continue;
    const buffer = fs.readFileSync(absolute);
    if (buffer.includes(0)) continue;
    try {
      files.push({ name, text: utf8.decode(buffer) });
    } catch {
      // Not UTF-8 text.
    }
  }
  return files;
}
