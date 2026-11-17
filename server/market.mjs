// Market reads, all read-only: QuoterV2 quotes (nothing is sent), Uniswap v3 Swap logs, and headline RSS scored with VADER.
import fs from "node:fs";
import { ethers } from "ethers";
import vader from "vader-sentiment";
export const CFG = JSON.parse(fs.readFileSync(new URL("../data/assets.json", import.meta.url), "utf8"));
// RPC_URL in .env (a private endpoint) takes over from the shared public RPC in assets.json
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || CFG.chain.rpc, CFG.chain.id, { staticNetwork: true, batchMaxCount: 30 });
const quoter = new ethers.Contract(CFG.uniswap.quoterV2, ["function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut,uint160,uint32,uint256 gasEstimate)"], provider);
const SWAP = new ethers.Interface(["event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"]);
const U = CFG.usdg;
const retry = async (f, n = 4) => { for (let k = 0; ; k++) { try { return await f(); } catch (e) { if (k >= n) throw e; await new Promise((r) => setTimeout(r, 1500 * (k + 1))); } } };
/** quote USDG -> asset; returns { tokens, gas } */
export async function quoteBuy(a, usdg) { const r = await retry(() => quoter.quoteExactInputSingle.staticCall({ tokenIn: U.address, tokenOut: a.token, amountIn: ethers.parseUnits(usdg.toFixed(6), U.decimals), fee: a.fee, sqrtPriceLimitX96: 0 })); return { tokens: +ethers.formatUnits(r[0], 18), gas: Number(r[3]) }; }
/** quote asset -> USDG; returns { usdg, gas } */
export async function quoteSell(a, tokens) { const r = await retry(() => quoter.quoteExactInputSingle.staticCall({ tokenIn: a.token, tokenOut: U.address, amountIn: ethers.parseUnits(tokens.toFixed(18), 18), fee: a.fee, sqrtPriceLimitX96: 0 })); return { usdg: +ethers.formatUnits(r[0], U.decimals), gas: Number(r[3]) }; }
export async function gasPriceEth() { const f = await retry(() => provider.getFeeData()); return +ethers.formatEther(f.gasPrice ?? 0n); }
/** mid price per asset from a 100 USDG buy and the matching sell */
export async function mids() { return Object.fromEntries(await Promise.all(CFG.assets.map(async (a) => { const b = await quoteBuy(a, 100); const s = await quoteSell(a, b.tokens); const ask = 100 / b.tokens, bid = s.usdg / b.tokens; return [a.sym, { ask, bid, mid: (ask + bid) / 2 }]; }))); }
const token0 = {};
export async function headBlock() { return retry(() => provider.getBlockNumber()); }
/** USDG-denominated buy/sell flow from Swap logs between two blocks */
export async function swapFlow(a, fromBlock, toBlock) {
  if (!token0[a.pool]) token0[a.pool] = (await retry(() => new ethers.Contract(a.pool, ["function token0() view returns (address)"], provider).token0())).toLowerCase();
  const usdgIs0 = token0[a.pool] === U.address.toLowerCase(); const logs = [];
  for (let s = fromBlock; s <= toBlock; s += 40000) logs.push(...(await retry(() => provider.getLogs({ address: a.pool, fromBlock: s, toBlock: Math.min(toBlock, s + 39999), topics: [SWAP.getEvent("Swap").topicHash] }))));
  let buy = 0, sell = 0, n = 0; for (const l of logs) { const d = SWAP.parseLog(l); const u = +ethers.formatUnits(usdgIs0 ? d.args.amount0 : d.args.amount1, U.decimals); if (u > 0) buy += u; else sell += -u; n++; }
  return { buy, sell, n };
}
const NEWS = {};
/** latest headlines for a ticker, scored with VADER compound in [-1, 1] */
export async function headlines(a) {
  const now = Date.now(); if (NEWS[a.sym] && now - NEWS[a.sym].at < 10 * 60e3) return NEWS[a.sym].items;
  try { const r = await fetch(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(a.news)}&region=US&lang=en-US`, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) }); const x = await r.text();
    const items = [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => { const g = (t) => ((m[1].match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) || [])[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
      const title = g("title"); return { title, link: g("link"), at: Date.parse(g("pubDate")) || now, score: vader.SentimentIntensityAnalyzer.polarity_scores(title).compound }; }).filter((i) => i.title);
    NEWS[a.sym] = { at: now, items }; return items; } catch { return NEWS[a.sym]?.items || []; }
}
