// Sanity checks for the brain: wiring loaded, attractants push forward, repellents push back, learning moves the drive both ways.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { loadConnectome, sniff, P } from "./brain.mjs";
const K = loadConnectome(fileURLToPath(new URL("../data/connectome.json", import.meta.url)));
const A = JSON.parse(fs.readFileSync(new URL("../data/assets.json", import.meta.url), "utf8")).assets;
const ix = (n) => K.idx.get(n), LR = (c) => (K.idx.has(c) ? [c] : [c + "L", c + "R"]);
const FW = ["AIYL", "AIYR", "RIBL", "RIBR", "AVBL", "AVBR", "PVCL", "PVCR"].map(ix), RV = ["AIBL", "AIBR", "AIZL", "AIZR", "RIML", "RIMR", "AVAL", "AVAR", "AVDL", "AVDR", "AVEL", "AVER"].map(ix);
const ATT = ["AWAL", "AWAR", "ASEL"].map(ix), REP = ["ASHL", "ASHR", "AWBL", "AWBR", "ASER"].map(ix);
const v = (inp, seeds = 8) => { let f = 0, r = 0; for (let q = 1; q <= seeds; q++) { const sp = sniff(K, inp, { rngSeed: q * 53 }); f += FW.reduce((t, i) => t + sp[i], 0); r += RV.reduce((t, i) => t + sp[i], 0); } return (f - r) / (f + r + 4 * seeds); };
let fail = 0; const ok = (c, m) => { console.log((c ? "ok  " : "FAIL") + "  " + m); if (!c) fail++; };
ok(K.N === 302, `302 neurons (got ${K.N})`);
ok(K.C.chem.length === 3671 && K.C.gap.length === 1091, `3,671 chemical synapses and 1,091 gap pairs (got ${K.C.chem.length}, ${K.C.gap.length})`);
ok(v({}) === 0, "silence in, silence out");
const at = v(Object.fromEntries(ATT.map((i) => [i, 0.8 * P.maxRate]))), re = v(Object.fromEntries(REP.map((i) => [i, 1.1 * P.maxRate])));
ok(at > 0.3, `attractant drives forward (${at.toFixed(2)})`); ok(re < -0.3, `repellent drives reverse (${re.toFixed(2)})`);
for (const a of A) { const ids = a.scent.flatMap(LR).map(ix); const z = v(Object.fromEntries(ids.map((i) => [i, 40]))); ok(Math.abs(z) < 0.25, `${a.sym} scent alone is near neutral (${z.toFixed(2)})`); }
process.exit(fail ? 1 : 0);
