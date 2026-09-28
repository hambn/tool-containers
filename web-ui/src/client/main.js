import { fragmentId } from "../shared/fragment.mjs";
import { matchesAll, parseQuery } from "../shared/search.mjs";
import { load, save } from "./storage.js";

const root = document.documentElement;
const RECENT_KEY = "recent";
const RECENT_MAX = 5;
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform ?? navigator.platform);

// Theme: an explicit choice is stored; otherwise the OS preference applies.
const prefersDark = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => root.classList.contains("dark") || (!root.classList.contains("light") && prefersDark.matches);
function syncThemeButtons() {
  for (const button of document.querySelectorAll("[data-theme-toggle]")) button.setAttribute("aria-pressed", String(isDark()));
  // The browser chrome follows the chosen theme, not only the OS one.
  if (root.classList.contains("light") || root.classList.contains("dark")) {
    const color = getComputedStyle(document.body).backgroundColor;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = color;
  }
}
for (const button of document.querySelectorAll("[data-theme-toggle]")) {
  button.addEventListener("click", () => {
    const theme = isDark() ? "light" : "dark";
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    save("theme", theme);
    syncThemeButtons();
  });
}
prefersDark.addEventListener("change", syncThemeButtons);
syncThemeButtons();

// Copy buttons copy the code in their nearest [data-copy-source]; a live region announces it.
const announcer = document.querySelector("[data-announce]");
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  event.preventDefault();
  const source = button.closest("[data-copy-source]");
  const code = source?.querySelector("pre, code");
  try {
    await navigator.clipboard.writeText((code ?? source).textContent.trimEnd());
    button.dataset.copied = "";
    announcer.textContent = "Copied to clipboard";
    setTimeout(() => {
      delete button.dataset.copied;
      announcer.textContent = "";
    }, 1500);
  } catch {
    announcer.textContent = "Copy failed";
  }
});

// Mobile menu sheet: <dialog> gives the focus trap, Esc, and focus return.
const menu = document.getElementById("menu");
document.querySelector("[data-menu-open]")?.addEventListener("click", () => {
  menu.showModal();
  (menu.querySelector("[aria-current=page]") ?? menu.querySelector("a"))?.focus();
});
menu?.addEventListener("click", (event) => {
  if (event.target === menu || event.target.closest("[data-menu-close]")) menu.close();
});

// Search: the UI loads on first use; triggers are links to /search/ until then.
let searchUi;
const loadSearch = () => (searchUi ??= import("./search-ui.js").catch((error) => {
  searchUi = undefined;
  throw error;
}));
async function openSearch(query = "") {
  if (menu?.open) menu.close();
  const ui = await loadSearch();
  ui.openDialog(query);
}
for (const kbd of document.querySelectorAll("[data-hotkey]")) kbd.textContent = isMac ? "⌘K" : "Ctrl K";
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-search-open]");
  if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  openSearch().catch(() => (location.href = trigger.href));
});
document.addEventListener("keydown", (event) => {
  const typing = event.target.closest?.("input, textarea, select, [contenteditable]");
  // Autofill fires keydown events without a key.
  if ((event.metaKey || event.ctrlKey) && event.key?.toLowerCase() === "k" && !event.altKey) {
    // Also while the dialog is open, so the browser's own Ctrl+K never fires.
    event.preventDefault();
    const dialog = document.getElementById("search");
    if (dialog.open) dialog.close();
    else openSearch();
  } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    openSearch();
  }
});
// Warm the chunk when the pointer approaches a trigger.
document.querySelector("[data-search-open]")?.addEventListener("pointerenter", () => loadSearch().catch(() => {}), { once: true });

const searchForm = document.querySelector("[data-search-page]");
if (searchForm) {
  loadSearch()
    .then((ui) => ui.mountPage(searchForm))
    .catch(() => {
      document.querySelector("[data-search-count]").textContent = "Search could not load. Reload the page to try again.";
    });
}

