// Continuous research: every cycle a compact record of the worm's sniff is kept; every few minutes Claude reads the
// recent records plus statistics computed here, writes a lab note and tests a running set of hypotheses against new data.
// Notes only describe the simulation. Numbers come from the data given, never from Claude.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const FILE = path.join(process.env.WORMBRAIN_DATA || fileURLToPath(new URL("../data/", import.meta.url)), "research.json");
export let R = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { records: [], notes: [], hyps: [], nextId: 1, runs: 0 };
const save = () => fs.writeFileSync(FILE, JSON.stringify(R));
const env = (k, d) => +(process.env[k] || d);
export const enabled = () => !!process.env.ANTHROPIC_API_KEY && process.env.RESEARCH !== "off";
export const everyMs = () => env("RESEARCH_EVERY_MIN", 5) * 60e3;
export let busy = false, lastError = null, nextAt = Date.now() + 20e3;

// ---------- records (no API call, every cycle) ----------
const KEY = ["AWA", "ASH", "ASE", "AIY", "AIB", "AIZ", "RIB", "RIM", "AVB", "AVA", "AVD", "PVC"];
let idxOf = null, kindOf = null;
function names(neurons) { if (idxOf) return; idxOf = Object.fromEntries(KEY.map((c) => [c, neurons.map((n, i) => (n.id === c || n.id === c + "L" || n.id === c + "R" ? i : -1)).filter((i) => i >= 0)])); kindOf = neurons.map((n) => n.kind); }
export function observe(S, neurons) {
  const w = S.brain?.worm; if (!w || R.records.at(-1)?.c === S.cycle) return; names(neurons);
  const first = new Map(), n = { sensory: 0, inter: 0, motor: 0 };
  for (let k = 0; k < (w.raster || []).length; k += 2) { const t = w.raster[k] / 10, i = w.raster[k + 1]; if (!first.has(i)) first.set(i, t); if (kindOf[i] in n) n[kindOf[i]]++; }
  const fs1 = Object.fromEntries(KEY.map((c) => { const ts = idxOf[c].map((i) => first.get(i)).filter((t) => t != null); return [c, ts.length ? +Math.min(...ts).toFixed(1) : null]; }));
  R.records.push({ c: S.cycle, t: S.brain.t, sym: w.sym, smell: w.smell, v: w.v, f: w.f, r: w.r, dwell: w.dwell, d: w.decision, act: w.act ? { side: w.act.side, usdg: w.act.usdg } : null, first: fs1, n });
  if (R.records.length > 720) R.records.splice(0, R.records.length - 720); save();
}

// ---------- statistics the notes are allowed to quote ----------
const mean = (a) => (a.length ? a.reduce((t, x) => t + x, 0) / a.length : null), r3 = (x) => (x == null ? null : +x.toFixed(3));
function corr(x, y) { const n = x.length; if (n < 5) return null; const mx = mean(x), my = mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return b && c ? a / Math.sqrt(b * c) : null; }
function stats(recs) {
  const by = (f) => recs.filter(f), dec = {}; for (const r of recs) dec[r.d] = (dec[r.d] || 0) + 1;
  const both = by((r) => r.first.AVB != null && r.first.AVA != null), avbFirst = both.filter((r) => r.first.AVB < r.first.AVA);
  const assets = {}; for (const r of recs) { const a = (assets[r.sym] ||= { sniffs: 0, smell: [], drive: [], buys: 0, sells: 0 }); a.sniffs++; a.smell.push(r.smell); a.drive.push(r.v); if (r.act?.side === "buy") a.buys++; if (r.act?.side === "sell") a.sells++; }
  for (const a of Object.values(assets)) { a.meanSmell = r3(mean(a.smell)); a.meanDrive = r3(mean(a.drive)); delete a.smell; delete a.drive; }
  const lat = (a, b) => r3(mean(recs.filter((r) => r.first[a] != null && r.first[b] != null).map((r) => r.first[b] - r.first[a])));
  return { sniffs: recs.length, cycles: recs.length ? [recs[0].c, recs.at(-1).c] : null, decisions: dec,
    corrSmellDrive: r3(corr(recs.map((r) => r.smell), recs.map((r) => r.v))), corrForwardReverseSpikes: r3(corr(recs.map((r) => r.f), recs.map((r) => r.r))),
    meanDrive: { smellAbove0_1: r3(mean(by((r) => r.smell > 0.1).map((r) => r.v))), smellBelowMinus0_1: r3(mean(by((r) => r.smell < -0.1).map((r) => r.v))), smellNearZero: r3(mean(by((r) => Math.abs(r.smell) <= 0.1).map((r) => r.v))) },
    avbBeforeAva: { sniffsWithBoth: both.length, avbFirstShare: both.length ? r3(avbFirst.length / both.length) : null, meanDriveWhenAvbFirst: r3(mean(avbFirst.map((r) => r.v))), meanDriveWhenAvaFirst: r3(mean(both.filter((r) => r.first.AVB >= r.first.AVA).map((r) => r.v))) },
    meanLatencyMs: { AWA_to_AIY: lat("AWA", "AIY"), ASH_to_AIB: lat("ASH", "AIB"), AIY_to_AVB: lat("AIY", "AVB"), AIB_to_AVA: lat("AIB", "AVA") },
    meanSpikesPerSniff: { sensory: r3(mean(recs.map((r) => r.n.sensory))), inter: r3(mean(recs.map((r) => r.n.inter))), motor: r3(mean(recs.map((r) => r.n.motor))) }, assets };
}

