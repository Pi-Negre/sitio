(function () {
'use strict';
const W = 360, H = 500, RL = 44, RR = 316, TARGET = 3600, PY = 430, MAXV = 260;
// Incolla qui l'URL /exec del tuo Google Apps Script per la classifica (vedi istruzioni)
const BICI_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRap5Szo01QEmwXEave2ZLNWZHPtWhkSsehzKOaYAijTa_pnAw8sB1_Jf8KcWMR9KU/exec";
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Testi ---------- */
const T = {
  it: { title: "Bike Escape", subtitle: "Schiva gli ostacoli e arriva al matrimonio in tempo!", char: "1. Scegli il personaggio", city: "2. Scegli l'ambientazione",
    sposo: "Sposo", sposoSub: "Giacca blu notte", sposa: "Sposa", sposaSub: "Abito e velo", milano: "Milano", milanoSub: "Tra Duomo e nebbia", barcellona: "Barcellona", barcellonaSub: "Sole e Sagrada Família",
    play: "Gioca", back: "← Torna all'Area Giochi", controls: "Frecce sinistra e destra (oppure A / D) per muoverti.", touch: "Tieni premuti i tasti o trascina sulla strada.",
    dest: "Al matrimonio", go: "Via!", finish: "Arrivo", again: "Rigioca", change: "Cambia scelta", level: "Livello", score: "Punteggio", nameLabel: "Il tuo nome", namePh: "Es. Mario Rossi", nameReq: "Inserisci il tuo nome per giocare", boardTitle: "Classifica", thPos: "Pos.", thName: "Giocatore", thCity: "Città", thScore: "Punti", boardLoading: "Caricamento classifica…", boardEmpty: "Ancora nessun punteggio.", boardError: "Classifica non disponibile.", boardOff: "Classifica non ancora collegata.", rings: "Anelli", close: "Per un pelo", dodged: "Schivati", scoreHint: "Raccogli gli anelli (le serie consecutive valgono di più) e sfiora gli ostacoli per guadagnare punti.",
    winTitle_m: "Ce l'hai fatto!", winTitle_f: "Ce l'hai fatta!", winMsg_m: "Sei arrivato in tempo: gli invitati ti aspettano.", winMsg_f: "Sei arrivata in tempo: gli invitati ti aspettano.",
    loseTitle: "Game over", loseMsg_m: "Ti sei scontrato con {o}.", loseMsg_f: "Ti sei scontrata con {o}.",
    ob: { ped: "un pedone", dog: "un cane", bin: "un cestino", hog: "un riccio", tram: "un tram", palm: "una palma", scooter: "un monopattino", roach: "una cucaracha" } },
  en: { title: "Bike Escape", subtitle: "Dodge the obstacles and reach the wedding on time!", char: "1. Choose your character", city: "2. Choose the location",
    sposo: "Groom", sposoSub: "Midnight blue suit", sposa: "Bride", sposaSub: "Dress and veil", milano: "Milan", milanoSub: "Duomo and fog", barcellona: "Barcelona", barcellonaSub: "Sun and Sagrada Família",
    play: "Play", back: "← Back to Games Area", controls: "Left and right arrow keys (or A / D) to move.", touch: "Hold the buttons or drag on the road.",
    dest: "To the wedding", go: "Go!", finish: "Finish", again: "Play again", change: "Change selection", level: "Level", score: "Score", nameLabel: "Your name", namePh: "E.g. John Smith", nameReq: "Enter your name to play", boardTitle: "Leaderboard", thPos: "Pos.", thName: "Player", thCity: "City", thScore: "Points", boardLoading: "Loading leaderboard…", boardEmpty: "No scores yet.", boardError: "Leaderboard unavailable.", boardOff: "Leaderboard not connected yet.", rings: "Rings", close: "Close calls", dodged: "Dodged", scoreHint: "Collect rings (streaks are worth more) and graze obstacles to earn points.",
    winTitle: "You made it!", winMsg: "You arrived on time: the guests are waiting.", loseTitle: "Game over", loseMsg: "You crashed into {o}.",
    ob: { ped: "a pedestrian", dog: "a dog", bin: "a bin", hog: "a hedgehog", tram: "a tram", palm: "a palm tree", scooter: "a scooter", roach: "a cockroach" } }
};
let lang = localStorage.getItem('selectedLanguage') || 'it'; if (!T[lang]) lang = 'it';
let ch = 'sposo', city = 'milano';
const g$ = () => (ch === 'sposa' ? 'f' : 'm');
const tx = k => { const L = T[lang]; const v = L[k + '_' + g$()] !== undefined ? L[k + '_' + g$()] : L[k]; return v; };

/* ---------- Temi città ---------- */
const CITY = {
  milano: { road: '#4b5059', edge: '#d8cfc6', line: '#f1ede6', accent: '#b3202a', roofs: ['#b8a9a0', '#cdbfb4', '#9ea3a8', '#c9aeb0'],
    coats: ['#e0b04a', '#c0392b', '#f1f1f1', '#4a8bd0', '#e58aa5'], conf: ['#b3202a', '#ffffff', '#d9a441', '#1f2933'], pool: ['tram', 'tram', 'ped', 'ped', 'dog', 'bin', 'hog'], bin: '#2f8f5b', tram: '#e07b2b' },
  barcellona: { road: '#6a5a55', edge: '#efd9a8', line: '#ffe08a', accent: '#d65a31', roofs: ['#d9683a', '#e8a24a', '#c6502f', '#f0c27a'],
    coats: ['#e07a3f', '#f2c14e', '#2e9aa0', '#d9577b', '#f4f1e8'], conf: ['#d65a31', '#f4b94a', '#1c8c8c', '#ffffff'], pool: ['dog', 'dog', 'roach', 'roach', 'scooter', 'palm', 'ped'] }
};

/* ---------- Canvas ---------- */
const cv = $('gameCanvas'), ctx = cv.getContext('2d'), wrap = $('wrap');
let dpr = 1;
function fit() { dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr; }
fit();

function ell(x, y, rx, ry, col, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
function rr(x, y, w, h, r, col) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fillStyle = col; ctx.fill(); }
function line(x1, y1, x2, y2, col, w) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); }
const SH = 'rgba(0,0,0,.2)', SKIN = '#f1c7a0';

