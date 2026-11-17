// Spoor engine: three scout worms read the market, one trader worm crawls eleven scent patches, four paper books.
// Paper only: fills are QuoterV2 quotes plus gas, nothing is ever sent. No wallet, no key.
import fs from "node:fs";
import path from "node:path";
import { loadConnectome, sniff, P } from "./brain.mjs";
import * as M from "./market.mjs";
import { fileURLToPath } from "node:url";
const K = loadConnectome(fileURLToPath(new URL("../data/connectome.json", import.meta.url)));
const A = M.CFG.assets, ix = (n) => K.idx.get(n), LR = (c) => (K.idx.has(c) ? [c] : [c + "L", c + "R"]);
const FW = ["AIYL", "AIYR", "RIBL", "RIBR", "AVBL", "AVBR", "PVCL", "PVCR"].map(ix), RV = ["AIBL", "AIBR", "AIZL", "AIZR", "RIML", "RIMR", "AVAL", "AVAR", "AVDL", "AVDR", "AVEL", "AVER"].map(ix);
const ATT = ["AWAL", "AWAR", "ASEL"].map(ix), REP = ["ASHL", "ASHR", "AWBL", "AWBR", "ASER"].map(ix);
const APP = new Set(["AIYL", "AIYR", "AIAL", "AIAR"].map(ix)), AVO = new Set(["AIBL", "AIBR", "AIZL", "AIZR"].map(ix));
const SCENT = A.map((a) => a.scent.flatMap(LR).map(ix)), SCENT_HZ = 40;
export const RULES = { start: 10000, capFrac: 0.2, minBuy: 25, buyFrac: 0.05, dailyStop: 0.03, halfLifeH: 6, evalMin: 15, stay: 0.35, turn: -0.35, buy: 0.4, sell: -0.4, eta: 0.35, maxImpact: 0.02 };
// WORMBRAIN_DATA points the writable state somewhere else (the desktop and Android apps use their per-user data folder)
const DATA_DIR = process.env.WORMBRAIN_DATA || fileURLToPath(new URL("../data/", import.meta.url)); fs.mkdirSync(DATA_DIR, { recursive: true });
const STATE_FILE = path.join(DATA_DIR, "state.json");
const book = (name) => ({ name, cash: RULES.start, pos: {}, trades: [], equity: [], dayStart: { day: "", v: RULES.start }, pending: [] });
export let S = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : {
  started: Date.now(), cycle: 0, books: { worm: book("Spoor"), blind: book("Blind"), random: book("Random"), hold: book("Hold") },
  learn: { worm: A.map(() => 0), blind: A.map(() => 0) }, trader: { worm: { at: 0, dir: 1, dwell: 0 }, blind: { at: 0, dir: 1, dwell: 0 } },
  prices: {}, hist: {}, lastBlock: 0, flowWin: {}, matrix: [], brain: null, log: [], learnStats: { sugar: 0, shock: 0 } };