// ---------- the lab note ----------
let client = null; const getClient = async () => (client ||= new (await import("@anthropic-ai/sdk")).default());
const SYSTEM = `You are the research scientist attached to SPOOR, a paper trader whose brain is a simulation of the 302-neuron C. elegans connectome (Cook et al. 2019) that paper-trades tokenized stocks and ETH on Robinhood Chain. Every minute the trader brain "sniffs" one asset: a market smell in [-1,1] (built by three scout brains from swap flow, the 15-minute price move and news sentiment) drives attractant sensory neurons (AWA, ASEL) when positive and repellent ones (ASH, AWB, ASER) when negative. The spikes spread through the real wiring; forward-side neurons (AIY, RIB, AVB, PVC) against reverse-side ones (AIB, AIZ, RIM, AVA, AVD, AVE) give a drive v in [-1,1]. Two strong sniffs in a row (v > 0.4) buy on paper; v < -0.4 on a held asset sells. Fifteen minutes after a buy the price outcome becomes "sugar" or "shock" and reshapes that scent's synapses.

You run a continuous study of this one animal. Each time you get the newest sniff records, statistics computed by the lab, the books, the learning log, your open hypotheses and your last notes. Then you:
1. Write one lab note about what is new or surprising in this batch, in plain English for a curious reader. Two to four sentences.
2. Judge every open hypothesis against this batch only: "supports", "contradicts" or "neutral", with a one-line reason that cites the numbers.
3. Propose at most one new, testable hypothesis about the circuit or its trading behaviour, with the measurement that would test it, or leave both fields empty when the open set already covers what you see. Do not repeat an existing hypothesis.
4. Ask the next question the study should answer.

Rules: quote only numbers that appear in the data, rounded as given; never invent or extrapolate a figure. This is a model of a wiring diagram, not a living animal, and paper trading, not advice: never predict prices or suggest trades. Name neurons by class (AVA, not AVAL). Put up to four neuron classes the note is about in "focus".
Naming: the brain and its trading book are called SPOOR (the books are spoor, blind, random and hold). Never write the word "worm" anywhere in your output.`;
const SCHEMA = { type: "object", additionalProperties: false, required: ["title", "observation", "focus", "updates", "newHypothesis", "newTest", "nextQuestion"], properties: {
  title: { type: "string", description: "headline of the note, under 70 characters" },
  observation: { type: "string" }, focus: { type: "array", items: { type: "string" } },
  updates: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "verdict", "reason"], properties: { id: { type: "string" }, verdict: { type: "string", enum: ["supports", "contradicts", "neutral"] }, reason: { type: "string" } } } },
  newHypothesis: { type: "string", description: "empty string when none" }, newTest: { type: "string", description: "empty string when none" }, nextQuestion: { type: "string" } } };
const status = (h) => (h.for >= 3 && h.for >= 2 * h.against ? "supported" : h.against >= 3 && h.against >= 2 * h.for ? "rejected" : h.against > h.for ? "weakened" : "open");