function palm(t, ph, s) {
  ctx.save(); ctx.scale(s, s);
  for (let i = 0; i < 9; i++) { ctx.save(); ctx.rotate(i / 9 * Math.PI * 2 + Math.sin(t * 1.5 + ph) * 0.08); ell(0, -14, 5, 15, i % 2 ? '#3f8f55' : '#2f7a49'); ctx.restore(); }
  ell(0, 0, 5, 5, '#7a5230'); ctx.restore();
}

/* ---------- Ostacoli (visti dall'alto) ---------- */
const OB = {
  ped: { w: 30, h: 30, rel: [-40, 50], draw(o, t) {
    ell(2, 3, 13, 8, SH); const s = Math.sin(t * 9 + o.ph) * 3;
    ell(-13, s, 3, 5, o.col); ell(13, -s, 3, 5, o.col); ell(0, 0, 12, 7, o.col);
    ell(0, 0, 6, 6, SKIN); ell(0, -1.5, 6, 5, o.hair); } },
  dog: { w: 22, h: 32, rel: [90, 170], draw(o, t) {
    ell(2, 3, 10, 15, SH); line(0, -12, Math.sin(t * 16 + o.ph) * 5, -21, o.col, 3);
    ell(0, 0, 8, 13, o.col); ell(0, 13, 6, 6, o.col); ell(-5.5, 11, 2.5, 4, 'rgba(0,0,0,.35)'); ell(5.5, 11, 2.5, 4, 'rgba(0,0,0,.35)'); ell(0, 18, 1.8, 1.6, '#222'); } },
  bin: { w: 26, h: 26, rel: [0, 0], draw(o) {
    ell(2, 3, 13, 13, SH); ell(0, 0, 12, 12, o.col); ell(0, 0, 9, 9, 'rgba(255,255,255,.3)'); ell(0, 0, 3, 3, 'rgba(0,0,0,.35)'); } },
  hog: { w: 24, h: 20, rel: [-15, 15], draw(o) {
    ell(1, 2, 12, 9, SH); ell(0, 0, 11, 8.5, '#6e5240');
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; line(Math.cos(a) * 8, Math.sin(a) * 6, Math.cos(a) * 13, Math.sin(a) * 10.5, '#3d2c20', 1.6); }
    ell(0, 8, 3.5, 3, '#c9a88a'); ell(-1.6, 9.5, .9, .9, '#222'); ell(1.6, 9.5, .9, .9, '#222'); } },
  tram: { w: 44, h: 116, rel: [90, 130], draw(o) {
    rr(-20, -54, 46, 118, 9, SH); rr(-22, -58, 44, 116, 8, o.col); rr(-14, -51, 28, 102, 6, 'rgba(255,255,255,.28)');
    for (let i = 0; i < 6; i++) rr(-5, -44 + i * 17, 10, 6, 2, 'rgba(0,0,0,.25)');
    line(-22, 0, 22, 0, 'rgba(0,0,0,.35)', 2); line(-8, -6, 8, 6, '#222', 1.6); line(8, -6, -8, 6, '#222', 1.6);
    ell(-13, 55, 4, 3, '#ffe9a8'); ell(13, 55, 4, 3, '#ffe9a8'); } },
  palm: { w: 40, h: 40, rel: [0, 0], draw(o, t) { ell(3, 4, 18, 18, SH); palm(t, o.ph, 1); } },
  scooter: { w: 20, h: 46, rel: [-80, -40], draw(o) {
    ell(2, 3, 9, 24, SH); rr(-4, -10, 8, 32, 3, '#1c8c8c'); rr(-1.5, 20, 3, 6, 1.5, '#222');
    line(0, -9, 0, -17, '#333', 2); rr(-11, -20, 22, 3, 1.5, '#333');
    ell(0, -4, 8, 5, o.col); ell(0, -5, 5, 5, o.hair); } },
  roach: { w: 28, h: 38, rel: [70, 140], draw(o, t) {
    ctx.scale(1.25, 1.25);
    for (let i = 0; i < 3; i++) { const y = -2 + i * 6, a = Math.sin(t * 28 + o.ph + i * 2);
      line(-4, y, -11, y + 3 + a * 3, '#3b2616', 1.6); line(4, y, 11, y + 3 - a * 3, '#3b2616', 1.6); }
    line(-1.5, 14, -6 + Math.sin(t * 9 + o.ph) * 3, 25, '#3b2616', 1.2); line(1.5, 14, 6 + Math.sin(t * 9 + o.ph + 2) * 3, 25, '#3b2616', 1.2);
    ell(1, 3, 6, 10.5, SH); ell(0, 2, 6, 10.5, '#6b4423'); line(0, -7, 0, 11, 'rgba(0,0,0,.35)', 1);
    ell(-2, 0, 1.6, 6, 'rgba(255,255,255,.3)'); ell(0, 13, 4, 3.4, '#3b2616'); } }
};

