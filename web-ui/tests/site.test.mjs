import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { parse } from "node-html-parser";
import { build } from "../src/build.mjs";
import { repoRoot } from "../src/lib/config.mjs";
import { ContentError } from "../src/lib/content.mjs";
import { CODE_BG, contrast } from "../src/lib/highlight.mjs";
import { DESCRIPTION, categoryReadme, fixtureRepo, platformReadme, tempDir, toolReadme } from "./helpers.mjs";

// Raw bytes, about twice the size at the time of writing: loose enough for
// content growth, tight enough to catch an accidental bundle or inlined asset.
const BUDGETS = { page: 50_000, css: 40_000, js: 25_000, json: 160_000, svg: 8_000, woff2: 70_000 };

const MODES = [
  { name: "default hosting", env: {}, siteUrl: "https://tool-containers.hgh.dev", basePath: "" },
  {
    name: "project subpath hosting",
    env: { SITE_URL: "https://example.com/tool-containers", BASE_PATH: "/tool-containers" },
    siteUrl: "https://example.com/tool-containers",
    basePath: "/tool-containers",
  },
];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const routeOf = (file) => `/${file.replace(/(^|\/)index\.html$/, "$1")}`;
const fileOf = (route) => (route.endsWith("/") ? `${route}index.html` : route).slice(1);

/** A built site: every HTML page parsed once, keyed by route. */
async function buildSite(options) {
  const outDir = tempDir("web-ui-site-");
  await build({ outDir, ...options });
  const files = walk(outDir).map((file) => path.relative(outDir, file).split(path.sep).join("/"));
  const pages = new Map(files.filter((file) => file.endsWith(".html")).map((file) => [routeOf(file), parse(readFileSync(path.join(outDir, file), "utf8"))]));
  const ids = new Map();
  const idsOf = (file) => {
    if (!ids.has(file)) ids.set(file, new Set(parse(readFileSync(path.join(outDir, file), "utf8")).querySelectorAll("[id]").map((node) => node.id)));
    return ids.get(file);
  };
  return { outDir, files, pages, idsOf, read: (file) => readFileSync(path.join(outDir, file), "utf8") };
}

const meta = (dom, name) => dom.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
const jsonLd = (dom) => dom.querySelectorAll('script[type="application/ld+json"]').flatMap((script) => JSON.parse(script.text)["@graph"]);

