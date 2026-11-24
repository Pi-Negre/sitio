/* ============================================================================
   header-flyers.js  -  eagles and "Gandalf on an eagle" flying around the page header
   Add ONE line to your page (before </body>):
       <script src="header-flyers.js" defer></script>
   It builds its own <canvas> inside the header (".band"), so no other markup is required.
   Sprites: Golden Eagle, Harpy Eagle, Gandalf + Great Eagle (cleaned & downscaled into flyers.png) + Dragon with rider (dragon-atlas.png).
   Click any flyer: it tumbles through the page, lands in the chicken footer, the hens revive it and it flies back (needs window.coop from index.html).
   ========================================================================== */
(() => {
  /* ================= CONFIG - edit freely ================= */
  const CONFIG = {
    header: ".band",                       // element that receives the flyers
    atlas: "../assets/images/flyers.png",  // sprite atlas, resolved relative to this script
    atlasDragon: "../assets/images/dragon-atlas.png",  // dragon + rider (header flight AND fall/revive animation)
    atlasEagles: "../assets/images/eagle-atlas.png",   // full-size eagle frames used for the fall/revive animation
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
      { type: "golden", scale: .45,  follow: false,                    path: [.030, .060, 5.2, 0.6, .42, .20, .62] },
      { type: "dragon",  scale: 1.00, follow: true,  offset: [-96, 34],  path: [.034, .068, 3.3, 1.7, .42, .22, .44] }   // replaces the 2nd repeated golden eagle
    ]
  };

  /* ================= SPRITE ATLAS (frame = [x, y, w, h, anchorX, anchorY]) ================= */
  const ATLAS = {"golden":{"flap":[[0,0,73,64,35,37],[74,0,73,71,36,41]],"glide":[[292,0,126,27,56,12],[419,0,126,28,56,12]],"dash":[[239,72,85,27,43,13],[325,72,87,27,44,13]],"brake":[[0,104,78,59,42,25],[79,104,70,76,36,37]]},"harpy":{"flap":[[148,0,71,63,35,36],[220,0,71,64,36,37]],"glide":[[0,72,121,31,54,14],[122,72,116,30,49,13]],"dash":[[413,72,87,26,44,11],[501,72,81,29,39,14]],"brake":[[150,104,67,81,34,39],[218,104,67,82,34,39]]},"gandalf":{"up":[[286,104,73,71,36,41],[360,104,73,71,36,41],[434,104,73,71,36,41],[508,104,73,71,34,42]],"glide":[[0,187,126,52,57,32],[127,187,126,52,57,31],[254,187,120,52,54,31],[375,187,116,52,50,31]],"down":[[492,187,88,66,39,35],[0,254,70,57,36,31],[71,254,74,57,40,31],[146,254,77,53,39,28]],"flap":[[286,104,73,71,36,41],[360,104,73,71,36,41],[434,104,73,71,36,41],[508,104,73,71,34,42],[492,187,88,66,39,35],[0,254,70,57,36,31],[71,254,74,57,40,31],[146,254,77,53,39,28]]}};

  ATLAS.dragon = {"k":0.42,"flap":[[342,286,200,135,100,68],[544,286,201,130,100,65]],"glide":[[934,286,181,103,90,52],[1117,286,179,119,90,60],[1298,286,160,103,80,52]]};   // k = size relative to the source pixels (the dragon sheet is not pre-downscaled)
  const RIDERS = new Set(["gandalf", "dragon"]);   // no brake/dash frames, flap rows + glide row

  /* full-size sheets used by the fall / rescue animation: key "row.col" -> [x, y, w, h] */
  const SHEETS = {
    eagles: { w: 1800, h: 686, f: {"0.0":[0,0,143,137],"0.1":[145,0,145,152],"0.2":[292,0,141,135],"0.3":[435,0,141,137],"0.4":[578,0,250,58],"0.5":[830,0,250,60],"1.0":[1082,0,238,68],"1.1":[1322,0,234,66],"1.2":[1558,0,170,60],"1.3":[0,154,174,60],"1.4":[176,154,174,58],"1.5":[352,154,163,64],"2.0":[517,154,153,129],"2.1":[672,154,142,166],"2.2":[816,154,135,176],"2.3":[953,154,135,180],"2.4":[1090,154,148,155],"2.5":[1240,154,147,155],"2.6":[1389,154,146,155],"2.7":[1537,154,147,155],"3.0":[0,336,250,114],"3.1":[252,336,251,114],"3.2":[505,336,238,114],"3.3":[745,336,234,114],"3.4":[981,336,176,143],"4.0":[1159,336,131,102],"4.1":[1292,336,181,95],"4.2":[1475,336,184,92],"4.3":[0,481,188,94],"4.4":[190,481,185,55],"4.5":[377,481,179,58],"5.0":[558,481,161,98],"5.1":[721,481,168,97],"5.2":[891,481,170,89],"5.3":[1063,481,166,90],"5.4":[1231,481,184,54],"5.5":[1417,481,173,63],"5.6":[1592,481,18,17],"5.7":[1612,481,19,19],"5.8":[1633,481,17,17],"6.0":[0,581,170,89],"6.1":[172,581,166,97],"6.2":[340,581,140,103],"6.3":[482,581,75,60],"6.4":[559,581,142,81],"6.5":[703,581,74,60],"6.6":[779,581,219,87],"6.7":[1000,581,255,63],"6.8":[1257,581,27,25]} },
    dragon: { w: 1800, h: 634, f: {"0.0":[0,0,222,144],"0.1":[224,0,224,144],"0.2":[450,0,215,141],"0.3":[667,0,214,143],"0.4":[883,0,232,110],"0.5":[1117,0,233,110],"1.0":[1352,0,228,79],"1.1":[0,146,227,80],"1.2":[229,146,221,69],"1.3":[452,146,221,63],"1.4":[675,146,222,74],"1.5":[899,146,220,74],"2.0":[1121,146,173,138],"2.1":[1296,146,173,132],"2.2":[1471,146,171,135],"2.3":[0,286,163,127],"2.4":[165,286,175,108],"2.5":[342,286,200,135],"2.6":[544,286,201,130],"2.7":[747,286,185,118],"3.0":[934,286,181,103],"3.1":[1117,286,179,119],"3.2":[1298,286,160,103],"3.3":[1460,286,139,101],"3.4":[1601,286,136,88],"3.5":[0,423,137,88],"3.6":[139,423,192,49],"3.7":[333,423,152,64],"4.0":[487,423,153,97],"4.1":[642,423,155,96],"4.2":[799,423,150,96],"4.3":[951,423,135,97],"4.4":[1088,423,140,81],"4.5":[1230,423,138,81],"4.6":[1370,423,193,48],"4.7":[1565,423,152,64],"5.0":[0,522,198,110],"5.1":[200,522,187,110],"5.2":[389,522,199,91],"5.3":[590,522,77,53],"5.4":[669,522,178,108],"5.5":[849,522,233,76],"5.6":[1084,522,218,71]} }
  };

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

  /* ---- click / tap on a flyer (the canvas itself ignores pointer events, so hit-test by position) ---- */
  function flyerAt(px, py) {
    const list = flyers.filter(f => !f.hidden && !f.away && framesOf(f)[f.frame]).sort((a, b) => b.scale - a.scale);
    for (const f of list) {                                 // largest = drawn last = topmost, so test it first
      const fr = framesOf(f)[f.frame], s = S * f.scale * (ATLAS[f.type].k || 1), pad = 8;
      const l = f.dir === 1 ? f.x - fr[4] * s : f.x - (fr[2] - fr[4]) * s, r = l + fr[2] * s;
      const tp = f.y - fr[5] * s, bt = tp + fr[3] * s;
      if (px >= l - pad && px <= r + pad && py >= tp - pad && py <= bt + pad) return f;
    }
    return null;
  }
  band.addEventListener("pointermove", e => {
    if (e.pointerType === "touch") return;
    const r = band.getBoundingClientRect();
    band.style.cursor = flyerAt(e.clientX - r.left, e.clientY - r.top) ? "pointer" : "";
  }, { passive: true });
  band.addEventListener("click", e => {
    if (e.target.closest("a, button, select, input, label")) return;
    const r = band.getBoundingClientRect(), f = flyerAt(e.clientX - r.left, e.clientY - r.top);
    if (f) knock(f);
  });

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
    const speed = f.speed, canBrake = !RIDERS.has(f.type);
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
    if (RIDERS.has(f.type)) return (f.state === "glide") ? A.glide : A.flap;   // flap = upstroke + downstroke rows
    return A[f.state];
  }
  function frameDelay(f) {
    const m = CONFIG.frameMs;
    if (RIDERS.has(f.type)) return (f.state === "glide" ? m.gandalfGlide : m.gandalfFlap) * (f.type === "dragon" ? 1.8 : 1);
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
    const list = flyers.filter(f => !f.hidden && !f.away).sort((a, b) => a.scale - b.scale);   // small / far birds first
    list.forEach(f => {
      const fr = framesOf(f)[f.frame]; if (!fr) return;
      const im = f.type === "dragon" ? dragonImg : img; if (!im) return;
      const s = S * f.scale * DPR * (ATLAS[f.type].k || 1), bob = f.state === "glide" ? Math.sin(now / 420 + f.spin) * 1.5 : 0;
      const px = Math.round((f.x) * DPR), py = Math.round((f.y + bob) * DPR);
      ctx.setTransform(f.dir * s, 0, 0, s, px, py);                  // mirror around the anchor when flying left
      ctx.drawImage(im, fr[0], fr[1], fr[2], fr[3], -fr[4], -fr[5], fr[2], fr[3]);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ================= click -> fall -> hens revive -> fly home ================= */
  /* which full-size sprite set each header flyer type uses (frame keys are "row.col" in eagle-atlas.png / dragon-atlas.png) */
  const SPECS = {
    golden: { atlas: "eagles", name: "Eagle", k0: .51, fps: 9,
      fall: ["4.0","4.1","4.2","4.3"], dead: "4.4", wake: ["4.5","4.4"], lift: ["2.0","2.1"], up: ["0.0","0.1"] },
    harpy:  { atlas: "eagles", name: "Harpy eagle", k0: .51, fps: 9,
      fall: ["5.0","5.1","5.2","5.3"], dead: "5.4", wake: ["5.5","5.4"], lift: ["2.2","2.3"], up: ["0.2","0.3"] },
    gandalf:{ atlas: "eagles", name: "Eagle and wizard", k0: .49, fps: 8,
      fall: ["6.0","6.1"], split: { carrier: ["6.2","6.4"], rider: ["6.3","6.5"] },
      dead: "6.7", wake: ["6.6","6.7"], lift: ["2.4","2.5"], up: ["2.4","2.5","2.6","2.7"] },
    dragon: { atlas: "dragon", name: "Dragon and rider", k0: .42, fps: 6,
      fall: ["5.0","5.1"], split: { carrier: ["5.2"], rider: ["5.3"] },
      dead: "5.6", wake: ["5.5","5.6"], lift: ["2.5","2.6"], up: ["2.5","2.6"] }
  };
  const dragonUrl = new URL((scriptEl && scriptEl.dataset.atlasDragon) || CONFIG.atlasDragon, (scriptEl && scriptEl.src) || location.href).href;
  const SHEET_URL = {
    eagles: new URL((scriptEl && scriptEl.dataset.atlasEagles) || CONFIG.atlasEagles, (scriptEl && scriptEl.src) || location.href).href,
    dragon: dragonUrl
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cycle = (arr, tt, fps) => arr[Math.max(0, Math.floor(tt * fps)) % arr.length];   // rAF timestamps can be a hair before performance.now()
  const bandBox = () => { const r = band.getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY }; };

  const fxStyle = document.createElement("style");
  fxStyle.textContent = `
    #flyLayer { position:absolute; left:0; top:0; width:100%; height:0; z-index:40; pointer-events:none; }
    .bf-sprite { position:absolute; left:0; top:0; background-repeat:no-repeat; image-rendering:pixelated; will-change:transform; pointer-events:none; }
    .bf-sprite.glow { filter:drop-shadow(0 0 6px #fff6b0) drop-shadow(0 0 14px #ffd84a) brightness(1.25); }
    .bf-fx { position:absolute; left:0; top:0; pointer-events:none; }
    .bf-dust { width:10px; height:10px; border-radius:50%; background:#d9c7a0; opacity:.85; animation:bfdust .7s ease-out forwards; }
    @keyframes bfdust { to { transform:translate(var(--dx),var(--dy)) scale(.2); opacity:0; } }
    .bf-star { font:700 16px/1 "Geist Pixel", system-ui, sans-serif; color:#ffd84a; text-shadow:1px 1px 0 #8a5a00,-1px -1px 0 #8a5a00,1px -1px 0 #8a5a00,-1px 1px 0 #8a5a00; }
    .bf-spark { width:6px; height:6px; background:#fff3b0; box-shadow:0 0 6px #ffd84a; animation:bfspark 1s ease-out forwards; }
    .bf-heart { font-size:18px; color:#ff5f7a; text-shadow:1px 1px 0 #7a1630; animation:bfspark 1.2s ease-out forwards; }
    @keyframes bfspark { to { transform:translate(var(--dx),var(--dy)); opacity:0; } }
    @media print { #flyLayer { display:none; } }`;
  document.head.appendChild(fxStyle);
  const layer = document.createElement("div"); layer.id = "flyLayer"; layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  function groundY() {                                  // document y of the line where lying creatures rest in the footer
    const fld = document.getElementById("field");
    return fld ? fld.getBoundingClientRect().bottom + scrollY - 26 : document.documentElement.scrollHeight - 30;
  }
  class Sprite {
    constructor(spec, k, cls = "") {
      this.spec = spec; this.sheet = SHEETS[spec.atlas]; this.k = k;
      this.el = document.createElement("div"); this.el.className = "bf-sprite " + cls;
      this.el.style.backgroundImage = `url(${SHEET_URL[spec.atlas]})`;
      this.x = this.y = this.r = 0; this.dir = 1; this.fk = null; this.w = this.h = 0;
      layer.appendChild(this.el);
    }
    set(key) {
      if (key === this.fk) return; this.fk = key;
      const f = this.sheet.f[key], k = this.k, s = this.el.style;
      this.w = f[2] * k; this.h = f[3] * k;
      s.width = this.w + "px"; s.height = this.h + "px";
      s.backgroundSize = this.sheet.w * k + "px " + this.sheet.h * k + "px";
      s.backgroundPosition = (-f[0] * k) + "px " + (-f[1] * k) + "px";
    }
    draw() { this.el.style.transform = `translate(${(this.x - this.w / 2).toFixed(1)}px,${(this.y - this.h / 2).toFixed(1)}px) rotate(${this.r.toFixed(1)}deg) scale(${this.dir},1)`; }
    restOnGround() { this.y = groundY() - this.h / 2; }
    remove() { this.el.remove(); }
  }

  /* sound: follows the page's sound toggle */
  let ac;
  const soundOn = () => !(window.coop && window.coop.soundOn === false);
  function blip(type, f0, f1, dur, gain) {
    if (!soundOn()) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime;
      o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur * .7);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + .03); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + .03);
    } catch (e) {}
  }
  const thud = (s = 1) => blip("triangle", 130, 40, .26, .35 * s);
  const whoosh = () => blip("sine", 180, 620, .6, .08);

  function fx(cls, x, y, dx, dy, text) {
    const e = document.createElement("i"); e.className = "bf-fx " + cls; if (text) e.textContent = text;
    e.style.left = x + "px"; e.style.top = y + "px"; e.style.setProperty("--dx", dx + "px"); e.style.setProperty("--dy", dy + "px");
    layer.appendChild(e); setTimeout(() => e.remove(), 1300); return e;
  }
  const dust = (x, y, n = 9) => { for (let i = 0; i < n; i++) fx("bf-dust", x + rnd(-14, 14), y - rnd(0, 6), rnd(-46, 46), rnd(-26, -4)); };
  const sparkles = (x, y, n = 12) => { for (let i = 0; i < n; i++) fx("bf-spark", x + rnd(-10, 10), y + rnd(-10, 10), rnd(-60, 60), rnd(-80, -10)); };

  const rescueQueue = []; let rescuing = false;

  /* a header flyer was clicked: the canvas bird disappears and a full-size sprite takes over at the same spot */
  function knock(f) {
    if (f.away || !SPECS[f.type]) return;
    f.away = true; band.style.cursor = "";
    const bb = bandBox();
    new Faller(f, bb.left + f.x, bb.top + f.y).fall();
    if (window.coop && window.coop.cluck) window.coop.cluck(.7);
  }

  class Faller {
    constructor(f, x, y) {
      this.f = f; this.spec = SPECS[f.type];
      this.k = this.spec.k0 * S * f.scale;
      this.s = new Sprite(this.spec, this.k); this.s.dir = f.dir; this.s.x = x; this.s.y = y; this.s.set(this.spec.fall[0]); this.s.draw();
      this.vx0 = f.vx * .4; this.vy0 = f.vy * .4; this.rider = null; this.state = "fall";
    }
    /* tumble down through the whole page */
    fall() {
      const spec = this.spec, main = this.s;
      let rider = null, riderVx = 0, riderSpin = 0, riderVy = 0;
      let vy = -220 + this.vy0, vx = this.vx0 + main.dir * rnd(20, 70);
      let t = 0, split = false, bounced = false, landed = false, riderLanded = !spec.split, lastT = performance.now();
      const step = now => {
        const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; t += dt;
        const g = groundY(), gravity = 1650, vmax = 1500;
        if (spec.split && !split && t > .32) {            // the rider gets thrown off
          split = true;
          rider = new Sprite(spec, this.k, "rider"); rider.set(spec.split.rider[0]); rider.dir = main.dir;
          rider.x = main.x + main.dir * 4; rider.y = main.y - main.h * .3;
          riderVx = vx + main.dir * rnd(-40, 90); riderVy = vy - 160; riderSpin = rnd(330, 520) * (Math.random() < .5 ? 1 : -1);
          this.rider = rider; vy -= 60; main.fk = null;
        }
        vy = Math.min(vmax, vy + gravity * dt);
        main.x += vx * dt; main.y += vy * dt;
        if (!landed) {
          main.set(cycle(split ? spec.split.carrier : spec.fall, t, 10));
          main.r = Math.sin(t * 9) * 12 + (split ? 0 : Math.sin(t * 5) * 6);
          main.x = Math.max(main.w / 2, Math.min(document.documentElement.clientWidth - main.w / 2, main.x));
          if (main.y + main.h / 2 >= g) {
            main.y = g - main.h / 2;
            if (!bounced && vy > 500) { bounced = true; vy = -vy * .25; vx *= .4; thud(1); dust(main.x, g, 12); }
            else { landed = true; vy = 0; thud(.6); dust(main.x, g, 6); }
          }
        }
        if (rider && !riderLanded) {
          riderVy = Math.min(vmax, riderVy + gravity * dt); rider.x += riderVx * dt; rider.y += riderVy * dt; rider.r += riderSpin * dt;
          rider.set(cycle(spec.split.rider, t, 9));
          if (rider.y + rider.h / 2 >= g) { riderLanded = true; dust(rider.x, g, 5); }
          rider.draw();
        }
        main.draw();
        if (landed && riderLanded) return this.land();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    /* lying "dead" in the footer, stars circling */
    land() {
      const s = this.s, spec = this.spec;
      if (this.rider) { this.rider.remove(); this.rider = null; }
      s.r = 0; s.set(spec.dead); s.restOnGround();
      s.x = Math.max(s.w / 2 + 14, Math.min(document.documentElement.clientWidth - s.w / 2 - 14, s.x)); s.draw();
      this.state = "dead";
      const stars = [];
      for (let i = 0; i < 3; i++) { const st = fx("bf-star", 0, 0, 0, 0, "★"); st.style.animation = "none"; stars.push(st); }
      const t0 = performance.now();
      const spin = now => {
        if (this.state !== "dead") { stars.forEach(e => e.remove()); return; }
        const tt = (now - t0) / 1000;
        stars.forEach((e, i) => {
          const a = tt * 3.2 + i * 2.09, hx = s.x + s.dir * s.w * .28, hy = s.y - s.h * .45;
          e.style.left = "0"; e.style.top = "0";
          e.style.transform = `translate(${hx + Math.cos(a) * 20 - 6}px,${hy + Math.sin(a) * 6 - 14}px)`;
        });
        requestAnimationFrame(spin);
      };
      requestAnimationFrame(spin);
      rescueQueue.push(this); pump();
    }
    /* the hens have gathered: wake up, shake off the dust, fly back to the header */
    async revive() {
      const s = this.s, spec = this.spec, f = this.f;
      s.el.classList.add("glow");
      for (let i = 0; i < 6; i++) { s.set(spec.wake[i % 2]); s.restOnGround(); s.x += (i % 2 ? 2 : -2); s.draw(); sparkles(s.x, s.y - s.h / 2, 3); await sleep(170); }
      this.state = "revive";
      if (window.coop && window.coop.cluck) window.coop.cluck(1.3);
      for (let i = 0; i < 4; i++) fx("bf-heart", s.x + rnd(-30, 30), s.y - s.h, rnd(-20, 20), rnd(-70, -35), "♥");
      const baseY = s.y, t0 = performance.now(), popMs = 520;
      await new Promise(res => {
        const fr = now => {
          const p = Math.max(0, Math.min(1, (now - t0) / popMs));
          s.set(cycle(spec.lift, p * 6, 8)); s.y = baseY - Math.sin(p * Math.PI) * 46 - p * 26; s.r = -Math.sin(p * Math.PI) * 14 * s.dir; s.draw();
          p < 1 ? requestAnimationFrame(fr) : res();
        }; requestAnimationFrame(fr);
      });
      whoosh();
      // home = where this bird's patrol path is right now (it keeps moving, so the target is re-read every frame)
      const home = () => { const q = patrol(f, f.t0 + t), bb = bandBox(); return { x: bb.left + q.x, y: bb.top + q.y }; };
      const sx = s.x, sy = s.y, h0 = home(), dur = Math.max(1800, Math.min(6500, Math.hypot(h0.x - sx, h0.y - sy) / .55)), tf = performance.now();
      await new Promise(res => {
        const fr = now => {
          const p = Math.max(0, Math.min(1, (now - tf) / dur)), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, h = home();
          s.x = sx + (h.x - sx) * e + Math.sin(p * Math.PI * 2) * 40 * (1 - p);
          s.y = sy + (h.y - sy) * e;
          if (Math.abs(h.x - sx) > 30) s.dir = h.x >= sx ? 1 : -1;
          s.set(cycle(spec.up, (now - tf) / 1000, spec.fps + 3));
          s.r = -s.dir * 30 * Math.sin(p * Math.PI) * (h.y < sy ? 1 : .2); s.draw();
          if (Math.random() < .08) fx("bf-spark", s.x, s.y + s.h * .2, rnd(-10, 10), rnd(10, 40));
          p < 1 ? requestAnimationFrame(fr) : res();
        }; requestAnimationFrame(fr);
      });
      // hand over to the canvas bird again, exactly where the sprite is
      const bb = bandBox();
      f.x = s.x - bb.left; f.y = s.y - bb.top; f.vx = 0; f.vy = 0; f.dir = s.dir; f.state = "flap"; f.stateAt = performance.now(); f.frame = 0; f.frameAt = f.stateAt;
      f.away = false; s.remove(); this.state = "done";
    }
  }

  /* one body at a time: the hens run over, fuss around it, then it gets up */
  async function pump() {
    if (rescuing || !rescueQueue.length) return;
    rescuing = true;
    const body = rescueQueue.shift();
    await sleep(900);
    const C = window.coop;
    if (!C) { await body.revive(); rescuing = false; return pump(); }   // page without chickens: just get up
    while (C.mode !== "idle") await sleep(300);                         // wait for a running race / run
    window.coopRescue = true;
    const hens = C.hens.slice().sort((a, b) => a.x - b.x);
    hens.forEach(h => { h.busy = true; h.el.classList.remove("sleep"); h.awakeUntil = performance.now() + 20000; });
    const cw = C.CW(), bx = body.s.x, half = body.s.w / 2;
    hens.forEach((h, i) => {
      const side = i < 2 ? -1 : 1, off = side * (half + 8 + (side < 0 ? (1 - i) : (i - 2)) * 38);
      C.goTo(h, bx - cw / 2 + off, 260 + Math.random() * 120);
    });
    const t0 = performance.now();
    while (performance.now() - t0 < 9000 && hens.some(h => Math.abs(h.tx - h.x) > 2)) await sleep(120);
    hens.forEach(h => { h.dir = bx > h.x + cw / 2 ? 1 : -1; C.place(h); });
    for (let r = 0; r < 5; r++) {
      hens.forEach((h, i) => { if (Math.random() < .7) setTimeout(() => { C.replay(h.el, "peck", 700); if (Math.random() < .5) C.cluck(h.p.pitch); }, i * 120); });
      await sleep(620);
    }
    hens.forEach(h => C.replay(h.el, "hop", 560));
    await body.revive();
    hens.forEach(h => { h.busy = false; h.awakeUntil = performance.now() + 4000; });
    window.coopRescue = false; rescuing = false; pump();
  }

  /* ================= loop ================= */
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false, last = 0, t = 0, visible = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    flyers.forEach(f => { if (!f.hidden && !f.away) step(f, dt, now, t); });
    draw(now); requestAnimationFrame(frame);
  }
  function start() { if (running || reduce || !img || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  function applyCount() {
    const n = innerWidth < 560 ? CONFIG.mobileCount : CONFIG.flock.length;
    flyers.forEach((f, i) => { f.hidden = i >= n; });
  }
  let dragonImg = null;
  const dImage = new Image();
  dImage.onload = () => { dragonImg = dImage; };
  dImage.onerror = () => { console.warn("header-flyers: could not load", dragonUrl); flyers.forEach(f => { if (f.type === "dragon") f.away = true; }); };
  dImage.src = dragonUrl;
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
