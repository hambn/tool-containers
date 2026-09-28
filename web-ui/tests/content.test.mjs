import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ContentError, assertValid, discover, treeOrder } from "../src/lib/content.mjs";
import { splitFrontmatter, validateFrontmatter } from "../src/lib/frontmatter.mjs";
import { DESCRIPTION, categoryReadme, platformReadme, toolReadme } from "./helpers.mjs";

// Rule-by-rule cases shared with check-repo.py live in fixtures/documents.yaml
// (fixtures.test.mjs); these cover the typed values and messages the site relies on.

const tool = (overrides) => validateFrontmatter(splitFrontmatter(toolReadme("demo", overrides)).data, "tool", { slug: "demo" });
const platform = (overrides, slug = "helm") => validateFrontmatter(splitFrontmatter(platformReadme("Helm", overrides)).data, "platform", { slug });

describe("frontmatter", () => {
  test("a valid tool and platform pass", () => {
    assert.deepEqual(tool().problems, []);
    assert.deepEqual(platform().problems, []);
  });

  const failures = [
    ["unknown key", () => tool({ extra: "x" }), /unknown frontmatter key "extra"/],
    ["platform key on a tool", () => tool({ usecase: "x" }), /unknown frontmatter key "usecase"/],
    ["missing required key", () => tool({ title: undefined }), /missing required key "title"/],
    ["wrong type", () => tool({ title: ["a"] }), /title: expected string, got list/],
    ["name must match the directory", () => tool({ name: "other" }), /name/],
    ["short description", () => tool({ description: "Too short." }), /description/],
    ["markup in description", () => tool({ description: DESCRIPTION("The `demo` tool") }), /description/],
    ["the removed image key", () => tool({ image: "ghcr.io/hambn/demo" }), /unknown frontmatter key "image"/],
    ["images must list GHCR first", () => tool({ images: ["docker.io/hambn/demo", "ghcr.io/hambn/demo"] }), /images: must list ghcr\.io\/hambn\/demo first/],
    ["order must be an integer", () => tool({ order: 1.5 }), /order: must be an integer/],
    ["non-https upstream", () => tool({ upstream: "http://example.com" }), /upstream/],
    ["javascript upstream", () => tool({ upstream: "javascript:alert(1)" }), /upstream/],
    ["too few keywords", () => tool({ keywords: ["a", "b"] }), /keywords/],
    ["duplicate keywords", () => tool({ keywords: ["a", "a", "b"] }), /keywords/],
    ["platform name fixed by directory", () => platform({ name: "Docker" }), /name/],
    ["missing usecase", () => platform({ usecase: undefined }), /missing required key "usecase"/],
    ["platform keywords bounds", () => platform({ keywords: ["one"] }), /keywords/],
  ];
  for (const [name, run, pattern] of failures) {
    test(`rejects: ${name}`, () => {
      const { problems } = run();
      assert.ok(problems.some((problem) => pattern.test(problem)), `expected ${pattern} in ${JSON.stringify(problems)}`);
    });
  }

  test("normalizes values: trimmed strings, numeric order, image lists", () => {
    const { meta } = tool({ title: "  Demo  ", order: 3 });
    assert.equal(meta.title, "Demo");
    assert.equal(meta.order, 3);
    assert.deepEqual(meta.images, ["ghcr.io/hambn/demo", "docker.io/hambn/demo"]);
  });

  test("parses YAML 1.1 like PyYAML and rejects duplicate keys", () => {
    assert.deepEqual(splitFrontmatter("---\na: y\nb: yes\nc: 1e3\nd: 09\n---\n").data, { a: "y", b: true, c: "1e3", d: "09" });
    assert.match(splitFrontmatter("---\na: 1\na: 2\n---\n").error, /unique/);
  });

  test("reports YAML that is not a mapping", () => {
    assert.match(splitFrontmatter("---\n- a\n---\nbody").error, /mapping, got list/);
  });
});

