import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { transformSync } from "esbuild";
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
    const digest = createHash("sha256")
      .update(contents)
      .digest("hex")
      .slice(0, 8);
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
  return fs
    .readFileSync(path.join(uiRoot, "src", file), "utf8")
    .replaceAll("{{base}}", config.basePath);
}

/** Use a parser so quoted strings, URLs, and JavaScript syntax survive minification. */
export function minifyCss(css) {
  return transformSync(css, {
    loader: "css",
    minify: true,
    legalComments: "none",
    target: "es2022",
  }).code.trim();
}

export function minifyJs(js) {
  return transformSync(js, {
    loader: "js",
    minify: true,
    legalComments: "none",
    target: "es2022",
  }).code.trim();
}
