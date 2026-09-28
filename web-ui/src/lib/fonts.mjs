import { readFileSync } from "node:fs";
import path from "node:path";
import { uiRoot } from "./config.mjs";

/**
 * Geist Sans and Geist Mono (SIL OFL 1.1, see OFL.txt), cut down from the
 * `geist` npm package's variable fonts to the Latin range and the weights the
 * stylesheet uses. web-ui/README.md has the command that made them.
 *
 * Each web font has a metric-matched local fallback: the fallback face is
 * scaled and given the web font's line metrics, so text keeps its size and
 * position when the web font swaps in and the page does not shift.
 */
export const FONTS = [
  {
    name: "sans",
    family: "Geist",
    file: "Geist-latin.woff2",
    weight: "400 700",
    preload: true,
    fallback: { family: "Geist Fallback", local: ["Arial", "ArialMT", "Liberation Sans", "Arimo"], sizeAdjust: "105.52%", ascent: "95.24%", descent: "27.96%" },
  },
  {
    name: "mono",
    family: "Geist Mono",
    file: "GeistMono-latin.woff2",
    weight: "400 600",
    preload: false,
    fallback: { family: "Geist Mono Fallback", local: ["Courier New", "CourierNewPSMT", "Liberation Mono", "Cousine"], sizeAdjust: "100%", ascent: "100.52%", descent: "29.5%" },
  },
];

const dir = path.join(uiRoot, "src/fonts");
export const fontFile = (font) => readFileSync(path.join(dir, font.file));
export const fontLicense = () => readFileSync(path.join(dir, "OFL.txt"));

/** `@font-face` rules for every font and its fallback; `hrefs` maps a font name to its asset URL. */
export function fontFaces(hrefs) {
  return FONTS.map(({ name, family, weight, fallback }) => {
    const local = fallback.local.map((face) => `local("${face}")`).join(", ");
    return [
      `@font-face{font-family:"${family}";src:url("${hrefs[name]}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap}`,
      `@font-face{font-family:"${fallback.family}";src:${local};size-adjust:${fallback.sizeAdjust};ascent-override:${fallback.ascent};descent-override:${fallback.descent};line-gap-override:0%}`,
    ].join("\n");
  }).join("\n");
}
