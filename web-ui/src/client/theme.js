// Runs in <head> before first paint. Without a stored choice no class is set
// and the stylesheet follows the OS preference, with or without JavaScript.
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  try {
    const theme = localStorage.getItem("theme");
    if (theme === "light" || theme === "dark") root.classList.add(theme);
  } catch {}
  // A shared catalog link carries filters: keep the list unpainted until they
  // apply, so rows never visibly jump (see .filtering in the stylesheet).
  if (/[?&](q|category|platform)=/.test(location.search)) root.classList.add("filtering");
})();
