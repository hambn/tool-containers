/**
 * Progressive enhancement for the generated site. Every feature is optional:
 * the page is fully readable and navigable with this file blocked, so each
 * block exits when the markup it enhances is absent.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;

  /* ------------------------------------------------------------- theme */

  var themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var dark = !root.classList.contains("dark");
      root.classList.toggle("dark", dark);
      try {
        localStorage.setItem("theme", dark ? "dark" : "light");
      } catch (error) {}
    });
  }

  /* ------------------------------------------------- navigation drawer */

  var navToggle = document.querySelector(".nav-toggle");
  var sidebar = document.getElementById("sidebar");

  function setDrawer(open) {
    body.classList.toggle("nav-open", open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    }
  }

  if (navToggle && sidebar) {
    navToggle.addEventListener("click", function () {
      setDrawer(!body.classList.contains("nav-open"));
    });
    var backdrop = document.querySelector(".backdrop");
    if (backdrop) backdrop.addEventListener("click", function () { setDrawer(false); });
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest("a")) setDrawer(false);
    });
    window.addEventListener("pageshow", function () { setDrawer(false); });
  }

  /* --------------------------------------------------------- copy code */

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    var code = button.closest(".code-card").querySelector("pre");
    navigator.clipboard.writeText(code.innerText).then(function () {
      button.classList.add("copied");
      button.setAttribute("aria-label", "Copied");
      setTimeout(function () {
        button.classList.remove("copied");
        button.setAttribute("aria-label", "Copy code to clipboard");
      }, 1600);
    }, function () {});
  });

  /* ----------------------------------------------------- filter the nav */

  var filter = document.querySelector("[data-nav-filter]");
  if (filter) {
    var empty = document.querySelector("[data-nav-empty]");
    filter.addEventListener("input", function () {
      var query = filter.value.trim().toLowerCase();
      var matches = 0;

      document.querySelectorAll("#sidebar [data-nav-item]").forEach(function (item) {
        var hit = !query || item.textContent.toLowerCase().indexOf(query) !== -1;
        item.hidden = !hit;
        if (hit) matches += 1;
      });
      document.querySelectorAll("#sidebar [data-nav-group]").forEach(function (group) {
        group.hidden = !group.querySelector("[data-nav-item]:not([hidden])");
      });
      if (empty) empty.hidden = matches > 0;
    });

    document.addEventListener("keydown", function (event) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        filter.focus();
        filter.select();
      }
      if (event.key === "Escape") {
        setDrawer(false);
        if (document.activeElement === filter) filter.blur();
      }
    });
  }

  /* --------------------------------------------------- table of contents */

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc-link"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    var headings = [];
    tocLinks.forEach(function (link) {
      var id = link.hash.slice(1);
      var heading = document.getElementById(id);
      if (!heading) return;
      linkFor[id] = link;
      headings.push(heading);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (link) {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
          });
          var link = linkFor[entry.target.id];
          if (link) {
            link.classList.add("active");
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );
    headings.forEach(function (heading) { observer.observe(heading); });
  }
})();
