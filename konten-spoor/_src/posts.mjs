// node posts.mjs -> ../POSTS.md: every research and product post with its image, in posting order.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import R from "./research.mjs";
import P from "./product.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const slug = (k) => k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const r = (i) => { const n = String(i + 1).padStart(2, "0"); return `### R${n} · Field Notes №${n} · ${R[i].k}\nImage: research/${n}-${slug(R[i].k)}.png\nSource: ${R[i].c}\n\n${R[i].x}\n`; };
const p = (i) => `### P${String(i + 1).padStart(2, "0")} · product\nImage: product/${P[i].img}.png (or a fresh screenshot from the lab when posting)\n\n${P[i].x}\n`;
const launch = fs.readFileSync(path.join(here, "launch.md"), "utf8");
const done = new Set(); const R_ = (...ix) => ix.map((i) => (done.add("r" + i), r(i))).join("\n"); const P_ = (...ix) => ix.map((i) => (done.add("p" + i), p(i))).join("\n");

let out = `# Spoor · every X post (${R.length} research + ${P.length} product)

Replace [SITE] with your domain and every [..] with live numbers from the lab (/research) when you post.
Research = the "Field Notes" series, each card numbered. Product = screenshots of the live lab.
Suggested rhythm: 3-4 posts a day before launch, 4-6 after (1 research, 2-3 product, 1 scoreboard or trade log).

=========================================================
## PHASE 1 · BEFORE LAUNCH (build the research story first)
=========================================================

${R_(0, 1, 2)}
${P_(0)}
${R_(3, 9, 10)}
${P_(1)}
${R_(12, 13, 14)}
${P_(2, 3)}
${R_(15, 22, 27)}
${P_(4, 14)}
${R_(29)}
### TEASER · image brand/teaser.png
302 neurons. One strike at a time.

[SITE]

Soon.

=========================================================
## PHASE 2 · LAUNCH
=========================================================

${launch}

=========================================================
## PHASE 3 · AFTER LAUNCH
=========================================================

`;
out += R.map((_, i) => i).filter((i) => !done.has("r" + i)).map(r).join("\n") + "\n";
out += P.map((_, i) => i).filter((i) => !done.has("p" + i)).map(p).join("\n");
out += `

=========================================================
## DAILY TEMPLATES (reuse)
=========================================================
- Daily score → P24 + a fresh product/books.png
- Every BUY/SELL → P25 + a screenshot of the replay (the "Last decisive sniff" button)
- Every evening → P18 (learning log) + the Learning section
- When the lab notebook flips a hypothesis → P27 + product/research.png
- When Spoor loses: say it lost and give the reason from the log. That is what earns trust.

## RULES
- Never write "AI trader", "guaranteed", or any profit claim. This is paper trading.
- "No AI makes the trades" = every trade comes from 302 neurons and fixed rules. Claude only reads and writes notes and drafts.
- Every research post names its source. If you are unsure of a claim, skip the post.
- Any post about a token says it is the project's own account and that nothing here is financial advice.
`;
fs.writeFileSync(path.join(here, "..", "POSTS.md"), out);
console.log("POSTS.md:", R.length, "research +", P.length, "product");
