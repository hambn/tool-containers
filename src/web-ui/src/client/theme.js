// Apply theme before paint. Controls stay hidden until JavaScript is available.
(function () {
  document.documentElement.classList.add("js");
  var dark = matchMedia("(prefers-color-scheme: dark)").matches;
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") dark = stored === "dark";
  } catch {}
  document.documentElement.classList.toggle("dark", dark);
})();
