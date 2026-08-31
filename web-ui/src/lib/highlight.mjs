import { createHighlighter } from "shiki";
import { escapeHtml } from "./markdown.mjs";

const LANGUAGES = ["bash", "shellscript", "dockerfile", "yaml", "json", "text"];
const THEMES = { light: "github-light", dark: "github-dark-default" };

/** Fence languages the repository uses, mapped onto a grammar Shiki loads. */
const ALIASES = { sh: "bash", shell: "bash", zsh: "bash", yml: "yaml", console: "bash", "": "text" };

/**
 * A syntax theme for one build. Shiki emits an inline style per token; tokens
 * share a handful of colour pairs, so styles are interned into `.tk*` classes
 * and emitted once per page instead of once per token.
 */
export async function createTheme() {
  const highlighter = await createHighlighter({ themes: Object.values(THEMES), langs: LANGUAGES });
  const loaded = new Set(highlighter.getLoadedLanguages());
  const classes = new Map();

  const intern = (prefix, style) => {
    const key = `${prefix}:${style}`;
    if (!classes.has(key)) classes.set(key, { name: `${prefix}${classes.size}`, style });
    return classes.get(key).name;
  };

  return {
    /** Highlight one fence, returning HTML with interned token classes. */
    render(code, lang) {
      const grammar = ALIASES[lang] ?? lang;
      const html = highlighter.codeToHtml(code, {
        lang: loaded.has(grammar) ? grammar : "text",
        themes: THEMES,
        defaultColor: false,
      });
      return html
        .replace(/ class="(shiki[^"]*)" style="([^"]+)"/g, (_m, cls, style) => ` class="${cls} ${intern("ptk", style)}"`)
        .replace(/<span style="([^"]+)">/g, (_m, style) => `<span class="${intern("tk", style)}">`);
    },
    /** CSS for every token class interned so far; read after rendering. */
    css() {
      return [...classes.values()].map(({ name, style }) => `.${name}{${style}}`).join("");
    },
  };
}

/** Highlight a fence, falling back to escaped plain text if the grammar fails. */
export async function highlight(code, lang, theme) {
  try {
    return theme.render(code, lang);
  } catch {
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}
