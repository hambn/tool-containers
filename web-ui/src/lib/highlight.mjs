import path from "node:path";
import { createHighlighter } from "shiki";
import { escapeHtml } from "./html.mjs";

const THEMES = { light: "github-light", dark: "github-dark-default" };
const GRAMMARS = ["shellscript", "dockerfile", "yaml", "json", "toml", "markdown", "ini"];
const ALIASES = { bash: "shellscript", sh: "shellscript", shell: "shellscript", zsh: "shellscript", console: "shellscript", yml: "yaml", md: "markdown", env: "ini" };
const EXTENSIONS = { sh: "shellscript", bash: "shellscript", yml: "yaml", yaml: "yaml", json: "json", toml: "toml", md: "markdown", env: "ini", conf: "ini", ini: "ini" };

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
    const light = style["--shiki-light"] ?? "";
    const dark = style["--shiki-dark"] ?? "";
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
