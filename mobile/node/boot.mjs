// Android entry for the embedded Node.js runtime (capacitor-nodejs, Node 18).
// Points the engine at the app's private data folder, starts it, and tells the WebView where to go once it listens.
import { createRequire } from "node:module";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const require = createRequire(import.meta.url);
// `bridge` is only resolvable through NODE_PATH, which ESM `import` ignores, so it is loaded with require
let bridge = null;
try { bridge = require("bridge"); } catch (e) { console.error("bridge unavailable:", e.message); }
const send = (event, ...args) => { try { bridge?.channel.send(event, ...args); } catch (e) { console.error("send:", e.message); } };

// the project folder is overwritten on every app update, so state lives in the plugin's data folder
const data = bridge?.getDataPath?.() || process.env.DATADIR || path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data-rw");
fs.mkdirSync(data, { recursive: true });

// optional settings in <data>/spoor.env (KEY=VALUE lines); Node 18 has no process.loadEnvFile
const envFile = path.join(data, "spoor.env");
if (!fs.existsSync(envFile)) fs.writeFileSync(envFile, "# Spoor settings (KEY=VALUE). ANTHROPIC_API_KEY enables draft posts and the lab notebook.\nANTHROPIC_API_KEY=\nVOICE=on\nCYCLE_SECONDS=60\nRPC_URL=\n");
for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && m[2] !== "" && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
process.env.WORMBRAIN_DATA = data;
process.env.HOST = "127.0.0.1";
process.env.PORT ||= "5300";
const url = `http://127.0.0.1:${process.env.PORT}/`;

let ready = false;
bridge?.channel.on("where", () => { if (ready) send("engine-ready", url); });
try { await import("./bundle.mjs"); }
catch (e) { send("engine-error", String(e?.stack || e)); throw e; }

// the server binds asynchronously after import; wait until the port answers
const listening = () => new Promise((ok) => { const s = net.connect(+process.env.PORT, "127.0.0.1"); s.once("connect", () => { s.end(); ok(true); }); s.once("error", () => ok(false)); });
for (let i = 0; i < 240 && !ready; i++) { if (await listening()) ready = true; else await new Promise((r) => setTimeout(r, 250)); }
if (ready) send("engine-ready", url); else send("engine-error", `The engine did not start listening on ${url}`);
