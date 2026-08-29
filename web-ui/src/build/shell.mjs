import { repoUrl, basePath as base, siteOrigin } from "./catalog.mjs";
import { escapeHtml } from "./markdown.mjs";
import { sprite, icon } from "./icons.mjs";

/* --------------------------------------------------------------- top nav */

const NAV_ITEMS = [
  { label: "Home", href: "/", kinds: ["home"] },
  { label: "Docs", href: "/docs/", kinds: ["docs-index", "tool", "example"] },
];

function renderTopNav(kind) {
  const items = NAV_ITEMS.map((item) => {
    const active = item.kinds.includes(kind);
    return `<a class="top-link${active ? " active" : ""}"${
      active ? ' aria-current="page"' : ""
    } href="${base}${item.href}">${item.label}</a>`;
  }).join("");
  return `<nav class="top-nav" aria-label="Main">${items}</nav>`;
}

const HAS_SIDEBAR = new Set(["docs-index", "tool", "example"]);

/* ---------------------------------------------------------------- scripts */

function headScript() {
  return `(function(){try{var t=localStorage.getItem("theme")}catch(e){}var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")})();`;
}

function bodyScript() {
  return `(function(){
var d=document.documentElement;
var t=document.querySelector(".theme-toggle");
if(t)t.addEventListener("click",function(){var dark=!d.classList.contains("dark");d.classList.toggle("dark",dark);try{localStorage.setItem("theme",dark?"dark":"light")}catch(e){}});
var navBtn=document.querySelector(".nav-toggle");
function closeNav(){document.body.classList.remove("nav-open");if(navBtn)navBtn.setAttribute("aria-expanded","false")}
if(navBtn)navBtn.addEventListener("click",function(){var open=document.body.classList.toggle("nav-open");navBtn.setAttribute("aria-expanded",String(open))});
var b=document.querySelector(".backdrop");
if(b)b.addEventListener("click",closeNav);
document.addEventListener("keydown",function(e){
if(e.key==="Escape")closeNav();
if(e.key==="/"&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||"")){e.preventDefault();var f=document.querySelector("[data-nav-filter]");if(f){f.focus();f.select()}}
});
var sb=document.getElementById("sidebar");
if(sb)sb.addEventListener("click",function(e){if(e.target instanceof Element&&e.target.closest("a"))closeNav()});
window.addEventListener("pageshow",closeNav);
document.addEventListener("click",function(e){
if(!(e.target instanceof Element))return;
var btn=e.target.closest("[data-copy]");
if(!btn)return;
var pre=btn.closest(".code-card").querySelector("pre");
navigator.clipboard.writeText(pre.innerText).then(function(){
btn.classList.add("copied");btn.setAttribute("aria-label","Copied");
setTimeout(function(){btn.classList.remove("copied");btn.setAttribute("aria-label","Copy to clipboard")},1200)
}).catch(function(){})
});
var f=document.querySelector("[data-nav-filter]");
if(f)f.addEventListener("input",function(){
var q=f.value.trim().toLowerCase();
document.querySelectorAll("#sidebar [data-nav-group] .nav-link").forEach(function(a){a.style.display=q&&a.textContent.toLowerCase().indexOf(q)===-1?"none":""});
document.querySelectorAll("#sidebar [data-nav-group]").forEach(function(g){g.style.display=q&&!g.querySelector(".nav-link:not([style*=\\"none\\"])")?"none":""});
var em=document.querySelector("[data-nav-empty]");
if(em)em.style.display=q&&!document.querySelector("#sidebar [data-nav-group] .nav-link:not([style*=\\"none\\"])")?"":"none"
});
var links=[].slice.call(document.querySelectorAll(".toc-link"));
if(links.length&&"IntersectionObserver"in window){
var byId={};links.forEach(function(a){byId[a.hash.slice(1)]=a});
var heads=links.map(function(a){return document.getElementById(a.hash.slice(1))}).filter(Boolean);
var obs=new IntersectionObserver(function(entries){
entries.forEach(function(en){if(!en.isIntersecting)return;links.forEach(function(a){a.classList.remove("active")});var a=byId[en.target.id];if(a)a.classList.add("active")})
},{rootMargin:"-10% 0px -75% 0px"});
heads.forEach(function(h){obs.observe(h)})
}
})();`;
}

/* ------------------------------------------------------------------ shell */

/**
 * Shared page chrome: sprite, header with top navigation (Home / Docs) and a
 * mobile drawer toggle for layouts that ship a sidebar. Page modules build
 * their own body (landing layout or docs shell) and pass it as contentHtml.
 */
export function shell({ page, contentHtml, title, description, css, structuredData = null }) {
  const fullTitle = page.kind === "home" ? title : `${title} \u00b7 tool-containers`;
  const canonical = `${siteOrigin}${base}${page.route}`;
  const openGraphType = page.kind === "tool" || page.kind === "example" ? "article" : "website";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
${page.kind === "404" ? '<meta name="robots" content="noindex">\n' : ""}<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b">
<meta property="og:type" content="${openGraphType}">
<meta property="og:site_name" content="tool-containers">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(fullTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2318181b'/%3E%3Ctext x='5' y='21' fill='white' font-family='monospace' font-size='14'%3E%26gt;_%3C/text%3E%3C/svg%3E">
${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>` : ""}
<style>${css}</style>
<script>${headScript()}</script>
</head>
<body>
${sprite()}
<a class="skip-link" href="#content">Skip to content</a>
<header class="site-header">
<div class="header-inner">
${HAS_SIDEBAR.has(page.kind) ? `<button class="icon-btn nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">${icon("menu")}</button>\n` : ""}<a class="brand" href="${base}/"><span class="brand-mark">&gt;_</span><span>tool-containers</span></a>
${renderTopNav(page.kind)}
<div class="header-actions">
<a class="icon-btn" aria-label="View repository on GitHub" href="${repoUrl}">${icon("github")}</a>
<button class="icon-btn theme-toggle" type="button" aria-label="Toggle dark mode">${icon("sun", "ic-sun")}${icon("moon", "ic-moon")}</button>
</div>
</div>
</header>
${contentHtml}
<script>${bodyScript()}</script>
</body>
</html>
`;
}