const save = () => fs.writeFileSync(STATE_FILE, JSON.stringify(S));
const log = (m) => { S.log.unshift({ t: Date.now(), m }); S.log = S.log.slice(0, 200); };
// sensory gain (Weber-like): any signal above a small floor is lifted into the range the circuit answers to, graded by size
const encode = (s) => { if (Math.abs(s) < 0.05) return {}; const ids = s > 0 ? ATT : REP, fr = s > 0 ? 0.55 + 0.25 * Math.min(1, s) : 0.68 + 0.42 * Math.min(1, -s); return Object.fromEntries(ids.map((i) => [i, fr * P.maxRate])); };
const readout = (sp) => { const f = FW.reduce((t, i) => t + sp[i], 0), r = RV.reduce((t, i) => t + sp[i], 0); return { f, r, v: (f - r) / (f + r + 4) }; };
// learned value L in [-1,1] reshapes the scent neurons' synapses onto approach (AIY, AIA) and avoid (AIB, AIZ) interneurons, sign-aware
const synMod = (k, L) => { if (!L) return null; const m = new Map(); for (const i of SCENT[k]) { const mm = new Map(); for (const [j, , sg] of K.out[i]) { const t = APP.has(j) ? 1 : AVO.has(j) ? -1 : 0; if (!t) continue; const fwd = t * sg > 0; mm.set(j, fwd ? 1 + 3 * Math.max(0, L) - 0.8 * Math.max(0, -L) : 1 + 3 * Math.max(0, -L) - 0.8 * Math.max(0, L)); } m.set(i, mm); } return m; };
const day = (t) => new Date(t).toISOString().slice(0, 10);
const value = (b) => b.cash + Object.entries(b.pos).reduce((t, [s, p]) => t + p.qty * (S.prices[s]?.bid ?? 0), 0);
let gasEth = 0;
async function fill(b, k, side, usdg, reason) {
  const a = A[k], ethPx = S.prices.ETH?.mid ?? 0, mid = S.prices[a.sym]?.mid;
  // thin pools: a buy only goes in if the whole position could get back out within maxImpact of mid; a sell halves until it fits
  if (side === "buy") { let q = await M.quoteBuy(a, usdg); const held = b.pos[a.sym]?.qty ?? 0;
    while (mid) { const s = await M.quoteSell(a, held + q.tokens); if (s.usdg >= (held + q.tokens) * mid * (1 - RULES.maxImpact)) break; usdg /= 2; if (usdg < RULES.minBuy) return null; q = await M.quoteBuy(a, usdg); reason += " (sized down, thin pool)"; }
    const gas = q.gas * gasEth * ethPx; if (usdg + gas > b.cash) return null;
    b.cash -= usdg + gas; const p = b.pos[a.sym] || { qty: 0, cost: 0 }; p.qty += q.tokens; p.cost += usdg + gas; b.pos[a.sym] = p;
    const t = { t: Date.now(), side, sym: a.sym, usdg: +usdg.toFixed(2), qty: q.tokens, px: usdg / q.tokens, gas: +gas.toFixed(4), reason }; b.trades.unshift(t); b.trades = b.trades.slice(0, 300); return t; }
  const p = b.pos[a.sym]; if (!p || p.qty <= 0) return null; let qty = p.qty, q = await M.quoteSell(a, qty);
  while (mid && q.usdg < qty * mid * (1 - RULES.maxImpact) && qty * mid > 2 * RULES.minBuy) { qty /= 2; q = await M.quoteSell(a, qty); }
  const part = qty < p.qty, cost = p.cost * qty / p.qty, gas = q.gas * gasEth * ethPx;
  b.cash += q.usdg - gas; const t = { t: Date.now(), side, sym: a.sym, usdg: +q.usdg.toFixed(2), qty, px: q.usdg / qty, gas: +gas.toFixed(4), pnl: +(q.usdg - gas - cost).toFixed(2), reason: part ? reason + ` (${Math.round(qty / p.qty * 100)}%, thin pool)` : reason };
  if (part) { p.qty -= qty; p.cost -= cost; } else delete b.pos[a.sym]; b.trades.unshift(t); b.trades = b.trades.slice(0, 300); return t;
}
const canBuy = (b, k) => { const eq = value(b); if (eq < b.dayStart.v * (1 - RULES.dailyStop)) return 0; const held = (b.pos[A[k].sym]?.qty ?? 0) * (S.prices[A[k].sym]?.bid ?? 0);
  const size = Math.min(Math.max(RULES.minBuy, eq * RULES.buyFrac), eq * RULES.capFrac - held, b.cash - 1); return size >= RULES.minBuy ? size : 0; };
