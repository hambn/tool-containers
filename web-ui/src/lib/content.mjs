import fs from "node:fs";
import path from "node:path";
import { PLATFORMS, splitFrontmatter, validateFrontmatter } from "./frontmatter.mjs";

/**
 * Content discovery: turns the tracked repository documents into a typed
 * catalog. This is the only module that knows the
 * `tools/<category>/<tool>/docs/<platform>/` layout.
 */

/** A content problem the author must fix; the build prints it verbatim. */
export class ContentError extends Error {
  name = "ContentError";
}

const TOOL_README = /^tools\/([^/]+)\/([^/]+)\/README\.md$/;
const PLATFORM_README = /^tools\/([^/]+)\/([^/]+)\/docs\/([^/]+)\/README\.md$/;
const PLATFORM_RANK = [...PLATFORMS.keys()];

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** File-tree order: files before subdirectories at each level, then by name. */
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
 * @property {string} slug   directory name under `docs/`
 * @property {string} source repository path of the README
 * @property {string} body   markdown without frontmatter
 * @property {{ name: string, description: string, usecase: string, keywords: string[] }} meta
 * @property {string[]} files sibling recipe files, relative to the README's directory
 *
 * @typedef {object} Tool
 * @property {string} category
 * @property {string} slug
 * @property {string} source
 * @property {string} body
 * @property {{ name: string, title: string, description: string, image: string, upstream?: string, keywords: string[] }} meta
 * @property {Platform[]} platforms
 *
 * @typedef {object} Catalog
 * @property {{ source: string, body: string }} readme
 * @property {{ slug: string, tools: Tool[] }[]} categories only categories that contain tools
 * @property {Tool[]} tools in catalog order
 * @property {string[]} files the tracked inventory the catalog was built from
 */

/**
 * Build the catalog from tracked repository paths. The inventory and reader
 * are arguments so tests can feed a fixture tree.
 * @param {{ files: string[], read: (file: string) => string }} input
 * @returns {Catalog}
 */
export function discover({ files, read }) {
  const problems = [];
  const report = (file, list) => problems.push(...list.map((problem) => `${file}: ${problem}`));
  const load = (file, kind, slug) => {
    const { data, body, error } = splitFrontmatter(read(file));
    if (error) {
      report(file, [error]);
      return { source: file, body, meta: { keywords: [] } };
    }
    const { meta, problems: found } = validateFrontmatter(data, kind, { slug });
    report(file, found);
    return { source: file, body, meta };
  };

  const tools = new Map();
  for (const file of files) {
    const match = file.match(TOOL_README);
    if (!match) continue;
    const [, category, slug] = match;
    tools.set(`${category}/${slug}`, { category, slug, ...load(file, "tool", slug), platforms: [] });
  }

  for (const file of files) {
    const match = file.match(PLATFORM_README);
    if (!match) continue;
    const [, category, toolSlug, slug] = match;
    const tool = tools.get(`${category}/${toolSlug}`);
    if (!tool) {
      report(file, [`platform docs need a tool README at tools/${category}/${toolSlug}/README.md`]);
      continue;
    }
    if (!PLATFORMS.has(slug)) {
      report(file, [`docs/${slug}/ is not a known platform; expected one of ${PLATFORM_RANK.join(", ")}`]);
      continue;
    }
    const dir = path.posix.dirname(file);
    const siblings = files
      .filter((other) => other.startsWith(`${dir}/`) && other !== file)
      .map((other) => other.slice(dir.length + 1))
      .sort(treeOrder);
    tool.platforms.push({ slug, ...load(file, "platform", slug), files: siblings });
  }

  let readme = { data: null, body: "" };
  if (files.includes("README.md")) {
    readme = splitFrontmatter(read("README.md"));
    if (readme.data !== null) report("README.md", ["the root README must not have frontmatter"]);
  } else {
    problems.push("README.md: the root README is not tracked");
  }

  const ordered = [...tools.values()].sort((a, b) => byName(a.category, b.category) || byName(a.slug, b.slug));
  const unique = (label, list, value) => {
    const seen = new Map();
    for (const item of list) {
      const key = value(item)?.toLowerCase();
      if (!key) continue;
      if (seen.has(key)) report(item.source, [`${label} duplicates ${seen.get(key)}`]);
      else seen.set(key, item.source);
    }
  };
  unique("description", ordered, (tool) => tool.meta.description);
  unique("description", ordered.flatMap((tool) => tool.platforms), (platform) => platform.meta.description);
  for (const tool of ordered) unique("usecase", tool.platforms, (platform) => platform.meta.usecase);

  if (problems.length) throw new ContentError(`Invalid documents:\n  - ${problems.join("\n  - ")}`);

  const categories = new Map();
  for (const tool of ordered) {
    tool.platforms.sort((a, b) => PLATFORM_RANK.indexOf(a.slug) - PLATFORM_RANK.indexOf(b.slug));
    if (!categories.has(tool.category)) categories.set(tool.category, []);
    categories.get(tool.category).push(tool);
  }
  return {
    readme: { source: "README.md", body: readme.body },
    categories: [...categories].map(([slug, list]) => ({ slug, tools: list })),
    tools: ordered,
    files,
  };
}

const MAX_INLINE_BYTES = 128 * 1024;
const utf8 = new TextDecoder("utf-8", { fatal: true });

/**
 * Read the recipe files that can be shown inline. Binary, oversized, and
 * non-UTF-8 files stay on GitHub only; the page still links to them.
 * @param {string} root repository root
 * @param {string} dir repository path of the recipe directory
 * @param {string[]} names paths relative to `dir`
 */
export function readInlineFiles(root, dir, names) {
  const files = [];
  for (const name of names) {
    const absolute = path.join(root, dir, name);
    const stat = fs.statSync(absolute, { throwIfNoEntry: false });
    if (!stat?.isFile() || stat.size > MAX_INLINE_BYTES) continue;
    const buffer = fs.readFileSync(absolute);
    if (buffer.includes(0)) continue;
    try {
      files.push({ name, text: utf8.decode(buffer) });
    } catch {
      // Not UTF-8 text: leave it on GitHub.
    }
  }
  return files;
}
