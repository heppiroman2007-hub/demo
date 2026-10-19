// Настройки конкретной кондитерской приходят из config.js (его пишет build.py)
const SITE = window.SITE || {};
const WA_PHONE = SITE.wa || "";
const waLink = text => `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = n => n.toLocaleString("ru-RU").replace(/ /g, " ") + " ₽";

// Шапка заливается цветом после первого экрана
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("solid", scrollY > 60);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

// Мобильное меню
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
burger.addEventListener("click", () => burger.setAttribute("aria-expanded", nav.classList.toggle("open")));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }));

// Параллакс: тарелки, ягоды и листья смещаются за мышью и при прокрутке
if (!reduceMotion) {
  const layers = [...document.querySelectorAll(".hero .px")];
  const aboutArt = document.querySelector(".about__art");
  const aboutLayers = [...document.querySelectorAll("[data-px]")];
  let mx = 0, my = 0, ticking = false;
  function paint() {
    ticking = false;
    const sy = scrollY;
    if (sy < innerHeight * 1.2) {
      layers.forEach(l => {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate3d(${mx * d * 14}px, ${my * d * 14 - sy * d * 0.12}px, 0)`;
      });
    }
    const r = aboutArt.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      aboutLayers.forEach(l => {
        const d = Number(l.dataset.px);
        l.style.translate = `${mx * d * 10}px ${p * d * -60 + my * d * 10}px`;
      });
    }
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; req(); }, { passive: true });
  addEventListener("scroll", req, { passive: true });
  paint();
}

// Появление блоков при прокрутке (+ страховка для того, что уже на экране)
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
function revealVisible() {
  document.querySelectorAll(".reveal:not(.in)").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight - 40 && r.bottom > 0) { el.classList.add("in"); io.unobserve(el); }
  });
}
setTimeout(revealVisible, 80);
let revealPending = false;
addEventListener("scroll", () => {
  if (revealPending) return;
  revealPending = true;
  setTimeout(() => { revealPending = false; revealVisible(); }, 150);
}, { passive: true });

// Счётчики (4,6 и 262)
const countIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    countIo.unobserve(e.target);
    const el = e.target, end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0);
    const show = v => { el.textContent = v.toFixed(dec).replace(".", ","); };
    if (reduceMotion) return show(end);
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 1500);
      show(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: .5 });
document.querySelectorAll("[data-count]").forEach(el => countIo.observe(el));

