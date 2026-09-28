import { escapeHtml } from "../shared/escape.mjs";
import { createSearch, highlight, snippet } from "../shared/search.mjs";
import { load } from "./storage.js";

const DIALOG_PAGES = 8;
const DIALOG_SECTIONS = 3;
const KIND_ICON = { tool: "box", platform: "file", docs: "file" };

// Reuse the page's sprite so the chunk carries no icon markup.
const spriteHref = document.querySelector("svg.icon use")?.getAttribute("href").split("#")[0] ?? "";
const icon = (name) => `<svg class="icon i-${name}" aria-hidden="true"><use href="${escapeHtml(spriteHref)}#${name}"/></svg>`;

let engine;
/** The index loads once; a failed load is forgotten so the next attempt retries. */
function loadEngine() {
  engine ??= fetch(document.body.dataset.searchIndex)
    .then((response) => {
      if (!response.ok) throw new Error(`search index: HTTP ${response.status}`);
      return response.json();
    })
    .then(createSearch)
    .catch((error) => {
      engine = undefined;
      throw error;
    });
  return engine;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const sectionHref = (page, section) => `${page.u}#${encodeURIComponent(section.id)}`;

// Search dialog

const dialog = document.getElementById("search");
const input = document.getElementById("search-input");
const listbox = document.getElementById("search-results");
const status = document.getElementById("search-status");
const searchPath = new URL(document.querySelector("[data-search-open]").href).pathname;
let options = [];
let active = -1;
let pending = 0;

function option({ href, iconName, title, text = "", sub = false, context = "" }) {
  const id = `search-option-${options.length}`;
  options.push(id);
  return `<a role="option" id="${id}" class="option${sub ? " sub" : ""}" href="${escapeHtml(href)}" aria-selected="false">${icon(iconName)}<span class="option-body"><span class="option-title">${context ? `<span class="sr-only">${escapeHtml(context)} › </span>` : ""}${title}</span>${text ? `<span class="option-text">${text}</span>` : ""}</span></a>`;
}

// Result groups are labelled by their first option, the page itself, so only the empty state shows labels.
const group = (label, items, visible = true) =>
  items.length
    ? `<div role="group" class="option-group" aria-label="${escapeHtml(label)}">${visible ? `<div class="group-label" aria-hidden="true">${escapeHtml(label)}</div>` : ""}${items.join("")}</div>`
    : "";

function setActive(index) {
  if (active >= 0) document.getElementById(options[active])?.setAttribute("aria-selected", "false");
  active = options.length ? (index + options.length) % options.length : -1;
  if (active < 0) {
    input.removeAttribute("aria-activedescendant");
    return;
  }
  const element = document.getElementById(options[active]);
  element.setAttribute("aria-selected", "true");
  element.scrollIntoView({ block: "nearest" });
  input.setAttribute("aria-activedescendant", options[active]);
}

function show(markup, message) {
  listbox.innerHTML = markup;
  input.setAttribute("aria-expanded", String(options.length > 0));
  status.textContent = message;
  active = -1;
  setActive(0);
}

function emptyState(search) {
  const known = new Map(search.pages.map((page) => [new URL(page.u, location.href).pathname, page]));
  const recent = load("recent", [])
    .map((item) => known.get(item?.u))
    .filter(Boolean)
    .map((page) => option({ href: page.u, iconName: "clock", title: escapeHtml(page.t) }));
  const images = search.pages.filter((page) => page.k === "tool").map((page) => option({ href: page.u, iconName: "box", title: escapeHtml(page.t), text: escapeHtml(page.d) }));
  return group("Recent", recent) + group("Images", images);
}

function resultsMarkup(results, terms, limit, sectionLimit) {
  return results
    .slice(0, limit)
    .map(({ page, text, sections }) =>
      group(page.t, [
        option({ href: page.u, iconName: KIND_ICON[page.k] ?? "file", title: highlight(page.t, terms), text: snippet(text, terms, 120) }),
        ...sections.slice(0, sectionLimit).map((section) =>
          option({ href: sectionHref(page, section), iconName: "hash", title: highlight(section.heading, terms), text: section.text ? snippet(section.text, terms, 100) : "", sub: true, context: page.t }),
        ),
      ], false),
    )
    .join("");
}

async function update() {
  const query = input.value;
  const ticket = ++pending;
  let search;
  try {
    search = await loadEngine();
  } catch {
    if (ticket !== pending) return;
    show(`<div class="search-error"><p>Search could not load.</p><button type="button" class="button" data-search-retry>Try again</button></div>`, "Search could not load");
    return;
  }
  if (ticket !== pending) return;
  options = [];
  if (!query.trim()) {
    show(emptyState(search), "");
    return;
  }
  const { terms, results } = search.search(query);
  if (!results.length) {
    show(`<p class="search-empty">No results for “${escapeHtml(query.trim())}”</p>`, "No results");
    return;
  }
  let markup = resultsMarkup(results, terms, DIALOG_PAGES, DIALOG_SECTIONS);
  if (results.length > DIALOG_PAGES) {
    const href = `${searchPath}?q=${encodeURIComponent(query.trim())}`;
    markup += option({ href, iconName: "search", title: `Show all ${plural(results.length, "result")}` });
  }
  show(markup, plural(results.length, "result"));
}

export function openDialog(query = "") {
  input.value = query;
  if (!dialog.open) dialog.showModal();
  input.focus();
  input.select();
  update();
}

input.addEventListener("input", update);
input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    setActive(active + (event.key === "ArrowDown" ? 1 : -1));
  } else if (event.key === "Enter" && active >= 0) {
    event.preventDefault();
    const target = document.getElementById(options[active]);
    if (event.metaKey || event.ctrlKey) window.open(target.href, "_blank");
    else target.click();
  }
});
listbox.addEventListener("pointermove", (event) => {
  const target = event.target.closest("[role=option]");
  if (target && target.id !== options[active]) setActive(options.indexOf(target.id));
});
listbox.addEventListener("click", (event) => {
  if (event.target.closest("[data-search-retry]")) {
    update();
    input.focus();
  } else if (event.target.closest("[role=option]")) {
    // Same-page anchors do not unload the page, so close explicitly.
    dialog.close();
  }
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog || event.target.closest("[data-search-close]")) dialog.close();
});