async function crawl(who, smell) {
  const tr = S.trader[who], b = S.books[who], k = tr.at, L = S.learn[who][k];
  // worms explore with a biased random walk: a little sensory noise on every sniff (the blind worm gets only the noise)
  let z = 0; for (let q = 0; q < 6; q++) z += Math.random(); const noise = (z - 3) * 0.3 * Math.SQRT2; const sm = smell[k] + noise;
  const inp = { ...encode(sm) }; for (const i of SCENT[k]) inp[i] = (inp[i] || 0) + SCENT_HZ;
  const raster = who === "worm" ? [] : null; const sp = sniff(K, inp, { synMod: synMod(k, L), rngSeed: (S.cycle * 7919 + k * 31 + (who === "blind" ? 17 : 0)) >>> 0, raster }); const o = readout(sp);
  let act = null;
  if (o.v > RULES.stay) tr.dwell++; else tr.dwell = 0;
  if (o.v < RULES.turn) tr.dir *= -1;
  const held = b.pos[A[k].sym]?.qty > 0;
  if (held && o.v < RULES.sell) act = await fill(b, k, "sell", 0, `reversal ${o.v.toFixed(2)} at ${A[k].sym}`);
  else if (tr.dwell >= 2 && o.v > RULES.buy) { const size = canBuy(b, k); if (size) { act = await fill(b, k, "buy", size, `dwelled at ${A[k].sym}, drive ${o.v.toFixed(2)}`); if (act) b.pending.push({ k, at: Date.now(), px: act.px }); } }
  const decision = act ? act.side : o.v > RULES.stay ? "stay" : o.v < RULES.turn ? "turn" : "crawl";
  if (tr.dwell === 0) tr.at = (tr.at + tr.dir + A.length) % A.length;
  return { who, k, sym: A[k].sym, smell: +sm.toFixed(3), v: +o.v.toFixed(3), f: o.f, r: o.r, dwell: tr.dwell, dir: tr.dir, act, decision, next: A[tr.at].sym, input: Object.keys(inp).map(Number), raster, spikes: Array.from(sp) };
}
function learn(who) {
  const b = S.books[who], now = Date.now(), Lr = S.learn[who], decay = Math.pow(0.5, (now - (S.lastLearn?.[who] ?? now)) / 36e5 / RULES.halfLifeH);
  for (let k = 0; k < Lr.length; k++) Lr[k] *= decay; S.lastLearn = { ...(S.lastLearn || {}), [who]: now };
  const due = b.pending.filter((p) => now - p.at >= RULES.evalMin * 60e3); b.pending = b.pending.filter((p) => now - p.at < RULES.evalMin * 60e3);
  for (const p of due) { const r = (S.prices[A[p.k].sym]?.mid ?? p.px) / p.px - 1; const dL = RULES.eta * Math.tanh(r / 0.01);
    Lr[p.k] = Math.max(-1, Math.min(1, Lr[p.k] + dL)); S.learnStats[r >= 0 ? "sugar" : "shock"]++; log(`${who === "worm" ? "spoor" : who}: ${r >= 0 ? "sugar" : "shock"} on ${A[p.k].sym} (${(r * 100).toFixed(2)}% in ${RULES.evalMin} min), value now ${Lr[p.k].toFixed(2)}`);
    if (b.pos[A[p.k].sym]) b.pending.push({ k: p.k, at: now, px: S.prices[A[p.k].sym].mid }); }
}
export async function cycle() {
  const t0 = Date.now(); S.cycle++; gasEth = await M.gasPriceEth();
  const md = await M.mids(); S.prices = md; for (const a of A) { const h = (S.hist[a.sym] ||= []); h.push([t0, md[a.sym].mid]); while (h.length && t0 - h[0][0] > 26 * 36e5) h.shift(); }
  // FLOW: 15-minute USDG buy/sell flow from Uniswap v3 Swap logs
  // never read more than the last ~15 minutes of blocks: after downtime, older swaps would be counted as if they just happened
  const head = await M.headBlock(); const from = Math.max(S.lastBlock ? S.lastBlock + 1 : 0, head - 8700);
  for (const a of A) { const f = await M.swapFlow(a, from, head); const w = (S.flowWin[a.sym] ||= []); w.push([t0, f.buy, f.sell, f.n]); while (w.length && t0 - w[0][0] > 15 * 60e3) w.shift(); }
  S.lastBlock = head;
  const flowS = A.map((a) => { const w = S.flowWin[a.sym], b = w.reduce((t, x) => t + x[1], 0), s = w.reduce((t, x) => t + x[2], 0); return Math.tanh((b - s) / (b + s + 2500) * 2.5); });
  // TAPE: 15-minute price move
  const tapeS = A.map((a) => { const h = S.hist[a.sym], now = h[h.length - 1][1], back = h.find((x) => t0 - x[0] <= 15 * 60e3) || h[0]; return Math.tanh((now / back[1] - 1) / 0.006); });
  // NEWS: VADER over the last 6 hours of headlines, recency-weighted
  const newsS = []; for (const a of A) { const it = (await M.headlines(a)).filter((x) => t0 - x.at < 6 * 36e5); const wsum = it.reduce((t, x) => t + Math.exp(-(t0 - x.at) / 36e5 / 3), 0); newsS.push(wsum ? it.reduce((t, x) => t + x.score * Math.exp(-(t0 - x.at) / 36e5 / 3), 0) / wsum : 0); }
  // three scout worms, one per stream, each a whole brain
  const streams = [["Flow", flowS], ["Tape", tapeS], ["News", newsS]], scout = [];
  for (const [si, [name, sig]] of streams.entries()) { const row = []; for (let k = 0; k < A.length; k++) { const sp = sniff(K, encode(sig[k]), { rngSeed: (S.cycle * 104729 + si * 977 + k * 13) >>> 0 }); const o = readout(sp); row.push({ s: +sig[k].toFixed(3), v: +o.v.toFixed(3), spikes: o.f + o.r }); } scout.push({ name, row }); }
  const smell = A.map((_, k) => scout.reduce((t, s) => t + s.row[k].v, 0) / 3);
  S.matrix = A.map((a, k) => ({ sym: a.sym, flow: scout[0].row[k], tape: scout[1].row[k], news: scout[2].row[k], smell: +smell[k].toFixed(3), L: { worm: +S.learn.worm[k].toFixed(3), blind: +S.learn.blind[k].toFixed(3) } }));
  for (const who of ["worm", "blind", "random", "hold"]) { const b = S.books[who], d = day(t0); if (b.dayStart.day !== d) b.dayStart = { day: d, v: value(b) }; }
  learn("worm"); learn("blind");
  const w = await crawl("worm", smell), bl = await crawl("blind", A.map(() => 0));
  // RANDOM mirrors the worm's timing and size with a coin-flip direction
  if (w.act) { const rb = S.books.random, k = w.k, coin = Math.random() < 0.5; if (coin) { const size = Math.min(w.act.usdg, canBuy(rb, k) || 0); if (size >= RULES.minBuy) await fill(rb, k, "buy", size, "coin flip: buy"); } else await fill(rb, k, "sell", 0, "coin flip: sell"); }
  // HOLD buys equal weight once and never trades
  const hb = S.books.hold; if (!hb.trades.length) for (let k = 0; k < A.length; k++) await fill(hb, k, "buy", (RULES.start - 30) / A.length, "equal-weight hold");
  for (const b of Object.values(S.books)) { b.equity.push([t0, +value(b).toFixed(2)]); if (b.equity.length > 6000) b.equity.splice(0, b.equity.length - 6000); }
  if (Math.abs(w.v) >= 0.2 || w.act) S.lastStrong = { ...w, cycle: S.cycle, t: t0 };
  S.brain = { t: t0, worm: w, strong: S.lastStrong || null, blind: { ...bl, spikes: undefined, raster: undefined }, scoutSpikes: null };
  if (w.act) log(`spoor ${w.act.side} ${w.act.sym} for ${w.act.usdg} USDG (${w.act.reason})`); if (bl.act) log(`blind ${bl.act.side} ${bl.act.sym} for ${bl.act.usdg} USDG`);
  S.lastCycleMs = Date.now() - t0; save(); return S;
}
export const connectome = () => ({ neurons: K.C.neurons.map((n) => ({ id: n.id, kind: n.kind, pos: n.pos })), links: K.C.chem.filter((e) => e[2] >= 5).map(([a, b]) => [K.idx.get(a), K.idx.get(b)]), chem: K.C.chem.map(([a, b, w]) => [K.idx.get(a), K.idx.get(b), w]), counts: { chem: K.C.chem.length, gap: K.C.gap.length }, source: K.C.source, signNote: K.C.signNote, signRefs: K.C.signRefs, params: P, scent: A.map((a) => ({ sym: a.sym, scent: a.scent })) });
export const assets = A;
