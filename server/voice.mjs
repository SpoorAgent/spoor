// SPOOR's X voice: Claude writes a short post from the telemetry. Drafts only, nothing is posted anywhere.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const FILE = path.join(process.env.WORMBRAIN_DATA || fileURLToPath(new URL("../data/", import.meta.url)), "voice.json");
export let VOICE = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { drafts: [] };
// the SDK loads lazily, so a runtime it does not support (Node 18 on Android) only loses drafts, not the engine
let client = null; const getClient = async () => (client ||= process.env.ANTHROPIC_API_KEY ? new (await import("@anthropic-ai/sdk")).default() : null);
const SYSTEM = `You write short posts for an X account run in the name of SPOOR, a paper trader named after a spoor (the scent trail a hunter follows) whose brain is a simulated C. elegans nervous system (302 neurons wired from the published connectome) that paper-trades tokenized stocks and ETH on Robinhood Chain. It is paper only: no wallet, no real orders.
Write in spoor's first person, lowercase, dry and curious, the way a very small brain would describe its day: smells, crawling, sugar, shocks, neurons firing. Use only the facts in the telemetry you are given; never invent numbers.
Rules: under 260 characters. No hashtags, no emojis, no price predictions, no advice, no telling anyone to buy or sell. You may name the asset it is sniffing and its paper result. Return only the post text. Call yourself spoor and never use the word "worm".`;
export async function draft(S) {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY is not set" };
  const client = await getClient().catch((e) => { throw new Error(`Claude SDK unavailable on this runtime: ${e.message}`); });
  const B = S.books, eq = (k) => B[k].equity.at(-1)?.[1] ?? 10000, w = S.brain?.worm || {};
  const top = [...(S.matrix || [])].sort((a, b) => b.smell - a.smell), last = B.worm.trades[0];
  const telemetry = { cycle: S.cycle, lastSniff: { asset: w.sym, smell: w.smell, drive: w.v, forwardSpikes: w.f, reverseSpikes: w.r, dwell: w.dwell },
    bestSmells: top.slice(0, 3).map((m) => [m.sym, m.smell]), worstSmells: top.slice(-2).map((m) => [m.sym, m.smell]), lastTrade: last ? { side: last.side, asset: last.sym, usdg: last.usdg, at: new Date(last.t).toISOString() } : null,
    paperEquity: { spoor: eq("worm"), blind: eq("blind"), random: eq("random"), hold: eq("hold") }, learned: { sugar: S.learnStats.sugar, shock: S.learnStats.shock } };
  const r = await client.beta.messages.create({ model: "claude-opus-5-5", max_tokens: 1024, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low" }, system: SYSTEM,
    messages: [{ role: "user", content: `Telemetry:\n${JSON.stringify(telemetry, null, 1)}\n\nWrite one post.` }] });
  if (r.stop_reason === "refusal") return { error: "declined", details: r.stop_details };
  const text = r.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const d = { t: Date.now(), text, telemetry, model: r.model }; VOICE.drafts.unshift(d); VOICE.drafts = VOICE.drafts.slice(0, 30); fs.writeFileSync(FILE, JSON.stringify(VOICE)); return d;
}
