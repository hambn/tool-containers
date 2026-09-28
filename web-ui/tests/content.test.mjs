import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ContentError, discover } from "../src/lib/content.mjs";
import { splitFrontmatter, validateFrontmatter } from "../src/lib/frontmatter.mjs";
import { DESCRIPTION, platformReadme, toolReadme } from "./helpers.mjs";

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
    ["image must match the name", () => tool({ image: "docker.io/hambn/demo" }), /image/],
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

  test("reports YAML that is not a mapping", () => {
    assert.match(splitFrontmatter("---\n- a\n---\nbody").error, /mapping, got list/);
  });
});

describe("discover", () => {
  const catalog = (files) => discover({ files: Object.keys(files), read: (file) => files[file] });
  const base = {
    "README.md": "# Root\n\nLead.\n",
    "tools/ai/demo/README.md": toolReadme("demo"),
    "tools/ai/demo/docs/helm/README.md": platformReadme("Helm"),
    "tools/ai/demo/docs/helm/chart/values.yaml": "a: 1\n",
  };

  test("builds categories, tools, platforms, and sibling files", () => {
    const { categories, tools } = catalog(base);
    assert.deepEqual(categories.map((category) => category.slug), ["ai"]);
    assert.equal(tools[0].platforms[0].slug, "helm");
    assert.deepEqual(tools[0].platforms[0].files, ["chart/values.yaml"]);
  });

  const invalid = [
    ["an orphan platform README", { "tools/ai/ghost/docs/helm/README.md": platformReadme("Helm") }, /tools\/ai\/ghost\/docs\/helm\/README\.md: platform docs need a tool README/],
    ["an unknown platform directory", { "tools/ai/demo/docs/nomad/README.md": platformReadme("Nomad") }, /docs\/nomad\/ is not a known platform/],
    ["root README frontmatter", { "README.md": "---\ntitle: x\n---\n# Root\n" }, /README\.md: the root README must not have frontmatter/],
    ["duplicate tool descriptions", { "tools/ai/other/README.md": toolReadme("other", { description: DESCRIPTION("The demo tool") }) }, /description duplicates tools\/ai\/demo\/README\.md/],
  ];
  for (const [name, extra, pattern] of invalid) {
    test(`fails on ${name}, naming the file`, () => {
      assert.throws(() => catalog({ ...base, ...extra }), (error) => error instanceof ContentError && pattern.test(error.message));
    });
  }

  test("collects every problem before failing", () => {
    const files = { ...base, "tools/ai/demo/README.md": toolReadme("demo", { extra: 1, title: 2 }) };
    assert.throws(() => catalog(files), (error) => /extra/.test(error.message) && /title: expected string, got number/.test(error.message));
  });
});
