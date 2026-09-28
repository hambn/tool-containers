import { parse as parseYaml } from "yaml";

/**
 * The frontmatter contract for repository documents (defined in
 * .agents/skills/documentation/SKILL.md). Category, tool, and platform READMEs
 * carry the metadata the site publishes; anything outside this schema fails
 * the build so a typo can never silently drop a title or description.
 * `.github/scripts/check-repo.py` implements the same rules, and both run the
 * shared cases in tests/fixtures/frontmatter.yaml to prove it.
 */

/** Platform directories and their fixed display names, in reading order. */
export const PLATFORMS = new Map([
  ["docker", "Docker"],
  ["docker-compose", "Docker Compose"],
  ["podman", "Podman"],
  ["kubernetes", "Kubernetes"],
  ["helm", "Helm"],
]);

/** Registries a tool image may be listed on; the first is required and listed first. */
export const REGISTRIES = ["ghcr.io/hambn/", "docker.io/hambn/"];
export const DESCRIPTION_LENGTH = { min: 110, max: 160 };
const USECASE_MAX = 80;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
// Plain strings end up in meta tags and JSON-LD verbatim, so markup would leak:
// no code, emphasis, HTML, links, or headings.
const MARKUP = /[`*<>]|\]\(|^#|(?:^|[^A-Za-z0-9])_|_(?:[^A-Za-z0-9]|$)/;
const HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?(?:[/?#]\S*)?$/;

/**
 * check-repo.py parses with PyYAML (YAML 1.1), so the site parses YAML 1.1 too,
 * with PyYAML's implicit resolvers where the `yaml` package's differ (`y` and
 * `1e3` stay strings, `09` is not an integer). Integers come back as bigint so
 * `1` and `1.0` stay distinguishable. Keyed by the replaced resolver's pattern.
 */
const PYYAML_RESOLVERS = new Map([
  ["^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$", /^(?:[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/],
  ["^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$", /^(?:[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/],
  ["^[-+]?[0-9][0-9_]*$", /^[-+]?(?:0|[1-9][0-9_]*)$/],
  ["^[-+]?(?:[0-9][0-9_]*)?(?:\\.[0-9_]*)?[eE][-+]?[0-9]+$", /^(?:[-+]?[0-9][0-9_]*\.[0-9_]*|\.[0-9_]+)[eE][-+][0-9]+$/],
  ["^[-+]?(?:[0-9][0-9_]*)?\\.[0-9_]*$", /^(?:[-+]?[0-9][0-9_]*\.[0-9_]*|\.[0-9_]+)$/],
  ["^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$", /^[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+$/],
]);

const YAML_OPTIONS = {
  version: "1.1",
  intAsBigInt: true,
  customTags(tags) {
    const replaced = tags.map((tag) => (PYYAML_RESOLVERS.has(tag.test?.source) ? { ...tag, test: PYYAML_RESOLVERS.get(tag.test.source) } : tag));
    const used = new Set(tags.map((tag) => tag.test?.source));
    const missing = [...PYYAML_RESOLVERS.keys()].filter((source) => !used.has(source));
    if (missing.length) throw new Error(`the yaml package changed its YAML 1.1 resolvers; update PYYAML_RESOLVERS for ${missing.join(", ")}`);
    return replaced;
  },
};

function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "list";
  if (value instanceof Date) return "date";
  if (typeof value === "bigint") return "integer";
  if (typeof value === "number") return "float";
  if (typeof value === "object") return "mapping";
  return typeof value;
}

/**
 * Split a document into YAML frontmatter and markdown body. A document without
 * frontmatter yields `data: null` so the caller decides whether that is legal.
 * Duplicate keys are a parse error.
 * @returns {{ data: Record<string, unknown> | null, body: string, error?: string }}
 */
export function splitFrontmatter(source) {
  const match = source.match(FRONTMATTER);
  if (!match) return { data: null, body: source };
  const body = source.slice(match[0].length);
  let data;
  try {
    data = parseYaml(match[1], YAML_OPTIONS);
  } catch (error) {
    return { data: {}, body, error: `invalid YAML frontmatter: ${error.message.split("\n")[0]}` };
  }
  if (typeName(data) !== "mapping") {
    return { data: {}, body, error: `frontmatter must be a YAML mapping, got ${typeName(data)}` };
  }
  return { data, body };
}

/** The problem with a plain string, or "": single line, no markup, not empty once trimmed. */
function plainProblem(value) {
  if (typeof value !== "string") return `expected string, got ${typeName(value)}`;
  const text = value.trim();
  if (!text) return "must not be empty";
  if (/[\r\n]/.test(text)) return "must be a single line";
  if (MARKUP.test(text)) return "must be plain text without Markdown or HTML";
  return "";
}

const trim = (value) => value.trim();

/** A plain string rule; `extra` checks the trimmed value. */
const plain = (extra) => ({
  check: (value, context) => plainProblem(value) || (extra?.(value.trim(), context) ?? ""),
  normalize: trim,
});

/** A list of unique plain strings; uniqueness is case-insensitive. */
const plainList = (min, max, extra) => ({
  check(value, context) {
    if (!Array.isArray(value)) return `expected list, got ${typeName(value)}`;
    for (const item of value) {
      const problem = plainProblem(item);
      if (problem) return `items: ${problem}`;
    }
    if (value.length < min || value.length > max) return `must list ${min}-${max} items, got ${value.length}`;
    const seen = new Set();
    for (const item of value) {
      const key = item.trim().toLowerCase();
      if (seen.has(key)) return `lists "${item.trim()}" more than once`;
      seen.add(key);
    }
    return extra?.(value.map(trim), context) ?? "";
  },
  normalize: (value) => value.map(trim),
});

const name = plain((value, { slug }) => (value === slug ? "" : `must equal the directory name "${slug}", got "${value}"`));

const description = plain((value) => {
  const { min, max } = DESCRIPTION_LENGTH;
  return value.length < min || value.length > max ? `must be ${min}-${max} characters, got ${value.length}` : "";
});

const order = {
  check: (value) => (typeof value === "bigint" && value >= 1n ? "" : `must be an integer of at least 1, got ${typeName(value)} ${String(value)}`),
  normalize: Number,
};

const images = plainList(1, REGISTRIES.length, (value, { slug }) => {
  const allowed = REGISTRIES.map((registry) => `${registry}${slug}`);
  const bad = value.find((image) => !allowed.includes(image));
  if (bad) return `"${bad}" is not one of ${allowed.join(", ")}`;
  return value[0] === allowed[0] ? "" : `must list ${allowed[0]} first`;
});

const upstream = plain((value) => (HTTPS_URL.test(value) ? "" : `must be an https URL, got "${value}"`));

const SCHEMAS = {
  category: {
    name: { required: true, ...name },
    title: { required: true, ...plain() },
    description: { required: true, ...description },
    order: { required: true, ...order },
  },
  tool: {
    name: { required: true, ...name },
    title: { required: true, ...plain() },
    description: { required: true, ...description },
    order: { required: true, ...order },
    images: { required: true, ...images },
    upstream: { required: false, ...upstream },
    keywords: { required: false, ...plainList(3, 8) },
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
    keywords: { required: false, ...plainList(2, 6) },
  },
};

/**
 * Validate one document's frontmatter against its kind's schema. Problems are
 * returned, not thrown, so one build reports every file that needs fixing.
 * Cross-document rules (uniqueness, order) are checked by the caller.
 * @param {Record<string, unknown> | null} data
 * @param {"category" | "tool" | "platform"} kind
 * @param {{ slug: string }} context directory name the document lives in
 * @returns {{ meta: Record<string, any>, problems: string[] }}
 */
export function validateFrontmatter(data, kind, context) {
  const schema = SCHEMAS[kind];
  if (data === null) return { meta: { keywords: [] }, problems: ["missing YAML frontmatter"] };
  const problems = [];
  const meta = {};
  for (const key of Object.keys(data)) {
    if (!Object.hasOwn(schema, key)) problems.push(`unknown frontmatter key "${key}"; allowed: ${Object.keys(schema).join(", ")}`);
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
  if (kind !== "category") meta.keywords ??= [];
  return { meta, problems };
}
