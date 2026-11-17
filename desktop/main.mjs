// Spoor desktop: runs the engine inside Electron's Node, keeps its state in the per-user data folder,
// and shows the landing page in a window. Settings (API key, cycle length) live in a user-editable .env file,
// never inside the installer.
import { app, BrowserWindow, Menu, shell, dialog } from "electron";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TEMPLATE = `# Spoor settings. Edit, save, then choose Spoor → Restart engine.
# Optional: enables the worm's draft posts and the lab notebook (Claude). Leave empty to turn both off.
ANTHROPIC_API_KEY=
VOICE=on
VOICE_EVERY_HOURS=3
# Lab notebook: one research note every RESEARCH_EVERY_MIN minutes; RESEARCH=off stops it.
RESEARCH=on
RESEARCH_EVERY_MIN=5
CYCLE_SECONDS=60
# Optional private RPC for Robinhood Chain (the public one is used when empty).
RPC_URL=
`;

if (!app.requestSingleInstanceLock()) app.quit();

const userDir = () => app.getPath("userData");
const envFile = () => path.join(userDir(), "spoor.env");
let win = null, url = "";

/** First free port from `p` upward on 127.0.0.1. */
const freePort = (p) => new Promise((ok) => { const s = net.createServer(); s.once("error", () => ok(freePort(p + 1))); s.listen(p, "127.0.0.1", () => s.close(() => ok(p))); });

async function startEngine() {
  const data = path.join(userDir(), "data"); fs.mkdirSync(data, { recursive: true });
  if (!fs.existsSync(envFile())) fs.writeFileSync(envFile(), TEMPLATE);
  try { process.loadEnvFile(envFile()); } catch (e) { console.error("settings:", e.message); }
  for (const k of ["ANTHROPIC_API_KEY", "RPC_URL"]) if (process.env[k] === "") delete process.env[k];
  process.env.WORMBRAIN_DATA = data; process.env.HOST = "127.0.0.1";
  process.env.PORT = String(await freePort(5300));
  url = `http://localhost:${process.env.PORT}/`;
  // the engine starts its HTTP server and its cycle timer on import
  await import(pathToFileURL(path.join(app.getAppPath(), "server", "server.mjs")).href);
}

function createWindow() {
  win = new BrowserWindow({ width: 1360, height: 860, minWidth: 380, minHeight: 600, backgroundColor: "#000000", title: "Spoor", show: false,
    icon: path.join(app.getAppPath(), "desktop", "build", "icon.png"), webPreferences: { contextIsolation: true, sandbox: true } });
  win.once("ready-to-show", () => win.show());
  // the server may still be binding when the window opens: retry briefly
  let tries = 0; win.webContents.on("did-fail-load", () => { if (tries++ < 40) setTimeout(() => win?.loadURL(url), 250); });
  // anything outside the local engine opens in the system browser
  const local = (u) => u.startsWith(url);
  win.webContents.setWindowOpenHandler(({ url: u }) => { if (!local(u)) shell.openExternal(u); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, u) => { if (!local(u)) { e.preventDefault(); shell.openExternal(u); } });
  win.on("closed", () => (win = null));
  win.loadURL(url);
}

function menu() {
  const go = (p) => win?.loadURL(url + p);
  const tpl = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { label: "Spoor", submenu: [
      { label: "Landing page", accelerator: "CmdOrCtrl+1", click: () => go("") },
      { label: "Live dashboard", accelerator: "CmdOrCtrl+2", click: () => go("research") },
      { type: "separator" },
      { label: "Edit settings (API key)…", click: () => shell.openPath(envFile()) },
      { label: "Open data folder", click: () => shell.openPath(path.join(userDir(), "data")) },
      { label: "Restart engine", click: () => { app.relaunch(); app.exit(0); } },
      { type: "separator" },
      { label: "Open in browser", click: () => shell.openExternal(url) },
      ...(process.platform === "darwin" ? [] : [{ type: "separator" }, { role: "quit" }]),
    ] },
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on("window-all-closed", () => app.quit()); // closing the window stops the engine on every platform
app.whenReady().then(async () => {
  try { await startEngine(); }
  catch (e) { dialog.showErrorBox("Spoor could not start the engine", String(e?.stack || e)); app.exit(1); return; }
  menu(); createWindow();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
