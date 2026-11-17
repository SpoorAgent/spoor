// Renders the Spoor X kit with the Electron that the desktop app already uses (works on Windows, macOS and Linux).
// Needs the engine running (npm start) for the coin, the product screenshots and the connectome.
//   npx electron konten-spoor/_src/render.mjs              -> everything
//   npx electron konten-spoor/_src/render.mjs cards brand  -> only some parts (sphere, cards, brand, product)
//   BASE=http://127.0.0.1:5300 overrides the engine address.
import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import R from "./research.mjs";
const slug = (k) => k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); // same as posts.mjs

const here = path.dirname(fileURLToPath(import.meta.url)), kit = path.resolve(here, ".."), BASE = process.env.BASE || "http://127.0.0.1:5300";
const want = new Set(process.argv.slice(2).filter((a) => /^(sphere|cards|brand|product)$/.test(a))); const on = (k) => !want.size || want.has(k);
app.commandLine.appendSwitch("disable-gpu-sandbox"); app.commandLine.appendSwitch("no-sandbox"); app.commandLine.appendSwitch("enable-unsafe-swiftshader");
app.commandLine.appendSwitch("force-color-profile", "srgb");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (rel, img) => { const f = path.join(kit, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, img.toPNG()); console.log("wrote", rel, `${img.getSize().width}x${img.getSize().height}`); };

/** A hidden offscreen window whose CSS viewport is w x h, painted at `scale` device pixels per CSS pixel.
 *  enableLargerThanScreen + setContentSize let it exceed the screen; very large sizes (over ~2600 px) stall, so keep scale modest. */
async function page(url, w, h, scale = 1.2) {
  const W = Math.round(w * scale), H = Math.round(h * scale);
  const win = new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, enableLargerThanScreen: true, backgroundColor: "#000000", paintWhenInitiallyHidden: true,
    webPreferences: { offscreen: true, zoomFactor: scale, backgroundThrottling: false } });
  win.setContentSize(W, H); win.webContents.setFrameRate(30); await win.loadURL(url); win.webContents.setZoomFactor(scale);
  await win.webContents.executeJavaScript("document.fonts.ready.then(() => true)"); win.scale = scale; return win;
}
const js = (win, code) => win.webContents.executeJavaScript(code);
/** The viewport, or a CSS-pixel rect of it, at device resolution. */
const shot = (win, rect) => win.webContents.capturePage(rect && { x: Math.round(rect.x * win.scale), y: Math.round(rect.y * win.scale), width: Math.round(rect.width * win.scale), height: Math.round(rect.height * win.scale) });

async function sphere() {
  // the hero's particle sphere, alone: everything but the WebGL scene is hidden, then the bright particles are found
  // (top 62% only, so the terrain lines below stay out) and a square is cropped around them
  const win = await page(BASE + "/", 1600, 900, 1.6); await wait(7000);
  await js(win, "(() => { const s = document.createElement('style'); s.textContent = '.nav,main,footer,.vig,.glow,.grain,#code,.ribbon{visibility:hidden!important}'; document.head.append(s); return true; })()");
  await wait(800);
  const img = await shot(win), { width: W, height: H } = img.getSize(), px = img.toBitmap();
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H * 0.62; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (px[i] + px[i + 1] + px[i + 2] > 420) { sx += x; sy += y; n++; } }
  if (!n) throw new Error("no sphere found on the home page");
  const side = Math.round(Math.min(W, H) * 0.62), x0 = Math.max(0, Math.round(sx / n - side / 2)), y0 = Math.max(0, Math.round(sy / n - side / 2));
  out("brand/sphere.png", img.crop({ x: x0, y: y0, width: side, height: side })); win.destroy();
}

async function cards() {
  const con = await (await fetch(BASE + "/api/connectome")).json();
  const win = await page(pathToFileURL(path.join(here, "card.html")).href, 1600, 900, 1.2);
  await js(win, `setNet(${JSON.stringify(con.neurons)}, ${JSON.stringify(con.chem)}); true`);
  for (const [i, d] of R.entries()) {
    const n = String(i + 1).padStart(2, "0");
    await js(win, `set(${JSON.stringify({ k: `FIELD NOTES №${n}<i>·</i>${d.k}`, h: d.h, s: d.s, c: d.c, n: d.n })}); true`); await wait(160);
    out(`research/${n}-${slug(d.k)}.png`, await shot(win));
  }
  win.destroy();
}

async function brand() {
  if (!fs.existsSync(path.join(kit, "brand/sphere.png"))) throw new Error("brand/sphere.png is missing: render the sphere first");
  const parts = { banner: [1500, 500, 1.6, "x-banner"], pfp: [1000, 1000, 1, "x-pfp"], og: [1200, 630, 1, "og"], launch: [1600, 900, 1.2, "launch"], teaser: [1600, 900, 1.2, "teaser"] };
  for (const [part, [w, h, s, name]] of Object.entries(parts)) {
    const win = await page(pathToFileURL(path.join(here, "brand.html")).href + "?part=" + part, w, h, s); await wait(400);
    out(`brand/${name}.png`, await shot(win)); win.destroy();
  }
}

async function product() {
  // live screenshots, 1600x900 CSS at 1.2x. Landing sections first, then the lab.
  // home sections: the brain (0 language models), four brains (live scouts), the lab notebook
  const SHOTS = [["/", "#top", "hero", 4500], ["/", "#signals", "signals", 1200], ["/", "#intro", "live", 1200], ["/", "#lab", "research", 1200],
    ["/research", "#think", "think", 3000, "decisive"], ["/research", "#track", "track", 600], ["/research", "#books", "books", 600], ["/research", "#scouts", "scouts", 600], ["/research", "#learn", "learn", 600], ["/research", "#lab", "lab", 900]];
  const wins = {};
  for (const [url, sel, name, ms, mode] of SHOTS) {
    if (!wins[url]) { wins[url] = await page(BASE + url, 1600, 900, 1.2); await wait(2500); await js(wins[url], "(() => { const s = document.createElement('style'); s.textContent = '::-webkit-scrollbar{display:none} .body,.rail,.rv,.line>span,.kin{opacity:1!important;transform:none!important;translate:none!important}'; document.head.append(s); return true; })()"); }
    const win = wins[url];
    // the think shot replays the last sniff that led to a trade, caught mid-replay
    if (mode === "decisive") await js(win, "(() => { const b = document.querySelector('#src'); if (b && !b.disabled && SRC === 'latest') b.click(); else if (window.load && window.cur) load(cur()); return true; })()");
    await js(win, `(() => { document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')); const el = document.querySelector(${JSON.stringify(sel)});
      window.scrollTo({ top: ${sel === "#top" ? 0 : `el.getBoundingClientRect().top + scrollY - 72`}, behavior: 'instant' }); return true; })()`);
    await wait(ms); out(`product/${name}.png`, await shot(win));
  }
  Object.values(wins).forEach((w) => w.destroy());
}

app.whenReady().then(async () => {
  try { if (on("sphere")) await sphere(); if (on("cards")) await cards(); if (on("brand")) await brand(); if (on("product")) await product(); }
  catch (e) { console.error(e); process.exitCode = 1; }
  app.quit();
});
app.on("window-all-closed", () => {});
