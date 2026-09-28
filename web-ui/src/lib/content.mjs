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

const CATEGORY_README = /^tools\/([^/]+)\/README\.md$/;
const TOOL_README = /^tools\/([^/]+)\/([^/]+)\/README\.md$/;
const PLATFORM_README = /^tools\/([^/]+)\/([^/]+)\/docs\/([^/]+)\/README\.md$/;
const PLATFORM_RANK = [...PLATFORMS.keys()];

/** The h2 of a category README that lists its tools; the site replaces it with a generated list. */
export const TOOLS_SECTION = "Tools";
// One bullet per tool: a link to the tool directory, an em dash, then prose without links or HTML.
const TOOL_BULLET = /^- \[[^\]]+\]\(\.\/([^/()\s]+)\/\) — (\S.*)$/;
const NOT_PROSE = /\]\(|</;

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// Invalid documents have no order; they sort last so a failing build still gets a total order.
const byOrder = (a, b) => (a.meta.order ?? Infinity) - (b.meta.order ?? Infinity) || byName(a.slug, b.slug);

/** File-tree order: files before subdirectories at each level, then by name. */
export function treeOrder(a, b) {
  const left = a.split("/");
  const right = b.split("/");
  for (let i = 0; i < Math.min(left.length, right.length); i += 1) {
    const leftIsFile = i === left.length - 1;
    const rightIsFile = i === right.length - 1;
    if (leftIsFile !== rightIsFile) return leftIsFile ? -1 : 1;
    if (left[i] !== right[i]) return byName(left[i], right[i]);
  }
  return left.length - right.length;
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
 * @property {Category} category
 * @property {string} slug
 * @property {string} source
 * @property {string} body
 * @property {{ name: string, title: string, description: string, order: number, images: string[], upstream?: string, keywords: string[] }} meta
 *   `images` are pull references without a tag, GHCR first, in display order
 * @property {Platform[]} platforms in platform order
 *
 * @typedef {object} Category
 * @property {string} slug
 * @property {string | null} source repository path of the category README (null only in a failed discovery)
 * @property {string} body
 * @property {{ name: string, title: string, description: string, order: number }} meta
 * @property {Tool[]} tools in `order` order
 *
 * @typedef {object} Catalog
 * @property {{ source: string, body: string }} readme
 * @property {Category[]} categories in `order` order
 * @property {Tool[]} tools in catalog order: by category, then by tool `order`
 * @property {string[]} files the tracked inventory the catalog was built from
 */

/**
 * Build the catalog from tracked repository paths. The inventory and reader
 * are arguments so tests can feed a fixture tree. Every problem is collected,
 * never thrown: the caller renders the documents too and reports everything
 * at once. The catalog is only fit for publishing when `problems` is empty.
 * @param {{ files: string[], read: (file: string) => string }} input
 * @returns {{ catalog: Catalog, problems: string[] }}
 */
export function discover({ files, read }) {
  const problems = [];
  const report = (file, list) => problems.push(...list.map((problem) => `${file}: ${problem}`));
  const load = (file, kind, slug) => {
    const { data, body, error } = splitFrontmatter(read(file));
    if (error) {
      report(file, [error]);
      return { source: file, body, meta: kind === "category" ? {} : { keywords: [] } };
    }
    const { meta, problems: found } = validateFrontmatter(data, kind, { slug });
    report(file, found);
    return { source: file, body, meta };
  };

  const categories = new Map();
  for (const file of files) {
    const match = file.match(CATEGORY_README);
    if (match) categories.set(match[1], { slug: match[1], ...load(file, "category", match[1]), tools: [] });
  }

  const tools = new Map();
  for (const file of files) {
    const match = file.match(TOOL_README);
    if (!match) continue;
    const [, categorySlug, slug] = match;
    let category = categories.get(categorySlug);
    if (!category) {
      report(file, [`tools need a category README at tools/${categorySlug}/README.md`]);
      category = { slug: categorySlug, source: null, body: "", meta: {}, tools: [] };
      categories.set(categorySlug, category);
    }
    const tool = { category, slug, ...load(file, "tool", slug), platforms: [] };
    category.tools.push(tool);
    tools.set(`${categorySlug}/${slug}`, tool);
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

  const ordered = [...categories.values()].sort(byOrder);
  for (const category of ordered) {
    category.tools.sort(byOrder);
    for (const tool of category.tools) tool.platforms.sort((a, b) => PLATFORM_RANK.indexOf(a.slug) - PLATFORM_RANK.indexOf(b.slug));
  }
  const toolList = ordered.flatMap((category) => category.tools);
  const platforms = toolList.flatMap((tool) => tool.platforms);

  for (const category of ordered) {
    if (!category.source) continue;
    const ordered = category.tools.every((tool) => tool.meta.order !== undefined);
    report(category.source, toolsSectionProblems(category.body, category.tools.map((tool) => tool.slug), ordered));
  }

  // Case-insensitive, on the trimmed value: the same rule as check-repo.py.
  const unique = (label, list, value, scope) => {
    const seen = new Map();
    for (const item of list) {
      const raw = value(item);
      if (raw === undefined) continue;
      const key = String(raw).toLowerCase();
      if (seen.has(key)) report(item.source, [`${label} duplicates ${seen.get(key)}; make it unique ${scope}`]);
      else seen.set(key, item.source);
    }
  };
  unique("description", [...ordered.filter((category) => category.source), ...toolList, ...platforms], (doc) => doc.meta.description, "across all documents");
  unique("order", ordered.filter((category) => category.source), (category) => category.meta.order, "among categories");
  for (const category of ordered) unique("order", category.tools, (tool) => tool.meta.order, `within tools/${category.slug}/`);
  for (const tool of toolList) unique("usecase", tool.platforms, (platform) => platform.meta.usecase, "within the tool");

  return {
    catalog: { readme: { source: "README.md", body: readme.body }, categories: ordered, tools: toolList, files },
    problems,
  };
}

/**
 * Check a category README's `## Tools` section: only bullets and blank lines,
 * each bullet linking one tool, every tool exactly once and in `order`.
 * Without a valid order on every tool (`ordered` false), only the set of links
 * is checked, so one bad `order` is not reported twice.
 * `.github/scripts/check-repo.py` applies the same line-based rule.
 * @param {string} body category README without frontmatter
 * @param {string[]} expected the category's tool slugs in order
 */
export function toolsSectionProblems(body, expected, ordered = true) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === `## ${TOOLS_SECTION}`);
  if (start === -1) return [`needs a "## ${TOOLS_SECTION}" section listing its tools`];
  const problems = [];
  const linked = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2} /.test(line)) break;
    if (!line.trim()) continue;
    const match = line.match(TOOL_BULLET);
    if (!match || NOT_PROSE.test(match[2])) {
      problems.push(`## ${TOOLS_SECTION}: "${line.trim()}" is not a "- [Title](./<tool>/) — description" bullet with prose only`);
    } else {
      linked.push(match[1]);
    }
  }
  const sequence = (list) => (ordered ? list : [...list].sort(byName)).join(" ");
  if (sequence(linked) !== sequence(expected)) {
    problems.push(`## ${TOOLS_SECTION} must link each tool once, in order: expected ${expected.join(", ") || "none"}, got ${linked.join(", ") || "none"}`);
  }
  return problems;
}

/** Throw every collected problem at once, each line naming its file. */
export function assertValid(problems) {
  if (problems.length) throw new ContentError(`Invalid documents:\n  - ${problems.join("\n  - ")}`);
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
