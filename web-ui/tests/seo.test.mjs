import assert from "node:assert/strict";
import { test } from "node:test";
import { describePages } from "../src/lib/seo.mjs";
import { fitSentences, sentences } from "../src/lib/text.mjs";

const short = "Docker images for many purposes — AI agents, CI builders, sandboxes, and more.";
const long = "Each image is a self-contained tool inside a category, with multiple build variants and per-platform deployment recipes, published to GHCR and Docker Hub.";

test("fitSentences adds whole sentences, then the leading clauses of the next", () => {
  const { text, end } = fitSentences([short, long], 160);
  assert.equal(text, `${short} Each image is a self-contained tool inside a category.`);
  assert.equal(end, 1, "the clipped sentence is not used in full");
  assert.ok(text.length <= 160);
  assert.equal(fitSentences([short, long], 240).text, `${short} ${long}`);
});

/** A site with only the pages describePages needs for the root README. */
const site = () => ({ pages: [{ kind: "home" }, { kind: "docs", heading: "Documentation" }], catalog: { tools: [] }, recipeCount: 0 });
const descriptions = (lead, headings = ["Catalog", "Images and tags"]) => {
  const s = site();
  const meta = describePages(s, { lead, headings });
  return s.pages.map((page) => meta.get(page).description);
};

test("home and /docs/ descriptions are distinct and at most 160 characters", () => {
  for (const lead of [`${short} ${long}`, short, long, `${long} ${long.replace("Each", "Every")}`]) {
    const [home, docs] = descriptions(lead);
    assert.ok(home && docs, lead);
    assert.notEqual(home, docs, lead);
    assert.ok(home.length <= 160 && docs.length <= 160, lead);
  }
  assert.equal(descriptions(`${short} ${long}`)[1], long);
  assert.equal(descriptions(short)[1], "The tool-containers documentation: Catalog, Images and tags.");
});

test("sentences are split and trimmed", () => {
  assert.deepEqual(sentences(`${short}  ${long} `), [short, long]);
});
