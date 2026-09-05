// Enhance static HTML. Reading and navigation also work without this script.
(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const syncThemeLabel = () =>
    themeToggle?.setAttribute(
      "aria-label",
      root.classList.contains("dark") ? "Use light theme" : "Use dark theme",
    );
  syncThemeLabel();
  themeToggle?.addEventListener("click", () => {
    const dark = root.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
    syncThemeLabel();
  });

  const navToggle = document.querySelector(".nav-toggle");
  const sidebar = document.getElementById("sidebar");
  const desktop = matchMedia("(min-width: 1024px)");
  const background = document.querySelectorAll(
    "main, .site-footer, .toc-col, .brand, .top-nav, .header-actions, .skip-link",
  );
  let drawerOpen = false;

  function setDrawer(open, returnFocus = true) {
    drawerOpen = open && !desktop.matches;
    document.body.classList.toggle("nav-open", drawerOpen);
    navToggle?.setAttribute("aria-expanded", String(drawerOpen));
    navToggle?.setAttribute(
      "aria-label",
      drawerOpen ? "Close navigation" : "Open navigation",
    );
    background.forEach((element) => {
      element.inert = drawerOpen;
    });
    if (drawerOpen) sidebar?.querySelector("input, a")?.focus();
    else if (returnFocus) navToggle?.focus();
  }
  navToggle?.addEventListener("click", () => setDrawer(!drawerOpen));
  document
    .querySelector(".backdrop")
    ?.addEventListener("click", () => setDrawer(false));
  sidebar?.addEventListener("click", (event) => {
    if (drawerOpen && event.target.closest("a")) setDrawer(false);
  });
  desktop.addEventListener("change", () => setDrawer(false, false));
  window.addEventListener("pageshow", () => setDrawer(false, false));

  // Filter existing HTML without downloading a search index.
  const catalogSearch = document.getElementById("catalog-search");
  const categoryButtons = [...document.querySelectorAll("[data-category]")];
  const catalogItems = [...document.querySelectorAll("[data-catalog-item]")];
  const catalogGroups = [...document.querySelectorAll("[data-catalog-group]")];
  const catalogEmpty = document.querySelector("[data-catalog-empty]");
  const catalogStatus = document.querySelector("[data-catalog-status]");
  let category = "";
  function filterCatalog() {
    const words = catalogSearch.value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    let matches = 0;
    catalogItems.forEach((item) => {
      const inCategory =
        !category ||
        item.closest("[data-catalog-group]").dataset.catalogGroup === category;
      item.hidden =
        !inCategory ||
        !words.every((word) => item.dataset.search.includes(word));
      if (!item.hidden) matches += 1;
    });
    catalogGroups.forEach((group) => {
      const selected = !category || group.dataset.catalogGroup === category;
      const hasItems = group.querySelector("[data-catalog-item]");
      group.hidden =
        !selected ||
        (hasItems
          ? !group.querySelector("[data-catalog-item]:not([hidden])")
          : words.length > 0);
    });
    categoryButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      ),
    );
    catalogEmpty.hidden =
      matches > 0 ||
      (!words.length &&
        category &&
        catalogGroups.some((group) => !group.hidden));
    catalogStatus.textContent = `${matches} ${matches === 1 ? "tool" : "tools"} found.`;
  }
  if (catalogSearch) {
    document.querySelector("[data-catalog-controls]").hidden = false;
    catalogSearch.addEventListener("input", filterCatalog);
    categoryButtons.forEach((button) =>
      button.addEventListener("click", () => {
        category = button.dataset.category;
        filterCatalog();
      }),
    );
    document
      .querySelector("[data-catalog-reset]")
      .addEventListener("click", () => {
        category = "";
        catalogSearch.value = "";
        filterCatalog();
        catalogSearch.focus();
      });
  }

  const navFilter = document.querySelector("[data-nav-filter]");
  navFilter?.addEventListener("input", () => {
    const query = navFilter.value.trim().toLowerCase();
    let matches = 0;
    sidebar.querySelectorAll("[data-nav-item]").forEach((item) => {
      item.hidden = !item.textContent.toLowerCase().includes(query);
      if (!item.hidden) matches += 1;
    });
    sidebar.querySelectorAll("[data-nav-group]").forEach((group) => {
      group.hidden = !group.querySelector("[data-nav-item]:not([hidden])");
    });
    document.querySelector("[data-nav-empty]").hidden = matches > 0;
  });

  document.addEventListener("keydown", (event) => {
    const typing =
      /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) ||
      document.activeElement.isContentEditable;
    if (
      event.key === "/" &&
      !typing &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const filter = catalogSearch ?? navFilter;
      if (filter) {
        event.preventDefault();
        if (filter === navFilter && !desktop.matches) setDrawer(true);
        filter.focus();
      }
    }
    if (event.key === "Escape" && drawerOpen) setDrawer(false);
    if (event.key === "Tab" && drawerOpen) {
      const focusable = [
        navToggle,
        ...sidebar.querySelectorAll("input, a, button"),
      ].filter((element) => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const copyStatus = document.createElement("span");
  copyStatus.className = "sr-only";
  copyStatus.setAttribute("role", "status");
  document.body.append(copyStatus);
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const code = button.closest(".code-card").querySelector("pre");
    try {
      await navigator.clipboard.writeText(code.innerText);
      button.classList.add("copied");
      button.setAttribute("aria-label", "Copied");
      copyStatus.textContent = "Code copied to clipboard.";
    } catch {
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent =
        "Clipboard unavailable. Code selected; use your browser's copy command.";
    }
    setTimeout(() => {
      button.classList.remove("copied");
      button.setAttribute("aria-label", "Copy code to clipboard");
      copyStatus.textContent = "";
    }, 2000);
  });

  const tocLinks = [...document.querySelectorAll(".toc-link")];
  if (tocLinks.length && "IntersectionObserver" in window) {
    const linkFor = new Map(
      tocLinks.map((link) => [decodeURIComponent(link.hash.slice(1)), link]),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).at(-1);
        if (!visible) return;
        tocLinks.forEach((link) => {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
        });
        const link = linkFor.get(visible.target.id);
        link.classList.add("active");
        link.setAttribute("aria-current", "location");
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );
    linkFor.forEach((_, id) => {
      const heading = document.getElementById(id);
      if (heading) observer.observe(heading);
    });
  }
})();
