import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "node-html-parser";
import { html, raw } from "../src/lib/html.mjs";
import { createMarkdown, slugify } from "../src/lib/markdown.mjs";

const render = createMarkdown({
  highlighter: { render: (code) => `<pre><code>${code.replace(/[&<>]/g, (char) => `&#${char.charCodeAt(0)};`)}</code></pre>` },
  resolveLink: (href) => href.replace(/^self\.md/, "/docs/self/"),
  icon: (name) => `<svg data-icon="${name}"></svg>`,
  reservedIds: ["main"],
});
const page = (markdown, context = {}) => {
  const out = render(markdown, { source: "tools/ai/demo/README.md", selfHref: "/docs/self/", ...context });
  return { ...out, dom: parse(out.html) };
};

test("slugify follows GitHub", () => {
  assert.equal(slugify("Included software"), "included-software");
  assert.equal(slugify("Run `claude` — fast!"), "run-claude--fast");
  assert.equal(slugify("Über Straße"), "über-straße");
  assert.equal(slugify("!!!"), "section");
});

test("headings get unique ids that avoid template ids, with an anchor inside", () => {
  const { dom, toc } = page("# Title\n\nLead.\n\n## Main\n\n## Setup\n\n### Setup\n\n#### Deep\n");
  const ids = dom.querySelectorAll("h2, h3, h4").map((heading) => heading.id);
  assert.deepEqual(ids, ["main-1", "setup", "setup-1", "deep"]);
  for (const heading of dom.querySelectorAll("h2, h3, h4")) {
    assert.equal(heading.querySelector("a.anchor").getAttribute("href"), `#${heading.id}`);
  }
  assert.deepEqual(toc.map((entry) => entry.id), ["main-1", "setup", "setup-1"]);
});

test("the title and first paragraph become the page title and lead", () => {
  const out = page("# Demo **tool**\n\nThe *lead*.\n\n## Usage\n\nBody.\n");
  assert.equal(out.title, "Demo tool");
  assert.equal(out.lead, "The lead.");
  assert.equal(out.dom.querySelectorAll("h1").length, 0);
  assert.equal(out.dom.querySelector("p").text, "Body.");
});

test("a Contents section of same-page links is stripped; other Contents sections stay", () => {
  const stripped = page("# T\n\nLead.\n\n## Contents\n\n- [Usage](#usage)\n- [Notes](#notes)\n\n## Usage\n\nText.\n");
  assert.deepEqual(stripped.toc.map((entry) => entry.text), ["Usage"]);
  const kept = page("# T\n\nLead.\n\n## Contents\n\n- [Elsewhere](https://example.com)\n");
  assert.deepEqual(kept.toc.map((entry) => entry.text), ["Contents"]);
});

test("list items whose only link is the page itself are dropped", () => {
  const { dom } = page("# T\n\nLead.\n\n- Docs: [site](self.md#top)\n- Source: [GitHub](https://github.com)\n\nText.\n\n- [self](self.md)\n");
  assert.deepEqual(dom.querySelectorAll("li").map((item) => item.text.trim()), ["Source: GitHub"]);
  assert.equal(dom.querySelectorAll("ul").length, 1, "a list left empty disappears");
});

test("raw HTML is rejected, naming the file", () => {
  assert.throws(() => page("# T\n\n<div>x</div>\n"), /tools\/ai\/demo\/README\.md: raw HTML is not published/);
});

test("inline recipe files render as details, collapsed when long", () => {
  const long = Array.from({ length: 50 }, (_, index) => `line${index}`).join("\n");
  const { dom, toc, sections } = page("# T\n\nLead.\n", { files: [{ name: "compose.yaml", text: "a: 1\n" }, { name: "chart/values.yaml", text: long }] });
  const files = dom.querySelectorAll("details.file");
  assert.deepEqual(files.map((file) => [file.id, file.hasAttribute("open")]), [["file-compose-yaml", true], ["file-chart-values-yaml", false]]);
  assert.deepEqual(toc.map((entry) => entry.text), ["File contents", "compose.yaml", "chart/values.yaml"]);
  assert.ok(sections.every((section) => !section.text.includes("line1")), "code is never indexed");
});

test("search sections start with the lead and skip code", () => {
  const { sections } = page("# T\n\nLead text.\n\nMore.\n\n```sh\nsecret-command\n```\n\n## Usage\n\n| A | B |\n|---|---|\n| x | y |\n");
  assert.deepEqual(sections, [
    { id: "", heading: "", text: "Lead text. More." },
    { id: "usage", heading: "Usage", text: "A B x y" },
  ]);
});

test("the html template escapes values unless marked raw", () => {
  const hostile = `"><script>alert(1)</script>&`;
  const out = String(html`<a title="${hostile}" data-x='${hostile}'>${hostile}${raw("<b>ok</b>")}</a>`);
  const node = parse(out).querySelector("a");
  assert.equal(node.getAttribute("title"), hostile);
  assert.equal(node.getAttribute("data-x"), hostile);
  assert.equal(parse(out).querySelectorAll("script").length, 0);
  assert.equal(node.querySelector("b").text, "ok");
});