/* ---------- Stato ---------- */
const g = { mode: 'setup', t: 0, sf: 0, dist: 0, elapsed: 0, level: 1, score: 0, extra: 0, rings: 0, close: 0, dodged: 0, streak: 0, items: [], pops: [], lostTo: null, roadOff: 0, cd: 0, cdN: -1, endT: 0, shown: false, raf: 0, last: 0, drag: null,
  p: { x: W / 2, vx: 0, tilt: 0 }, obs: [], sc: { l: [], r: [] }, conf: [], keys: { l: 0, r: 0 }, lastHud: -1 };

function mkItem() {
  const C = CITY[city];
  return Math.random() < 0.3 ? { k: 'tree', h: 38, ph: Math.random() * 6 } : { k: 'roof', h: rnd(50, 110), c: pick(C.roofs), u: Math.floor(rnd(1, 4)) };
}
function fillScene(arr) {
  let top = arr.length ? Math.min.apply(null, arr.map(i => i.y)) : H;
  while (top > -130) { const it = mkItem(); it.y = top - it.h - rnd(4, 12); arr.push(it); top = it.y; }
}

function resetRun() {
  g.mode = 'count'; g.cd = 3.4; g.cdN = -1; g.dist = 0; g.elapsed = 0; g.level = 1; g.score = 0; g.extra = 0; g.rings = 0; g.close = 0; g.dodged = 0; g.streak = 0; g.items = []; g.pops = []; g.sf = 0.3; g.endT = 0; g.shown = false;
  g.obs = []; g.conf = []; g.sc.l = []; g.sc.r = []; g.p.x = W / 2; g.p.vx = 0; g.p.tilt = 0; g.lastHud = -1;
  fillScene(g.sc.l); fillScene(g.sc.r);
  $('end').classList.remove('show'); wrap.classList.remove('hit');
  $('hud-city').textContent = tx(city);
}

