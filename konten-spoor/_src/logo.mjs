// SPOOR logo: a thick ring, wide on one side and thin on the other as if the band twists, with two spheres resting
// inside it: the "OO" of SPOOR, one bright and one in shade. Monochrome in the site's palette, kept light:
// light-to-mid greys and a white sphere on near-black #141517, light from the top left.
//   node konten-spoor/_src/logo.mjs   -> writes the SVGs into site/brand/ and konten-spoor/brand/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../..");
const OUT = [path.join(root, "site/brand"), path.join(root, "konten-spoor/brand")];
const BG = "#141517";

/** The mark inside a 120x120 box. grain: a fine speckle for large sizes; flat versions stay clean at icon size. */
function mark({ grain = true, id = "s" } = {}) {
  const cx = 60, cy = 60, R = 42;               // the ring's outer edge
  const hx = 64, hy = 56, hr = 27;              // the hole sits off-centre: a wide band lower left, a thin one upper right
  const circle = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const defs = `
<linearGradient id="${id}-band" gradientUnits="userSpaceOnUse" x1="18" y1="44" x2="104" y2="72"><stop offset="0" stop-color="#eef0f2"/><stop offset=".45" stop-color="#c3c5c9"/><stop offset="1" stop-color="#6c6e73"/></linearGradient>
<radialGradient id="${id}-glint" cx="38" cy="30" r="40" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
<clipPath id="${id}-ring"><path d="${circle(cx, cy, R)} ${circle(hx, hy, hr)}" clip-rule="evenodd"/></clipPath>
<linearGradient id="${id}-wall" gradientUnits="userSpaceOnUse" x1="92" y1="30" x2="70" y2="62"><stop offset="0" stop-color="#9b9da2"/><stop offset="1" stop-color="#55575c"/></linearGradient>
<linearGradient id="${id}-rim" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="100" y2="100"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".6" stop-color="#ffffff" stop-opacity=".12"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}-big" cx="42" cy="63" r="15" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e4e6e9"/><stop offset="1" stop-color="#9ea0a5"/></radialGradient>
<radialGradient id="${id}-small" cx="72" cy="39" r="12" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d9dbdf"/><stop offset=".55" stop-color="#9a9ca1"/><stop offset="1" stop-color="#606267"/></radialGradient>
<clipPath id="${id}-hole"><path d="${circle(hx, hy, hr)}"/></clipPath>
<filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>` +
    (grain ? `<filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="5.5" numOctaves="1" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .1  0 0 0 0 .11  1.8 0 0 0 -.95"/><feComposite in2="SourceGraphic" operator="in" result="speck"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="speck"/></feMerge></filter>` : "");
  const body = [
    // the shaded sphere sits behind the thin side of the band, partly hidden by it
    `<circle cx="76.5" cy="43" r="9" fill="url(#${id}-small)"/>`,
    // the band, with the inner wall showing on the far side where it turns away
    `<path d="${circle(cx, cy, R)} ${circle(hx, hy, hr)}" fill="url(#${id}-band)" fill-rule="evenodd"/>`,
    `<g clip-path="url(#${id}-hole)"><path d="${circle(hx, hy, hr)} ${circle(hx - 4.5, hy + 4.5, hr)}" fill="url(#${id}-wall)" fill-rule="evenodd"/></g>`,
    `<path d="${circle(cx, cy, R)} ${circle(hx, hy, hr)}" fill="url(#${id}-glint)" fill-rule="evenodd"/>`,
    `<path d="${circle(cx, cy, R - .4)}" fill="none" stroke="url(#${id}-rim)" stroke-width=".8"/>`,
    // the bright sphere rests on the wide side, casting a soft shadow onto the band
    `<g clip-path="url(#${id}-ring)"><ellipse cx="56" cy="83.5" rx="9.5" ry="3.2" fill="#3a3c41" opacity=".7" filter="url(#${id}-soft)"/></g>`,
    `<circle cx="48.5" cy="70" r="10.5" fill="url(#${id}-big)"/>`,
  ].join("");
  return { defs, body: `<g${grain ? ` filter="url(#${id}-grain)"` : ""}>${body}</g>` };
}

// the SPOOR wordmark, the same monoline letters as the site navigation (126 x 24, letters start at x=33)
const WORD = `<path d="M46 2h-8a5 5 0 0 0 0 10h3a5 5 0 0 1 0 10h-8"/><path d="M52 22V2h8a5 5 0 0 1 0 10h-8"/><path d="M71 8.5a6.5 6.5 0 0 1 13 0v7a6.5 6.5 0 0 1 -13 0Z"/><path d="M90 8.5a6.5 6.5 0 0 1 13 0v7a6.5 6.5 0 0 1 -13 0Z"/><path d="M109 22V2h8a5 5 0 0 1 0 10h-8m8 0 6 10"/>`;
const svg = (w, h, inner, defs = "", bg = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>${bg ? `<rect width="${w}" height="${h}" fill="${BG}"/>` : ""}${inner}</svg>\n`;

const files = {};
{ const m = mark({ grain: true, id: "g" }); files["spoor-mark.svg"] = svg(120, 120, m.body, m.defs); files["spoor-mark-clear.svg"] = svg(120, 120, m.body, m.defs, false); }
{ const m = mark({ grain: false, id: "f" }); files["spoor-mark-flat.svg"] = svg(120, 120, m.body, m.defs); files["spoor-favicon.svg"] = svg(120, 120, m.body, m.defs, false); }
{ // lockup: the mark, then the wordmark at 2.4x, optically centred on the ring
  const m = mark({ grain: true, id: "l" });
  files["spoor-lockup.svg"] = svg(470, 140, `<g transform="translate(10 10)">${m.body}</g><g transform="translate(${150 - 33 * 2.4} 41) scale(2.4)" fill="none" stroke="#f5f5f5" stroke-width="1.9" stroke-linecap="square">${WORD}</g>`, m.defs);
}
{ // stacked lockup for square spaces (profile pictures, app icons with a name)
  const m = mark({ grain: true, id: "k" });
  files["spoor-lockup-stacked.svg"] = svg(300, 300, `<g transform="translate(70 34) scale(1.333)">${m.body}</g><g transform="translate(${150 - (33 + 45) * 1.6} 236) scale(1.6)" fill="none" stroke="#f5f5f5" stroke-width="1.9" stroke-linecap="square">${WORD}</g>`, m.defs);
}
for (const dir of OUT) { fs.mkdirSync(dir, { recursive: true }); for (const [name, s] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), s); }
console.log("wrote", Object.keys(files).join(", "), "into", OUT.map((d) => path.relative(root, d)).join(" and "));
