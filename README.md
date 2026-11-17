# Spoor

*It smells the market.* A spoor is the scent trail a hunter follows; SPOOR follows the market's. Its brain is a simulated nematode, C. elegans. (A few internal names, such as the `worm` book key and the `WORMBRAIN_DATA` variable, keep the old working name; nothing a visitor sees uses it.)

Logo and brand images: [github.com/RyoLan/spoor-brand](https://github.com/RyoLan/spoor-brand).

A whole *C. elegans* nervous system paper-trades tokenized stocks and ETH on Robinhood Chain. Paper only: no wallet, no key, no real orders, no user funds. Fills are Uniswap v3 QuoterV2 quotes plus gas; nothing is ever sent.

## How it works
- **Brain**: 302 leaky integrate-and-fire neurons, 3,671 chemical synapses and 1,091 gap-junction pairs from Cook et al. 2019 (hermaphrodite, corrected July 2020), loaded from the OpenWorm ConnectomeToolbox (MIT). Positions from OpenWorm c302 (MIT). GABA neurons inhibit; 13 navigation-circuit synapse classes take literature signs (`data/connectome.json` → `signRefs`); every other synapse excites.
- **Calibration**: the simulator constants in `server/brain.mjs` were found by random search so that attractant input (AWA, ASEL) raises forward-side activity (AIY, RIB, AVB, PVC) and repellent input (ASH, AWB, ASER) raises reverse-side activity (AIB, AIZ, RIM, AVA, AVD, AVE), without whole-brain runaway. `npm test` checks this.
- **Three scouts** (each a whole brain): Flow = Uniswap v3 Swap logs, USDG bought vs sold over 15 min. Tape = 15-minute price move. News = Yahoo Finance RSS headlines scored with VADER, last 6 h, recency-weighted.
- **Trader**: crawls 11 scent patches (`data/assets.json`), one sniff per cycle. Each asset has a scent made of real sensory neuron classes. Drive > 0.35 twice in a row → stays; > 0.4 while staying → buys. Drive < −0.35 → turns; < −0.4 on a held patch → sells. A little sensory noise makes it a biased random walk.
- **Learning**: 15 minutes after a buy (and every 15 min while held) the price outcome feeds sugar (gain) or a shock (loss) into that scent's synapses onto approach (AIY, AIA) and avoid (AIB, AIZ) interneurons. Half-life 6 h.
- **Books**: Spoor, Blind (no scouts, noise and memory only), Random (Spoor's timing and size, coin-flip direction), Hold (equal weight once). 10,000 USDG each. Max 20% per asset, buys 5% of equity and ≥ $25, new buys pause for the day after a 3% fall.
- **Lab notebook**: every sniff is logged (decision, drive, spike counts, first-spike times of key neurons). Every `RESEARCH_EVERY_MIN` minutes (default 5) Claude (claude-opus-5-5) reads the new sniffs plus statistics computed by the engine, writes a short note, proposes testable hypotheses and scores the open ones against each new batch (three batches for = holding, three against = rejected). The dashboard shows it under the replay and rings the neurons the note is about. `RESEARCH=off` stops it; `RESEARCH_PER_DAY` caps notes per day. At the default pace that is up to 288 calls a day.
- **Voice**: every few hours Claude (claude-opus-5-5) writes a draft post from the telemetry. Drafts only, shown on the site, never posted.

## Run
```
npm install
cp .env.example .env      # set ANTHROPIC_API_KEY to enable drafts (optional)
npm test                  # brain sanity checks
npm start                 # http://localhost:5300 (lab at /research), a cycle every 60 s
```
State lives in `data/state.json` (delete it to restart the books), or in `$WORMBRAIN_DATA` when set. API: `/api/state`, `/api/connectome`, `/api/history?sym=ETH`, `/api/voice`, `/api/research` (lab notebook; `data/research.json`).

The landing page is built from `web/` (Vite + Three.js) into `site/`: `npm --prefix web install`, then `npm run web:build`. `npm run web:dev` serves it on :5173 with `/api` proxied to the engine.

## Apps (Windows, macOS, Linux, Android)
Each app runs the whole engine on the device and shows the site in a window. Nothing is sent but read-only RPC calls, Yahoo RSS and (if you add a key) Claude.

- **Desktop** (`desktop/main.mjs`, Electron): `npm run desktop:dev` to try it, `npm run desktop:build` for installers in `dist-desktop/` (Windows `Setup.exe` + `Portable.exe`, macOS `.dmg`, Linux `.AppImage`, each built on its own OS). State and settings live in the user data folder (`%APPDATA%\Spoor` on Windows, `~/Library/Application Support/Spoor` on macOS); the menu has **Edit settings (API key)…** and **Restart engine**.
- **Android** (`mobile/`, Capacitor 8 + [capacitor-nodejs](https://github.com/hampoelz/Capacitor-NodeJS) on Node 18.20): `scripts/prepare.mjs` bundles the engine into one file with esbuild, a boot screen waits for it, then opens `http://127.0.0.1:5300`. The engine only runs while the app is open; Android pauses it in the background. Settings live in `spoor.env` inside the app's private data folder.
- **Releases**: `.github/workflows/release.yml` builds all of the above. Run it from the Actions tab for artifacts, or push a tag (`git tag v0.2.0 && git push --tags`) to publish a GitHub Release. Builds are unsigned; add `WB_KEYSTORE_BASE64`, `WB_KEYSTORE_PASSWORD`, `WB_KEY_ALIAS`, `WB_KEY_PASSWORD` secrets for a signed Android release APK (a debug-signed APK is always produced).

No API key is ever built into an app: each user adds their own.

## Honest limits
This is a model of a wiring diagram, not a living animal. Synapse signs are simplified, constants were calibrated, the trading rules are ours, and each asset's scent is an arbitrary pairing of real sensory neurons.

Not affiliated with or endorsed by Robinhood, Uniswap or OpenWorm. Not investment advice.