function spawn() {
  const C = CITY[city], type = pick(C.pool), d = OB[type];
  const col = type === 'tram' ? C.tram : type === 'bin' ? C.bin : type === 'dog' ? pick(['#8b5a2b', '#e0b979', '#f3ede0', '#3b2a20']) : pick(C.coats);
  g.obs.push({ type, x: rnd(RL + d.w / 2 + 4, RR - d.w / 2 - 4), y: -d.h, rel: rnd(d.rel[0], d.rel[1]), ph: Math.random() * 6, col,
    hair: pick(['#2b2118', '#6b4226', '#a8793f', '#1a1a1a']) });
}

function setCount(n) {
  const el = $('count-n'); $('count').classList.add('show');
  el.textContent = n > 0 ? n : tx('go'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  if (n <= 0) setTimeout(() => $('count').classList.remove('show'), 650);
}

function lose(o) {
  g.mode = 'lose'; g.endT = 0; g.lostTo = o.type; finishRun(false);
  wrap.classList.remove('hit'); void wrap.offsetWidth; wrap.classList.add('hit');
}
function win() {
  g.mode = 'win'; g.endT = 0; finishRun(true);
  const C = CITY[city];
  for (let i = 0; i < 90; i++) g.conf.push({ x: W / 2 + rnd(-40, 40), y: H * 0.45, vx: rnd(-170, 170), vy: rnd(-380, -120), r: rnd(0, 6), vr: rnd(-8, 8), w: rnd(5, 9), h: rnd(3, 6), c: pick(C.conf) });
}

function showEnd(won) {
  const L = T[lang];
  $('end-icon').innerHTML = won ? '<circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.5 3.5L17 9"/>' : '<circle cx="12" cy="12" r="10"/><path d="M9 9l6 6M15 9l-6 6"/>';
  $('end-title').textContent = won ? tx('winTitle') : tx('loseTitle');
  $('end-msg').textContent = won ? tx('winMsg') : tx('loseMsg').replace('{o}', L.ob[g.lostTo]);
  $('end-score').textContent = tx('score') + ': ' + g.score;
  $('end-stats').textContent = [tx('rings') + ': ' + g.rings, tx('close') + ': ' + g.close, tx('dodged') + ': ' + g.dodged].join('  \u00b7  ');
  const el = $('end-icon'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  $('end').classList.add('show'); g.shown = true;
}

/* ---------- Aggiornamento ---------- */
function toast() {
  const el = $('toast'); el.textContent = tx('level') + ' ' + g.level;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

function update(dt) {
  g.t += dt;
  const tgt = { ready: 0.3, count: 0.3, play: 1, win: 0.3, lose: 0, setup: 0 }[g.mode] || 0;
  g.sf += (tgt - g.sf) * Math.min(1, dt * 3);
  if (!isFinite(g.sf)) g.sf = 0;
  // La difficolta' cresce con la strada fatta: velocita' da 1x a 1.8x, piu' ostacoli al secondo
  const lvl = clamp(g.dist / TARGET, 0, 1), spd = 1 + 0.8 * lvl;

  const p = g.p, can = g.mode === 'play' || g.mode === 'count';
  let vt = 0;
  if (can) {
    const dir = g.keys.r - g.keys.l;
    if (dir) vt = dir * MAXV; else if (g.drag !== null) vt = clamp((g.drag - p.x) * 9, -MAXV, MAXV);
  }
  p.vx += (vt - p.vx) * Math.min(1, dt * 10);
  p.x = clamp(p.x + p.vx * dt, RL + 14, RR - 14);
  p.tilt = p.vx / MAXV * 0.28;

  const v = 200 * spd * g.sf * dt;
  g.roadOff = (g.roadOff + v) % 40;
  ['l', 'r'].forEach(s => { const a = g.sc[s]; a.forEach(i => { i.y += v; }); g.sc[s] = a.filter(i => i.y < H + 20); fillScene(g.sc[s]); });

  if (g.mode === 'count') {
    g.cd -= dt; const n = Math.ceil(g.cd - 0.4);
    if (n !== g.cdN && n <= 3) { g.cdN = n; setCount(Math.max(0, n)); }
    if (g.cd <= 0.4 && g.cdN <= 0) g.mode = 'play';
  }
  if (g.mode === 'play') {
    g.elapsed += dt;
    const level = Math.min(5, Math.floor(lvl * 4.99) + 1);
    if (level > g.level) { g.level = level; toast(); }
    const last = g.obs[g.obs.length - 1];
    if (TARGET - g.dist > 220 && (!last || last.y > 70) && Math.random() < dt * (1.3 + 1.7 * lvl)) spawn();
    const lr = g.items[g.items.length - 1];
    if (TARGET - g.dist > 220 && (!lr || lr.y > 130) && Math.random() < dt * 0.8) spawnRing();
  }
  if (g.mode === 'play' || g.mode === 'win') g.dist += 100 * spd * g.sf * dt;

  g.obs.forEach(o => { o.y += (200 * spd + o.rel) * g.sf * dt; if (o.type === 'roach') o.x = clamp(o.x + Math.sin(g.t * 7 + o.ph) * 70 * dt * g.sf, RL + 16, RR - 16); });
  g.items.forEach(r => { r.y += 200 * spd * g.sf * dt; });
  g.obs = g.obs.filter(o => o.y < H + 80);
  if (g.mode !== 'play') g.items = g.items.filter(r => r.y < H + 30);

  if (g.mode === 'play') {
    for (const o of g.obs) {
      const d = OB[o.type], hw = d.w / 2 * 0.82, hh = d.h / 2 * 0.82;
      if (Math.abs(p.x - o.x) < 10 + hw && Math.abs(PY - o.y) < 22 + hh) { lose(o); break; }
      if (Math.abs(PY - o.y) < 22 + hh) o.gap = Math.min(o.gap === undefined ? 99 : o.gap, Math.abs(p.x - o.x) - (10 + hw));
      else if (!o.done && o.y > PY) { o.done = true; g.dodged++; g.extra += 10; if (o.gap !== undefined && o.gap < 16) { g.close++; g.extra += 25; pop(p.x, '+25', '#ffffff'); } }
    }
    if (g.mode === 'play') {
      g.items = g.items.filter(r => {
        if (Math.abs(p.x - r.x) < 20 && Math.abs(PY - r.y) < 30) { collect(r); return false; }
        if (r.y > PY + 40 && !r.missed) { r.missed = true; g.streak = 0; }
        return r.y < H + 30;
      });
    }
    if (g.mode === 'play' && g.dist >= TARGET) win();
  }
  if (g.mode === 'win' || g.mode === 'lose') {
    g.endT += dt;
    if (!g.shown && g.endT > (g.mode === 'win' ? 1.4 : 0.9)) showEnd(g.mode === 'win');
  }
  g.conf.forEach(c => { c.vy += 420 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; });
  g.conf = g.conf.filter(c => c.y < H + 20);
  g.pops.forEach(q => { q.t += dt; q.y -= 45 * dt; }); g.pops = g.pops.filter(q => q.t < 1);

  const live = Math.floor(Math.min(g.dist, TARGET)) + g.extra, mult = 1 + Math.min(3, Math.floor(g.streak / 3));
  const rem = Math.max(0, TARGET - Math.floor(g.dist)), key = rem + '|' + g.level + '|' + live + '|' + mult;
  if (key !== g.lastHud) {
    g.lastHud = key;
    $('hud-dist').textContent = tx('dest') + ': ' + rem + ' m';
    $('hud-lvl').textContent = tx('level') + ' ' + g.level + '/5';
    $('hud-score').textContent = live; $('hud-combo').textContent = mult > 1 ? 'x' + mult : '';
    const pc = (1 - rem / TARGET) * 100; $('fill').style.width = pc + '%'; $('dot').style.left = pc + '%';
  }
}

function pop(x, text, col) { g.pops.push({ x, y: PY - 34, t: 0, text, col }); }
function spawnRing() {
  for (let k = 0; k < 6; k++) {
    const x = rnd(RL + 22, RR - 22);
    if (!g.obs.some(o => o.y < 130 && Math.abs(o.x - x) < OB[o.type].w / 2 + 26)) { g.items.push({ x, y: -20, ph: Math.random() * 6 }); return; }
  }
}
function collect(r) {
  g.streak++; g.rings++;
  const mult = 1 + Math.min(3, Math.floor(g.streak / 3)), pts = 50 * mult;
  g.extra += pts; pop(r.x, '+' + pts, '#ffd45a');
  for (let i = 0; i < 8; i++) g.conf.push({ x: r.x, y: r.y, vx: rnd(-90, 90), vy: rnd(-150, -30), r: 0, vr: rnd(-6, 6), w: 4, h: 4, c: pick(['#ffd45a', '#fff3b0', '#ffffff']) });
}

/* ---------- Classifica ---------- */
let playerName = localStorage.getItem('bikePlayer') || '';
function finishRun(won) {
  g.score = Math.round(Math.min(g.dist, TARGET)) + g.extra + (won ? 1000 : 0);
  saveScore(g.score, won);
}
function boardMsg(key) {
  const b = $('board-body'); b.innerHTML = '';
  const tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 4; td.textContent = tx(key); tr.appendChild(td); b.appendChild(tr);
}
function saveScore(score, won) {
  if (!BICI_SCRIPT_URL) return;
  fetch(BICI_SCRIPT_URL, { method: 'POST', mode: 'no-cors', cache: 'no-cache', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ nome: playerName, punteggio: score, citta: city, personaggio: ch, esito: won ? 'arrivo' : 'incidente' }) })
    .then(() => setTimeout(loadBoard, 1000)).catch(loadBoard);
}
function loadBoard() {
  if (!BICI_SCRIPT_URL) { boardMsg('boardOff'); return; }
  boardMsg('boardLoading');
  fetch(BICI_SCRIPT_URL).then(r => r.json()).then(data => {
    const b = $('board-body'); b.innerHTML = '';
    if (!Array.isArray(data) || !data.length) { boardMsg('boardEmpty'); return; }
    data.forEach((row, i) => {
      const tr = document.createElement('tr');
      if (row.nome === playerName && Number(row.punteggio) === g.score) tr.className = 'me';
      [i + 1, row.nome, T[lang][row.citta] || row.citta || '', row.punteggio].forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      b.appendChild(tr);
    });
  }).catch(() => boardMsg('boardError'));
}

/* ---------- Disegno ---------- */
function drawPlayer() {
  const p = g.p, t = g.t, C = CITY[city], sposa = ch === 'sposa';
  const pedal = Math.sin(t * (5 + g.sf * 9));
  ctx.save(); ctx.translate(p.x, PY); ctx.rotate(p.tilt);
  ell(3, 3, 11, 27, SH);
  if (sposa) {
    ctx.beginPath(); ctx.moveTo(-6, -2);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-7 - i * 1.7 + Math.sin(t * 5 + i) * 3.5 - p.vx * 0.02 * i, 2 + i * 7);
    for (let i = 6; i >= 0; i--) ctx.lineTo(7 + i * 1.7 + Math.sin(t * 5 + i + 1) * 3.5 - p.vx * 0.02 * i, 2 + i * 7);
    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
  }
  rr(-3, 5, 6, 22, 3, '#222');
  ctx.save(); ctx.translate(0, -14); ctx.rotate(p.tilt * 0.8); rr(-3, -11, 6, 22, 3, '#222'); ctx.restore();
  line(0, -14, 0, 14, C.accent, 3.5);
  line(-11, -12, 11, -12, '#333', 3);
  const shoe = sposa ? '#f4f1e8' : '#1a1a1a';
  ell(-5, 3 + pedal * 5, 3, 4.5, shoe); ell(5, 3 - pedal * 5, 3, 4.5, shoe);
  const jacket = sposa ? '#fdfaf3' : '#1d2a44';
  line(-9, -2, -10, -12, jacket, 4.5); line(9, -2, 10, -12, jacket, 4.5);
  if (sposa) { ell(0, 3, 14, 11, '#fdfaf3'); ell(0, -1, 11, 7, '#ffffff'); } else ell(0, -2, 11, 7.5, jacket);
  const hair = sposa ? '#6b4226' : '#2b2118';
  ell(0, -4, 6.2, 6.2, SKIN); ell(0, -3, 6.2, 5.4, hair);
  if (sposa) { ell(0, 2, 3.2, 3, hair); ell(0, -14, 4.2, 3.6, '#e58aa5'); ell(-2, -15, 2.4, 2.4, '#fff'); ell(2.2, -13.5, 2.4, 2.4, '#f4c6d2'); }
  else { ell(-4.5, -1, 1.8, 1.8, '#a82e3a'); }
  ctx.restore();
}

