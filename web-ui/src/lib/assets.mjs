import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import { uiRoot } from "./config.mjs";

// Browsers with native `light-dark()`, `:has()`, and `<dialog>`; esbuild lowers nothing older.
const TARGETS = ["chrome123", "edge123", "firefox120", "safari17.5"];
const STYLES = ["base.css", "layout.css", "components.css", "prose.css"];

const digest = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

/** The content-addressed href of `/assets/<name>-<hash>.<ext>`, known before it is written. */
export const assetHref = (config, name, ext, content) => config.href(`/assets/${name}-${digest(content)}.${ext}`);

/**
 * Writes build output. Assets under /assets/ are content-addressed, so they
 * can be cached forever and a changed file always gets a new URL.
 * @param {string} outDir
 * @param {ReturnType<import("./config.mjs").resolveConfig>} config
 */
export function createOutput(outDir, config) {
  const assetsDir = path.join(outDir, "assets");
  mkdirSync(assetsDir, { recursive: true });
  const write = (file, content) => {
    const target = path.join(outDir, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  return {
    write,
    /** Write `/assets/<name>-<hash>.<ext>` and return its href. */
    asset(name, ext, content) {
      write(`assets/${name}-${digest(content)}.${ext}`, content);
      return assetHref(config, name, ext, content);
    },
    /** Bundle the stylesheets plus the syntax highlighting rules. */
    async css(extra) {
      const source = [...STYLES.map((file) => readFileSync(path.join(uiRoot, "src/styles", file), "utf8")), extra].join("\n");
      const { code } = await esbuild.transform(source, { loader: "css", minify: true, target: TARGETS });
      return this.asset("site", "css", code);
    },
    /**
     * Bundle the client entry; the search UI is split into a chunk that loads
     * on first use. Returns the entry's href.
     */
    async js() {
      const main = path.join(uiRoot, "src/client/main.js");
      const result = await esbuild.build({
        entryPoints: [main],
        bundle: true,
        splitting: true,
        format: "esm",
        minify: true,
        target: TARGETS,
        outdir: assetsDir,
        entryNames: "[name]-[hash]",
        chunkNames: "[name]-[hash]",
        metafile: true,
        write: false,
      });
      // Metafile paths are relative to the working directory; dynamic imports are entry points too.
      const relative = (file) => path.relative(process.cwd(), file);
      let entry = "";
      for (const file of result.outputFiles) {
        writeFileSync(file.path, file.contents);
        if (result.metafile.outputs[relative(file.path)]?.entryPoint === relative(main)) entry = path.basename(file.path);
      }
      if (!entry) throw new Error("esbuild produced no entry chunk");
      return config.href(`/assets/${entry}`);
    },
    /** Minified source for inlining in `<head>`. */
    async inlineScript(file) {
      const { code } = await esbuild.transform(readFileSync(path.join(uiRoot, "src/client", file), "utf8"), { minify: true, target: TARGETS });
      return code.trim();
    },
    /** Copy the committed static files (icons, social image) to the site root. */
    copyPublic() {
      const dir = path.join(uiRoot, "public");
      for (const name of readdirSync(dir)) write(name, readFileSync(path.join(dir, name)));
    },
  };
}

/**
 * A `favicon.ico` holding one PNG image: every browser that requests
 * /favicon.ico by convention accepts PNG-compressed ICO entries.
 * @param {Buffer} png
 */
export function pngToIco(png) {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  header.writeUInt8(width >= 256 ? 0 : width, 6);
  header.writeUInt8(height >= 256 ? 0 : height, 7);
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}