// Фильтр каталога
const chips = [...document.querySelectorAll(".chip")];
const prods = [...document.querySelectorAll(".prod")];
chips.forEach(c => c.addEventListener("click", () => {
  chips.forEach(x => { x.classList.toggle("is-on", x === c); x.setAttribute("aria-selected", x === c); });
  const f = c.dataset.filter;
  prods.forEach((p, i) => {
    const show = f === "all" || p.dataset.cat === f;
    p.hidden = !show;
    if (show && !reduceMotion) p.animate([{ opacity: 0, transform: "translateY(20px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 450, delay: (i % 4) * 60, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
  });
}));

// Кнопки «Хочу такой» — заказ в WhatsApp
document.querySelectorAll(".prod__btn").forEach(b => b.addEventListener("click", () => {
  window.open(waLink(`Здравствуйте! Хочу заказать: ${b.dataset.item}. Подскажите, пожалуйста, стоимость и сроки.`), "_blank", "noopener");
}));

// ---------- Конструктор бенто ----------
const SIZES = {
  s:   { label: "S", desc: "10 см · 400–500 г", scale: .52 },
  max: { label: "MAX", desc: "13 см · 700–800 г", scale: .64 },
  xl:  { label: "XL", desc: "1,2–1,3 кг", scale: .76 },
  xxl: { label: "XXL", desc: "18 см · 1,7–1,8 кг", scale: .88 }
};
// Цены по размерам можно передать в config.js (SITE.bento); без них стоимость рассчитывает кондитер.
// null — такого размера с этой начинкой нет.
const ANY = { s: 0, max: 0, xl: 0, xxl: 0 };
const P = SITE.bento || {};
const HAS_PRICES = Object.keys(P).length > 0;
const FILLS = {
  pistachio:  { name: "Фисташка-малина", prices: P.pistachio || ANY, deco: "raspberry" },
  strawberry: { name: "Клубничный пломбир", prices: P.strawberry || ANY, deco: "strawberry" },
  mango:      { name: "Манго-клубника", prices: P.mango || ANY, deco: "mango" },
  snickers:   { name: "«Сникерс»", prices: P.snickers || ANY, deco: "snickers" }
};
const COLOR_NAMES = { "#fbf6ee": "белый", "#f7c9d4": "розовый", "#d9c4f2": "лавандовый", "#c9ead8": "мятный", "#bfe3f7": "голубой", "#6b4430": "шоколадный" };
const state = { size: "s", fill: "pistachio", color: "#fbf6ee", text: "С днём рождения!" };

const cake = document.getElementById("cake");
const rim = document.getElementById("rim");
const deco = document.getElementById("deco");
const cakeText = document.getElementById("cakeText");
const priceEl = document.getElementById("price");
const sizeLabel = document.getElementById("sizeLabel");
const sendBtn = document.getElementById("sendBento");
const inscription = document.getElementById("inscription");

// бортик из кремовых капель
(function buildRim() {
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = 44.5;
    const d = document.createElement("i");
    d.style.left = 50 + Math.cos(a) * r + "%";
    d.style.top = 50 + Math.sin(a) * r + "%";
    rim.appendChild(d);
  }
})();

// украшения: ягоды полумесяцем у края, как у настоящих бенто
const DECO = {
  raspberry: [["#e52a55", "#9c0e30", 9], ["#e52a55", "#9c0e30", 8], ["#7fb53a", "#3f7a1a", 4]],
  strawberry: [["#ff4d5e", "#b3122a", 10], ["#e52a55", "#9c0e30", 7], ["#ffffff", "#e7d9c9", 4]],
  mango: [["#ffc23a", "#e3860b", 8], ["#ff4d5e", "#b3122a", 9], ["#ffd76a", "#f0a020", 6]],
  snickers: [["#c98a4b", "#7a4a1f", 6], ["#4a2a17", "#24120a", 7], ["#d9a066", "#8a5525", 5]]
};
function buildDeco() {
  deco.innerHTML = "";
  const set = DECO[FILLS[state.fill].deco];
  const pts = 13;
  for (let i = 0; i < pts; i++) {
    const t = i / (pts - 1);
    const a = (200 + t * 120) * Math.PI / 180;
    const jitter = (i % 3) * 2.2;
    const r = 33 - jitter;
    const [c1, c2, size] = set[i % set.length];
    const d = document.createElement("i");
    d.style.left = 50 + Math.cos(a) * r + "%";
    d.style.top = 50 + Math.sin(a) * r + "%";
    d.style.width = d.style.height = size + "%";
    d.style.background = `radial-gradient(circle at 34% 30%, rgba(255,255,255,.7) 0 9%, transparent 11%), radial-gradient(circle at 40% 38%, ${c1}, ${c2})`;
    d.style.boxShadow = "0 3px 4px rgba(60,10,20,.35)";
    if (FILLS[state.fill].deco === "mango" && i % 3 !== 1) d.style.borderRadius = "22%";
    d.style.animationDelay = i * 35 + "ms";
    deco.appendChild(d);
  }
}

function render() {
  const s = SIZES[state.size], f = FILLS[state.fill];
  cake.style.setProperty("--size", s.scale);
  cake.style.setProperty("--cream", state.color);
  cake.classList.toggle("dark", state.color === "#6b4430");
  cakeText.textContent = state.text || " ";
  cakeText.style.fontSize = `clamp(16px, ${(state.text.length > 16 ? 2.4 : 3.4) * s.scale / .64}vw, ${state.text.length > 16 ? 26 : 36}px)`;
  sizeLabel.textContent = s.desc;
  // недоступные размеры для начинки
  document.querySelectorAll("#sizes button").forEach(b => { b.disabled = f.prices[b.dataset.size] == null; });
  const price = f.prices[state.size];
  priceEl.textContent = HAS_PRICES ? fmt(price) : "рассчитает кондитер";
  const priceLine = HAS_PRICES ? `Цена по сайту: ${fmt(price)}. ` : "Подскажите, пожалуйста, стоимость. ";
  const msg = `Здравствуйте! Хочу заказать бенто-торт:\n• Размер: ${s.label} (${s.desc})\n• Начинка: ${f.name}\n• Цвет крема: ${COLOR_NAMES[state.color]}\n• Надпись: «${state.text}»\n${priceLine}На какую дату можно заказать?`;
  sendBtn.href = waLink(msg);
}

function choose(groupId, attr, key, after) {
  document.getElementById(groupId).addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    [...b.parentElement.children].forEach(x => x.classList.toggle("is-on", x === b));
    state[key] = b.dataset[attr];
    if (after) after();
    render();
  });
}
choose("sizes", "size", "size");
choose("fills", "fill", "fill", () => {
  // если у начинки нет выбранного размера — переключаем на XL
  if (FILLS[state.fill].prices[state.size] == null) {
    state.size = "xl";
    document.querySelectorAll("#sizes button").forEach(x => x.classList.toggle("is-on", x.dataset.size === "xl"));
  }
  buildDeco();
});
choose("colors", "color", "color");
inscription.addEventListener("input", () => { state.text = inscription.value.trim(); render(); });

buildDeco();
render();