function drawRing(r) {
  const k = 0.45 + 0.55 * Math.abs(Math.cos(g.t * 3 + r.ph));
  ctx.save(); ctx.translate(r.x, r.y);
  ell(0, 0, 18, 18, 'rgba(255,214,90,.22)');
  ctx.scale(k, 1); ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.strokeStyle = '#f2b632'; ctx.lineWidth = 4.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI * 1.15, Math.PI * 1.85); ctx.strokeStyle = '#fff1b0'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(r.x, r.y - 11); ctx.rotate(Math.PI / 4); rr(-3.2, -3.2, 6.4, 6.4, 1.2, '#bfe9ff'); ctx.restore();
}

function drawScene(side, it) {
  const C = CITY[city], x0 = side === 'l' ? 3 : W - 41;
  if (it.k === 'roof') {
    rr(x0, it.y, 38, it.h, 3, it.c); rr(x0 + 4, it.y + 4, 30, it.h - 8, 2, 'rgba(0,0,0,.12)');
    if (city === 'barcellona') { ctx.fillStyle = 'rgba(0,0,0,.09)'; for (let y = it.y + 9; y < it.y + it.h - 8; y += 8) ctx.fillRect(x0 + 4, y, 30, 2); }
    else for (let i = 0; i < it.u; i++) rr(x0 + 9 + (i % 2) * 14, it.y + 12 + i * 22, 11, 9, 2, 'rgba(255,255,255,.35)');
  } else if (city === 'barcellona') { ctx.save(); ctx.translate(x0 + 19, it.y + 19); palm(g.t, it.ph, 0.95); ctx.restore(); }
  else { ell(x0 + 21, it.y + 21, 17, 17, SH); ell(x0 + 19, it.y + 19, 17, 17, '#5f8456'); ell(x0 + 17, it.y + 16, 10, 10, '#78996b'); }
}