// The /search/ page

function pageResults(results, terms) {
  return results
    .map(({ page, text, sections }) => {
      const nested = sections
        .map((section) => `<li><a href="${escapeHtml(sectionHref(page, section))}">${highlight(section.heading, terms)}</a>${section.text ? `<p>${snippet(section.text, terms)}</p>` : ""}</li>`)
        .join("");
      return `<li class="result"><a class="result-title" href="${escapeHtml(page.u)}">${highlight(page.t, terms)}</a><p>${snippet(text, terms)}</p>${nested ? `<ul class="result-sections">${nested}</ul>` : ""}</li>`;
    })
    .join("");
}

export function mountPage(form) {
  const field = form.elements.q;
  const list = document.querySelector("[data-search-list]");
  const count = document.querySelector("[data-search-count]");
  field.value = new URLSearchParams(location.search).get("q") ?? "";

  const render = async () => {
    const query = field.value.trim();
    let search;
    try {
      search = await loadEngine();
    } catch {
      count.innerHTML = `Search could not load. <button type="button" class="link-button" data-retry>Try again</button>`;
      count.querySelector("[data-retry]").addEventListener("click", render);
      return;
    }
    if (query !== field.value.trim()) return;
    const url = new URL(location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    history.replaceState(history.state, "", url);

    if (!query) {
      list.innerHTML = "";
      count.textContent = `Type to search ${plural(search.pages.length, "page")}.`;
      return;
    }
    const { terms, results } = search.search(query);
    list.innerHTML = pageResults(results, terms);
    count.textContent = results.length ? `${plural(results.length, "result")} for “${query}”` : `No results for “${query}”. Try fewer or different words.`;
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  field.addEventListener("input", render);
  render();
  if (!field.value) field.focus();
}
