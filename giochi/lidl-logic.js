const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
let currentLanguage = "it";
const T = () => window.weddingTranslations[currentLanguage].lidl;
function applyUiLanguage() {
  const t = T();
  document.documentElement.lang = currentLanguage;
  document.title = t.title;
  $("lang-select").value = currentLanguage;
  document.querySelector(".band h1").textContent = t.title;
  document.querySelector(".band > p").textContent = t.intro;
  $("scan-text").textContent = t.scan;
  document.querySelector(".kicker").textContent = t.product;
  document.querySelector(".match h3").textContent = t.compatibility;
  $("restart").textContent = t.restart;
  document.querySelector("#result-box .actions a").textContent = t.home;
  document.querySelector(".back-link").textContent = t.back;
  if (!$("quiz-game").hidden && !lock) loadQuestion();
  if (!$("result-box").hidden) showResult();
}
const ICONS = {
  rain: svg('<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 14v6M8 14v6M12 16v6"/>'),
  lunch: svg('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
  party: svg('<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>'),
  sofa: svg('<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0ZM4 18v2M20 18v2"/>'),
  cart: svg('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
  school: svg('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  phone: svg('<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>'),
  ceci: svg('<circle cx="8" cy="9" r="3.5"/><circle cx="16" cy="9" r="3.5"/><circle cx="12" cy="16" r="3.5"/>'),
  riso: svg('<path d="M3 12h18a9 9 0 0 1-18 0Z"/><path d="M8 8c0-1.5 1-2 1-4M12 8c0-1.5 1-2 1-4M16 8c0-1.5 1-2 1-4"/>'),
  latte: svg('<path d="M7 3h10l1 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7z"/><path d="M6 7h12M9 12h6M9 16h6"/>'),
  verdura: svg('<path d="M12 22V12M12 12C12 7 8 4 4 4c0 4 3 8 8 8ZM12 14c0-4 3-7 8-7 0 4-3 7-8 7Z"/>')
};

// The question icons are language-neutral; all question and answer copy lives in lang.json.
const domande = [
  { icon: "rain" }, { icon: "lunch" }, { icon: "party" }, { icon: "sofa" },
  { icon: "cart" }, { icon: "school" }, { icon: "phone" }
];

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLORS = ["#0050aa", "#fff000", "#e60a14"];
let currentQ = 0, lock = false, punteggi = {};

function resetScores() { punteggi = Object.fromEntries(Object.keys(T().profiles).map(profile => [profile, 0])); }

function burst(x, y, n = 14) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span"); s.className = "fx";
    const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 120;
    s.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[i % 3]};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r - 80}px;--rot:${(Math.random() - .5) * 540}deg`;
    s.addEventListener("animationend", () => s.remove());
    document.body.appendChild(s);
  }
}

function setSteps(done, now) {
  [...$("steps").children].forEach((s, i) => { s.className = i < done ? "done" : (i === now ? "now" : ""); });
}

function loadQuestion() {
  if (currentQ >= T().questions.length) { startScan(); return; }
  const d = domande[currentQ], card = $("card");
  const question = T().questions[currentQ];
  const answerProfiles = T().answerProfiles[currentQ];
  $("progress").textContent = T().progress.replace("{current}", currentQ + 1).replace("{total}", T().questions.length);
  $("badge").innerHTML = ICONS[d.icon]; $("question-text").textContent = question.q;
  setSteps(currentQ, currentQ);
  card.classList.remove("enter", "leave"); void card.offsetWidth; card.classList.add("enter");

  const box = $("options-container"); box.innerHTML = ""; box.classList.remove("locked");
  question.answers.forEach((answer, i) => {
    const b = document.createElement("button");
    b.className = "btn-opt"; b.style.setProperty("--i", i);
    b.innerHTML = `<span class="chip">${"ABCD"[i]}</span><span class="txt"></span>`;
    b.querySelector(".txt").textContent = answer;
    const opt = { profile: answerProfiles[i] };
    b.onclick = ev => choose(b, opt, ev);
    box.appendChild(b);
  });
  lock = false;
}

function choose(btn, opt, ev) {
  if (lock) return; lock = true;
  const box = $("options-container"); box.classList.add("locked");
  [...box.children].forEach(c => c.classList.add(c === btn ? "chosen" : "dim"));
  const r = btn.getBoundingClientRect();
  burst(ev.clientX || r.left + r.width / 2, ev.clientY || r.top + r.height / 2, 10);
  punteggi[opt.profile]++; setSteps(currentQ + 1, -1);
  setTimeout(() => {
    $("card").classList.remove("enter"); $("card").classList.add("leave");
    setTimeout(() => { currentQ++; loadQuestion(); }, 350);
  }, 750);
}

function makeBars(el, n) {
  el.innerHTML = "";
  for (let i = 0; i < n; i++) { const b = document.createElement("i"); b.style.width = (1 + Math.floor(Math.random() * 4)) + "px"; el.appendChild(b); }
}

function startScan() {
  $("quiz-game").hidden = true; $("scan-box").hidden = false;
  makeBars($("scan-bars"), 34);
  let i = 0; const t = setInterval(() => {
    const texts = T().scanSteps;
    $("scan-text").textContent = texts[++i % texts.length];
  }, 650);
  setTimeout(() => { clearInterval(t); showResult(); }, 2000);
}

function showResult() {
  const profiles = T().profiles;
  const win = Object.keys(punteggi).reduce((a, b) => punteggi[a] > punteggi[b] ? a : b);
  const p = profiles[win];
  $("scan-box").hidden = true; $("result-box").hidden = false;
  $("product-art").innerHTML = ICONS[p.icon]; $("cheese-name").textContent = p.name; $("cheese-nick").textContent = p.nick;
  $("cheese-note").textContent = p.note; $("cheese-description").textContent = p.desc;
  $("price").innerHTML = `${p.price}€<small>${T().price}</small>`;
  makeBars($("tag-bars"), 40);

  const rows = $("match-rows"); rows.innerHTML = "";
  Object.keys(profiles).sort((a, b) => punteggi[b] - punteggi[a]).forEach(k => {
    const pct = Math.round(punteggi[k] / T().questions.length * 100);
    const row = document.createElement("div"); row.className = "row" + (k === win ? " win" : "");
    const name = profiles[k].name;
    row.innerHTML = `<span>${name}</span><div class="meter"><b data-w="${pct}"></b></div><span>${pct}%</span>`;
    rows.appendChild(row);
  });

  const tag = $("tag"); tag.classList.remove("show"); void tag.offsetWidth; tag.classList.add("show");
  setTimeout(() => { const r = tag.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 30); }, 900);
  setTimeout(() => rows.querySelectorAll("b").forEach(b => b.style.width = b.dataset.w + "%"), 700);
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

$("restart").onclick = () => {
  resetScores(); currentQ = 0; $("result-box").hidden = true; $("quiz-game").hidden = false;
  $("tag").classList.remove("show"); loadQuestion();
};

document.addEventListener("languageChanged", event => {
  currentLanguage = event.detail.language;
  applyUiLanguage();
});

// Press 1–4 to choose the corresponding answer.
document.addEventListener("keydown", e => {
  if ($("quiz-game").hidden || lock) return;
  const b = $("options-container").children[+e.key - 1]; if (b) b.click();
});

window.weddingLanguageReady.then(({ language }) => {
  currentLanguage = language;
  $("steps").innerHTML = T().questions.map(() => "<i></i>").join("");
  resetScores();
  applyUiLanguage();
});
