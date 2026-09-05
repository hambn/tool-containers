import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSite, buildPages, readCatalog } from "../src/lib/catalog.mjs";
import { resolveConfig } from "../src/lib/config.mjs";
import {
  escapeHtml,
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
  const source = "[Codex](tools/ai/codex/README.md)";
  const html = await render(
    `# Title\n\n[Codex][tool]\n\n[tool]: tools/ai/codex/README.md\n\n~~~md\n${source}\n~~~\n\nInline: \`${source}\`\n\n[Catalog](README.md#catalog)`,
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
    const directory = path.join(root, "tools", "test", "sample");
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
