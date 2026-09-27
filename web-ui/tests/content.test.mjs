// Unit tests for the build pipeline: frontmatter, discovery, and rendering.
// They use in-memory fixtures, so they run without a prior build.
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveConfig } from "../src/lib/config.mjs";
import { ContentError, discover, parseFrontmatter, readInlineFiles } from "../src/lib/content.mjs";
import { buildPages, buildSite } from "../src/lib/site.mjs";
import { escapeHtml, truncate } from "../src/lib/html.mjs";
import { fileLanguage, renderMarkdown, slugify } from "../src/lib/markdown.mjs";
import { minifyCss, minifyJs } from "../src/lib/assets.mjs";

const TOOL = "---\nname: sample\ndescription: A sample tool used by the tests.\nimage: ghcr.io/x/sample\n---\n# sample\n";
const RECIPE = (name) => `---\nname: ${name}\ndescription: Run the sample.\nusecase: Testing\n---\n# sample · ${name}\n`;

/** Discovery over an in-memory tree: `files` maps repository paths to content. */
const discoverFixture = (files) => discover({ files: Object.keys(files), read: (file) => files[file] });

test("frontmatter is split from the body and parsed as YAML", () => {
  const { data, body } = parseFrontmatter("---\nname: x\nkeywords: [a, 'b: c']\n---\n# X\n", "f.md");
  assert.deepEqual(data, { name: "x", keywords: ["a", "b: c"] });
  assert.equal(body, "# X\n");
  assert.deepEqual(parseFrontmatter("# No frontmatter\n", "f.md").data, {});
  assert.throws(() => parseFrontmatter("---\nname: [unclosed\n---\n", "bad.md"), /bad\.md: invalid YAML/);
});

test("a missing required key fails with the file name", () => {
  const tool = "tools/a/sample/README.md";
  const recipe = "tools/a/sample/docs/docker/README.md";
  assert.throws(
    () => discoverFixture({ [tool]: TOOL, [recipe]: "---\nname: Docker\ndescription: Run it.\n---\n# D\n" }),
    (error) => error instanceof ContentError && error.message.includes(`${recipe}: frontmatter is missing required key "usecase"`),
  );
  assert.throws(() => discoverFixture({ [tool]: "# sample\n" }), /tools\/a\/sample\/README\.md: frontmatter is missing required key "name"/);
  assert.throws(
    () => discoverFixture({ [tool]: TOOL.replace("image:", "keywords: nope\nimage:") }),
    /"keywords" must be a list of strings/,
  );
});

test("discovery follows new, renamed, and removed documents", () => {
  const tree = {
    "README.md": "# root\n",
    "tools/a/sample/README.md": TOOL,
    "tools/a/sample/docs/helm/README.md": RECIPE("Helm"),
    "tools/a/sample/docs/docker/README.md": RECIPE("Docker"),
    "tools/a/sample/docs/docker/run.sh": "echo",
    "tools/a/orphan/docs/docker/README.md": RECIPE("Docker"),
  };
  const routes = (files) => buildPages(discoverFixture(files)).map((page) => page.route);
  // Recipes follow the fixed platform order, not the alphabet.
  assert.deepEqual(routes(tree), ["/", "/docs/", "/docs/a/sample/", "/docs/a/sample/docker/", "/docs/a/sample/helm/", "/search/"]);

  const renamed = { ...tree, "tools/a/sample/docs/podman/README.md": RECIPE("Podman") };
  delete renamed["tools/a/sample/docs/helm/README.md"];
  assert.ok(routes(renamed).includes("/docs/a/sample/podman/"));
  assert.ok(!routes(renamed).includes("/docs/a/sample/helm/"));

  const removed = { ...tree };
  delete removed["tools/a/sample/README.md"];
  assert.deepEqual(routes(removed), ["/", "/docs/", "/search/"]);

  const catalog = discoverFixture(tree);
  assert.deepEqual(catalog.categories[0].tools[0].platforms[0].files, ["run.sh"]);
  assert.equal(catalog.categories[0].tools[0].meta.image, "ghcr.io/x/sample");
});

