// Applies the stored theme before first paint, so a dark-mode visitor never
// sees a white flash. Inlined in <head>; everything else is deferred.
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (error) {}
})();