function draw() {
  const C = CITY[city];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = C.edge; ctx.fillRect(0, 0, W, H);
  g.sc.l.forEach(i => drawScene('l', i)); g.sc.r.forEach(i => drawScene('r', i));
  ctx.fillStyle = C.road; ctx.fillRect(RL, 0, RR - RL, H);
  ctx.fillStyle = C.line; ctx.fillRect(RL - 2, 0, 2, H); ctx.fillRect(RR, 0, 2, H);
  for (let y = -40 + g.roadOff; y < H; y += 40) ctx.fillRect(W / 2 - 2, y, 4, 20);

  const fy = PY - 26 - (TARGET - g.dist) * 2;
  if (fy > -60 && fy < H + 40) {
    for (let r = 0; r < 2; r++) for (let k = 0; k < (RR - RL) / 12; k++) { ctx.fillStyle = (k + r) % 2 ? '#fff' : '#111'; ctx.fillRect(RL + k * 12, fy + r * 12, 12, 12); }
    ctx.fillStyle = C.accent; ctx.fillRect(RL, fy - 30, RR - RL, 24);
    ctx.fillStyle = '#fff'; ctx.font = '700 13px "Instrument Sans",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(tx('finish').toUpperCase(), W / 2, fy - 13); ctx.textAlign = 'start';
  }
  g.items.forEach(drawRing);
  g.obs.forEach(o => { const d = OB[o.type]; ctx.save(); ctx.translate(o.x, o.y); if (o.type !== 'tram') ell(0, 0, d.w * 0.75, d.h * 0.62, 'rgba(255,255,255,.16)'); d.draw(o, g.t); ctx.restore(); });
  drawPlayer();
  g.conf.forEach(c => { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore(); });

  ctx.textAlign = 'center'; ctx.font = '700 15px "Instrument Sans",sans-serif';
  g.pops.forEach(q => { ctx.globalAlpha = 1 - q.t; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(q.text, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.text, q.x, q.y); });
  ctx.globalAlpha = 1; ctx.textAlign = 'start';
  const gr = ctx.createLinearGradient(0, 0, 0, 190);
  if (city === 'milano') { gr.addColorStop(0, 'rgba(235,240,245,.7)'); gr.addColorStop(1, 'rgba(235,240,245,0)'); }
  else { gr.addColorStop(0, 'rgba(255,214,120,.38)'); gr.addColorStop(1, 'rgba(255,214,120,0)'); }
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, 190);
}