describe("discover", () => {
  const run = (files) => discover({ files: Object.keys(files), read: (file) => files[file] });
  const catalog = (files) => {
    const { catalog: result, problems } = run(files);
    assertValid(problems);
    return result;
  };
  const base = {
    "README.md": "# Root\n\nLead.\n",
    "tools/ai/README.md": categoryReadme("ai", ["demo"]),
    "tools/ai/demo/README.md": toolReadme("demo"),
    "tools/ai/demo/docs/helm/README.md": platformReadme("Helm"),
    "tools/ai/demo/docs/helm/chart/values.yaml": "a: 1\n",
  };

  test("builds categories, tools, platforms, and sibling files", () => {
    const { categories, tools } = catalog(base);
    assert.deepEqual(categories.map((category) => category.slug), ["ai"]);
    assert.equal(categories[0].meta.title, "AI");
    assert.equal(tools[0].category, categories[0]);
    assert.equal(tools[0].platforms[0].slug, "helm");
    assert.deepEqual(tools[0].platforms[0].files, ["chart/values.yaml"]);
  });

  const invalid = [
    ["an orphan platform README", { "tools/ai/ghost/docs/helm/README.md": platformReadme("Helm") }, /tools\/ai\/ghost\/docs\/helm\/README\.md: platform docs need a tool README/],
    ["an unknown platform directory", { "tools/ai/demo/docs/nomad/README.md": platformReadme("Nomad") }, /docs\/nomad\/ is not a known platform/],
    ["root README frontmatter", { "README.md": "---\ntitle: x\n---\n# Root\n" }, /README\.md: the root README must not have frontmatter/],
    [
      "duplicate tool descriptions",
      {
        "tools/ai/README.md": categoryReadme("ai", ["demo", "other"]),
        "tools/ai/other/README.md": toolReadme("other", { order: 2, description: DESCRIPTION("The demo tool") }),
      },
      /description duplicates tools\/ai\/demo\/README\.md/,
    ],
  ];
  for (const [name, extra, pattern] of invalid) {
    test(`fails on ${name}, naming the file`, () => {
      assert.throws(() => catalog({ ...base, ...extra }), (error) => error instanceof ContentError && pattern.test(error.message));
    });
  }

  test("collects every problem before failing", () => {
    const files = { ...base, "tools/ai/demo/README.md": toolReadme("demo", { extra: 1, title: 2 }) };
    assert.throws(() => catalog(files), (error) => /extra/.test(error.message) && /title: expected string, got integer/.test(error.message));
  });

  test("sorts categories and tools by order, then by name", () => {
    const files = {
      ...base,
      "tools/ai/README.md": categoryReadme("ai", ["zeta", "demo", "alpha"], { order: 2 }),
      "tools/ai/zeta/README.md": toolReadme("zeta", { order: 1 }),
      "tools/ai/alpha/README.md": toolReadme("alpha", { order: 3 }),
      "tools/ai/demo/README.md": toolReadme("demo", { order: 2 }),
      "tools/base/README.md": categoryReadme("base", ["core"], { order: 1 }),
      "tools/base/core/README.md": toolReadme("core"),
    };
    const { categories, tools } = catalog(files);
    assert.deepEqual(categories.map((category) => category.slug), ["base", "ai"]);
    assert.deepEqual(tools.map((tool) => tool.slug), ["core", "zeta", "demo", "alpha"]);
  });

  test("never throws: an invalid catalog still comes back with its problems", () => {
    const { catalog: result, problems } = run({ ...base, "tools/ai/README.md": "# AI\n" });
    assert.deepEqual(result.categories.map((category) => category.slug), ["ai"]);
    assert.ok(problems.some((problem) => problem.startsWith("tools/ai/README.md: missing YAML frontmatter")), problems.join("\n"));
  });
});

test("treeOrder puts files before directories and is total", () => {
  const files = ["b/c.yaml", "a.yaml", "b.yaml", "a/z.yaml", "b/a/x.yaml"];
  assert.deepEqual(files.sort(treeOrder), ["a.yaml", "b.yaml", "a/z.yaml", "b/c.yaml", "b/a/x.yaml"]);
  assert.equal(treeOrder("a", "a"), 0);
});