test("inline files list files before directories and skip binary or huge files", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "web-ui-files-"));
  const dir = "tools/t/s/docs/helm";
  const write = (name, content) => {
    fs.mkdirSync(path.dirname(path.join(root, dir, name)), { recursive: true });
    fs.writeFileSync(path.join(root, dir, name), content);
  };
  try {
    write("run.sh", "echo\n");
    write("chart/values.yaml", "a: 1\n");
    write("logo.png", Buffer.from([0x89, 0x50, 0x00, 0x01]));
    write("huge.txt", "x".repeat(200 * 1024));
    const tracked = ["chart/values.yaml", "huge.txt", "logo.png", "run.sh"];
    const files = discover({
      files: ["tools/t/s/README.md", `${dir}/README.md`, ...tracked.map((name) => `${dir}/${name}`)],
      read: (file) => (file.endsWith("s/README.md") ? TOOL : RECIPE("Helm")),
    }).categories[0].tools[0].platforms[0].files;
    assert.deepEqual(files, ["huge.txt", "logo.png", "run.sh", "chart/values.yaml"]);
    assert.deepEqual(
      readInlineFiles(dir, files, root).map((file) => file.name),
      ["run.sh", "chart/values.yaml"],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------ markdown */

const config = resolveConfig({ BASE_PATH: "/preview", SITE_URL: "https://example.com/preview" });
const site = buildSite(
  config,
  discoverFixture({ "README.md": "# root\n", "tools/ai/codex/README.md": TOOL.replace("sample", "codex") }),
);
const theme = { render: (code, lang) => `<pre data-lang="${lang}"><code>${escapeHtml(code)}</code></pre>` };
const render = (markdown, extra = {}) => renderMarkdown(markdown, { sourceDir: ".", site, theme, ...extra });

test("the title is lifted out and later level-one headings are demoted", async () => {
  const doc = await render("# The <code>title</code>\n\nLead text\nwraps.\n\n# Second\n\n## Third");
  assert.equal(doc.title, "The title");
  assert.ok(!doc.html.includes("<h1"));
  assert.match(doc.html, /<h2 id="second">/);
  assert.equal(doc.lead, "Lead text wraps.");
});

test("links resolve to routes, anchors, or GitHub; code stays verbatim", async () => {
  const source = "[Codex](tools/ai/codex/README.md)";
  const { html } = await render(
    `# T\n\n[Codex][tool] [dir](tools/ai/codex/) [Catalog](README.md#catalog) [ext](https://x.dev) [f](tools/ai/codex/Dockerfile)\n\n[tool]: tools/ai/codex/README.md\n\n~~~md\n${source}\n~~~\n\nInline: \`${source}\``,
  );
  assert.match(html, /href="\/preview\/docs\/ai\/codex\/"/);
  assert.equal(html.match(/href="\/preview\/docs\/ai\/codex\/"/g).length, 2);
  assert.match(html, /href="\/preview\/docs\/#catalog"/);
  assert.match(html, /href="https:\/\/x\.dev" rel="noopener"/);
  assert.match(html, /href="https:\/\/github\.com\/[^"]+\/blob\/HEAD\/tools\/ai\/codex\/Dockerfile"/);
  assert.ok(html.includes(`<code>${escapeHtml(source)}</code></pre>`));
  assert.ok(html.includes(`<code>${escapeHtml(source)}</code>`));
});

test("heading ids follow GitHub's slugs and stay unique", async () => {
  const { html, toc } = await render("# T\n\n## Repeat\n\n## Repeat\n\n### Air-gapped — hosts\n\n#### Deep");
  assert.match(html, /id="repeat"/);
  assert.match(html, /id="repeat-1"/);
  assert.match(html, /id="air-gapped--hosts"/);
  assert.deepEqual(toc.map((entry) => entry.id), ["repeat", "repeat-1", "air-gapped--hosts"]);
  assert.equal(slugify("Images and tags"), "images-and-tags");
});

test("fences: nested, tilde, and unterminated all render as code blocks", async () => {
  const { html } = await render("# T\n\n> ~~~sh\n> echo nested\n> ~~~\n\n## After\n\n```yaml\nunterminated: true");
  assert.match(html, /data-lang="sh"><code>echo nested/);
  assert.match(html, /id="after"/);
  assert.match(html, /unterminated: true/);
  assert.equal((html.match(/class="code"/g) ?? []).length, 2);
});

test("recipe files render inline and links to them become anchors", async () => {
  const dir = "tools/t/s/docs/helm";
  const doc = await render(
    "# Helm\n\n## File map\n\n- [`run.sh`](./run.sh)\n- [values](chart/values.yaml#image)\n- [chart](chart/)\n- [missing](other.yaml)\n\n```sh\nexport SKIP_ME=1\n```",
    { sourceDir: dir, files: [{ name: "run.sh", text: "echo <hi>\n" }, { name: "chart/values.yaml", text: "a: 1\n" }] },
  );
  assert.match(doc.html, /href="#file-run-sh"><code>run\.sh<\/code>/);
  assert.match(doc.html, /href="#file-chart-values-yaml">values/);
  assert.match(doc.html, /href="#file-chart-values-yaml">chart/);
  assert.match(doc.html, /blob\/HEAD\/tools\/t\/s\/docs\/helm\/other\.yaml/);
  assert.match(doc.html, /<h3 id="file-run-sh">/);
  assert.match(doc.html, /data-lang="bash"><code>echo &lt;hi&gt;<\/code>/);
  assert.ok(doc.html.indexOf('id="file-map"') < doc.html.indexOf('id="file-contents"'));
  assert.deepEqual(doc.toc.slice(-3).map((entry) => entry.id), ["file-contents", "file-run-sh", "file-chart-values-yaml"]);
  // Search sections carry prose, never code.
  assert.ok(doc.sections.some((section) => section.heading === "File map"));
  assert.ok(!JSON.stringify(doc.sections).includes("SKIP_ME"));
});

test("inline file languages follow names", () => {
  assert.equal(fileLanguage("Dockerfile"), "dockerfile");
  assert.equal(fileLanguage("app.Dockerfile"), "dockerfile");
  assert.equal(fileLanguage("chart/Chart.yaml"), "yaml");
  assert.equal(fileLanguage("compose.yml"), "yaml");
  assert.equal(fileLanguage("chart/templates/_helpers.tpl"), "text");
});

/* ------------------------------------------------------------- helpers */

test("public URLs and navigation prefixes remain independent", () => {
  const root = resolveConfig({ SITE_URL: "https://example.com/docs/" });
  assert.equal(root.basePath, "");
  assert.equal(root.canonical("/"), "https://example.com/docs/");
  const prefix = resolveConfig({ BASE_PATH: "preview/", SITE_URL: "https://example.com/preview/" });
  assert.equal(prefix.href("/docs/"), "/preview/docs/");
  assert.equal(prefix.canonical("/docs/"), "https://example.com/preview/docs/");
});

test("truncation never ends mid-word or on a dash", () => {
  assert.equal(truncate("short", 10), "short");
  assert.equal(truncate("alpha beta — gamma delta", 14), "alpha beta…");
});

test("minification preserves comment-shaped strings", () => {
  assert.ok(minifyJs('globalThis.v = "https://e.com/a//b"; // c\n').includes("https://e.com/a//b"));
  assert.ok(minifyCss('.l::after { content: "a  b /* x */"; }').includes("a  b /* x */"));
});
