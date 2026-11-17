// Motion: shared text and card animation for the landing page and the dashboard. Plain script, no dependencies.
//   Motion.words(selector)            headings rise word by word when they scroll into view
//   Motion.peel(selector, strength)   cards start tipped back in 3D and peel flat as they scroll in
//   Motion.tilt(selector)             cards lean toward the cursor, with a soft spotlight under it
//   Motion.scramble(el, text)         mono text decodes from random glyphs into its value
// Everything is skipped under prefers-reduced-motion.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = `
  .mw{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .14em;margin:0 -.04em -.14em}
  .mw>.mi{display:inline-block;transform:translateY(108%) rotate(5deg);transform-origin:0 100%;opacity:0;transition:transform 1s cubic-bezier(.16,.84,.24,1),opacity .6s ease-out;transition-delay:calc(var(--i,0)*55ms)}
  .mw-in .mw>.mi{transform:none;opacity:1}
  .mpeel{transform-origin:50% 0;will-change:transform;transform:perspective(1300px) rotateX(calc(var(--pe,0)*var(--pk,22)*1deg + var(--rx,0)*1deg)) rotateY(calc(var(--ry,0)*1deg)) translateY(calc(var(--pe,0)*var(--pk,22)*3.4px)) scale(calc(1 - var(--pe,0)*.05));opacity:calc(1 - var(--pe,0)*.85)}
  .mtilt{position:relative}
  .mtilt::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .25s ease-out;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(186,167,255,.09),transparent 60%)}
  .mtilt.hot::after{opacity:1}
  .mtilt.hot{border-color:rgba(186,167,255,.32)!important}`;
  if (!reduce) { const s = document.createElement("style"); s.textContent = css; document.head.append(s); }

  /** Wrap every word (keeping <br>, <i>, <span> and other inline markup) in a clipped span. */
  function split(el) {
    if (el.dataset.mw) return; el.dataset.mw = "1"; let i = 0;
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          for (const p of parts) { if (!p) continue; if (/^\s+$/.test(p)) { frag.append(p); continue; }
            const w = document.createElement("span"), inner = document.createElement("span"); w.className = "mw"; inner.className = "mi"; inner.style.setProperty("--i", i++); inner.textContent = p; w.append(inner); frag.append(w); }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("mw")) walk(n);
      }
    };
    walk(el);
  }
  // headings reveal when seen; the scroll check in update() is a backup for browsers that delay observers (background tabs)
const pending = new Set();
const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("mw-in"); seen.unobserve(e.target); pending.delete(e.target); } }), { threshold: 0.2 });
  function words(sel) { if (reduce) return; document.querySelectorAll(sel).forEach((el) => { split(el); seen.observe(el); pending.add(el); }); schedule(); }
  /** Re-run the rise on an element whose text was just replaced (e.g. a live title). */
  function rewords(el) { if (reduce || !el) return; delete el.dataset.mw; el.classList.remove("mw-in"); split(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("mw-in"))); }

  // peel: progress follows the card's position, so it peels in and tips back out as you scroll
  const peeled = new Set(); let queued = false;
  function update() {
    queued = false; const vh = innerHeight;
    for (const el of pending) { const r = el.getBoundingClientRect(); if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add("mw-in"); pending.delete(el); seen.unobserve(el); } }
    for (const el of peeled) { const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) continue;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.42))); el.style.setProperty("--pe", ((1 - p) ** 2).toFixed(3)); }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  function peel(sel, k = 22) { if (reduce) return; document.querySelectorAll(sel).forEach((el) => { el.classList.add("mpeel"); el.style.setProperty("--pk", k); peeled.add(el); }); schedule(); }
  addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", schedule);

  // tilt + spotlight, eased toward the cursor
  function tilt(sel, max = 5) {
    if (reduce || matchMedia("(hover: none)").matches) return;
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add("mtilt"); if (!el.classList.contains("mpeel")) el.classList.add("mpeel");
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      const step = () => { cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14; el.style.setProperty("--rx", cx.toFixed(2)); el.style.setProperty("--ry", cy.toFixed(2)); raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(step) : 0; };
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", `${(u * 100).toFixed(1)}%`); el.style.setProperty("--my", `${(v * 100).toFixed(1)}%`);
        const m = Math.min(max, 900 / Math.max(r.width, 1)); ty = (u - 0.5) * 2 * m; tx = -(v - 0.5) * 2 * m * 0.7; el.classList.add("hot"); if (!raf) raf = requestAnimationFrame(step); });
      el.addEventListener("pointerleave", () => { tx = ty = 0; el.classList.remove("hot"); if (!raf) raf = requestAnimationFrame(step); });
    });
  }

  const GLYPHS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ+−·/";
  function scramble(el, text, ms = 650) {
    if (!el) return; if (reduce || el.dataset.scrambled) { el.textContent = text; return; } el.dataset.scrambled = "1";
    const t0 = performance.now(), n = text.length;
    const step = (now) => { const k = Math.min(1, (now - t0) / ms), done = Math.floor(k * n);
      el.textContent = text.slice(0, done) + [...text.slice(done)].map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join("");
      if (k < 1) requestAnimationFrame(step); else el.textContent = text; };
    requestAnimationFrame(step);
  }

  window.Motion = { words, rewords, peel, tilt, scramble, reduce };
})();