const hashTarget = (hash) => {
  const id = fragmentId(hash);
  return id === null ? null : document.getElementById(id);
};

// A link to a collapsed recipe file opens it, then scrolls to it: the
// browser scrolled before the content above it had its final height.
function revealHash() {
  const target = hashTarget(location.hash);
  if (target instanceof HTMLDetailsElement && !target.open) {
    target.open = true;
    target.scrollIntoView();
  }
}
addEventListener("hashchange", revealHash);
revealHash();

// "On this page" marks the section being read: the last heading above the top third.
const tocLinks = new Map([...document.querySelectorAll(".toc a")].map((link) => [fragmentId(link.hash), link]));
const headings = [...tocLinks.keys()].map((id) => id !== null && document.getElementById(id)).filter(Boolean);
if (headings.length) {
  let current;
  const spy = () => {
    const line = innerHeight / 3;
    const active = headings.findLast((heading) => heading.getBoundingClientRect().top < line) ?? headings[0];
    if (active === current) return;
    tocLinks.get(current?.id)?.removeAttribute("aria-current");
    tocLinks.get(active.id)?.setAttribute("aria-current", "true");
    current = active;
  };
  // Fires whenever a heading crosses the line a third of the way down the viewport.
  const observer = new IntersectionObserver(spy, { rootMargin: "0px 0px -66% 0px" });
  for (const heading of headings) observer.observe(heading);
  spy();
}

// "On this page" below 1280px: close after a jump so the content is visible.
document.querySelector(".toc-inline")?.addEventListener("click", (event) => {
  if (event.target.closest("a")) event.currentTarget.open = false;
});

// Recently viewed docs pages feed the search dialog's empty state.
const pageName = document.body.dataset.pageName;
if (pageName) {
  const path = location.pathname;
  const recent = load(RECENT_KEY, []).filter((item) => item && item.u !== path);
  save(RECENT_KEY, [{ u: path }, ...recent].slice(0, RECENT_MAX));
}

// Home catalog filter, matching words as search does; state lives in the URL.
const filter = document.querySelector("[data-filter]");
if (filter) {
  const FIELDS = ["q", "category"];
  const rows = [...document.querySelectorAll(".row")];
  const groups = [...document.querySelectorAll("[data-group]")];
  const status = document.querySelector("[data-filter-status]");
  const empty = document.querySelector("[data-filter-empty]");
  const fields = filter.elements;
  const params = new URLSearchParams(location.search);
  for (const name of FIELDS) {
    const value = params.get(name);
    if (value && (fields[name].tagName !== "SELECT" || [...fields[name].options].some((option) => option.value === value))) fields[name].value = value;
  }
  const apply = () => {
    const terms = parseQuery(fields.q.value);
    const category = fields.category.value;
    const inCategory = rows.filter((row) => !category || row.dataset.category === category);
    // Exact and prefix matches first; a typo is forgiven only when nothing matches without one.
    let matching = inCategory.filter((row) => matchesAll(terms, row.dataset.text, { typos: false }));
    if (!matching.length) matching = inCategory.filter((row) => matchesAll(terms, row.dataset.text));
    const shown = new Set(matching);
    for (const row of rows) row.hidden = !shown.has(row);
    for (const group of groups) {
      const count = group.querySelectorAll(".row:not([hidden])").length;
      group.hidden = count === 0;
      group.querySelector("[data-count]").textContent = count;
    }
    empty.hidden = shown.size > 0;
    status.textContent = terms.length || category ? `${shown.size} of ${rows.length} images` : "";
    const url = new URL(location.href);
    for (const name of FIELDS) {
      const value = fields[name].value.trim().replace(/\s+/g, " ");
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    history.replaceState(history.state, "", url);
  };
  filter.addEventListener("input", apply);
  filter.addEventListener("submit", (event) => event.preventDefault());
  document.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
    filter.reset();
    apply();
    fields.q.focus();
  });
  if ([...params.keys()].length) apply();
}
root.classList.remove("filtering");
