import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");

/** Deployment config, set once by the build entry before any rendering. */
export let basePath = "";
export let siteOrigin = "";

export function configureSite({ base = "", origin = "" } = {}) {
  basePath = base.replace(/\/+$/, "");
  siteOrigin = origin.replace(/\/+$/, "");
}

const platformOrder = ["docker", "docker-compose", "podman", "docker-swarm", "kubernetes", "helm"];
export const platformLabels = {
  docker: "Docker",
  "docker-compose": "Docker Compose",
  podman: "Podman",
  "docker-swarm": "Docker Swarm",
  kubernetes: "Kubernetes",
  helm: "Helm",
};

const remoteUrl = execFileSync("git", ["remote", "get-url", "origin"], { cwd: repoRoot }).toString().trim();
const remoteParts = remoteUrl.replace(/\.git$/, "").split("/");
export const githubOwner = remoteParts.at(-2);
export const githubRepo = remoteParts.at(-1);
export const repoUrl = `https://github.com/${githubOwner}/${githubRepo}`;
export const blobUrl = (repoPath) => `${repoUrl}/blob/HEAD/${repoPath}`;

function rank(order, value) {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

/*
 * The catalog is generated from the repository shape: every directory under
 * images/ is a category (shown even while empty), every tool directory with a
 * README is a tool, and every examples/<platform>/ with a README is a page.
 * Categories sort alphabetically; platform order is display metadata only.
 */
export const catalog = [];
for (const entry of fs.readdirSync(path.join(repoRoot, "images"), { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue;
  const category = entry.name;
  const tools = [];
  for (const toolEntry of fs.readdirSync(path.join(repoRoot, "images", category), { withFileTypes: true })) {
    if (!toolEntry.isDirectory()) continue;
    const tool = toolEntry.name;
    if (!fs.existsSync(path.join(repoRoot, "images", category, tool, "README.md"))) continue;
    const examplesDir = path.join(repoRoot, "images", category, tool, "examples");
    const platforms = fs.existsSync(examplesDir)
      ? fs
          .readdirSync(examplesDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && fs.existsSync(path.join(examplesDir, d.name, "README.md")))
          .map((d) => d.name)
      : [];
    tools.push({ tool, platforms });
  }
  tools.sort((a, b) => a.tool.localeCompare(b.tool));
  for (const t of tools) t.platforms.sort((a, b) => rank(platformOrder, a) - rank(platformOrder, b));
  catalog.push({ category, tools });
}

export const pages = new Map();
pages.set("README.md", { route: "/", kind: "home" });
pages.set("__docs_index__", { route: "/docs/", kind: "docs-index", repoRelPath: "README.md" });
for (const { category, tools } of catalog) {
  for (const { tool, platforms } of tools) {
    pages.set(`images/${category}/${tool}/README.md`, {
      route: `/docs/${category}/${tool}/`,
      kind: "tool",
      category,
      tool,
    });
    for (const platform of platforms) {
      pages.set(`images/${category}/${tool}/examples/${platform}/README.md`, {
        route: `/docs/${category}/${tool}/${platform}/`,
        kind: "example",
        category,
        tool,
        platform,
      });
    }
  }
}

/** Docs pages in reading order for prev/next pagination; the landing page is not part of it. */
export const readingOrder = [{ route: "/docs/", label: "Docs" }];
for (const { category, tools } of catalog) {
  for (const { tool, platforms } of tools) {
    readingOrder.push({ route: `/docs/${category}/${tool}/`, label: tool });
    for (const platform of platforms) {
      readingOrder.push({
        route: `/docs/${category}/${tool}/${platform}/`,
        label: `${tool} \u00b7 ${platformLabels[platform] ?? platform}`,
      });
    }
  }
}
