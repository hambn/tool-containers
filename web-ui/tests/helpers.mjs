import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const DESCRIPTION = (subject) => `${subject} ships as a container image with Ubuntu and Alpine variants, and its documentation describes every supported deployment.`.slice(0, 150);

export const toolReadme = (slug, overrides = {}) => {
  const data = {
    name: slug,
    title: slug.toUpperCase(),
    description: DESCRIPTION(`The ${slug} tool`),
    image: `ghcr.io/hambn/${slug}`,
    keywords: ["one", "two", "three"],
    ...overrides,
  };
  return frontmatter(data, `# ${data.title}\n\nThe ${slug} lead paragraph.\n\n## Usage\n\nRun it.\n`);
};

export const platformReadme = (name, overrides = {}) => {
  const data = { name, description: DESCRIPTION(`Running on ${name}`), usecase: `Run on ${name}`, ...overrides };
  return frontmatter(data, `# ${name}\n\nThe ${name} lead.\n\n## Commands\n\nSteps.\n`);
};

function frontmatter(data, body) {
  const yaml = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
  return `---\n${yaml}\n---\n\n${body}`;
}

/** A throwaway Git repository with the given files committed. */
export function fixtureRepo(files) {
  const root = mkdtempSync(path.join(tmpdir(), "web-ui-fixture-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
  git("init", "-q");
  git("add", "-A");
  git("-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "-q", "-m", "fixture");
  return root;
}

export const tempDir = (prefix) => mkdtempSync(path.join(tmpdir(), prefix));
