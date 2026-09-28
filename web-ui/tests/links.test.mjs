import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveConfig } from "../src/lib/config.mjs";
import { createLinkResolver } from "../src/lib/links.mjs";
import { fragmentId } from "../src/shared/fragment.mjs";

const config = resolveConfig({ SITE_URL: "https://example.com/sub", BASE_PATH: "/sub", GITHUB_REPOSITORY: "owner/repo" });
const repo = "https://github.com/owner/repo";
const resolve = createLinkResolver({
  config,
  routeBySource: new Map([
    ["README.md", "/docs/"],
    ["tools/ai/demo/README.md", "/docs/ai/demo/"],
    ["tools/ai/demo/docs/helm/README.md", "/docs/ai/demo/helm/"],
  ]),
  files: ["README.md", "tools/ai/demo/README.md", "tools/ai/demo/docs/helm/README.md", "tools/ai/demo/docs/helm/chart/values.yaml", "tools/ai/demo/Dockerfile"],
});
const from = (target, options = {}) => resolve(target, { source: "tools/ai/demo/docs/helm/README.md", ...options });

test("document links become site routes, keeping fragments", () => {
  assert.equal(from("../../README.md#images"), "/sub/docs/ai/demo/#images");
  assert.equal(from("../../"), "/sub/docs/ai/demo/");
  assert.equal(from("/README.md"), "/sub/docs/");
});

test("inline recipe files become in-page anchors", () => {
  const anchors = new Map([["tools/ai/demo/docs/helm/chart/values.yaml", "file-values"], ["tools/ai/demo/docs/helm/chart", "file-values"]]);
  assert.equal(from("chart/values.yaml", { anchors }), "#file-values");
  assert.equal(from("chart/", { anchors }), "#file-values");
  // A fragment names a place inside the file, which only GitHub can show.
  assert.equal(from("chart/values.yaml#L3", { anchors }), `${repo}/blob/HEAD/tools/ai/demo/docs/helm/chart/values.yaml#L3`);
});

test("other repository paths go to GitHub, as tree or blob by the Git inventory", () => {
  assert.equal(from("../../Dockerfile"), `${repo}/blob/HEAD/tools/ai/demo/Dockerfile`);
  assert.equal(from("../../"), "/sub/docs/ai/demo/");
  assert.equal(from("chart"), `${repo}/tree/HEAD/tools/ai/demo/docs/helm/chart`);
  assert.equal(from("missing.txt"), `${repo}/blob/HEAD/tools/ai/demo/docs/helm/missing.txt`);
  assert.equal(from("../../README.md?plain=1"), `${repo}/blob/HEAD/tools/ai/demo/README.md?plain=1`);
});

test("malformed percent-encoding does not crash", () => {
  assert.equal(from("bad%zz.md"), `${repo}/blob/HEAD/tools/ai/demo/docs/helm/bad%25zz.md`);
});

test("links leaving the repository are errors", () => {
  assert.throws(() => from("../../../../../../etc/passwd"), /outside the repository/);
});

test("script and data links are errors", () => {
  assert.throws(() => from("javascript:alert(1)"), /unsupported scheme/);
  assert.throws(() => from(" JaVaScRiPt:alert(1)".trim()), /unsupported scheme/);
  assert.throws(() => from("data:text/html,x", { image: true }), /unsupported scheme/);
});

test("images load from GitHub raw URLs", () => {
  assert.equal(from("shot.png", { image: true }), `${repo}/raw/HEAD/tools/ai/demo/docs/helm/shot.png`);
});

test("absolute links into the public site follow BASE_PATH; others pass through", () => {
  assert.equal(from("https://example.com/sub/docs/ai/demo/"), "/sub/docs/ai/demo/");
  assert.equal(from("https://example.com/subway"), "https://example.com/subway");
  assert.equal(from("mailto:a@example.com"), "mailto:a@example.com");
  assert.equal(from("#local"), "#local");
});

test("fragments decode to element ids, and malformed ones are ignored instead of throwing", () => {
  assert.equal(fragmentId("#file-chart-values-yaml"), "file-chart-values-yaml");
  assert.equal(fragmentId("#%C3%BCber"), "über");
  assert.equal(fragmentId("#%"), null);
  assert.equal(fragmentId("#%E0%A4%A"), null);
  assert.equal(fragmentId("#"), null);
  assert.equal(fragmentId(""), null);
});
