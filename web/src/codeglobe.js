// The brain as a globe of disturbed terminal output.
// Lines of CLI text (the engine's real numbers, neuron names, synapses, quotes) are wrapped around a rotating sphere
// and drawn as monospace glyphs. It only appears once the page scrolls: the particle sphere glitches into it. The signal is "disturbed": glitch bands tear rows sideways, glyphs scramble near the
// pointer and in bursts, the neurons that fired in the last sniff are printed by name in accent, and as the scroll goes on
// the globe tears from the bottom up and its characters rain down, scrambling as they fall, toward the wave field.
const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01ABCDEF:;|~";
const hash = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const LN = 46, CN = 120; // the text grid that wraps the globe: 46 lines of 120 characters
const fmt = (x, d = 3) => (x >= 0 ? "+" : "") + Number(x).toFixed(d);

export function createCodeGlobe(canvas, { small, reduce }) {
  const g = canvas.getContext("2d");
  const cw = small ? 7 : 8.2, ch = small ? 11 : 13, font = `500 ${small ? 9.5 : 11.5}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
  let W = 0, H = 0, names = [], lines = [];
  const golden = Math.PI * (3 - Math.sqrt(5)), P = [];
  for (let i = 0; i < 302; i++) { const y = 1 - (2 * (i + 0.5)) / 302, r = Math.sqrt(1 - y * y), a = i * golden; P.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  const fire = new Float32Array(302), fireT = new Float32Array(302);
  let burst = 0, nextBurst = 2.5, bands = [];

  const size = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener("resize", size); size();

  // ---------- the text: a terminal session, rebuilt whenever the engine reports ----------
  const pad = (s) => { s = s + "   ·   "; let o = s; while (o.length < CN) o += s; return o.slice(0, CN); };
  const N = (i) => names[i] || `N${String(i).padStart(3, "0")}`;
  function filler(k) {
    const r = (s) => hash(k, s, 41), pick = () => N(Math.floor(r(k * 7 + 1) * 302) % 302);
    switch (k % 6) {
      case 0: return `0x${(Math.floor(r(1) * 0xffffff)).toString(16).padStart(6, "0")}  ${Array.from({ length: 12 }, (_, j) => Math.floor(hash(k, j, 9) * 256).toString(16).padStart(2, "0")).join(" ")}`;
      case 1: return `syn ${pick()} -> ${N(Math.floor(r(3) * 302))} w=${fmt((r(4) - 0.4) * 6, 1)} ${r(5) > 0.5 ? "chem" : "gap"}`;
      case 2: return `spike t=${(r(6) * 400).toFixed(1)}ms ${pick()} v=${fmt(r(7) - 0.5)}`;
      case 3: return `$ spoor trace --neuron ${pick()} --window 400ms`;
      case 4: return `[ok] connectome 302 neurons · 6393 chemical · 890 gap junctions`;
      default: return `integrate ${pick()} ${pick()} ${pick()} -> drive ${fmt(r(8) - 0.5, 2)}`;
    }
  }
  let feedHead = null;
  function build(feed) {
    if (feed) feedHead = feed;
    const head = feedHead || ["$ spoor boot --brain c.elegans --paper", "[ok] wiring 302 neurons from the published connectome", "$ spoor sniff --watch", "waiting for the first sniff ..."];
    lines = Array.from({ length: LN }, (_, k) => pad(k < head.length ? head[k] : filler(k)));
  }
  build();

  return {
    setNames(list) { names = list; build(); },
    // live engine state -> the top of the terminal
    setState(st, note) {
      const w = st.brain?.worm; if (!w) return;
      const row = st.matrix?.find((m) => m.sym === w.sym), q = st.prices?.[w.sym], books = ["worm", "blind", "random", "hold"]
        .map((k) => `${k === "worm" ? "spoor" : k} ${Math.round(st.books?.[k]?.equity?.at(-1)?.[1] ?? 10000)}`).join("  ");
      const fired = (w.spikes || []).map((n, i) => [n, i]).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([n, i]) => `${N(i)}x${n}`).join(" ");
      build([
        `$ spoor sniff --asset ${w.sym} --noses flow,tape,news`,
        `[cycle ${st.cycle}] flow ${fmt(row?.flow?.s ?? 0)} tape ${fmt(row?.tape?.s ?? 0)} news ${fmt(row?.news?.s ?? 0)}`,
        `smell ${fmt(w.smell)} -> drive ${fmt(w.v)} · ${w.f} forward · ${w.r} reverse spikes`,
        `fired ${fired || "none"}`,
        `decision ${String(w.decision).toUpperCase()} · next patch ${w.next}`,
        `uniswap.v3.quote(USDG/${w.sym}) ${q ? q.mid.toFixed(2) : "--"}`,
        `$ spoor books --paper`,
        books,
        ...(note ? [`$ spoor lab --latest`, `note #${note.id} ${note.title}`] : []),
      ]);
      (w.spikes || []).forEach((n, i) => { if (i < 302) fireT[i] = Math.min(1, n / 4); });
      this.glitch();
    },
    glitch() { if (reduce) return; burst = 1; const rows = 30; bands = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => { const a = Math.floor(Math.random() * rows); return { a, b: a + 1 + Math.floor(Math.random() * 4), dx: (Math.random() - 0.5) * 60, life: 0.08 + Math.random() * 0.2 }; }); nextBurst = 2 + Math.random() * 4; },

    // x, y, r: the globe on screen in px; rx, ry: its rotation; mx, my: pointer in px
    render({ x, y, r, rx, ry, t, dt, intro, morph, mx, my }) {
      g.clearRect(0, 0, W, H);
      // visible only while scrolling out of the hero: switches on (with heavy noise) over the first tenth of the scroll
      const show = Math.min(1, morph / 0.1), switching = 1 - show;
      if (intro <= 0.01 || morph <= 0.002 || morph > 0.72 || r < 4) return;
      if (!reduce) { nextBurst -= dt * (1 + morph * 6); if (nextBurst <= 0) this.glitch(); }
      burst = Math.max(0, burst - dt * 3); bands = bands.filter((b) => (b.life -= dt) > 0);
      for (let i = 0; i < 302; i++) fire[i] += (fireT[i] - fire[i]) * Math.min(1, dt * 2);
      g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
      const cxr = Math.cos(rx), sxr = Math.sin(rx), cyr = Math.cos(ry), syr = Math.sin(ry);
      const tick = reduce ? 0 : Math.floor(t * 14), scroll = reduce ? 0 : Math.floor(t * 1.4);
      const cols = Math.ceil((2 * r) / cw) + 1, rows = Math.ceil((2 * r) / ch) + 1;
      const x0 = x - ((cols - 1) * cw) / 2, y0 = y - ((rows - 1) * ch) / 2, reach = r * 0.5;
      const hot = []; // accent glyphs, drawn in a second pass
      g.fillStyle = "#a3a5aa";
      for (let j = 0; j < rows; j++) {
        const py = y0 + j * ch, ny = (y - py) / r; if (ny > 1 || ny < -1) continue;
        let off = 0; for (const b of bands) if (j % 30 >= b.a && j % 30 < b.b) off += b.dx;
        const scan = j % 2 ? 0.82 : 1; // faint interlace
        for (let i = 0; i < cols; i++) {
          const px = x0 + i * cw, nx = (px - x) / r, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
          const nz = Math.sqrt(1 - d2);
          // undo the rotation to find where on the globe this cell looks
          const qy = cxr * ny + sxr * nz, qz = -sxr * ny + cxr * nz, ox = cyr * nx - syr * qz, oz = syr * nx + cyr * qz, oy = qy;
          // melt: the bottom of the globe leaves first, exactly like the particles that replace it
          const leave = morph * 1.6 - ((oy + 1) * 0.42 + hash(i, j, 5) * 0.22) * 0.6;
          // cells that have left fall as code rain toward the wave field, fading and scrambling on the way
          const gone = leave > 0 ? leave / 0.45 : 0; if (gone >= 1) continue;
          const fall = gone > 0 ? gone * gone * H * (0.3 + hash(i, j, 13) * 0.55) : 0;
          if (hash(i, j, 7) > intro * 1.08) continue; // types itself in on load
          const u = Math.atan2(ox, oz) / (Math.PI * 2) + 0.5, v = Math.acos(Math.max(-1, Math.min(1, oy))) / Math.PI;
          const line = lines[(Math.floor(v * LN) + scroll) % LN];
          let c = line[Math.floor(u * CN) % CN];
          const lum = 0.16 + 0.84 * Math.max(0, -0.42 * nx + 0.5 * ny + 0.76 * nz);
          let a = lum * (0.3 + 0.7 * nz) * scan * show * (1 - gone);
          // disturbance: scrambling near the pointer, in bursts, and just before a cell melts away
          const md = Math.hypot(px - mx, py - my), near = md < reach ? 1 - md / reach : 0;
          const scr = 0.012 + burst * 0.3 + near * 0.6 + switching * 0.9 + (gone > 0 ? 0.85 : leave > -0.08 ? 0.6 : 0);
          let jx = 0, jy = 0, accent = line.startsWith("$ ");
          if (hash(i, j, tick + 99) < scr) { c = GLYPHS[Math.floor(hash(i, j, tick + 5) * GLYPHS.length)]; a = Math.min(1, a + 0.3); accent = accent || near > 0.25 || hash(i, j, tick + 3) < burst * 0.4 + gone * 0.35 + switching * 0.3; }
          if (near) { jx = (hash(i, j, tick + 1) - 0.5) * 7 * near; jy = (hash(i, j, tick + 2) - 0.5) * 4 * near; }
          if (c === " ") { if (hash(i, j, 3) > 0.3) continue; c = "."; a *= 0.5; }
          if (accent) hot.push(c, px + off + jx, py + jy + fall, a);
          else { g.globalAlpha = a; g.fillText(c, px + off + jx, py + jy + fall); }
        }
      }
      g.fillStyle = "#ffffff";
      for (let k = 0; k < hot.length; k += 4) { g.globalAlpha = Math.min(1, hot[k + 3] + 0.25); g.fillText(hot[k], hot[k + 1], hot[k + 2]); }
      // the neurons that fired in the last sniff, printed by name where they sit on the globe
      g.font = `600 ${small ? 9.5 : 11}px "JetBrains Mono", ui-monospace, monospace`;
      for (let k = 0; k < 302; k++) {
        if (fire[k] < 0.08) continue;
        const [px0, py0, pz0] = P[k], ax = cyr * px0 + syr * pz0, az0 = -syr * px0 + cyr * pz0, dy = cxr * py0 - sxr * az0, dz = sxr * py0 + cxr * az0;
        if (dz < 0.2) continue;
        if (morph * 1.6 - ((py0 + 1) * 0.42 + 0.11) * 0.6 > 0) continue;
        const sx = x + ax * r, sy = y - dy * r, pulse = 0.75 + 0.25 * Math.sin(t * 5 + k);
        g.globalAlpha = Math.min(1, fire[k] * pulse * (0.4 + dz)) * intro * show;
        g.fillStyle = "rgba(20,21,23,.85)"; const label = `[${N(k)}]`, tw = g.measureText(label).width + 6;
        g.fillRect(sx - tw / 2, sy - 8, tw, 16);
        g.fillStyle = "#ffffff"; g.fillText(label, sx, sy);
      }
      g.globalAlpha = 1;
    },
  };
}
