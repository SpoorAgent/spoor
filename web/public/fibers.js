// Fibers: bundles of thin curved strands that converge on one core, with pulses of light running inward along them,
// like signals travelling down axons into a brain. Plain script so the landing page and the dashboard share it.
//   Fibers.mount(canvas, { center: (w, h) => ({ x, y, r }), strands: 220, glow: 1, still: false })
(function () {
  const PAL = [[146, 129, 247], [186, 167, 255], [186, 167, 255], [214, 206, 255], [58, 211, 137]]; // violet, violet, light violet, lavender, a little green
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function mount(canvas, o) {
    const opt = Object.assign({ strands: 220, bundles: 11, glow: 1, pulses: 0.85, seed: 302 }, o || {});
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const g = canvas.getContext("2d"), base = document.createElement("canvas"), bg = base.getContext("2d");
    let W = 1, H = 1, dpr = 1, S = [], P = [], last = performance.now(), visible = true, raf = 0, core = { x: 0, y: 0, r: 0 };

    function build() {
      const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = base.width = Math.round(W * dpr); canvas.height = base.height = Math.round(H * dpr);
      core = opt.center(W, H); const rand = rng(opt.seed), far = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, H - core.y)) * 1.08;
      S = [];
      // strands come in bundles; each bundle leaves the core at its own angle and bends the same way, like a nerve tract
      for (let b = 0; b < opt.bundles; b++) {
        const a0 = (b / opt.bundles) * Math.PI * 2 + (rand() - 0.5) * 0.35, twist = (rand() < 0.5 ? -1 : 1) * (0.35 + rand() * 0.55), n = Math.round(opt.strands / opt.bundles * (0.6 + rand() * 0.8));
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n - 0.5) * (0.1 + rand() * 0.1), tw = twist * (0.8 + rand() * 0.4), r0 = core.r * (1.02 + rand() * 0.08), wob = (rand() - 0.5) * 0.25;
          const pts = []; for (let k = 0; k <= 48; k++) { const t = k / 48, rr = r0 + (far - r0) * t, th = a + tw * Math.pow(t, 1.5) + wob * Math.sin(t * 3.1); pts.push([core.x + rr * Math.cos(th), core.y + rr * Math.sin(th)]); }
          S.push({ pts, col: PAL[Math.floor(rand() * PAL.length)], w: 0.5 + rand() * 0.8, a: 0.09 + rand() * 0.17 });
        }
      }
      // the static strands, drawn once: brightest near the core, fading toward the edges
      bg.setTransform(dpr, 0, 0, dpr, 0, 0); bg.clearRect(0, 0, W, H); bg.lineCap = "round";
      for (const s of S) { const [r, gg, b] = s.col; bg.lineWidth = s.w;
        for (let k = 0; k < 48; k++) { const t = k / 48, al = s.a * Math.min(1, t * 9) * Math.pow(1 - t, 0.7) * opt.glow; if (al < 0.004) continue;
          bg.strokeStyle = `rgba(${r},${gg},${b},${al})`; bg.beginPath(); bg.moveTo(...s.pts[k]); bg.lineTo(...s.pts[k + 1]); bg.stroke(); } }
      P = []; const n = Math.round(S.length * opt.pulses); for (let i = 0; i < n; i++) P.push(spawn(rand() * 1));
      draw(0);
    }
    function spawn(t) { const s = S[Math.floor(Math.random() * S.length)]; return { s, t: t ?? 1, v: 0.06 + Math.random() * 0.18, len: 0.05 + Math.random() * 0.09 }; }
    const at = (s, t) => { const f = Math.max(0, Math.min(47.999, t * 48)), k = Math.floor(f), u = f - k, a = s.pts[k], b = s.pts[k + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };

    function draw(dt) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); g.drawImage(base, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      for (let i = 0; i < P.length; i++) {
        const p = P[i]; p.t -= p.v * dt; if (p.t <= 0.015) { // reached the core: a brief spark, then a new pulse from the edge
          const [x, y] = at(p.s, 0.015), [r, gg, b] = p.s.col, h = g.createRadialGradient(x, y, 0, x, y, 7); h.addColorStop(0, `rgba(${r},${gg},${b},${0.7 * opt.glow})`); h.addColorStop(1, `rgba(${r},${gg},${b},0)`);
          g.fillStyle = h; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); P[i] = spawn(1); continue; }
        const [r, gg, b] = p.s.col, fade = Math.min(1, (1 - p.t) * 4) * Math.min(1, p.t * 6), head = at(p.s, p.t), tail = at(p.s, Math.min(1, p.t + p.len));
        const grd = g.createLinearGradient(tail[0], tail[1], head[0], head[1]); grd.addColorStop(0, `rgba(${r},${gg},${b},0)`); grd.addColorStop(1, `rgba(${Math.min(255, r + 60)},${Math.min(255, gg + 50)},${Math.min(255, b + 30)},${0.95 * fade * opt.glow})`);
        g.strokeStyle = grd; g.lineWidth = 2.1; g.beginPath(); g.moveTo(...tail); for (let q = 1; q <= 4; q++) g.lineTo(...at(p.s, p.t + p.len * (1 - q / 4))); g.stroke();
        g.fillStyle = `rgba(255,255,255,${0.8 * fade * opt.glow})`; g.beginPath(); g.arc(head[0], head[1], 1.1, 0, 7); g.fill();
      }
      g.globalCompositeOperation = "source-over";
    }
    function loop(now) { raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; if (visible && !document.hidden) draw(dt); }
    let t; const onResize = () => { clearTimeout(t); t = setTimeout(build, 150); };
    addEventListener("resize", onResize); new IntersectionObserver((es) => (visible = es[0].isIntersecting)).observe(canvas);
    build(); if (!reduce && !opt.still) raf = requestAnimationFrame(loop);
    return { rebuild: build, stop: () => cancelAnimationFrame(raf) };
  }
  window.Fibers = { mount };
})();
