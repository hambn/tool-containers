import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildSite,
  buildPages,
  exampleFiles,
  readCatalog,
} from "../src/lib/catalog.mjs";
import { resolveConfig } from "../src/lib/config.mjs";
import {
  escapeHtml,
  fileLanguage,
  leadParagraph,
  renderDocument,
} from "../src/lib/markdown.mjs";
import { minifyCss, minifyJs } from "../src/lib/assets.mjs";

const site = buildSite(
  resolveConfig({
    BASE_PATH: "/preview",
    SITE_URL: "https://example.com/preview",
  }),
);
const render = (markdown) =>
  renderDocument(markdown, {
    sourceDir: ".",
    site,
    theme: { render: (code) => `<pre><code>${escapeHtml(code)}</code></pre>` },
  });

test("joins hard-wrapped descriptions", () => {
  assert.equal(
    leadParagraph(
      "# Title\n\nA sentence that\nwraps over lines.\n\nNext paragraph.",
    ),
    "A sentence that wraps over lines.",
  );
});

test("rewrites reference links and preserves link-shaped code verbatim", async () => {
  const source = "[Codex](src/tools/ai/codex/README.md)";
  const html = await render(
    `# Title\n\n[Codex][tool]\n\n[tool]: src/tools/ai/codex/README.md\n\n~~~md\n${source}\n~~~\n\nInline: \`${source}\`\n\n[Catalog](README.md#catalog)`,
  );
  assert.match(html, /href="\/preview\/docs\/ai\/codex\/"/);
  assert.match(html, /href="\/preview\/docs\/#catalog"/);
  assert.ok(html.includes(`<pre><code>${source}</code></pre>`));
  assert.ok(html.includes(`<code>${source}</code>`));
});

test("handles nested, tilde and unterminated fences", async () => {
  const html = await render(
    "# Title\n\n> ~~~sh\n> echo nested\n> ~~~\n\n## After\n\n```yaml\nunterminated: true",
  );
  assert.match(html, /echo nested/);
  assert.match(html, /id="after"/);
  assert.match(html, /unterminated: true/);
  assert.equal((html.match(/class="code-card"/g) ?? []).length, 2);
});

test("heading anchors remain unique", async () => {
  const html = await render("# Title\n\n## Repeat\n\n## Repeat\n\n### Nested");
  assert.match(html, /id="repeat"/);
  assert.match(html, /id="repeat-2"/);
  assert.match(html, /id="nested"/);
});

test("public URLs and navigation prefixes remain independent", () => {
  const root = resolveConfig({ SITE_URL: "https://example.com/docs/" });
  assert.equal(root.basePath, "");
  assert.equal(root.canonical("/"), "https://example.com/docs/");
  const prefix = resolveConfig({
    BASE_PATH: "preview/",
    SITE_URL: "https://example.com/preview/",
  });
  assert.equal(prefix.href("/docs/"), "/preview/docs/");
  assert.equal(prefix.canonical("/docs/"), "https://example.com/preview/docs/");
});

test("minification preserves comment-shaped strings and significant whitespace", () => {
  const js = minifyJs(
    'globalThis.value = "https://example.com/a//b"; // comment\n',
  );
  assert.ok(js.includes("https://example.com/a//b"));
  const css = minifyCss('.label::after { content: "a  b /* literal */"; }');
  assert.ok(css.includes("a  b /* literal */"));
});

test("new, renamed, and removed Markdown documents update discovery", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "web-ui-content-"));
  try {
    const directory = path.join(root, "src", "tools", "test", "sample");
    fs.mkdirSync(path.join(directory, "examples", "docker"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(directory, "README.md"), "# Sample\n");
    fs.writeFileSync(
      path.join(directory, "examples", "docker", "README.md"),
      "# Docker\n",
    );
    const routes = () =>
      buildPages(readCatalog(root)).map((page) => page.route);
    assert.ok(routes().includes("/docs/test/sample/docker/"));
    fs.renameSync(
      path.join(directory, "examples", "docker"),
      path.join(directory, "examples", "podman"),
    );
    assert.ok(routes().includes("/docs/test/sample/podman/"));
    assert.ok(!routes().includes("/docs/test/sample/docker/"));
    fs.rmSync(path.join(directory, "README.md"));
    assert.deepEqual(routes(), ["/", "/docs/"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("example files render inline with anchors, recursing into subdirectories", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "web-ui-files-"));
  const dir = "src/tools/test/sample/examples/helm";
  const write = (name, content) => {
    fs.mkdirSync(path.dirname(path.join(root, dir, name)), { recursive: true });
    fs.writeFileSync(path.join(root, dir, name), content);
  };
  try {
    write("README.md", "# Helm\n");
    write("run.sh", "echo <hi>\n");
    write("chart/values.yaml", "image: x\n");
    write("chart/templates/job.yaml", "kind: Job\n");
    write("logo.png", Buffer.from([0x89, 0x50, 0x00, 0x01]));
    write("huge.txt", "x".repeat(200 * 1024));
    const files = exampleFiles(dir, root);
    assert.deepEqual(
      files.map((file) => file.name),
      ["run.sh", "chart/values.yaml", "chart/templates/job.yaml"],
    );

    const html = await renderDocument(
      "# Helm\n\n## File map\n\n- [`run.sh`](./run.sh)\n- [values](chart/values.yaml#image)\n- [chart](chart/)\n- [templates](./chart/templates)\n- [missing](other.yaml)",
      {
        sourceDir: dir,
        site,
        theme: {
          render: (code, lang) =>
            `<pre data-lang="${lang}"><code>${escapeHtml(code)}</code></pre>`,
        },
        files,
      },
    );
    assert.match(html, /href="#file-run-sh"><code>run\.sh<\/code>/);
    assert.match(html, /href="#file-chart-values-yaml">values/);
    assert.match(html, /href="#file-chart-values-yaml">chart</);
    assert.match(html, /href="#file-chart-templates-job-yaml">templates/);
    assert.match(
      html,
      /href="https:\/\/github\.com\/[^"]+\/blob\/HEAD\/src\/tools\/test\/sample\/examples\/helm\/other\.yaml"/,
    );
    assert.match(html, /<h2 id="file-contents">/);
    for (const id of [
      "file-run-sh",
      "file-chart-values-yaml",
      "file-chart-templates-job-yaml",
    ])
      assert.ok(html.includes(`<h3 id="${id}">`), id);
    assert.match(html, /data-lang="bash"><code>echo &lt;hi&gt;<\/code>/);
    assert.match(html, /data-lang="yaml"><code>kind: Job<\/code>/);
    assert.ok(
      html.indexOf('id="file-map"') < html.indexOf('id="file-contents"'),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("inline file languages follow names", () => {
  assert.equal(fileLanguage("Dockerfile"), "dockerfile");
  assert.equal(fileLanguage("app.Dockerfile"), "dockerfile");
  assert.equal(fileLanguage("chart/Chart.yaml"), "yaml");
  assert.equal(fileLanguage("compose.yml"), "yaml");
  assert.equal(fileLanguage("config.toml"), "toml");
  assert.equal(fileLanguage("NOTES.md"), "markdown");
  assert.equal(fileLanguage("chart/templates/_helpers.tpl"), "text");
});
