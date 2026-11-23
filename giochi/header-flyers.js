/* ============================================================================
   header-flyers.js  -  eagles and "Gandalf on an eagle" flying around the page header
   Needs: flyers.png next to this file. Add ONE line to your page (before </body>):
       <script src="header-flyers.js" defer></script>
   It builds its own <canvas> inside the header (".band"), so no other markup is required.
   Sprites: Golden Eagle, Harpy Eagle, Gandalf + Great Eagle (cleaned & downscaled into flyers.png).
   ========================================================================== */
(() => {
  /* ================= CONFIG - edit freely ================= */
  const CONFIG = {
    header: ".band",                       // element that receives the flyers
    atlas: "flyers.png",                   // sprite atlas, resolved relative to this script
    scale: { min: .65, max: 1.3, refHeight: 210 },   // flyer size follows the header height
    maxSpeed: 150,                         // px/s while patrolling
    followSpeed: 460,                      // px/s top speed when chasing the cursor
    dash: 240, hover: 36, climb: 70,       // px/s thresholds that drive the state machine
    frameMs: { flap: 110, dash: 110, glide: 180, brake: 150, gandalfFlap: 100, gandalfGlide: 140 },
    mobileCount: 3,                        // flyers shown on narrow screens (< 560px)
    /* path = [freqX, freqY, phaseX, phaseY, ampX, ampY, centreY] -> figure-eight patrol (freq in Hz, amp/centre as header fractions) */
    flock: [
      { type: "golden",  scale: 1.10, follow: true,  offset: [0, 0],   path: [.045, .090, 0.0, 0.0, .44, .26, .48] },
      { type: "gandalf", scale: 1.00, follow: true,  offset: [78, -30], path: [.036, .072, 2.1, 1.0, .40, .24, .50] },
      { type: "harpy",   scale: .85,  follow: false,                    path: [.052, .104, 4.0, 2.3, .46, .22, .42] },
      { type: "gandalf", scale: .62,  follow: false,                    path: [.030, .060, 5.2, 0.6, .42, .20, .62] },
      { type: "golden",  scale: .58,  follow: false,                    path: [.040, .080, 1.2, 3.4, .45, .20, .30] }
    ]
  };

  /* ================= SPRITE ATLAS (frame = [x, y, w, h, anchorX, anchorY]) ================= */
  const ATLAS = {"golden":{"flap":[[0,0,73,64,35,37],[74,0,73,71,36,41]],"glide":[[292,0,126,27,56,12],[419,0,126,28,56,12]],"dash":[[239,72,85,27,43,13],[325,72,87,27,44,13]],"brake":[[0,104,78,59,42,25],[79,104,70,76,36,37]]},"harpy":{"flap":[[148,0,71,63,35,36],[220,0,71,64,36,37]],"glide":[[0,72,121,31,54,14],[122,72,116,30,49,13]],"dash":[[413,72,87,26,44,11],[501,72,81,29,39,14]],"brake":[[150,104,67,81,34,39],[218,104,67,82,34,39]]},"gandalf":{"up":[[286,104,73,71,36,41],[360,104,73,71,36,41],[434,104,73,71,36,41],[508,104,73,71,34,42]],"glide":[[0,187,126,52,57,32],[127,187,126,52,57,31],[254,187,120,52,54,31],[375,187,116,52,50,31]],"down":[[492,187,88,66,39,35],[0,254,70,57,36,31],[71,254,74,57,40,31],[146,254,77,53,39,28]],"flap":[[286,104,73,71,36,41],[360,104,73,71,36,41],[434,104,73,71,36,41],[508,104,73,71,34,42],[492,187,88,66,39,35],[0,254,70,57,36,31],[71,254,74,57,40,31],[146,254,77,53,39,28]]}};

  /* ================= setup ================= */
  const band = document.querySelector(CONFIG.header);
  if (!band) return;
  const scriptEl = document.currentScript;
  const atlasUrl = new URL((scriptEl && scriptEl.dataset.atlas) || CONFIG.atlas, (scriptEl && scriptEl.src) || location.href).href;

  const style = document.createElement("style");
  style.textContent = `
    .band-flyers { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; image-rendering: pixelated; transition: filter 1.5s; }
    .band > h1, .band > .sub { position: relative; z-index: 2; }   /* title stays in front of the birds */
    .band.night .band-flyers { filter: brightness(.72) saturate(.9); }
    @media print { .band-flyers { display: none; } }`;
  document.head.appendChild(style);

  const canvas = document.createElement("canvas");
  canvas.className = "band-flyers"; canvas.setAttribute("aria-hidden", "true");
  const sky = band.querySelector(".band-sky");
  if (sky && sky.after) sky.after(canvas); else band.insertBefore(canvas, band.firstChild);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, DPR = 1, S = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 3);
    W = band.clientWidth; H = band.clientHeight;
    canvas.width = Math.max(1, Math.round(W * DPR)); canvas.height = Math.max(1, Math.round(H * DPR));
    S = Math.max(CONFIG.scale.min, Math.min(CONFIG.scale.max, H / CONFIG.scale.refHeight));
  }

  /* ================= cursor (inside the header only) ================= */
  let cursor = null, cursorTimer = 0;
  band.addEventListener("pointermove", e => {
    const r = band.getBoundingClientRect(); cursor = { x: e.clientX - r.left, y: e.clientY - r.top };
    clearTimeout(cursorTimer); if (e.pointerType === "touch") cursorTimer = setTimeout(() => cursor = null, 2500);
  }, { passive: true });
  band.addEventListener("pointerleave", () => { cursor = null; });
  band.addEventListener("pointercancel", () => { cursor = null; });

  /* ================= flyers ================= */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const flyers = CONFIG.flock.map((c, i) => ({ ...c, i, x: 0, y: 0, vx: 0, vy: 0, dir: 1, state: "glide", stateAt: 0, frame: 0, frameAt: 0,
    brakeUntil: 0, fast: false, following: false, t0: rnd(0, 30), spin: rnd(0, 1000), speed: 0 }));
  const patrol = (f, t) => {
    const p = f.path; // figure-eight: y runs at twice the x frequency
    return { x: W * (.5 + p[4] * Math.sin(2 * Math.PI * p[0] * t + p[2])), y: H * (p[6] + p[5] * Math.sin(2 * Math.PI * p[1] * t + p[3])) };
  };
  function place() {
    flyers.forEach(f => { const q = patrol(f, f.t0); f.x = q.x; f.y = q.y; f.vx = 0; f.vy = 0; });
  }

  function chooseState(f, now) {
    const speed = f.speed, canBrake = f.type !== "gandalf";
    if (canBrake) {                                           // brake: fast -> slow close to the cursor
      if (speed > 260) f.fast = true;
      if (f.fast && f.following && speed < 190) { f.fast = false; f.brakeUntil = now + 520; }
      if (!f.following) f.fast = false;
      if (f.brakeUntil > now) return "brake";
    }
    if (speed > CONFIG.dash) return "dash";
    if (f.vy < -CONFIG.climb || speed < CONFIG.hover) return "flap";
    return "glide";
  }
  function framesOf(f) {
    const A = ATLAS[f.type];
    if (f.type === "gandalf") return (f.state === "glide") ? A.glide : A.flap;   // flap = upstroke + downstroke rows
    return A[f.state];
  }
  function frameDelay(f) {
    const m = CONFIG.frameMs;
    if (f.type === "gandalf") return f.state === "glide" ? m.gandalfGlide : m.gandalfFlap;
    return m[f.state];
  }

  function step(f, dt, now, t) {
    const off = f.offset || [0, 0];
    f.following = !!(f.follow && cursor);
    let tx, ty;
    if (f.following) { tx = cursor.x + off[0] * S; ty = cursor.y + off[1] * S; }
    else { const q = patrol(f, f.t0 + t); tx = q.x; ty = q.y; }
    const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
    const vmax = f.following ? CONFIG.followSpeed : CONFIG.maxSpeed * (.6 + .4 * f.scale);
    const want = Math.min(vmax, d * (f.following ? 3.2 : 2.2));
    const resp = f.following ? 4.5 : 2.4, k = 1 - Math.exp(-dt * resp);
    f.vx += (dx / d * want - f.vx) * k; f.vy += (dy / d * want - f.vy) * k;
    f.x += f.vx * dt; f.y += f.vy * dt;
    f.y = Math.max(H * .06, Math.min(H * .94, f.y));
    f.speed = Math.hypot(f.vx, f.vy);
    if (Math.abs(f.vx) > 22) f.dir = f.vx > 0 ? 1 : -1;       // keep facing when hovering
    else if (f.following) f.dir = (cursor.x >= f.x) ? 1 : -1;

    const next = chooseState(f, now);
    if (next !== f.state && (next === "brake" || now - f.stateAt > 220)) { f.state = next; f.stateAt = now; f.frame = 0; f.frameAt = now; }
    const list = framesOf(f);
    if (now - f.frameAt >= frameDelay(f)) { f.frame = (f.frame + 1) % list.length; f.frameAt = now; }
    if (f.frame >= list.length) f.frame = 0;
  }

  let img = null;
  function draw(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img) return;
    ctx.imageSmoothingEnabled = false;
    const list = flyers.filter(f => !f.hidden).sort((a, b) => a.scale - b.scale);   // small / far birds first
    list.forEach(f => {
      const fr = framesOf(f)[f.frame]; if (!fr) return;
      const s = S * f.scale * DPR, bob = f.state === "glide" ? Math.sin(now / 420 + f.spin) * 1.5 : 0;
      const px = Math.round((f.x) * DPR), py = Math.round((f.y + bob) * DPR);
      ctx.setTransform(f.dir * s, 0, 0, s, px, py);                  // mirror around the anchor when flying left
      ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], -fr[4], -fr[5], fr[2], fr[3]);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ================= loop ================= */
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false, last = 0, t = 0, visible = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    flyers.forEach(f => { if (!f.hidden) step(f, dt, now, t); });
    draw(now); requestAnimationFrame(frame);
  }
  function start() { if (running || reduce || !img || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  function applyCount() {
    const n = innerWidth < 560 ? CONFIG.mobileCount : CONFIG.flock.length;
    flyers.forEach((f, i) => { f.hidden = i >= n; });
  }
  const image = new Image();
  image.onload = () => {
    img = image; resize(); applyCount(); place();
    if (reduce) { flyers.forEach(f => { f.state = "glide"; }); draw(performance.now()); } else start();
  };
  image.onerror = () => console.warn("header-flyers: could not load", atlasUrl);
  image.src = atlasUrl;

  addEventListener("resize", () => { resize(); applyCount(); if (reduce && img) draw(performance.now()); });
  if ("ResizeObserver" in window) new ResizeObserver(() => { resize(); if (reduce && img) draw(performance.now()); }).observe(band);
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(band);
})();
