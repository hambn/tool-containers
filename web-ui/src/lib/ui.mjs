import { html, raw } from "./html.mjs";
import { platformLabel, platformRoute, registryLabel } from "./site.mjs";

/**
 * Markup shared by the Markdown renderer and the page templates. Every
 * builder takes the page's `icon` renderer and returns escaped `html`.
 */

/** A copy button; the client script copies the nearest `[data-copy-source]` text. */
export const copyButton = (icon, label) =>
  html`<button type="button" class="copy" data-copy aria-label="${label}">${raw(icon("copy"))}${raw(icon("check"))}</button>`;

/** True for an href that leaves the site. Internal routes are always root-relative. */
export const isExternal = (href) => /^https?:\/\//i.test(href);

/** Attributes and hidden text for a link that opens in a new tab. */
export const NEW_TAB = raw(' target="_blank" rel="noopener noreferrer"');
export const NEW_TAB_TEXT = raw('<span class="sr-only"> (opens in new tab)</span>');

/** An off-site link that opens in a new tab and says so; passing `icon` adds the external-link arrow. */
export function externalLink(href, content, { icon, className = "" } = {}) {
  const arrow = icon ? raw(icon("external")) : "";
  return html`<a${className ? html` class="${className}"` : ""} href="${href}"${NEW_TAB}>${content}${arrow}${NEW_TAB_TEXT}</a>`;
}

/** Every image reference of a tool, one per line with its registry and a copy button. */
export function imageList(images, icon) {
  return html`<ul class="images" aria-label="Images">${images.map(
    (image) =>
      html`<li class="image" data-copy-source><span class="image-registry">${registryLabel(image)}</span><code>${image}</code>${copyButton(icon, `Copy ${image}`)}</li>`,
  )}</ul>`;
}

/** Links to a tool's platform pages, in platform order. */
export function platformChips(tool, site) {
  if (!tool.platforms.length) return "";
  return html`<ul class="chips" aria-label="${tool.meta.title} platforms">${tool.platforms.map(
    (platform) => html`<li><a class="chip" href="${site.config.href(platformRoute(tool, platform))}">${platformLabel(platform)}</a></li>`,
  )}</ul>`;
}
