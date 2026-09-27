// Progressive enhancement for the pre-rendered pages. Every page is complete
// without this script; it adds the theme toggle, copy buttons, the mobile
// drawer, TOC scrollspy, catalog filtering, and search.
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const html = document.documentElement;
  const announcer = Object.assign(document.createElement("p"), { className: "sr-only" });
  announcer.setAttribute("role", "status");
  document.body.append(announcer);
  const announce = (text) => (announcer.textContent = text);

  /* ---------------------------------------------------------- theme */
  const themeButton = $(".theme");
  const syncTheme = () => themeButton?.setAttribute("aria-pressed", String(html.classList.contains("dark")));
  syncTheme();
  themeButton?.addEventListener("click", () => {
    const dark = html.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
    syncTheme();
  });

  /* ----------------------------------------------------------- copy */
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const text = $("pre", button.closest("[data-copy-scope]")).innerText.replace(/^\$ /, "");
    try {
      await navigator.clipboard.writeText(text.trimEnd());
      button.classList.add("done");
      announce("Copied to clipboard.");
      setTimeout(() => button.classList.remove("done"), 1500);
    } catch {
      announce("Copy failed; select the text and copy it manually.");
    }
  });

  /* ------------------------------------------------- mobile drawer */
  const menu = $(".menu");
  const sidebar = $("#sidebar");
  const backdrop = $("[data-close-nav]");
  const setDrawer = (open) => {
    html.classList.toggle("nav-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    backdrop.hidden = !open;
    // Keep keyboard and screen-reader focus inside the open drawer.
    $$("main, .footer, .toc").forEach((element) => (element.inert = open));
    if (open) $("a[aria-current], a", sidebar).focus();
  };
  if (menu && sidebar) {
    menu.addEventListener("click", () => setDrawer(!html.classList.contains("nav-open")));
    backdrop.addEventListener("click", () => setDrawer(false));
    matchMedia("(min-width: 1024px)").addEventListener("change", () => setDrawer(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && html.classList.contains("nav-open")) {
        setDrawer(false);
        menu.focus();
      }
    });
  }

  /* ------------------------------------------------- TOC scrollspy */
  const tocLinks = $$(".toc a");
  if (tocLinks.length) {
    const byId = new Map(tocLinks.map((link) => [decodeURIComponent(link.hash.slice(1)), link]));
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // The active heading is the first one in document order in the band.
        const active = tocLinks.find((link) => visible.has(decodeURIComponent(link.hash.slice(1))));
        if (!active) return;
        tocLinks.forEach((link) => link.removeAttribute("aria-current"));
        active.setAttribute("aria-current", "true");
      },
      { rootMargin: "-64px 0px -70% 0px" },
    );
    byId.forEach((_link, id) => {
      const heading = document.getElementById(id);
      if (heading) observer.observe(heading);
    });
  }

  /* ----------------------------------------------- catalog filter */
  const filter = $("[data-filter]");
  if (filter) {
    const cards = $$(".card.tool");
    const groups = $$("[data-group]");
    const params = new URLSearchParams(location.search);
    filter.q.value = params.get("q") ?? "";
    for (const name of ["category", "platform"]) {
      const input = $(`input[name=${name}][value="${CSS.escape(params.get(name) ?? "")}"]`, filter);
      if (input) input.checked = true;
    }
    const apply = () => {
      const words = filter.q.value.toLowerCase().split(/\s+/).filter(Boolean);
      const category = filter.category.value;
      const platform = filter.platform.value;
      let shown = 0;
      for (const card of cards) {
        card.hidden = !(
          (!category || card.dataset.category === category) &&
          (!platform || card.dataset.platforms.split(" ").includes(platform)) &&
          words.every((word) => card.dataset.search.includes(word))
        );
        if (!card.hidden) shown += 1;
      }
      groups.forEach((group) => (group.hidden = !$(".card:not([hidden])", group)));
      $("[data-filter-empty]").hidden = shown > 0;
      $("[data-filter-status]").textContent = `${shown} ${shown === 1 ? "image" : "images"} shown.`;
      // Mirror the state in the URL so a filtered view can be shared.
      const next = new URLSearchParams();
      if (filter.q.value) next.set("q", filter.q.value);
      if (category) next.set("category", category);
      if (platform) next.set("platform", platform);
      history.replaceState(null, "", next.size ? `?${next}` : location.pathname);
    };
    filter.hidden = false;
    filter.addEventListener("input", apply);
    filter.addEventListener("submit", (event) => event.preventDefault());
    $("[data-filter-reset]").addEventListener("click", () => {
      filter.reset();
      apply();
      filter.q.focus();
    });
    if (location.search) apply();
  }

  /* --------------------------------------------------------- search */
  const trigger = $("[data-search-index]");
  let index;
  const loadIndex = () =>
    (index ??= fetch(trigger.dataset.searchIndex)
      .then((response) => response.json())
      .then(({ pages }) => {
        const fold = (text) => text.toLowerCase();
        return pages.map((page) => ({
          ...page,
          ft: fold(page.t),
          fk: fold(`${page.k} ${page.c}`),
          fd: fold(page.d),
          fs: page.s.map(([heading, id, text]) => ({ heading, id, text, fh: fold(heading), fx: fold(text) })),
        }));
      }));

  // Weight of a word hit in each field: title > keywords > headings > body.
  const hit = (text, word, weight) => {
    const at = text.indexOf(word);
    if (at < 0) return 0;
    const wordStart = at === 0 || /[^a-z0-9]/.test(text[at - 1]);
    return weight * (wordStart ? 2 : 1) * (text === word ? 2 : 1);
  };
  const score = (words, fields) => {
    let total = 0;
    for (const word of words) {
      const best = Math.max(...fields.map(([text, weight]) => hit(text, word, weight)));
      if (!best) return 0;
      total += best;
    }
    return total;
  };

  const query = (pages, text) => {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const results = [];
    for (const page of pages) {
      const pageScore = score(words, [[page.ft, 100], [page.fk, 40], [page.fd, 20]]);
      if (pageScore) results.push({ score: pageScore, title: page.t, url: page.u, context: page.c, text: page.d });
      let sections = 0;
      for (const section of page.fs) {
        // Page fields help a section match ("codex volumes"), but the
        // section must contribute at least one hit to earn its own result.
        if (sections >= 3 || !words.some((word) => section.fh.includes(word) || section.fx.includes(word))) continue;
        const own = score(words, [[section.fh, 30], [section.fx, 8], [page.ft, 1], [page.fk, 1]]);
        if (own) {
          sections += 1;
          results.push({ score: own, title: section.heading, url: `${page.u}#${section.id}`, context: page.t, text: section.text });
        }
      }
    }
    return { words, results: results.sort((a, b) => b.score - a.score).slice(0, 20) };
  };

  const escape = (text) => text.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);
  const mark = (text, words) => {
    const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return escape(text).replace(pattern, "<mark>$1</mark>");
  };
  // Centre the snippet on the first hit so the match is visible.
  const snippet = (text, words) => {
    const lower = text.toLowerCase();
    const at = Math.min(...words.map((word) => lower.indexOf(word)).filter((i) => i >= 0), text.length);
    const start = Math.max(0, at - 50);
    return (start ? "…" : "") + text.slice(start, start + 150) + (start + 150 < text.length ? "…" : "");
  };
  const resultHtml = ({ title, url, context, text }, words, id) =>
    `<li${id ? ` id="${id}" role="option" aria-selected="false"` : ""}><a href="${escape(url)}"><span class="r-context">${escape(context)}</span><span class="r-title">${mark(title, words)}</span><span class="r-text">${mark(snippet(text, words), words)}</span></a></li>`;

  /* The dialog is created on first use so pages carry no search markup. */
  let dialog;
  const openSearch = async () => {
    if (!dialog) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<dialog class="search" aria-label="Search documentation"><div class="field"><svg aria-hidden="true"><use href="#i-search"/></svg><input type="search" role="combobox" aria-expanded="true" aria-controls="search-list" aria-autocomplete="list" placeholder="Search tools, platforms, docs…" autocomplete="off" spellcheck="false" aria-label="Search"><kbd>Esc</kbd></div><ul id="search-list" role="listbox" aria-label="Results"></ul><p class="search-hint"><kbd>↑</kbd><kbd>↓</kbd> to move, <kbd>↵</kbd> to open</p></dialog>`,
      );
      dialog = $("dialog.search");
      const input = $("input", dialog);
      const list = $("ul", dialog);
      let active = -1;
      const select = (next) => {
        const items = $$("li", list);
        if (!items.length) return;
        active = (next + items.length) % items.length;
        items.forEach((item, i) => item.setAttribute("aria-selected", String(i === active)));
        input.setAttribute("aria-activedescendant", items[active].id);
        items[active].scrollIntoView({ block: "nearest" });
      };
      const render = async () => {
        const { words = [], results = [] } = query(await loadIndex(), input.value);
        active = -1;
        input.removeAttribute("aria-activedescendant");
        list.innerHTML = words.length
          ? results.length
            ? results.map((result, i) => resultHtml(result, words, `sr-${i}`)).join("")
            : `<li class="none">No results for “${escape(input.value)}”</li>`
          : "";
        if (results.length) select(0);
        announce(words.length ? `${results.length} results.` : "");
      };
      input.addEventListener("input", render);
      input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          select(active + (event.key === "ArrowDown" ? 1 : -1));
        } else if (event.key === "Enter" && active >= 0) {
          event.preventDefault();
          $$("li a", list)[active].click();
        }
      });
      // A click on the backdrop lands on the dialog element itself.
      dialog.addEventListener("click", (event) => event.target === dialog && dialog.close());
      list.addEventListener("click", (event) => event.target.closest("a") && dialog.close());
    }
    loadIndex();
    dialog.showModal();
    $("input", dialog).select();
  };

  if (trigger) {
    // Warm the index as soon as the reader shows intent.
    trigger.addEventListener("pointerenter", loadIndex, { once: true });
    $$("[data-search-index], [data-open-search]").forEach((element) =>
      element.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openSearch();
      }),
    );
    document.addEventListener("keydown", (event) => {
      const typing = event.target.closest?.("input, textarea, select, [contenteditable]");
      const shortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing);
      if (shortcut && !dialog?.open) {
        event.preventDefault();
        openSearch();
      }
    });
  }

  /* The /search/ page renders results in place from its `q` parameter. */
  const searchPage = $("[data-search-page]");
  if (searchPage) {
    const input = $("input", searchPage);
    const list = $("[data-search-results]", searchPage);
    const run = async () => {
      const { words = [], results = [] } = query(await loadIndex(), input.value);
      list.innerHTML = results.map((result) => resultHtml(result, words)).join("");
      list.hidden = !words.length;
      $("[data-search-all]").hidden = words.length > 0;
      $("[data-search-status]").textContent = words.length ? `${results.length} results for “${input.value}”.` : "";
      history.replaceState(null, "", words.length ? `?q=${encodeURIComponent(input.value)}` : location.pathname);
    };
    input.value = new URLSearchParams(location.search).get("q") ?? "";
    $("form", searchPage).addEventListener("submit", (event) => {
      event.preventDefault();
      run();
    });
    input.addEventListener("input", run);
    if (input.value) run();
    else input.focus();
  }
})();
