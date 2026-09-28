import { parse as parseYaml } from "yaml";

/**
 * The frontmatter contract for repository documents. Tool and platform
 * READMEs carry the metadata the site publishes; anything outside this schema
 * fails the build so a typo can never silently drop a title or description.
 */

/** Platform directories and their fixed display names, in reading order. */
export const PLATFORMS = new Map([
  ["docker", "Docker"],
  ["docker-compose", "Docker Compose"],
  ["podman", "Podman"],
  ["kubernetes", "Kubernetes"],
  ["helm", "Helm"],
]);

export const IMAGE_PREFIX = "ghcr.io/hambn/";
export const DESCRIPTION_LENGTH = { min: 110, max: 160 };
const USECASE_MAX = 80;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
// Descriptions end up in meta tags and JSON-LD verbatim, so markup would leak.
const MARKUP = /[`<>]|\*\*|__|\[[^\]]*\]\(/;

function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "list";
  if (typeof value === "object") return "mapping";
  return typeof value;
}

/**
 * Split a document into YAML frontmatter and markdown body. A document without
 * frontmatter yields `data: null` so the caller decides whether that is legal.
 * @returns {{ data: Record<string, unknown> | null, body: string, error?: string }}
 */
export function splitFrontmatter(source) {
  const match = source.match(FRONTMATTER);
  if (!match) return { data: null, body: source };
  const body = source.slice(match[0].length);
  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    return { data: {}, body, error: `invalid YAML frontmatter: ${error.message.split("\n")[0]}` };
  }
  if (typeName(data) !== "mapping") {
    return { data: {}, body, error: `frontmatter must be a YAML mapping, got ${typeName(data)}` };
  }
  return { data, body };
}

const text = {
  check(value) {
    if (typeof value !== "string") return `expected string, got ${typeName(value)}`;
    if (!value.trim()) return "must not be empty";
    return "";
  },
  normalize: (value) => value.trim().replace(/\s+/g, " "),
};

const plain = (extra) => ({
  check(value, context) {
    const problem = text.check(value);
    if (problem) return problem;
    const normalized = text.normalize(value);
    if (MARKUP.test(normalized)) return "must be plain text without Markdown or HTML";
    return extra?.(normalized, context) ?? "";
  },
  normalize: text.normalize,
});

const keywordList = (min, max) => ({
  check(value) {
    if (!Array.isArray(value)) return `expected list, got ${typeName(value)}`;
    const bad = value.find((item) => typeof item !== "string" || !item.trim());
    if (bad !== undefined) return `items must be non-empty strings, got ${typeName(bad) === "string" ? "an empty string" : typeName(bad)}`;
    if (value.length < min || value.length > max) return `must list ${min}-${max} keywords, got ${value.length}`;
    const seen = new Set();
    for (const item of value) {
      const key = text.normalize(item).toLowerCase();
      if (seen.has(key)) return `lists "${item}" more than once`;
      seen.add(key);
    }
    return "";
  },
  normalize: (value) => value.map(text.normalize),
});

const description = plain((value) => {
  const { min, max } = DESCRIPTION_LENGTH;
  return value.length < min || value.length > max ? `must be ${min}-${max} characters, got ${value.length}` : "";
});

const SCHEMAS = {
  tool: {
    name: {
      required: true,
      ...plain((value, { slug }) => (value === slug ? "" : `must equal the directory name "${slug}", got "${value}"`)),
    },
    title: { required: true, ...plain() },
    description: { required: true, ...description },
    image: {
      required: true,
      ...plain((value, { slug }) => (value === `${IMAGE_PREFIX}${slug}` ? "" : `must be "${IMAGE_PREFIX}${slug}", got "${value}"`)),
    },
    upstream: {
      required: false,
      ...plain((value) => {
        try {
          if (new URL(value).protocol === "https:") return "";
        } catch {}
        return `must be an https URL, got "${value}"`;
      }),
    },
    keywords: { required: false, ...keywordList(3, 8) },
  },
  platform: {
    name: {
      required: true,
      ...plain((value, { slug }) => {
        const expected = PLATFORMS.get(slug);
        return value === expected ? "" : `must be "${expected}" for docs/${slug}/, got "${value}"`;
      }),
    },
    description: { required: true, ...description },
    usecase: {
      required: true,
      ...plain((value) => (value.length > USECASE_MAX ? `must be at most ${USECASE_MAX} characters, got ${value.length}` : "")),
    },
    keywords: { required: false, ...keywordList(2, 6) },
  },
};

/**
 * Validate one document's frontmatter against its kind's schema. Problems are
 * returned, not thrown, so one build reports every file that needs fixing.
 * Cross-document rules (uniqueness) are checked by the caller.
 * @param {Record<string, unknown> | null} data
 * @param {"tool" | "platform"} kind
 * @param {{ slug: string }} context directory name the document lives in
 * @returns {{ meta: Record<string, any>, problems: string[] }}
 */
export function validateFrontmatter(data, kind, context) {
  const schema = SCHEMAS[kind];
  if (data === null) return { meta: {}, problems: ["missing YAML frontmatter"] };
  const problems = [];
  const meta = {};
  for (const key of Object.keys(data)) {
    if (!(key in schema)) problems.push(`unknown frontmatter key "${key}"; allowed: ${Object.keys(schema).join(", ")}`);
  }
  for (const [key, rule] of Object.entries(schema)) {
    const value = data[key];
    if (value === undefined) {
      if (rule.required) problems.push(`missing required key "${key}"`);
      continue;
    }
    const problem = rule.check(value, context);
    if (problem) problems.push(`${key}: ${problem}`);
    else meta[key] = rule.normalize(value);
  }
  meta.keywords ??= [];
  return { meta, problems };
}