for (const mode of MODES) {
  describe(`generated site, ${mode.name}`, () => {
    let site;
    before(async () => {
      site = await buildSite({ env: mode.env });
    });
    after(() => rmSync(site.outDir, { recursive: true, force: true }));

    const canonical = (route) => `${mode.siteUrl}${route}`;
    const indexable = () => [...site.pages].filter(([, dom]) => !meta(dom, "robots").includes("noindex"));

    test("the page set equals the tracked Markdown inventory", () => {
      const tracked = execFileSync("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" }).split("\n");
      const expected = ["/", "/docs/", "/search/", "/404.html"];
      for (const file of tracked) {
        const match = file.match(/^tools\/([^/]+)\/(?:([^/]+)\/(?:docs\/([^/]+)\/)?)?README\.md$/);
        if (match) expected.push(`/docs/${match.slice(1).filter(Boolean).join("/")}/`);
      }
      assert.deepEqual([...site.pages.keys()].sort(), expected.sort());
    });

    test("Docker pages show direct commands and full platform labels", () => {
      const dom = site.pages.get("/docs/ai/t3code/docker/");
      assert.equal(dom.querySelector("h1").text, "Run T3 Code with Docker command");
      const labels = dom.querySelectorAll("a").map((link) => link.text.trim());
      assert.ok(labels.includes("Docker command"));
      assert.ok(labels.includes("Docker compose"));
      const commands = dom.querySelectorAll("pre").map((code) => parse(code.innerHTML).text);
      assert.ok(commands.some((code) => code.includes("-p 127.0.0.1:3773:3773")));
      assert.ok(commands.some((code) => code.includes("-p 3773:3773")));
      assert.ok(!dom.text.includes("airgapped.run.sh"));
      assert.ok(!dom.text.includes("run.sh"));
    });

    test("platform navigation uses a closed dropdown beside Overview", () => {
      const overview = site.pages.get("/docs/ai/t3code/");
      const platform = site.pages.get("/docs/ai/t3code/docker/");
      for (const dom of [overview, platform]) {
        const dropdown = dom.querySelector(".platform-dropdown");
        assert.ok(dropdown);
        assert.ok(!dropdown.hasAttribute("open"));
        assert.equal(dom.querySelector(".tabs > a").text, "Overview");
        assert.equal(dropdown.querySelectorAll("a").length, 5);
        assert.ok(!dom.querySelector(".tabs-label"));
      }
      assert.equal(overview.querySelector(".platform-dropdown summary").text.trim(), "Choose platform: Platform");
      assert.equal(platform.querySelector(".platform-dropdown summary").text.trim(), "Choose platform: Docker command");
      assert.equal(platform.querySelector('.platform-options [aria-current="page"]').text, "Docker command");
    });

    test("every page has exactly one h1 and a unique title and description", () => {
      const titles = new Set();
      const descriptions = new Set();
      for (const [route, dom] of site.pages) {
        assert.equal(dom.querySelectorAll("h1").length, 1, route);
        const title = dom.querySelector("title").text;
        const description = meta(dom, "description");
        assert.ok(title.length <= 60, `${route}: title is ${title.length} characters`);
        assert.ok(description.length > 0 && description.length <= 160, `${route}: description is ${description.length} characters`);
        assert.ok(!titles.has(title), `${route}: duplicate title ${title}`);
        assert.ok(!descriptions.has(description), `${route}: duplicate description`);
        titles.add(title);
        descriptions.add(description);
      }
    });

    test("internal links, assets, and fragments resolve inside BASE_PATH", () => {
      const problems = [];
      for (const [route, dom] of site.pages) {
        for (const node of dom.querySelectorAll("[href], [src], [action], [data-search-index]")) {
          const url = node.getAttribute("href") ?? node.getAttribute("src") ?? node.getAttribute("action") ?? node.getAttribute("data-search-index");
          if (/^(https?|mailto):/.test(url)) continue;
          const [pathPart, hash = ""] = url.split("#");
          let file = fileOf(route);
          if (pathPart) {
            if (!pathPart.startsWith(`${mode.basePath}/`)) {
              problems.push(`${route}: ${url} is outside ${mode.basePath || "/"}`);
              continue;
            }
            file = fileOf(pathPart.slice(mode.basePath.length).split("?")[0]);
            if (!site.files.includes(file)) {
              problems.push(`${route}: ${url} is missing`);
              continue;
            }
          }
          if (hash && /\.(html|svg)$/.test(file) && !site.idsOf(file).has(decodeURIComponent(hash))) problems.push(`${route}: ${url} has no #${hash}`);
        }
      }
      assert.deepEqual(problems, []);
    });

    test("off-site links open in a new tab and announce it", () => {
      for (const [route, dom] of site.pages) {
        for (const link of dom.querySelectorAll("a[href]").filter((a) => /^https?:/.test(a.getAttribute("href")))) {
          const where = `${route}: ${link.getAttribute("href")}`;
          assert.equal(link.getAttribute("target"), "_blank", where);
          assert.equal(link.getAttribute("rel"), "noopener noreferrer", where);
          const name = link.getAttribute("aria-label") ?? link.querySelector(".sr-only")?.text ?? "";
          assert.match(name, /\(opens in new tab\)$/, where);
        }
        for (const link of dom.querySelectorAll("a[target]").filter((a) => !/^https?:/.test(a.getAttribute("href")))) {
          assert.fail(`${route}: ${link.getAttribute("href")} is internal but opens a new tab`);
        }
      }
    });

    test("keywords are tags at the end of the article, each searching for itself", () => {
      let tagged = 0;
      for (const [route, dom] of site.pages) {
        assert.ok(!dom.querySelectorAll(".facts dt").some((term) => term.text === "Keywords"), `${route}: no Keywords row`);
        const tags = dom.querySelectorAll(".tags .chip");
        if (!tags.length) continue;
        tagged += 1;
        assert.equal(dom.querySelector(".tags h2").text, "Topics");
        for (const tag of tags) {
          assert.equal(tag.getAttribute("href"), `${mode.basePath}/search/?q=${encodeURIComponent(tag.text)}`, route);
        }
      }
      assert.ok(tagged > 0);
    });

    test("a tool page links its source once, from the facts panel", () => {
      for (const [route, dom] of site.pages) {
        const source = dom.querySelector(".facts a[href*='/tree/']");
        if (!source) continue;
        const href = source.getAttribute("href").replace(/\/tree\/[^/]+\//, "/tree/");
        const prose = dom.querySelectorAll(".prose a[href*='/tree/']").map((link) => link.getAttribute("href").replace(/\/tree\/[^/]+\//, "/tree/").replace(/\/$/, ""));
        assert.ok(!prose.includes(href), `${route}: the README's Source bullet is dropped`);
      }
    });

    test("canonical URLs and the sitemap list exactly the indexable pages", () => {
      for (const [route, dom] of site.pages) {
        const link = dom.querySelector('link[rel="canonical"]')?.getAttribute("href");
        const noindex = meta(dom, "robots").includes("noindex");
        assert.equal(link, noindex ? undefined : canonical(route), route);
        assert.equal(dom.querySelector('meta[property="og:url"]')?.getAttribute("content"), link, route);
      }
      assert.ok(!indexable().some(([route]) => route === "/search/" || route === "/404.html"));
      const locs = parse(site.read("sitemap.xml")).querySelectorAll("loc").map((loc) => loc.text);
      assert.deepEqual(locs.sort(), indexable().map(([route]) => canonical(route)).sort());
      assert.match(site.read("robots.txt"), new RegExp(`^Sitemap: ${canonical("/sitemap.xml")}$`, "m"));
    });

    test("JSON-LD parses, its headline is the h1, and its breadcrumb matches the visible one", () => {
      for (const [route, dom] of site.pages) {
        const nodes = jsonLd(dom);
        const indexed = !meta(dom, "robots").includes("noindex");
        assert.equal(nodes.length > 0, indexed, route);
        const article = nodes.find((node) => node["@type"] === "TechArticle");
        if (article) assert.equal(article.headline, dom.querySelector("h1").text.trim(), route);

        const visible = dom.querySelectorAll("nav.crumbs li").map((item) => {
          const link = item.querySelector("a");
          return { name: item.text.trim(), item: link ? `${mode.siteUrl}${link.getAttribute("href").slice(mode.basePath.length)}` : canonical(route) };
        });
        const breadcrumb = nodes.find((node) => node["@type"] === "BreadcrumbList");
        if (visible.length < 2) {
          assert.equal(breadcrumb, undefined, route);
          continue;
        }
        assert.deepEqual(breadcrumb.itemListElement.map(({ name, item }) => ({ name, item })), visible, route);
        assert.deepEqual(breadcrumb.itemListElement.map((entry) => entry.position), visible.map((_, index) => index + 1), route);
      }
    });

    test("the search index covers every reading page", () => {
      const index = JSON.parse(site.read(site.files.find((file) => /^assets\/search-.*\.json$/.test(file))));
      const routes = index.pages.map((page) => page.u.slice(mode.basePath.length));
      assert.deepEqual(routes.sort(), [...site.pages.keys()].filter((route) => route.startsWith("/docs/")).sort());
    });

    test("category pages list their tools in README order, and the sidebar links them", () => {
      const tracked = execFileSync("git", ["ls-files", ":(glob)tools/*/README.md"], { cwd: repoRoot, encoding: "utf8" }).split("\n").filter(Boolean);
      assert.ok(tracked.length > 0);
      for (const file of tracked) {
        const category = file.split("/")[1];
        const route = `/docs/${category}/`;
        const dom = site.pages.get(route);
        // check-repo.py and the build both hold the Tools bullets to frontmatter order.
        const bullets = [...readFileSync(path.join(repoRoot, file), "utf8").matchAll(/^- \[[^\]]+\]\(\.\/([^/]+)\/\)/gm)].map((match) => match[1]);
        const listed = dom.querySelectorAll(".category-tool-title a").map((link) => link.getAttribute("href"));
        assert.deepEqual(listed, bullets.map((tool) => `${mode.basePath}/docs/${category}/${tool}/`), route);
        for (const item of dom.querySelectorAll(".category-tool")) {
          assert.ok(item.querySelectorAll(".image code").length > 0, `${route}: every tool shows its images`);
          const toolRoute = item.querySelector(".category-tool-title a").getAttribute("href").slice(mode.basePath.length);
          const tabs = site.pages.get(toolRoute).querySelectorAll(".tabs-link").slice(1).map((link) => link.getAttribute("href"));
          assert.deepEqual(item.querySelectorAll(".chip").map((chip) => chip.getAttribute("href")), tabs, `${route}: platform chips`);
        }
        const sidebar = dom.querySelector(".sidebar");
        assert.equal(sidebar.querySelector('a.tree-label[aria-current="page"]').getAttribute("href"), `${mode.basePath}${route}`);
        const toolPage = site.pages.get(listed[0].slice(mode.basePath.length));
        assert.deepEqual(toolPage.querySelectorAll(".sidebar a.tree-label.active").map((link) => link.getAttribute("href")), [`${mode.basePath}${route}`], "a tool page highlights its category");
        const collection = jsonLd(dom).find((node) => node["@type"] === "CollectionPage");
        assert.equal(collection.headline, dom.querySelector("h1").text.trim(), route);
        assert.deepEqual(collection.mainEntity.itemListElement.map((entry) => entry.url), listed.map((href) => canonical(href.slice(mode.basePath.length))), route);
        const label = site.pages.get("/docs/").querySelectorAll("a.tree-label").find((link) => link.getAttribute("href") === `${mode.basePath}${route}`);
        assert.ok(label, `${route}: the sidebar links the category page`);
      }
    });

    test("the catalog groups tools by category order, links each category page, and lists every image", () => {
      const home = site.pages.get("/");
      assert.equal(home.querySelector('select[name="platform"]'), null, "no platform filter");
      assert.equal(home.querySelectorAll(".row nav, .row-platforms").length, 0, "no platform columns");
      const groups = home.querySelectorAll(".group");
      const categoryPages = site.pages.get("/docs/").querySelectorAll(".sidebar a.tree-label").map((link) => link.getAttribute("href"));
      assert.deepEqual(groups.map((group) => group.querySelector(".group-title a").getAttribute("href")), categoryPages);
      for (const row of home.querySelectorAll(".row")) {
        const tool = site.pages.get(row.querySelector(".row-title a").getAttribute("href").slice(mode.basePath.length));
        const images = (dom) => dom.querySelectorAll(".image code").map((code) => code.text);
        assert.deepEqual(images(row), images(tool.querySelector(".facts")));
        assert.ok(images(row).some((image) => image.startsWith("ghcr.io/")) && images(row).some((image) => image.startsWith("docker.io/")));
        assert.deepEqual(row.querySelectorAll(".image-registry").map((label) => label.text), ["GHCR", "Docker Hub"]);
      }
    });

    test("favicon.ico is an icon and the manifest shares the theme colour", () => {
      const ico = readFileSync(path.join(site.outDir, "favicon.ico"));
      assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
      const manifest = JSON.parse(site.read("site.webmanifest"));
      const dark = site.pages.get("/").querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]').getAttribute("content");
      assert.equal(manifest.theme_color, dark);
      assert.equal(manifest.start_url, `${mode.basePath}/`);
    });

    test("code token colours hold 4.5:1 on the code background in both themes", () => {
      const css = site.read(site.files.find((file) => /^assets\/site-.*\.css$/.test(file)));
      const long = (hex) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex);
      const tokens = [...css.matchAll(/\.t[\da-z]+\{color:light-dark\((#[\da-f]+),(#[\da-f]+)\)\}/gi)];
      assert.ok(tokens.length > 0);
      for (const [rule, light, dark] of tokens) {
        assert.ok(contrast(long(light), CODE_BG.light) >= 4.5, rule);
        assert.ok(contrast(long(dark), CODE_BG.dark) >= 4.5, rule);
      }
    });

    test("pages preload the chunks the entry script imports", () => {
      for (const [route, dom] of site.pages) {
        const entry = dom.querySelector('script[type="module"]').getAttribute("src");
        const imported = [...site.read(entry.slice(mode.basePath.length + 1)).matchAll(/(?:^|[;}])import\s*[^"(]*?"\.\/([^"]+)"/g)].map((match) => `${mode.basePath}/assets/${match[1]}`);
        assert.ok(imported.length > 0, route);
        assert.deepEqual(dom.querySelectorAll('link[rel="modulepreload"]').map((link) => link.getAttribute("href")), imported, route);
      }
    });

    test("fonts are self-hosted, preloaded, and licensed", () => {
      const fonts = site.files.filter((file) => /^assets\/.*\.woff2$/.test(file));
      assert.equal(fonts.length, 2, "Geist and Geist Mono");
      assert.ok(site.files.includes("assets/fonts-OFL.txt"), "the OFL ships beside the fonts");
      const css = site.read(site.files.find((file) => /^assets\/.*\.css$/.test(file)));
      for (const font of fonts) assert.ok(css.includes(`${mode.basePath}/${font}`), `${font}: referenced by @font-face`);
      assert.match(css, /font-display:\s*swap/);
      assert.match(css, /size-adjust/, "metric-matched fallback");
      for (const [route, dom] of site.pages) {
        const preloads = dom.querySelectorAll('link[rel="preload"][as="font"]');
        assert.equal(preloads.length, 1, `${route}: only the sans face is preloaded`);
        assert.equal(preloads[0].getAttribute("type"), "font/woff2", route);
        assert.ok(preloads[0].hasAttribute("crossorigin"), route);
        assert.ok(fonts.map((font) => `${mode.basePath}/${font}`).includes(preloads[0].getAttribute("href")), route);
      }
    });

    test("output stays within size budgets", () => {
      const size = (file) => statSync(path.join(site.outDir, file)).size;
      const total = (pattern) => site.files.filter((file) => pattern.test(file)).reduce((sum, file) => sum + size(file), 0);
      for (const file of site.files.filter((name) => name.endsWith(".html"))) assert.ok(size(file) <= BUDGETS.page, `${file}: ${size(file)} bytes`);
      for (const [kind, budget] of Object.entries(BUDGETS).filter(([kind]) => kind !== "page")) {
        const bytes = total(new RegExp(`^assets/.*\\.${kind}$`));
        assert.ok(bytes > 0 && bytes <= budget, `${kind}: ${bytes} bytes`);
      }
    });
  });
}

describe("hostile content", () => {
  // Frontmatter is plain text, so markup can only arrive through the body; quotes and ampersands still can.
  const keyword = `"quoted" & 'k' \\ \u2028end`;
  const title = `Tom's "Tool" & Co`;
  const files = {
    "README.md": "# Fixture\n\nA fixture catalog for tests. It has one tool.\n\n## Images\n\n- [Demo](tools/ai/demo/README.md)\n",
    "tools/ai/README.md": categoryReadme("ai", ["demo"], { title: `AI "&" Agents` }),
    "tools/ai/demo/README.md": toolReadme("demo", {
      title,
      keywords: [keyword, `a"b'c&d`, "plain"],
      upstream: `https://example.com/?a=1&b="x"`,
    }).concat("\n## Run \\<img src=x onerror=alert(1)\\>\n\nText.\n"),
    "tools/ai/demo/docs/helm/README.md": platformReadme("Helm"),
    "tools/ai/demo/docs/helm/chart/values.yaml": "key: </details><script>alert(1)</script>\n",
  };
  let site;
  let root;
  before(async () => {
    root = fixtureRepo(files);
    site = await buildSite({ root, env: {} });
  });
  after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(site.outDir, { recursive: true, force: true });
  });

  test("frontmatter and headings reach pages as text, never markup", () => {
    for (const [route, dom] of site.pages) {
      // Only the theme script, the module entry, and JSON-LD: an injected tag would add a fourth kind.
      const inline = dom.querySelectorAll("script").filter((script) => !script.hasAttribute("src") && script.getAttribute("type") !== "application/ld+json");
      assert.equal(inline.length, 1, route);
      assert.ok(!inline[0].text.includes("alert"), route);
      jsonLd(dom);
      assert.equal(dom.querySelectorAll("img").length, 0, route);
    }
    const tool = site.pages.get("/docs/ai/demo/");
    assert.equal(tool.querySelector("title").text, `${title} Docker image — tool-containers`);
    assert.equal(tool.querySelector("h1").text.trim(), title);
    assert.ok(tool.querySelectorAll("h2").some((heading) => heading.text.includes("Run <img src=x onerror=alert(1)>")));
    assert.ok(tool.querySelector("main").text.includes(keyword));
    assert.ok(tool.querySelectorAll("a").some((link) => link.getAttribute("href") === new URL(`https://example.com/?a=1&b="x"`).href));
    const article = jsonLd(tool).find((node) => node["@type"] === "TechArticle");
    assert.equal(article.keywords, `${keyword}, a"b'c&d, plain`);
    assert.equal(article.headline, title);

    const helm = site.pages.get("/docs/ai/demo/helm/");
    assert.ok(helm.querySelector(".file details").text.includes("</details><script>alert(1)</script>"));
  });

  test("attributes and generated files round-trip hostile values", () => {
    const row = site.pages.get("/").querySelector(".row");
    assert.ok(row.getAttribute("data-text").includes(keyword));
    const index = JSON.parse(site.read(site.files.find((file) => /^assets\/search-.*\.json$/.test(file))));
    assert.ok(index.pages.some((page) => page.w.includes(keyword)));
    assert.ok(site.read("llms.txt").includes(title));
  });
});

describe("build output", () => {
  const valid = {
    "README.md": "# Fixture\n\nA fixture catalog for tests.\n",
    "tools/ai/README.md": categoryReadme("ai", ["demo"]),
    "tools/ai/demo/README.md": toolReadme("demo"),
    "tools/ai/demo/docs/helm/README.md": platformReadme("Helm"),
  };
  const siblings = (outDir) => readdirSync(path.dirname(outDir)).filter((name) => name !== path.basename(outDir));

  test("a build replaces the previous output whole and leaves no staging directory", async () => {
    const root = fixtureRepo(valid);
    const parent = tempDir("web-ui-swap-");
    const outDir = path.join(parent, "dist");
    try {
      mkdirSync(outDir);
      writeFileSync(path.join(outDir, "stale.html"), "old");
      await build({ root, outDir, env: {} });
      assert.equal(existsSync(path.join(outDir, "stale.html")), false);
      assert.ok(existsSync(path.join(outDir, "docs/ai/index.html")));
      assert.deepEqual(siblings(outDir), []);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("a failed build reports every problem and keeps the previous output", async () => {
    const root = fixtureRepo({
      ...valid,
      "tools/ai/demo/README.md": toolReadme("demo", { image: "ghcr.io/hambn/demo" }).concat("\nSee [outside](../../../../outside.md).\n\n<div>raw</div>\n"),
      "tools/ai/ghost/docs/helm/README.md": platformReadme("Helm", { description: DESCRIPTION("A ghost") }),
    });
    const parent = tempDir("web-ui-invalid-");
    const outDir = path.join(parent, "dist");
    try {
      mkdirSync(outDir);
      writeFileSync(path.join(outDir, "index.html"), "previous");
      await assert.rejects(build({ root, outDir, env: {} }), (error) => {
        assert.ok(error instanceof ContentError);
        for (const expected of [
          "tools/ai/ghost/docs/helm/README.md: platform docs need a tool README",
          'tools/ai/demo/README.md: unknown frontmatter key "image"',
          "tools/ai/demo/README.md: raw HTML is not published",
          'link "../../../../outside.md" points outside the repository',
        ]) {
          assert.ok(error.message.includes(expected), `missing ${expected} in:\n${error.message}`);
        }
        return true;
      });
      assert.equal(readFileSync(path.join(outDir, "index.html"), "utf8"), "previous");
      assert.deepEqual(siblings(outDir), []);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("a failed first build writes nothing", async () => {
    const root = fixtureRepo({ ...valid, "tools/ai/README.md": categoryReadme("ai", []) });
    const parent = tempDir("web-ui-invalid-");
    const outDir = path.join(parent, "dist");
    try {
      await assert.rejects(build({ root, outDir, env: {} }), /tools\/ai\/README\.md: ## Tools must link each tool once/);
      assert.deepEqual(readdirSync(parent), []);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("an invalid SITE_URL fails the build", async () => {
    const parent = tempDir("web-ui-invalid-");
    try {
      await assert.rejects(build({ env: { SITE_URL: "" }, outDir: path.join(parent, "dist") }), /SITE_URL must be an absolute http\(s\) URL/);
      assert.deepEqual(readdirSync(parent), []);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});
