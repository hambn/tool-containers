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

// Copy buttons copy the text of their nearest [data-copy-source], minus the button itself.
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  event.preventDefault();
  const source = button.closest("[data-copy-source]");
  const code = source?.querySelector("pre, code");
  try {
    await navigator.clipboard.writeText((code ?? source).textContent.trimEnd());
    button.dataset.copied = "";
    setTimeout(() => delete button.dataset.copied, 1500);
  } catch {}
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
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.altKey) {
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
if (searchForm) loadSearch().then((ui) => ui.mountPage(searchForm));

// A link to a collapsed recipe file opens it.
function revealHash() {
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target instanceof HTMLDetailsElement) target.open = true;
}
addEventListener("hashchange", revealHash);
revealHash();

// Keep the current platform tab in view when the switcher scrolls sideways.
const currentTab = document.querySelector(".tabs-link[aria-current=page]");
if (currentTab) {
  const strip = currentTab.parentElement;
  strip.scrollLeft = currentTab.offsetLeft - (strip.clientWidth - currentTab.offsetWidth) / 2;
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
  save(RECENT_KEY, [{ t: pageName, u: path }, ...recent].slice(0, RECENT_MAX));
}

// Home catalog filter, matching words exactly as search does; state lives in the URL.
const filter = document.querySelector("[data-filter]");
if (filter) {
  const rows = [...document.querySelectorAll(".row")];
  const groups = [...document.querySelectorAll("[data-group]")];
  const status = document.querySelector("[data-filter-status]");
  const empty = document.querySelector("[data-filter-empty]");
  const fields = filter.elements;
  const params = new URLSearchParams(location.search);
  for (const name of ["q", "category", "platform"]) {
    const value = params.get(name);
    if (value && (fields[name].tagName !== "SELECT" || [...fields[name].options].some((option) => option.value === value))) fields[name].value = value;
  }
  const apply = () => {
    const terms = parseQuery(fields.q.value);
    const category = fields.category.value;
    const platform = fields.platform.value;
    let shown = 0;
    for (const row of rows) {
      const visible =
        (!category || row.dataset.category === category) &&
        (!platform || row.dataset.platforms.split(" ").includes(platform)) &&
        matchesAll(terms, row.dataset.text);
      row.hidden = !visible;
      if (visible) shown += 1;
    }
    for (const group of groups) {
      const count = group.querySelectorAll(".row:not([hidden])").length;
      group.hidden = count === 0;
      group.querySelector("[data-count]").textContent = count;
    }
    const filtered = terms.length || category || platform;
    empty.hidden = shown > 0;
    status.textContent = filtered ? `${shown} of ${rows.length} images` : "";
    const url = new URL(location.href);
    for (const name of ["q", "category", "platform"]) {
      const value = fields[name].value.trim();
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