function loop(ts) {
  g.raf = requestAnimationFrame(loop);
  const dt = Math.min(((ts - g.last) / 1000) || 0, 0.05); g.last = ts;
  update(dt); draw();
}

/* ---------- Schermate ---------- */
function swap(from, to, done) {
  from.classList.add('leave');
  setTimeout(() => {
    from.hidden = true; from.classList.remove('leave', 'enter');
    to.hidden = false; to.classList.remove('enter'); void to.offsetWidth; to.classList.add('enter');
    if (done) done();
  }, 280);
}
function startGame() {
  const inp = $('player-name'), name = inp.value.trim();
  if (!name) { inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); $('name-err').textContent = tx('nameReq'); inp.focus(); return; }
  playerName = name; localStorage.setItem('bikePlayer', name); $('name-err').textContent = '';
  g.mode = 'ready'; resetRun(); g.mode = 'ready';
  swap($('setup'), $('stage'), () => { g.mode = 'count'; });
  if (!g.raf) { g.last = performance.now(); g.raf = requestAnimationFrame(loop); }
}
function toSetup() {
  cancelAnimationFrame(g.raf); g.raf = 0; g.mode = 'setup'; g.shown = false; $('count').classList.remove('show'); $('end').classList.remove('show');
  swap($('stage'), $('setup'));
}

