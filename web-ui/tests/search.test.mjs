import assert from "node:assert/strict";
import { test } from "node:test";
import { createSearch, highlight, matchesAll, matchQuality, parseQuery, snippet } from "../src/shared/search.mjs";

const page = (t, { d = "", w = "", s = [] } = {}) => ({ t, u: `/${t.toLowerCase().replace(/\W+/g, "-")}/`, k: "tool", d, w, s });
const { search } = createSearch({
  pages: [
    page("Prose", { s: [["", "", "Mentions the widget once."]] }),
    page("Keywords", { w: "widget" }),
    page("Description", { d: "Explains the widget." }),
    page("Heading", { s: [["Widget setup", "widget-setup", "How to configure."]] }),
    page("Widget"),
    page("Claude Code · Helm", { w: "kubernetes", s: [["", "", "Deploy with a chart."], ["Variables", "variables", "Set values for the release."]] }),
  ],
});
const titles = (query) => search(query).results.map((result) => result.page.t);

test("queries are normalized, deduplicated words", () => {
  assert.deepEqual(parseQuery("  Crème  CRÈME brûlée! "), ["creme", "brulee"]);
});

test("ranking: title > heading > keywords > description > prose", () => {
  assert.deepEqual(titles("widget"), ["Widget", "Heading", "Keywords", "Description", "Prose"]);
});

test("prefix matching while typing", () => {
  assert.deepEqual(titles("widg"), ["Widget", "Heading", "Keywords", "Description", "Prose"]);
  assert.equal(matchQuality("kube", "kubernetes") > 0, true);
});

test("one typo is tolerated only for terms of five or more characters", () => {
  assert.ok(matchQuality("widgte", "widget") === 0, "a transposition is two edits");
  assert.ok(matchQuality("wigdet", "widget") === 0);
  assert.ok(matchQuality("widgit", "widget") > 0);
  assert.ok(matchQuality("valus", "values") > 0);
  assert.ok(matchQuality("variabls", "variables") > 0);
  assert.equal(matchQuality("hlm", "helm"), 0);
  assert.ok(matchQuality("widget", "widget") > matchQuality("widg", "widget"));
  assert.ok(matchQuality("widg", "widget") > matchQuality("widgit", "widget"));
});

test("every term must match (AND), and sections nest under their page", () => {
  assert.deepEqual(titles("widget kubernetes"), []);
  const [result] = search("claude helm valus").results;
  assert.equal(result.page.t, "Claude Code · Helm");
  assert.deepEqual(result.sections.map((section) => section.id), ["variables"]);
  const [chart] = search("helm chart").results;
  assert.deepEqual(chart.sections, [], "the preamble is the page itself, not a nested hit");
  assert.equal(chart.text, "Deploy with a chart.");
});

test("the home filter shares the matcher", () => {
  assert.equal(matchesAll(parseQuery("claud kube"), "Claude Code kubernetes"), true);
  assert.equal(matchesAll(parseQuery("claude nomad"), "Claude Code kubernetes"), false);
});

test("the home filter can match without typos, so a precise word stays precise", () => {
  assert.equal(matchesAll(parseQuery("codex"), "Claude Code CLI"), true, "one typo away by default");
  assert.equal(matchesAll(parseQuery("codex"), "Claude Code CLI", { typos: false }), false);
  assert.equal(matchesAll(parseQuery("codex"), "Codex CLI", { typos: false }), true);
  assert.equal(matchesAll(parseQuery("cod"), "Codex CLI", { typos: false }), true, "prefixes still match");
});

test("highlighting marks raw text, then escapes it", () => {
  assert.equal(highlight("<lt> & lt", ["lt"]), "&lt;<mark>lt</mark>&gt; &amp; <mark>lt</mark>");
  assert.equal(highlight(`"><img src=x>`, ["img"]), "&quot;&gt;&lt;<mark>img</mark> src=x&gt;");
  assert.equal(highlight("a <b>", []), "a &lt;b&gt;");
});

test("snippets cut at word boundaries around the first match", () => {
  const text = `${"alpha ".repeat(40)}needle ${"omega ".repeat(40)}`.trim();
  const out = snippet(text, ["needle"], 80);
  assert.match(out, /<mark>needle<\/mark>/);
  const plain = out.replace(/<\/?mark>/g, "").replace(/…/g, "").trim();
  assert.ok(plain.split(" ").every((word) => ["alpha", "omega", "needle"].includes(word)), plain);
  assert.ok(plain.length <= 80);
});
