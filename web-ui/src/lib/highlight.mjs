import path from "node:path";
import { createHighlighter } from "shiki";
import { escapeHtml } from "./html.mjs";

const THEMES = { light: "github-light", dark: "github-dark-default" };
// --code-bg in base.css; token colours are adjusted until they hold 4.5:1 on it.
const CODE_BG = { light: "#fafafa", dark: "#151518" };
const MIN_CONTRAST = 4.5;

const channels = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** `color`, darkened (on a light background) or lightened (on a dark one) just enough to read on `background`. */
export function readable(color, background) {
  if (!/^#[\da-f]{6}$/i.test(color)) return color;
  const target = luminance(background) > 0.5 ? 0 : 255;
  let rgb = channels(color);
  for (let step = 0; step < 50 && contrast(`#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`, background) < MIN_CONTRAST; step += 1) {
    rgb = rgb.map((c) => Math.round(c + (target - c) * 0.05));
  }
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
const GRAMMARS = ["shellscript", "dockerfile", "yaml", "json", "toml", "markdown", "ini"];
const ALIASES = { bash: "shellscript", sh: "shellscript", shell: "shellscript", zsh: "shellscript", console: "shellscript", yml: "yaml", md: "markdown", env: "ini" };
const EXTENSIONS = { sh: "shellscript", bash: "shellscript", yml: "yaml", yaml: "yaml", json: "json", toml: "toml", md: "markdown", env: "ini", conf: "ini", ini: "ini" };

const LABELS = { shellscript: "Shell", dockerfile: "Dockerfile", yaml: "YAML", json: "JSON", toml: "TOML", markdown: "Markdown", ini: "INI" };

/** The name a code block's header shows for its fence language. */
export function languageLabel(lang = "") {
  const key = lang.toLowerCase();
  return LABELS[ALIASES[key] ?? key] ?? (key && key !== "text" ? key : "Text");
}

/** Highlighting grammar for a recipe file, chosen by its name. */
export function fileLanguage(name) {
  const base = path.posix.basename(name);
  if (/^Dockerfile|\.Dockerfile$|^Containerfile/i.test(base)) return "dockerfile";
  return EXTENSIONS[path.posix.extname(base).slice(1).toLowerCase()] ?? "text";
}

/**
 * A syntax highlighter for one build. Shiki reports a light/dark colour pair
 * per token; tokens share few distinct pairs, so each pair becomes one CSS
 * class instead of an inline style on every span. Tokens in the theme's
 * default colour get no span at all and inherit the page foreground.
 */
export async function createCodeHighlighter() {
  const highlighter = await createHighlighter({ themes: Object.values(THEMES), langs: GRAMMARS });
  const loaded = new Set(highlighter.getLoadedLanguages());
  const defaults = `${highlighter.getTheme(THEMES.light).fg}|${highlighter.getTheme(THEMES.dark).fg}`.toLowerCase();
  const classes = new Map();

  const className = (style) => {
    const light = readable(style["--shiki-light"] ?? "", CODE_BG.light);
    const dark = readable(style["--shiki-dark"] ?? "", CODE_BG.dark);
    const key = `${light}|${dark}`.toLowerCase();
    if (key === defaults || key === "|") return "";
    if (!classes.has(key)) classes.set(key, { name: `t${classes.size.toString(36)}`, light, dark });
    return classes.get(key).name;
  };

  return {
    /** Highlight code as `<pre><code>` HTML; unknown languages render as plain text. */
    render(code, lang = "") {
      const grammar = ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
      if (!loaded.has(grammar)) return `<pre><code>${escapeHtml(code)}</code></pre>`;
      const { tokens } = highlighter.codeToTokens(code, { lang: grammar, themes: THEMES, defaultColor: false });
      const lines = tokens.map((line) =>
        line
          .map(({ content, htmlStyle = {} }) => {
            const name = content.trim() ? className(htmlStyle) : "";
            return name ? `<span class="${name}">${escapeHtml(content)}</span>` : escapeHtml(content);
          })
          .join(""),
      );
      return `<pre><code>${lines.join("\n")}</code></pre>`;
    },
    /** CSS for every token class used so far; read after the last render. */
    css() {
      return [...classes.values()].map(({ name, light, dark }) => `.${name}{color:light-dark(${light},${dark})}`).join("");
    },
  };
}