function texts() {
  document.querySelectorAll('[data-i]').forEach(e => { e.textContent = tx(e.dataset.i); });
  document.documentElement.lang = lang; $('lang-select').value = lang; $('player-name').placeholder = tx('namePh');
  if (g.mode !== 'setup') { $('hud-city').textContent = tx(city); g.lastHud = -1; }
  if (g.shown && (g.mode === 'win' || g.mode === 'lose')) showEnd(g.mode === 'win');
}

/* ---------- Eventi ---------- */
document.querySelectorAll('.choice[data-char]').forEach(b => b.addEventListener('click', () => {
  ch = b.dataset.char; document.body.dataset.char = ch;
  document.querySelectorAll('.choice[data-char]').forEach(x => x.setAttribute('aria-pressed', x === b)); texts();
}));
document.querySelectorAll('.choice[data-city]').forEach(b => b.addEventListener('click', () => {
  city = b.dataset.city; document.body.dataset.city = city;
  document.querySelectorAll('.choice[data-city]').forEach(x => x.setAttribute('aria-pressed', x === b));
}));
$('btn-play').addEventListener('click', startGame);
$('btn-again').addEventListener('click', () => { resetRun(); });
$('btn-change').addEventListener('click', toSetup);
$('lang-select').addEventListener('change', e => { lang = e.target.value; localStorage.setItem('selectedLanguage', lang); texts(); });

const kmap = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
addEventListener('keydown', e => { if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return; const k = kmap[e.key]; if (k) { g.keys[k] = 1; if (e.key.startsWith('Arrow')) e.preventDefault(); } });
addEventListener('keyup', e => { const k = kmap[e.key]; if (k) g.keys[k] = 0; });
addEventListener('blur', () => { g.keys.l = g.keys.r = 0; });
[['pad-l', 'l'], ['pad-r', 'r']].forEach(([id, k]) => {
  const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); g.keys[k] = 1; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { g.keys[k] = 0; }));
});
const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
cv.addEventListener('pointerdown', e => { g.drag = toX(e); if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (g.drag !== null) g.drag = toX(e); });
['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { g.drag = null; }));

$('player-name').value = playerName;
texts();
loadBoard();
})();