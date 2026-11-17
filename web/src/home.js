// The SPOOR home page: a particle brain (302 plexus nodes lit by the latest sniff's spikes). On scroll it glitches into
// a globe of disturbed CLI text that tears and rains down as code, and a wave field forms at the bottom; Lenis + GSAP choreography,
// solid dark cards, and live numbers from the engine.
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createCodeGlobe } from "./codeglobe.js";

gsap.registerPlugin(ScrollTrigger);
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
scrollTo(0, 0);

const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(pointer: fine)").matches;
const small = innerWidth < 760;
const S = { morph: 0, lift: 0, intro: 0, mx: 0, my: 0, tmx: 0, tmy: 0, spin: 0, vel: 0, pan: 0 };
let codeGlobe = null, lastNote = null;
const fire = new Float32Array(302), fireTarget = new Float32Array(302); // per-neuron glow from the latest sniff

/* =========================== WebGL scene =========================== */
let renderScene = () => {}, sceneResize = () => {};
try {
  const renderer = new THREE.WebGLRenderer({ canvas: $("#gl"), antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x141517, 1);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
  const center = new THREE.Vector3(0, 0.9, 0); let radius = 2.3;
  const golden = Math.PI * (3 - Math.sqrt(5));

  // ---- the particle cloud: every point has a home on the sphere and a home in the wave field
  const N = small ? 4200 : 9000, COLS = small ? 90 : 150, ROWS = Math.ceil(N / COLS), HALFX = small ? 7 : 15;
  const sph = new Float32Array(N * 3), ter = new Float32Array(N * 3), rnd = new Float32Array(N * 4);
  const order = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * golden, j = 1 + (Math.random() - 0.5) * 0.07;
    sph.set([Math.cos(a) * r * j, y * j, Math.sin(a) * r * j], i * 3);
    const k = order[i], cx = k % COLS, cz = Math.floor(k / COLS);
    ter.set([-HALFX + (cx / (COLS - 1)) * HALFX * 2 + (Math.random() - 0.5) * 0.05, -2.75, -18 + (cz / (ROWS - 1)) * 23], i * 3);
    rnd.set([Math.min(1, Math.max(0, (y + 1) * 0.42 + Math.random() * 0.22)), Math.random(), Math.random(), Math.random()], i * 4); // the bottom drips first
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(sph, 3));
  pg.setAttribute("aSphere", new THREE.BufferAttribute(sph, 3));
  pg.setAttribute("aTerrain", new THREE.BufferAttribute(ter, 3));
  pg.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
  const PU = {
    uTime: { value: 0 }, uMorph: { value: 0 }, uLift: { value: 0 }, uIntro: { value: 0 }, uSize: { value: small ? 2.3 : 2.1 },
    uPR: { value: 1 }, uRot: { value: new THREE.Vector2() }, uMouse: { value: new THREE.Vector3(99, 99, 0) },
    uCenter: { value: center }, uRadius: { value: radius }, uOpacity: { value: 0.85 },
  };
  const points = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: PU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uMorph, uLift, uIntro, uSize, uPR, uRadius;
      uniform vec2 uRot; uniform vec3 uMouse, uCenter;
      attribute vec3 aSphere, aTerrain; attribute vec4 aRand;
      varying float vAlpha;
      mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
      mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
      float wave(vec2 p, float t){ return sin(p.x*.32 + t*.6)*.42 + cos(p.y*.45 + t*.42)*.32 + sin((p.x + p.y)*.18 - t*.3)*.36; }
      void main(){
        float t = uTime;
        vec3 dir = rotX(uRot.x) * rotY(uRot.y) * aSphere;
        float scatter = 1. + (1. - uIntro) * (1.5 + aRand.w * 5.);
        vec3 s = uCenter + dir * uRadius * scatter * (1. + sin(t*.8 + aRand.z*6.2831)*.012);
        s += normalize(dir) * smoothstep(1.7, 0., distance(s.xy, uMouse.xy)) * .42 * smoothstep(-.3, .4, dir.z);
        vec3 g = aTerrain;
        g.y += wave(g.xz, t) * (1. + uLift*.7) + uLift*1.1;
        float p = clamp(uMorph*1.6 - aRand.x*.6, 0., 1.);
        float e = p*p*(3. - 2.*p), u = 1. - e;
        vec3 c1 = vec3(s.x*.16 + sin(aRand.z*6.2831)*.22, uCenter.y - uRadius*1.35, s.z*.16);
        vec3 c2 = vec3(g.x*.2, g.y + 2.8, g.z*.2 + .8);
        vec3 pos = u*u*u*s + 3.*u*u*e*c1 + 3.*u*e*e*c2 + e*e*e*g;
        float mid = sin(3.14159*e);
        pos.x += sin(t*2.3 + aRand.z*12. + e*9.) * .32 * mid;
        pos.z += cos(t*1.9 + aRand.y*9. + e*7.) * .32 * mid;
        pos.y += sin(t*3.1 + aRand.w*20.) * .08 * mid;
        vec4 mv = modelViewMatrix * vec4(pos, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.55 + aRand.y) * (1. + mid*.7) * uPR * (12. / -mv.z);
        float front = mix(.28, 1., smoothstep(-1., 1., dir.z));
        float near = smoothstep(-18., -2., g.z) * smoothstep(6., 2., g.z);
        vAlpha = mix(front, .25 + near*.75, e) * (.6 + mid*.55) * min(1., uIntro*1.4)
          // the sphere hands over to the code globe as soon as scrolling starts; particles come back only as the wave field
          * max((1. - smoothstep(0., .1, uMorph)) * (1. - smoothstep(0., .05, e)), smoothstep(.8, 1., e));
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity; varying float vAlpha;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(.9, .91, .93, smoothstep(.5, .05, d) * vAlpha * uOpacity); }`,
  }));
  points.frustumCulled = false; scene.add(points);

  // ---- the plexus: 302 nodes, one per neuron, joined to their neighbours; neurons that spiked in the last sniff glow
  const P = [];
  for (let i = 0; i < 302; i++) { const y = 1 - (2 * (i + 0.5)) / 302, r = Math.sqrt(1 - y * y), a = i * golden; P.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  const seg = [], links = new Array(302).fill(0);
  for (let i = 0; i < 302; i++) for (let k = i + 1; k < 302; k++) {
    if (links[i] > 3 || links[k] > 3) continue;
    if (P[i].distanceTo(P[k]) < 0.3) { seg.push(P[i].x, P[i].y, P[i].z, P[k].x, P[k].y, P[k].z); links[i]++; links[k]++; }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf5f5f5, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const ng = new THREE.BufferGeometry().setFromPoints(P);
  const fireAttr = new THREE.BufferAttribute(fire, 1); ng.setAttribute("aFire", fireAttr);
  ng.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: 302 }, () => Math.random() * 6.28), 1));
  const NU = { uTime: { value: 0 }, uPR: { value: 1 }, uAlpha: { value: 0 } };
  const nodes = new THREE.Points(ng, new THREE.ShaderMaterial({
    uniforms: NU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uPR; attribute float aFire, aSeed; varying float vF, vD;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mv;
        float beat = aFire * (.75 + .25 * sin(uTime*5. + aSeed));
        vF = beat; vD = clamp((mv.z + 14.) / 4., 0., 1.); // nearer nodes are brighter
        gl_PointSize = (3. + beat*13.) * uPR * (12. / -mv.z);
      }`,
    fragmentShader: /* glsl */`
      uniform float uAlpha; varying float vF, vD;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        float core = smoothstep(.5, .1, d), halo = smoothstep(.5, .0, d) * .5;
        // idle nodes are off-white; the ones that fired burn bright white
        vec3 col = mix(vec3(.62, .63, .66), vec3(1.), smoothstep(.15, .6, vF));
        gl_FragColor = vec4(col, (core*(.4 + vD*.4) + halo*vF) * (.55 + vF*.8) * uAlpha); }`,
  }));
  nodes.frustumCulled = false;
  const web = new THREE.Group(); web.add(new THREE.LineSegments(lg, lineMat), nodes); scene.add(web);

  // ---- topographic line terrain under the brain, with a valley beneath it
  const TR = small ? 34 : 46, TC = small ? 70 : 120, TW = small ? 16 : 26, tpos = [];
  for (let r = 0; r < TR; r++) { const z = -24 + (r / (TR - 1)) * 30;
    for (let c = 0; c < TC; c++) tpos.push(-TW + (c / TC) * TW * 2, 0, z, -TW + ((c + 1) / TC) * TW * 2, 0, z); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tpos, 3));
  const TU = { uTime: { value: 0 }, uFade: { value: 1 }, uSink: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 0) } };
  const terrain = new THREE.LineSegments(tg, new THREE.ShaderMaterial({
    uniforms: TU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uSink; uniform vec3 uMouse; varying float vA;
      float wave(vec2 p, float t){ return sin(p.x*.28 + t*.5)*.5 + cos(p.y*.35 + t*.35)*.38 + sin((p.x - p.y)*.15 + t*.25)*.42; }
      void main(){
        vec3 p = position;
        p.y += wave(p.xz, uTime) * (.28 + smoothstep(1., 11., abs(p.x))*1.05) - uSink;
        p.y += sin(length(p.xz - vec2(uMouse.x*1.6, -4.)) * 1.4 - uTime*2.) * .06;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(-24., -9., p.z) * smoothstep(7., 1.5, p.z);
      }`,
    fragmentShader: /* glsl */`uniform float uFade; varying float vA; void main(){ gl_FragColor = vec4(.84, .85, .87, .3 * vA * uFade); }`,
  }));
  terrain.position.y = -3.25; terrain.frustumCulled = false; scene.add(terrain);

  const ray = new THREE.Vector3(), mouseW = new THREE.Vector3();
  sceneResize = () => {
    const w = innerWidth, h = innerHeight, aspect = w / h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 760 ? 1.5 : 1.75)); renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.position.z = aspect < 1 ? 12 + (1 - aspect) * 11 : 12; camera.updateProjectionMatrix();
    radius = aspect < 1 ? 1.95 : 2.3; center.y = aspect < 1 ? 1.6 : 0.9;
    PU.uRadius.value = radius; PU.uPR.value = NU.uPR.value = renderer.getPixelRatio();
  };
  sceneResize();
  codeGlobe = createCodeGlobe($("#code"), { small, reduce });
  const proj = new THREE.Vector3();

  renderScene = (t, dt) => {
    S.mx += (S.tmx - S.mx) * Math.min(1, dt * 3); S.my += (S.tmy - S.my) * Math.min(1, dt * 3);
    S.spin += dt * (reduce ? 0.02 : 0.11 + Math.min(1.2, Math.abs(S.vel) * 0.004));
    const rx = 0.22 - S.my * 0.32, ry = S.spin + S.mx * 0.55;
    PU.uTime.value = TU.uTime.value = NU.uTime.value = reduce ? 0 : t;
    PU.uRot.value.set(rx, ry); PU.uMorph.value = S.morph; PU.uLift.value = S.lift; PU.uIntro.value = S.intro;
    for (let i = 0; i < 302; i++) fire[i] += (fireTarget[i] - fire[i]) * Math.min(1, dt * 2);
    fireAttr.needsUpdate = true;
    web.position.copy(center); web.scale.setScalar(radius * (1 + (1 - S.intro) * 2)); web.rotation.set(rx, ry, 0);
    // the plexus hands over to the code globe in the first tenth of the scroll
    const webA = S.intro * (1 - Math.min(1, S.morph * 10));
    lineMat.opacity = 0.17 * webA; NU.uAlpha.value = webA; web.visible = webA > 0.01;
    TU.uFade.value = S.intro * (1 - Math.min(1, S.morph * 1.6)); TU.uSink.value = S.morph * 1.6; terrain.visible = TU.uFade.value > 0.01;
    ray.set(S.mx, S.my, 0.5).unproject(camera).sub(camera.position).normalize();
    mouseW.copy(camera.position).addScaledVector(ray, -camera.position.z / ray.z);
    PU.uMouse.value.copy(mouseW); TU.uMouse.value.copy(mouseW);
    // the camera slides opposite the content, so the stream and the wave field fill the empty side
    camera.position.x += (S.mx * 0.5 + S.pan - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y = 0.35 + S.my * 0.25 - S.morph * 0.9;
    camera.lookAt(S.pan, -S.morph * 1.1, 0);
    renderer.render(scene, camera);
    // the code globe sits exactly where the particle sphere would be
    camera.updateMatrixWorld(); proj.copy(center).project(camera);
    const rpx = (radius / (camera.position.distanceTo(center) * Math.tan((camera.fov * Math.PI) / 360))) * (innerHeight / 2);
    codeGlobe.render({ x: ((proj.x + 1) / 2) * innerWidth, y: ((1 - proj.y) / 2) * innerHeight, r: rpx, rx, ry, t, dt, intro: S.intro, morph: S.morph,
      mx: S.hasPtr ? ((S.tmx + 1) / 2) * innerWidth : -1e4, my: S.hasPtr ? ((1 - S.tmy) / 2) * innerHeight : -1e4 });
  };
} catch (err) {
  console.warn("WebGL unavailable, showing the page without the scene", err);
  document.documentElement.classList.add("no-gl");
}

/* =========================== smooth scroll: one clock for Lenis, ScrollTrigger and the scene =========================== */
const lenis = reduce ? null : new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.95 });
if (lenis) lenis.on("scroll", (e) => { S.vel = e.velocity; ScrollTrigger.update(); });
let last = 0;
gsap.ticker.add((time) => {
  const dt = Math.min(0.05, last ? time - last : 0.016); last = time;
  if (lenis) lenis.raf(time * 1000);
  renderScene(time, dt);
});
gsap.ticker.lagSmoothing(0);

addEventListener("pointermove", (e) => { S.hasPtr = e.pointerType === "mouse"; S.tmx = (e.clientX / innerWidth) * 2 - 1; S.tmy = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });
let rz; addEventListener("resize", () => { sceneResize(); clearTimeout(rz); rz = setTimeout(() => { $$(".split").forEach((p) => splitLines(p, true)); ScrollTrigger.refresh(); }, 200); });
$$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href"), t = id === "#top" ? 0 : $(id); if (t === null) return;
  e.preventDefault(); lenis ? lenis.scrollTo(t, { duration: 2.2 }) : t === 0 ? scrollTo(0, 0) : t.scrollIntoView();
}));

/* =========================== typography =========================== */
function splitLines(el, settled) {
  const text = el.dataset.text || (el.dataset.text = el.innerHTML.trim());
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  const lines = []; let top = null;
  $$(".w", el).forEach((w) => { if (top === null || Math.abs(w.offsetTop - top) > 3) { lines.push([]); top = w.offsetTop; } lines.at(-1).push(w.innerHTML); });
  el.innerHTML = lines.map((l) => `<span class="line"><span>${l.join(" ")}</span></span>`).join("");
  if (settled) gsap.set($$(".line>span", el), { yPercent: 0, opacity: 1 });
}

/* =========================== choreography =========================== */
gsap.timeline({ defaults: { ease: "expo.out" } })
  .to("#gl", { opacity: 1, duration: 1.6, ease: "power2.out" }, 0)
  .to(S, { intro: 1, duration: reduce ? 0.01 : 2.8, ease: "power3.out" }, 0)
  .from(".nav > *", { y: -24, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.3)
  .from(".eyebrow.hi", { y: 14, opacity: 0, duration: 1.1 }, 0.5)
  .from(".title .in", { yPercent: 115, duration: 1.6, stagger: 0.12 }, 0.55)
  .to(".uline i", { scaleX: 1, duration: 1.5, ease: "power3.inOut" }, 0.95)
  .from(".live", { y: 40, opacity: 0, scale: 0.94, duration: 1.4 }, 1.1)
  .from(".hero-cards > *", { y: 20, opacity: 0, duration: 1.1, stagger: 0.1 }, 1.2)
  .from(".hero-foot .ft", { y: 16, opacity: 0, duration: 1.1, stagger: 0.1 }, 1.25);

// the brain melts into a liquid stream between the hero and section 02, and the wave field swells at the end
gsap.to(S, { morph: 1, ease: "none", scrollTrigger: { trigger: "#intro", start: "top bottom", endTrigger: "#how", end: "top 30%", scrub: 1.4 } });
gsap.to(S, { lift: 1, ease: "none", scrollTrigger: { trigger: "#lab", start: "top bottom", end: "bottom bottom", scrub: 1.2 } });

// hero type trails the scroll and sinks back behind its mask; the underline and the live card move at their own speeds
gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } })
  .to(".title", { y: () => innerHeight * 0.42, ease: "none" }, 0)
  .to(".title", { opacity: 0, ease: "power2.in" }, 0)
  .to(".title .drift", { yPercent: 108, ease: "power1.in" }, 0)
  .to(".eyebrow.hi", { y: () => innerHeight * 0.3, opacity: 0, ease: "none" }, 0)
  .to(".uline", { y: () => innerHeight * 0.2, scaleX: 0.2, opacity: 0, transformOrigin: "left", ease: "none" }, 0)
  .to(".live", { y: () => -innerHeight * 0.18, opacity: 0, ease: "power1.in" }, 0)
  .to(".hero-cards", { y: () => innerHeight * 0.42, opacity: 0, ease: "power2.in" }, 0) // moves with the title, so they never cross
  .to(".hero-foot", { y: 50, opacity: 0, ease: "none" }, 0);

// sections arrive like slides: 01 from the left, 02 from the right, 03 rises in the centre.
// The scene pans away from the content and the pools of light follow it.
const vw = (v) => (innerWidth * v) / 100, vh = (v) => (innerHeight * v) / 100;
const STAGES = {
  hero:   { pan: 0,    g: [[0, -16], [26, 22], [-30, 28]] },
  left:   { pan: -1.7, g: [[-26, 6], [-8, 30], [32, -20]] },
  right:  { pan: 1.7,  g: [[26, 2], [8, 30], [-32, -12]] },
  center: { pan: 0,    g: [[0, 8], [-24, 32], [24, 32]] },
};
const blobs = $$(".glow i");
function stage(name) {
  const st = STAGES[name], k = small ? 0.35 : 1;
  gsap.to(S, { pan: st.pan * k, duration: 2.2, ease: "power3.inOut", overwrite: "auto" });
  blobs.forEach((b, i) => gsap.to(b, { x: vw(st.g[i][0] * (small ? 0.6 : 1)), y: vh(st.g[i][1]), duration: 2.6, ease: "power3.inOut", overwrite: "auto" }));
}
stage("hero");
ScrollTrigger.create({ trigger: "#hero", start: "top top", end: "bottom 45%", onToggle: (st) => st.isActive && stage("hero") });
$$(".ed[data-side]").forEach((sec) => {
  const side = sec.dataset.side, body = $(".body", sec), rail = $(".rail", sec);
  ScrollTrigger.create({ trigger: sec, start: "top 55%", end: "bottom 45%", onToggle: (st) => st.isActive && stage(side) });
  const from = side === "left" ? { x: -120 } : side === "right" ? { x: 120 } : { y: 90, scale: 0.94 };
  gsap.fromTo(body, { ...from, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: sec, start: "top 88%", end: "top 30%", scrub: 1 } });
  gsap.fromTo(rail, { x: side === "left" ? -40 : side === "right" ? 40 : 0, opacity: 0 }, { x: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: sec, start: "top 80%", end: "top 35%", scrub: 1 } });
});

$$(".rule").forEach((r) => gsap.to(r, { scaleX: 1, ease: "none", scrollTrigger: { trigger: r, start: "top 92%", end: "top 45%", scrub: 0.8 } }));
$$(".h2").forEach((h) => gsap.from($$(".kin", h), { yPercent: 112, duration: 1.4, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: h, start: "top 85%" } }));
$$(".ed").forEach((sec) => {
  // rails first, then cards and rows in reading order
  gsap.from($$(".rail .rv", sec), { y: 30, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: sec.querySelector(".body"), start: "top 80%" } });
  $$(".body .rv", sec).forEach((el, i) => gsap.from(el, { y: 44, opacity: 0, duration: 1.2, ease: "expo.out", delay: (i % 4) * 0.07, scrollTrigger: { trigger: el, start: "top 92%" } }));
});
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  $$(".split").forEach((p) => {
    splitLines(p);
    gsap.from($$(".line>span", p), { yPercent: 100, opacity: 0, duration: 1.15, ease: "expo.out", stagger: 0.075, scrollTrigger: { trigger: p, start: "top 86%" } });
  });
  ScrollTrigger.refresh();
});

/* =========================== micro-interactions =========================== */
if (fine && !reduce) {
  $$("[data-mag]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }), yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * 0.3); yTo((e.clientY - (r.top + r.height / 2)) * 0.4); });
    el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, .45)" }));
  });
  // a soft highlight follows the pointer across every card and button
  $$(".solid").forEach((el) => el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect(); el.style.setProperty("--px", `${e.clientX - r.left}px`); el.style.setProperty("--py", `${e.clientY - r.top}px`);
  }));
}
// buttons squash slightly when pressed and spring back
$$("[data-press]").forEach((el) => {
  el.addEventListener("pointerdown", () => gsap.to(el, { scaleX: 1.06, scaleY: 0.92, duration: 0.18, ease: "power2.out" }));
  const up = () => gsap.to(el, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1.2, .35)" });
  el.addEventListener("pointerup", up); el.addEventListener("pointerleave", up);
});

/* =========================== live numbers from the engine =========================== */
const sg = (x) => (x > 0 ? "+" : x < 0 ? "−" : "±") + Math.abs(x).toFixed(2);
const money = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });
const tone = (el, x) => { el.classList.toggle("up", x > 0); el.classList.toggle("down", x < 0); };
let lastCycle = -1;
// the four live paper curves, on one shared scale, with the 10,000 USDG start as a dashed line
function drawEquity(books) {
  const keys = ["worm", "blind", "random", "hold"], series = {};
  let lo = 10000, hi = 10000;
  for (const k of keys) {
    const e = books?.[k]?.equity || []; if (!e.length) continue;
    const step = Math.max(1, Math.floor(e.length / 240)), pts = [];
    for (let i = 0; i < e.length; i += step) pts.push(e[i][1]);
    pts.push(e.at(-1)[1]); series[k] = pts;
    for (const v of pts) { if (v < lo) lo = v; if (v > hi) hi = v; }
  }
  const pad = (hi - lo) * 0.12 || 20, y = (v) => 228 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 216;
  for (const k of keys) {
    const pts = series[k], path = document.querySelector('#eqChart [data-line="' + k + '"]'); if (!pts || !path) continue;
    path.setAttribute("d", pts.map((v, i) => (i ? "L" : "M") + ((i / (pts.length - 1)) * 600).toFixed(1) + " " + y(v).toFixed(1)).join(" "));
  }
  const base = document.getElementById("eqBase"); if (base) { base.setAttribute("y1", y(10000).toFixed(1)); base.setAttribute("y2", y(10000).toFixed(1)); }
}
async function live() {
  try {
    const st = await (await fetch("/api/state", { cache: "no-store" })).json(); $("#ribbon").hidden = true;
    $("#lcCycle").textContent = `cycle ${st.cycle}${st.error ? " · retrying" : ""}`;
    const ls = st.learnStats || {};
    $("#barStats").innerHTML = `${money(ls.sugar ?? 0)} sugar · ${money(ls.shock ?? 0)} shock learned · cycle ${money(st.cycle)} · <a href="/research#learn">latest lesson</a>`;
    if (Array.isArray(st.log) && st.log.length) tickFeed = st.log.slice(0, 8);
    // books, leader marked
    let best = null, bestE = -Infinity;
    for (const k of ["worm", "blind", "random", "hold"]) {
      const e = st.books?.[k]?.equity?.at(-1)?.[1] ?? 10000, r = (e / 10000 - 1) * 100, row = $(`[data-book="${k}"]`);
      if (!row) continue;
      $("[data-eq]", row).textContent = `${money(e)} USDG`;
      const rt = $("[data-ret]", row); rt.textContent = `${r >= 0 ? "+" : "−"}${Math.abs(r).toFixed(2)}%`; tone(rt, r);
      if (e > bestE) { bestE = e; best = row; }
    }
    drawEquity(st.books);
    $$(".books a").forEach((a) => a.classList.toggle("lead", a === best));
    const w = st.brain?.worm;
    // every patch the brain can crawl to, with what the scouts smell there
    const cls = (x) => (x > 0.02 ? "up" : x < -0.02 ? "down" : "");
    if (st.matrix?.length) {
      $("#scouts").innerHTML = st.matrix.map((m) => `<tr class="${m.sym === w?.sym ? "here" : ""}"><td>${m.sym}</td>${["flow", "tape", "news"]
        .map((k) => `<td class="${cls(m[k]?.s ?? 0)}">${sg(m[k]?.s ?? 0)}</td>`).join("")}<td class="${cls(m.smell ?? 0)}">${sg(m.smell ?? 0)}</td></tr>`).join("");
      $("#scoutTag").textContent = `cycle ${st.cycle}`;
    }
    if (!w) return;
    const q = st.prices?.[w.sym];
    // the trader card: what the decision maker just did
    $("#trDec").textContent = w.next && w.decision === "crawl" ? "crawl → " + w.next : w.decision;
    $("#trSub").textContent = "sniffing " + w.sym + " · smell " + sg(w.smell) + " · drive " + sg(w.v);
    $("#lcSym").textContent = w.sym; $("#lcPx").textContent = q ? `${q.mid.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDG` : "";
    $("#lcDec").textContent = w.next && w.decision === "crawl" ? `crawl → ${w.next}` : w.decision;
    const sm = $("#lcSmell"), dv = $("#lcDrive"); sm.textContent = sg(w.smell); dv.textContent = sg(w.v); tone(sm, w.smell); tone(dv, w.v);
    $("#lcFire").textContent = `${w.f} · ${w.r}`; $("#lcFire").title = `${w.f} forward, ${w.r} reverse spikes`;
    const row = st.matrix?.find((m) => m.sym === w.sym);
    if (row) for (const k of ["flow", "tape", "news"]) {
      const card = $(`[data-nose="${k}"]`), b = $("[data-s]", card);
      b.textContent = sg(row[k].s); tone(b, row[k].s);
      $("[data-v]", card).textContent = `drive ${sg(row[k].v)} · ${row[k].spikes ?? 0} spikes · ${w.sym}`;
    }
    // light the brain: neurons that spiked in this sniff glow on the sphere
    if (st.cycle !== lastCycle) { lastCycle = st.cycle; codeGlobe?.setState(st, lastNote); (w.spikes || []).forEach((n, i) => { if (i < 302) fireTarget[i] = Math.min(1, n / 4); }); }
  } catch { $("#ribbon").hidden = false; $("#lcCycle").textContent = "engine offline"; }
}
async function notebook() {
  try {
    const L = await (await fetch("/api/research", { cache: "no-store" })).json(), n = L.notes?.[0];
    if (n) {
      lastNote = n;
      const mins = Math.max(0, Math.round(((L.now ?? Date.now()) - n.t) / 60000));
      $("#noteK").textContent = `Note ${n.id} · ${mins < 1 ? "just now" : mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`}`;
      $("#noteTitle").textContent = n.title; $("#noteObs").textContent = n.observation;
      $("#noteMeta").textContent = `${n.n ?? ""} sniffs studied · ${n.model ?? "Claude"}${n.focus?.length ? ` · about ${n.focus.slice(0, 4).join(" ")}` : ""}`;
    }
    const c = { open: 0, supported: 0, weakened: 0 }; (L.hyps || []).forEach((h) => { if (h.status in c) c[h.status]++; });
    // the notes before the latest one, newest first
    const now = L.now ?? Date.now(), ago = (t) => { const m = Math.max(0, Math.round((now - t) / 60000)); return m < 1 ? "now" : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`; };
    const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
    const past = (L.notes || []).slice(1, 7);
    if (past.length) $("#pastNotes").innerHTML = past.map((p) => `<li><time>#${p.id} · ${ago(p.t)}</time><span>${esc(p.title)}</span></li>`).join("");
    $("#hOpen").textContent = c.open; $("#hSup").textContent = c.supported; $("#hWeak").textContent = c.weakened;
  } catch { /* engine offline: keep the copy that is there */ }
}
// ---- token bar: switches on once data-ca (and data-buy) are set on #token in index.html
{
  const tk = $("#token"), ca = (tk?.dataset.ca || "").trim(), buy = (tk?.dataset.buy || "").trim();
  if (ca) {
    tk.classList.add("has-ca"); $("#caText").textContent = ca;
    const btn = $("#caCopy"); btn.disabled = false;
    btn.addEventListener("click", async () => { try { await navigator.clipboard.writeText(ca); btn.textContent = "Copied"; } catch { btn.textContent = "Select it"; } setTimeout(() => (btn.textContent = "Copy"), 1600); });
  }
  if (buy) { const a = $("#caBuy"); a.href = buy; a.target = "_blank"; a.rel = "noopener"; a.removeAttribute("aria-disabled"); a.textContent = "Buy $SPOOR"; }
}
// ---- log ticker: the engine's latest lessons and paper trades, one at a time, decoded in
let tickFeed = [], tickI = 0;
const TICK_GLYPHS = "!<>-_/[]{}=+*^?#01";
function tick() {
  if (!tickFeed.length) return;
  const e = tickFeed[tickI++ % tickFeed.length], text = String(e.m).replace(/^worm\b/, "spoor");
  $("#tickTag").textContent = /shock/.test(text) ? "synapses weaken" : /sugar/.test(text) ? "synapses strengthen" : /\b(buy|sell)\b/.test(text) ? "paper trade" : "";
  const el = $("#tickMsg"); if (reduce) { el.textContent = text; return; }
  const t0 = performance.now(), dur = 650;
  const step = (now) => { const k = Math.min(1, (now - t0) / dur), n = Math.floor(text.length * k);
    el.textContent = text.slice(0, n) + Array.from({ length: Math.min(8, text.length - n) }, () => TICK_GLYPHS[(Math.random() * TICK_GLYPHS.length) | 0]).join("");
    if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
setInterval(tick, 4500);
fetch("/api/connectome").then((r) => r.json()).then((c) => { codeGlobe?.setNames(c.neurons.map((n) => n.id)); if (c.counts) { $("#stChem").textContent = money(c.counts.chem); $("#stGap").textContent = money(c.counts.gap); } }).catch(() => {});
live().then(tick); notebook(); setInterval(live, 20e3); setInterval(notebook, 60e3);
