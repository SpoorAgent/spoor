// PNG exports of the SPOOR logo (run logo.mjs first):  npx electron konten-spoor/_src/logo-png.mjs
// Each SVG is inlined into an offscreen page drawn at its final pixel size (no zoom), one window per image.
import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url)), brand = path.resolve(here, "../brand"), site = path.resolve(here, "../../site/brand");
// [svg, png, width px, height px]; *clear / favicon keep a transparent background
const JOBS = [["spoor-mark.svg", "spoor-mark-1024.png", 1024, 1024], ["spoor-lockup.svg", "spoor-lockup.png", 1880, 560],
  ["spoor-lockup-stacked.svg", "spoor-pfp-1000.png", 1000, 1000], ["spoor-mark-flat.svg", "spoor-icon-512.png", 512, 512],
  ["spoor-favicon.svg", "spoor-favicon-192.png", 192, 192], ["spoor-mark-clear.svg", "spoor-mark-clear-1024.png", 1024, 1024]];
// same switches as render.mjs: software rendering, so it works without a usable GPU
app.commandLine.appendSwitch("disable-gpu-sandbox"); app.commandLine.appendSwitch("no-sandbox"); app.commandLine.appendSwitch("enable-unsafe-swiftshader");
app.commandLine.appendSwitch("force-color-profile", "srgb");

// one window per image: keep the app alive between them (by default Electron quits when the last window closes)
app.on("window-all-closed", () => {});
app.whenReady().then(async () => {
  try {
    for (const [svg, png, W, H] of JOBS) { try {
      const clear = /clear|favicon/.test(svg);
      const win = new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, enableLargerThanScreen: true, transparent: clear, backgroundColor: clear ? "#00000000" : "#141517",
        paintWhenInitiallyHidden: true, webPreferences: { offscreen: true, backgroundThrottling: false } });
      win.setContentSize(W, H);
      const inline = fs.readFileSync(path.join(brand, svg), "utf8").replace(/ width="\d+" height="\d+"/, ` width="${W}" height="${H}"`);
      await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block}</style>${inline}`));
      await new Promise((r) => setTimeout(r, 500));
      const img = await win.webContents.capturePage();
      for (const dir of [brand, site]) fs.writeFileSync(path.join(dir, png), img.toPNG());
      console.log("wrote", png, img.getSize().width + "x" + img.getSize().height); win.destroy();
    } catch (e) { console.error("FAILED", png, e.code || e.message); } }
  } catch (e) { console.error(e); process.exitCode = 1; }
  app.quit();
});