export async function study(S, why = "schedule") {
  if (!enabled()) return { error: "ANTHROPIC_API_KEY is not set or RESEARCH=off" };
  if (busy) return { error: "already studying" };
  const fresh = R.records.filter((r) => r.c > (R.notes[0]?.upTo ?? 0));
  if (fresh.length < 3) { nextAt = Date.now() + 60e3; return { error: "waiting for more sniffs" }; }
  if (R.notes.filter((n) => Date.now() - n.t < 864e5).length >= env("RESEARCH_PER_DAY", 300)) return { error: "daily note limit reached" };
  busy = true; lastError = null;
  try {
    const c = await getClient(), B = S.books, eq = (k) => B[k].equity.at(-1)?.[1] ?? 10000;
    const open = R.hyps.filter((h) => h.status !== "rejected").slice(0, 8);
    const data = { trigger: why, newSniffs: fresh.slice(-40), statsNewSniffs: stats(fresh), statsLast6h: stats(R.records.filter((r) => S.brain.t - r.t < 6 * 36e5)),
      books: Object.fromEntries(["worm", "blind", "random", "hold"].map((k) => [k === "worm" ? "spoor" : k, { equity: eq(k), returnPct: r3((eq(k) / 10000 - 1) * 100), trades: B[k].trades.length }])),
      learning: { ...S.learnStats, recent: S.log.slice(0, 6).map((l) => l.m.replace(/^worm\b/, "spoor")) }, openHypotheses: open.map(({ id, text, test, for: f, against, status: st }) => ({ id, text, test, for: f, against, status: st })),
      lastNotes: R.notes.slice(0, 3).map((n) => ({ title: n.title, observation: n.observation, nextQuestion: n.nextQuestion })) };
    const r = await c.beta.messages.create({ model: "claude-opus-5-5", max_tokens: 8000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: process.env.RESEARCH_EFFORT || "low", format: { type: "json_schema", schema: SCHEMA } },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content: `Lab data:\n${JSON.stringify(data)}` }] });
    if (r.stop_reason === "refusal") throw new Error("Claude declined this batch");
    if (r.stop_reason === "max_tokens") throw new Error("note was cut off");
    const o = JSON.parse(r.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
    const now = Date.now(), verdicts = [];
    for (const u of o.updates || []) { const h = R.hyps.find((x) => x.id === u.id); if (!h || u.verdict === "neutral") continue; h[u.verdict === "supports" ? "for" : "against"]++; h.status = status(h); h.updated = now; h.last = u.reason; verdicts.push({ id: h.id, verdict: u.verdict, reason: u.reason }); }
    let born = null; if (o.newHypothesis?.trim()) { born = { id: `H${R.nextId++}`, text: o.newHypothesis.trim(), test: (o.newTest || "").trim(), for: 0, against: 0, status: "open", born: S.cycle, t: now, updated: now, last: "" }; R.hyps.unshift(born); }
    // keep the board readable: at most 8 live hypotheses, rejected ones fall off after a while
    R.hyps = [...R.hyps.filter((h) => h.status !== "rejected"), ...R.hyps.filter((h) => h.status === "rejected")].slice(0, 14);
    const note = { id: ++R.runs, t: now, upTo: fresh.at(-1).c, from: fresh[0].c, n: fresh.length, title: o.title, observation: o.observation, focus: (o.focus || []).slice(0, 4).map((x) => { const s = String(x).toUpperCase().trim(); return /^[A-Z]{3}[LR]$/.test(s) ? s.slice(0, 3) : s; }),
      verdicts, born: born?.id || null, nextQuestion: o.nextQuestion, model: r.model, usage: { in: r.usage.input_tokens, cached: r.usage.cache_read_input_tokens || 0, out: r.usage.output_tokens } };
    R.notes.unshift(note); R.notes = R.notes.slice(0, 200); save(); return note;
  } catch (e) { lastError = String(e.message || e); console.error("research:", lastError); return { error: lastError }; }
  finally { busy = false; nextAt = Date.now() + everyMs(); }
}
export const tickResearch = (S) => { if (enabled() && !busy && Date.now() >= nextAt && (S.cycle || 0) > 2) study(S).catch(() => {}); };
// fix(): applied to everything a reader sees (the server passes the brand cleaner)
export const view = (fix = (s) => s) => ({ now: Date.now(), enabled: enabled(), busy, nextAt, every: everyMs() / 1000, runs: R.runs, sniffs: R.records.length, lastCycle: R.records.at(-1)?.c ?? null, lastError,
  notes: R.notes.slice(0, 12).map(({ usage, ...n }) => ({ ...n, title: fix(n.title), observation: fix(n.observation), nextQuestion: fix(n.nextQuestion), verdicts: (n.verdicts || []).map((v) => ({ ...v, reason: fix(v.reason) })) })),
  hyps: R.hyps.map((h) => ({ ...h, text: fix(h.text), test: fix(h.test), last: fix(h.last) })) });
