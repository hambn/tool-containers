import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { uiRoot } from "./config.mjs";

/**
 * Content-addressed static assets. Styles and scripts are shared files rather
 * than per-page inline blocks: the browser fetches each once and reuses it
 * across every page, and the digest in the name makes them immutable to cache.
 */
export function createAssets({ distRoot, config }) {
  const written = new Map();

  function emit(name, contents) {
    if (written.has(name)) return written.get(name);
    const digest = createHash("sha256").update(contents).digest("hex").slice(0, 8);
    const extension = path.extname(name);
    const file = `${name.slice(0, -extension.length)}.${digest}${extension}`;
    const target = path.join(distRoot, "assets", file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
    const url = config.href(`/assets/${file}`);
    written.set(name, url);
    return url;
  }

  /** Create the parent directory of a dist-relative path and return it. */
  function prepare(to) {
    const target = path.join(distRoot, to);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    return target;
  }

  return {
    emit,
    /** Copy a file through verbatim, keeping its name (fonts, icons, images). */
    copy(from, to) {
      fs.copyFileSync(from, prepare(to));
    },
    write(to, contents) {
      fs.writeFileSync(prepare(to), contents);
    },
  };
}

/** Read a stylesheet from `src/`, resolving the deployment base path. */
export function readStyles(file, config) {
  return fs.readFileSync(path.join(uiRoot, "src", file), "utf8").replaceAll("{{base}}", config.basePath);
}

/**
 * Minify CSS conservatively: drop comments, collapse whitespace runs, and trim
 * the space around punctuation. Whitespace inside strings, `url()` and the
 * space-separated values of `calc()` and media queries is preserved, so the
 * output stays byte-identical in meaning to the source.
 */
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;\}/g, "}")
    .replace(/\band\(/g, "and (")
    .replace(/\bnot\(/g, "not (")
    .trim();
}

/** Minify inline JavaScript: strip line comments and indentation only. */
export function minifyJs(js) {
  return js
    .split("\n")
    .map((line) => line.replace(/^\s+/, "").replace(/\s*\/\/[^"'`]*$/, ""))
    .filter(Boolean)
    .join("");
}
