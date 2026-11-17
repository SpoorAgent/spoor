# Spoor · X content kit

Everything for an X account about Spoor: post texts, research cards, brand images and live screenshots of the lab.
The original kit stays in `konten-x/` for reference; nothing here reuses its account, token or CA.

## What is here
| Path | What |
|---|---|
| `POSTS.md` | All posts in posting order: 30 "Field Notes" research posts, 28 product posts, launch thread, daily templates, rules |
| `PROFILE.txt` | Display name, handle ideas, bio options, pinned-post plan |
| `research/NN-*.png` | 30 research cards, 1920×1080, one per Field Notes post |
| `product/*.png` | 10 live screenshots, 1920×1080: `hero`, `signals`, `live`, `research` (landing) and `think`, `track`, `books`, `scouts`, `learn`, `lab` (the lab) |
| `brand/x-pfp.png` | Profile photo, 1000×1000 (the coin) |
| `brand/x-banner.png` | Header, 2400×800 (3:1, X shows it at 1500×500) |
| `brand/og.png` | Link preview for the site, 1200×630 |
| `brand/launch.png`, `brand/teaser.png` | Images for the launch post and the pre-launch teaser |
| `brand/coin.png` | The 3D coin, captured from the landing page |

## Before you post
1. Replace `[SITE]` in `POSTS.md` with your domain, and every `[..]` with live numbers from the lab (/research).
2. Product screenshots go stale fast. Re-render them on the day you post (below).
3. If you launch a token, use L4 in the launch thread and keep its disclosure line. Leave the shill-style callouts out.

## Re-render
The engine must be running (`npm start`, port 5300). From the repo root:

```bash
npm run content
```

Or only some parts: `npx electron konten-spoor/_src/render.mjs coin cards brand product`.
`coin` must run before `brand`. Rendering uses the Electron the desktop app already installs, so it works on Windows, macOS and Linux.
`node konten-spoor/_src/posts.mjs` rebuilds `POSTS.md` after you edit `_src/research.mjs`, `_src/product.mjs` or `_src/launch.md`.

## Not included
- The launch film (in the old kit). Making a video needs ffmpeg, which is not installed here. `brand/launch.png` replaces it for now.
- Automatic posting. Post by hand or with X's own scheduler; the engine only writes drafts.
