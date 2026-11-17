// Spoor server: runs a cycle every CYCLE_SECONDS, serves the site and a read-only JSON API on localhost only.
// Pages: / (home) and /research (the lab). /app.html is the old address and redirects to /research.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import * as E from "./engine.mjs";
import * as V from "./voice.mjs";
import * as RS from "./research.mjs";
import crypto from "node:crypto";
import * as T from "./burn.mjs";
import { label, clean } from "./brand.mjs";
const PORT = +(process.env.PORT || 5300), HOST = process.env.HOST || "127.0.0.1", EVERY = +(process.env.CYCLE_SECONDS || 60) * 1000;
const SITE = fileURLToPath(new URL("../site/", import.meta.url)), TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff", ".webp": "image/webp", ".ico": "image/x-icon", ".map": "application/json", ".glb": "model/gltf-binary" };
let busy = false, lastErr = null; const NEURONS = E.connectome().neurons;
// a buyback waits for a running cycle to finish so the two never share the RPC rate limit
const idle = async () => { for (let i = 0; busy && i < 40; i++) await new Promise((r) => setTimeout(r, 500)); };
async function tick() { if (busy || T.quiet()) return; busy = true; try { await E.cycle(); lastErr = null; RS.observe(E.S, NEURONS); } catch (e) { lastErr = String(e.message || e); console.error("cycle error:", lastErr); } finally { busy = false; } }
const pub = () => { const S = E.S; const books = Object.fromEntries(Object.entries(S.books).map(([k, b]) => [k, { name: label(k), cash: b.cash, pos: b.pos, trades: b.trades.slice(0, 60), equity: b.equity.filter((_, i, a) => a.length < 1500 || i % Math.ceil(a.length / 1500) === 0 || i === a.length - 1), paused: b.equity.length ? b.equity.at(-1)[1] < b.dayStart.v * (1 - E.RULES.dailyStop) : false }]));
  return { now: Date.now(), started: S.started, cycle: S.cycle, lastCycleMs: S.lastCycleMs, every: EVERY / 1000, error: lastErr, prices: S.prices, matrix: S.matrix, books, learn: S.learn, learnStats: S.learnStats, trader: S.trader, brain: S.brain, log: S.log.slice(0, 60).map((l) => ({ ...l, m: clean(l.m) })), rules: E.RULES, assets: E.assets.map((a) => ({ sym: a.sym, token: a.token, pool: a.pool })) }; };
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
// /studio: the owner sets the CA and runs buybacks by hand. Key from STUDIO_KEY in .env, or data/burn/secrets.json.
const digest = (x) => crypto.createHash("sha256").update(String(x)).digest(), misses = new Map();
const ipOf = (req) => (/^(::ffff:)?127\.0\.0\.1$|^::1$/.test(req.socket.remoteAddress || "") && req.headers["x-real-ip"]) || req.socket.remoteAddress || "";
function studioOk(req) {
  const ip = ipOf(req), now = Date.now(), m = (misses.get(ip) || []).filter((t) => now - t < 10 * 60e3);
  if (m.length >= 10) return "locked";
  if (crypto.timingSafeEqual(digest(req.headers["x-studio-key"] || ""), digest(T.STUDIO_KEY))) return "ok";
  misses.set(ip, [...m, now]); if (misses.size > 5000) misses.clear(); return "bad";
}
const body = (req) => new Promise((ok, no) => { let b = ""; req.on("data", (c) => { b += c; if (b.length > 8000) { no(new Error("Request too large.")); req.destroy(); } }); req.on("end", () => { try { ok(JSON.parse(b || "{}")); } catch { no(new Error("Bad JSON.")); } }); });
async function studio(req, res, u) {
  const a = studioOk(req); if (a !== "ok") return json(res, a === "locked" ? 429 : 401, { error: a === "locked" ? "Too many wrong keys. Wait 10 minutes." : "Wrong studio key." });
  const k = `${req.method} ${u.pathname.slice("/api/studio".length)}`;
  try {
    if (k === "GET /status") return json(res, 200, await T.status());
    if (k === "POST /token") return json(res, 200, await T.saveToken(await body(req)));
    if (k === "POST /wallet") return json(res, 200, T.saveKey((await body(req)).privateKey || ""));
    if (k === "DELETE /wallet") return json(res, 200, T.removeKey());
    if (k === "POST /buyback") { const usd = (await body(req)).usd; await idle(); return json(res, 200, await T.buyback(usd)); }
    if (k === "POST /supply") { const usd = (await body(req)).usd; await idle(); return json(res, 200, await T.burnSupply(usd)); }
    if (k === "POST /burn-held") { await idle(); return json(res, 200, await T.burnHeld()); }
    return json(res, 404, { error: "Not found." });
  } catch (e) { return json(res, 400, { error: e.shortMessage || e.message }); }
}
const handle = (req, res) => { const u = new URL(req.url, "http://x");
  // the lab lives at /research; old links to /app.html still land there
  if (u.pathname === "/app.html") { res.writeHead(301, { location: "/research" + u.search }); return res.end(); }
  if (u.pathname === "/research" || u.pathname === "/research/") u.pathname = "/app.html";
  if (u.pathname === "/api/state") return json(res, 200, pub());
  if (u.pathname === "/api/connectome") return json(res, 200, E.connectome());
  // read-only price history (26 h of mids) and the 15-minute swap-flow window for one asset
  if (u.pathname === "/api/history") { const sym = u.searchParams.get("sym") || ""; if (!E.assets.some((a) => a.sym === sym)) return json(res, 400, { error: "Unknown sym." }); return json(res, 200, { sym, hist: E.S.hist?.[sym] || [], flow: E.S.flowWin?.[sym] || [] }); }
  if (u.pathname === "/api/token") return T.publicView().then((v) => json(res, 200, v), (e) => json(res, 500, { error: e.message }));
  if (u.pathname.startsWith("/api/studio/")) return studio(req, res, u);
  if (u.pathname === "/studio") u.pathname = "/studio.html";
  // the lab notebook: GET reads it, POST asks Claude for a note now (at most once a minute)
  if (u.pathname === "/api/research") { if (req.method === "POST") { if (Date.now() - (RS.R.notes[0]?.t ?? 0) < 60e3) return json(res, 429, { error: "a note was written less than a minute ago" }); return RS.study(E.S, "asked by a reader").then((n) => json(res, n.error ? 409 : 200, n)); } return json(res, 200, RS.view(clean)); }
  if (u.pathname === "/api/voice") { if (req.method === "POST") { if (Date.now() - (V.VOICE.drafts[0]?.t ?? 0) < +(process.env.VOICE_GAP_MIN || 10) * 60e3) return json(res, 429, { error: "spoor is still thinking, try later" }); if (V.VOICE.drafts.filter((d) => Date.now() - d.t < 864e5).length >= +(process.env.VOICE_PER_DAY || 30)) return json(res, 429, { error: "enough drafts for today" }); return V.draft(E.S).then((d) => json(res, d.error ? 502 : 200, d)).catch((e) => json(res, 502, { error: String(e.message || e) })); } return json(res, 200, { drafts: V.VOICE.drafts.slice(0, 10).map(({ t, text, model }) => ({ t, text: clean(text), model })), enabled: process.env.VOICE === "on" }); }
  let f = path.normalize(path.join(SITE, u.pathname === "/" ? "index.html" : u.pathname)); if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  // pages revalidate so an update shows up on the next load; hashed assets may stay cached
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", ...(f.endsWith(".html") ? { "cache-control": "no-cache" } : {}) }); fs.createReadStream(f).pipe(res);
};
const shown = HOST === "127.0.0.1" ? "localhost" : HOST;
http.createServer(handle).listen(PORT, HOST, () => console.log(`Spoor on http://${shown}:${PORT} · lab at http://${shown}:${PORT}/research · a cycle every ${EVERY / 1000}s · paper only`));
// "localhost" can resolve to the IPv6 loopback first, so answer there too (still loopback only, never the network)
if (HOST === "127.0.0.1") http.createServer(handle).on("error", () => {}).listen(PORT, "::1");
tick(); setInterval(tick, EVERY);
// research runs on its own clock: one note every RESEARCH_EVERY_MIN minutes while there are new sniffs
setInterval(() => RS.tickResearch(E.S), 15e3);
if (process.env.VOICE === "on") setInterval(() => { if (E.S.cycle > 2 && Date.now() - (V.VOICE.drafts[0]?.t ?? 0) > +(process.env.VOICE_EVERY_HOURS || 3) * 36e5) V.draft(E.S).catch((e) => console.error("voice:", e.message)); }, 5 * 60e3);
