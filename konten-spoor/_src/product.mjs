// Product posts. img = the live screenshot that goes with it (render.mjs captures them from the running engine).
// [..] = fill from the live app when posting. [SITE] = your domain.
export default [
{ img: "hero", x: `What is Spoor?

A paper trader whose brain is the real wiring diagram of C. elegans: all 302 neurons, simulated, pointed at Robinhood Chain.

It smells the market, holds still, then strikes. On paper.

No AI makes the trades. [SITE]` },
{ img: "think", x: `What's inside:
· 302 neurons
· 3,671 chemical connections
· 1,091 gap-junction pairs

All from Cook et al. 2019, loaded as published. Positions from OpenWorm.

We didn't design this brain. Evolution did.` },
{ img: "think", x: `Every 60 seconds Spoor sniffs one market.

The lab then replays that sniff spike by spike: real spikes from the simulation, slowed about 15x, travelling only along synapses that exist in a real nematode.

[SITE]/research` },
{ img: "think", x: `One sniff, four steps:

01 Sense: smell neurons (AWA, ASE, AWB...) get the market's scent
02 Integrate: AIY, AIB, AIZ, RIA weigh it
03 Decide: forward neurons (AVB, PVC) vs reverse (AVA, AVD)
04 Act: stay, strike, turn back, or crawl on` },
{ img: "signals", x: `Spoor doesn't read charts. Three scout brains turn the market into smell:

Flow: onchain buys vs sells in Uniswap v3 pools
Tape: the 15-minute price move
News: headline sentiment

Then the trader decides.` },
{ img: "scouts", x: `Scout #1, Flow.

Reads Swap events straight from Uniswap v3 pools on Robinhood Chain. More buying than selling = sweet smell. More selling = sour.

No API middleman. Raw chain logs, every cycle.` },
{ img: "scouts", x: `Scout #2, Tape.

The 15-minute price move for each market, priced from onchain quotes, not a CEX feed.

Up smells good. Down smells bad. That's it.` },
{ img: "scouts", x: `Scout #3, News.

Pulls fresh headlines for each asset and scores them with VADER, a plain rules-based sentiment scorer.

No language model reading the news. Words in, a number out, into the nose.` },
{ img: "track", x: `Spoor hunts across 11 scent patches on Robinhood Chain:

ETH · SPY · QQQ · NVDA · TSLA · AAPL · MSFT · AMZN · GOOGL · META · COIN

Tokenized stocks, priced in USDG. Green marks where it is right now.` },
{ img: "track", x: `How Spoor moves:

Smell good → it holds still.
Smell bad → it turns around.
Neither → it crawls to the next patch.

The chemotaxis rule real nematodes use to find food. Spoor uses it to find buyers.` },
{ img: "think", x: `When does it strike?

Only when it holds on the same patch for two strong sniffs in a row and the forward neurons win clearly (drive > 0.4).

One good smell isn't enough. A spoor waits.` },
{ img: "think", x: `When does it let go?

When it's holding and a sniff comes back with drive below -0.4: the reverse neurons (AVA, AVD) took over.

It backs away. Paper position closed.` },
{ img: "books", x: `Risk rules, same for every book:
· max 20% of the book in one asset
· buys are 5% of the book, min $25
· 3% down on the day = no new buys until tomorrow

Patient, not reckless.` },
{ img: "books", x: `Paper fills, but honest ones.

Every trade is priced with Uniswap v3 QuoterV2 on Robinhood Chain: the exact amount the pool would give for that size, plus gas.

Nothing is sent. No wallet. No key. The quotes are real.` },
{ img: "books", x: `Spoor has three rivals:

Blind copy: same brain, no scouts, only noise
Random: coin-flip trades at the same moments
Hold: equal-weight buy and hold

Same $10,000 paper, same rules. If Spoor can't beat them, the chart says so.` },
{ img: "books", x: `Why a blind copy?

It has the exact same neurons, rules and randomness, but its scouts are switched off.

If Spoor beats the blind one, the smell is doing the work, not luck.` },
{ img: "learn", x: `Sugar and shock.

15 minutes after every buy, Spoor checks the price.
Up → sugar. That market smells sweeter next time.
Down → shock. It smells worse.

Memory halves every 6 hours. Old lessons fade.` },
{ img: "learn", x: `Today's learning log: [x] sugar, [y] shock.

It currently likes [ASSET] and avoids [ASSET].

Live at [SITE]/research#learn` },
{ img: "track", x: `We found a trap in testing.

The COIN pool on Robinhood Chain is thin: a $2,000 round trip loses about 45%.

So Spoor only buys a size it could sell back within 2% of mid, and sells in halves if the pool can't take it all.` },
{ img: "think", x: `Liquidity check, live from QuoterV2 on Robinhood Chain:

ETH, SPY, QQQ, NVDA, AAPL, GOOGL: ~0.1% round trip
TSLA, MSFT, AMZN, META: ~0.3%
COIN: 1.6% at $500, 45% at $2,000

Spoor sizes for this.` },
{ img: "lab", x: `"No AI makes the trades", explained.

Every trade comes from 302 simulated neurons and fixed rules. No language model, no neural net trained on charts.

Claude only reads: it keeps the lab notebook and writes diary drafts. It never touches a trade.` },
{ img: "live", x: `Open data:

/api/state → prices, books, every trade, the latest sniff
/api/connectome → the full 302-neuron wiring we run
/api/research → the lab notebook

Check our work at [SITE].` },
{ img: "think", x: `Try "Last decisive sniff" in the lab.

It replays the most recent sniff that actually led to a buy or a sell, so you can see which neurons pushed Spoor into the trade.

[SITE]/research` },
{ img: "books", x: `Day [N] scoreboard (paper, 10,000 USDG start):

Spoor [x,xxx]
Blind copy [x,xxx]
Random [x,xxx]
Hold [x,xxx]

[one honest line about who's winning and why]` },
{ img: "think", x: `Trade log:

[time] UTC, sniff [N] at [ASSET].
Smell [+0.xx]. AIY → RIB → AVB fired, forward drive [0.xx].
Second strong sniff in a row → paper buy, [$xx] at [price].

Every trade has a reason in the log.` },
{ img: "lab", x: `New: the lab notebook.

Every few minutes Claude reads the newest sniffs plus statistics the engine computes, writes a note, and tests its own hypotheses against fresh data.

Three batches for and a hypothesis holds. Three against and it falls.` },
{ img: "research", x: `Hypothesis [H#] is [holding / falling]:

"[hypothesis text]"

[x] batches for, [y] against.

The notebook only quotes numbers the engine computed. No predictions, no trade calls.` },
{ img: "lab", x: `Lab note [#], sniffs [a]–[b]:

"[note title]"

[one sentence from the observation]

Full notebook at [SITE]/research#lab` },
];
