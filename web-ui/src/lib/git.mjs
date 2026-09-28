import { execFileSync } from "node:child_process";

const git = (root, args) =>
  execFileSync("git", args, { cwd: root, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }).toString();

/**
 * Repository paths Git tracks (including staged changes). Discovery reads this
 * rather than the working tree so untracked scratch files never publish.
 */
export function trackedFiles(root) {
  return git(root, ["ls-files", "-z", "--", "README.md", "tools"]).split("\0").filter(Boolean);
}

/**
 * First and last commit timestamps (strict ISO 8601, `%cI`) for every tracked
 * path, from a single `git log` walk. Files never committed are absent, so
 * callers treat a missing entry as "no date" rather than inventing one.
 * @returns {Map<string, { published: string, modified: string }>}
 */
export function commitDates(root) {
  const dates = new Map();
  let date = "";
  for (const line of git(root, ["log", "--format=%x00%cI", "--name-only", "--", "README.md", "tools"]).split("\n")) {
    if (line.startsWith("\0")) date = line.slice(1);
    else if (line) {
      // The walk runs newest first: the first sighting is the last change.
      const entry = dates.get(line);
      if (entry) entry.published = date;
      else dates.set(line, { published: date, modified: date });
    }
  }
  return dates;
}

/** Earliest publication and latest modification across several paths. */
export function combinedDates(dates, paths) {
  let published = "";
  let modified = "";
  for (const file of paths) {
    const entry = dates.get(file);
    if (!entry) continue;
    if (!published || Date.parse(entry.published) < Date.parse(published)) published = entry.published;
    if (!modified || Date.parse(entry.modified) > Date.parse(modified)) modified = entry.modified;
  }
  return { published, modified };
}
