// Общий скрипт для шаблонов-стилей. Настройки компании — в config.js (пишет build.py)
const SITE = window.SITE || {};
const WA_PHONE = SITE.wa || "";
const waLink = text => WA_PHONE ? `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}` : (SITE.url2gis || "#");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = n => n.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Шапка заливается после первого экрана
const header = $("#header");
if (header) {
  const onScroll = () => header.classList.toggle("solid", scrollY > 40);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
}

// Мобильное меню
const nav = $("#nav"), burger = $("#burger");
if (nav && burger) {
  burger.addEventListener("click", () => burger.setAttribute("aria-expanded", nav.classList.toggle("open")));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }));
}

// Появление блоков при прокрутке
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach(el => io.observe(el));
setTimeout(() => $$(".reveal:not(.in)").forEach(el => {
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
}), 80);

// Счётчики (рейтинг, число отзывов)
const countIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    countIo.unobserve(e.target);
    const el = e.target, end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0);
    const show = v => { el.textContent = v.toFixed(dec).replace(".", ","); };
    if (reduceMotion) return show(end);
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 1400);
      show(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: .5 });
$$("[data-count]").forEach(el => countIo.observe(el));

// Кнопки заказа: data-item — что хотят, data-price — цена с сайта
$$("[data-item]").forEach(b => b.addEventListener("click", e => {
  e.preventDefault();
  const price = b.dataset.price ? ` Цена на сайте: ${b.dataset.price}.` : "";
  window.open(waLink(`Здравствуйте! Хочу заказать: ${b.dataset.item}.${price} На какую дату можно?`), "_blank", "noopener");
}));

// Лёгкий наклон карточек за курсором (только мышь)
if (!reduceMotion && matchMedia("(hover: hover)").matches) {
  $$("[data-tilt]").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
}

// ---------- Конструктор бенто (если он есть на странице) ----------
if ($("#cake")) {
  const SIZES = {
    s:   { label: "S", desc: "10 см · 400–500 г", scale: .52 },
    max: { label: "MAX", desc: "13 см · 700–800 г", scale: .64 },
    xl:  { label: "XL", desc: "1,2–1,3 кг", scale: .76 },
    xxl: { label: "XXL", desc: "18 см · 1,7–1,8 кг", scale: .88 }
  };
  // SITE.bento: {начинка: {s, max, xl, xxl}}; null — такого размера нет
  const P = SITE.bento || {};
  const FILLS = {
    pistachio:  { name: "Фисташка-малина", deco: "raspberry" },
    strawberry: { name: "Клубничный пломбир", deco: "strawberry" },
    mango:      { name: "Манго-клубника", deco: "mango" },
    snickers:   { name: "«Сникерс»", deco: "snickers" }
  };
  const priceOf = (fill, size) => (P[fill] || P.default || {})[size];
  const COLOR_NAMES = { "#fbf6ee": "белый", "#f7c9d4": "розовый", "#d9c4f2": "лавандовый", "#c9ead8": "мятный", "#bfe3f7": "голубой", "#6b4430": "шоколадный" };
  const state = { size: "s", fill: "pistachio", color: "#fbf6ee", text: "С днём рождения!" };
  const cake = $("#cake"), rim = $("#rim"), deco = $("#deco"), cakeText = $("#cakeText");
  const priceEl = $("#price"), sizeLabel = $("#sizeLabel"), sendBtn = $("#sendBento"), inscription = $("#inscription");

  for (let i = 0, n = 28; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = document.createElement("i");
    d.style.left = 50 + Math.cos(a) * 44.5 + "%";
    d.style.top = 50 + Math.sin(a) * 44.5 + "%";
    rim.appendChild(d);
  }
  const DECO = {
    raspberry: [["#e52a55", "#9c0e30", 9], ["#e52a55", "#9c0e30", 8], ["#7fb53a", "#3f7a1a", 4]],
    strawberry: [["#ff4d5e", "#b3122a", 10], ["#e52a55", "#9c0e30", 7], ["#ffffff", "#e7d9c9", 4]],
    mango: [["#ffc23a", "#e3860b", 8], ["#ff4d5e", "#b3122a", 9], ["#ffd76a", "#f0a020", 6]],
    snickers: [["#c98a4b", "#7a4a1f", 6], ["#4a2a17", "#24120a", 7], ["#d9a066", "#8a5525", 5]]
  };
  function buildDeco() {
    deco.innerHTML = "";
    const set = DECO[FILLS[state.fill].deco];
    for (let i = 0, pts = 13; i < pts; i++) {
      const a = (200 + i / (pts - 1) * 120) * Math.PI / 180, r = 33 - (i % 3) * 2.2;
      const [c1, c2, size] = set[i % set.length];
      const d = document.createElement("i");
      d.style.left = 50 + Math.cos(a) * r + "%";
      d.style.top = 50 + Math.sin(a) * r + "%";
      d.style.width = d.style.height = size + "%";
      d.style.background = `radial-gradient(circle at 34% 30%, rgba(255,255,255,.7) 0 9%, transparent 11%), radial-gradient(circle at 40% 38%, ${c1}, ${c2})`;
      if (FILLS[state.fill].deco === "mango" && i % 3 !== 1) d.style.borderRadius = "22%";
      d.style.animationDelay = i * 35 + "ms";
      deco.appendChild(d);
    }
  }
  function render() {
    const s = SIZES[state.size], f = FILLS[state.fill], price = priceOf(state.fill, state.size);
    cake.style.setProperty("--size", s.scale);
    cake.style.setProperty("--cream", state.color);
    cake.classList.toggle("dark", state.color === "#6b4430");
    cakeText.textContent = state.text || " ";
    cakeText.style.fontSize = `clamp(15px, ${(state.text.length > 16 ? 2.4 : 3.4) * s.scale / .64}vw, ${state.text.length > 16 ? 24 : 34}px)`;
    sizeLabel.textContent = s.desc;
    $$("#sizes button").forEach(b => { b.disabled = priceOf(state.fill, b.dataset.size) === null; });
    priceEl.textContent = price ? fmt(price) : "уточним";
    const priceLine = price ? `Цена на сайте: ${fmt(price)}. ` : "";
    sendBtn.href = waLink(`Здравствуйте! Хочу бенто-торт:\n• Размер: ${s.label} (${s.desc})\n• Начинка: ${f.name}\n• Крем: ${COLOR_NAMES[state.color]}\n• Надпись: «${state.text}»\n${priceLine}На какую дату можно?`);
  }
  function choose(id, attr, key, after) {
    $("#" + id).addEventListener("click", e => {
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
    if (priceOf(state.fill, state.size) === null) {
      state.size = "xl";
      $$("#sizes button").forEach(x => x.classList.toggle("is-on", x.dataset.size === "xl"));
    }
    buildDeco();
  });
  choose("colors", "color", "color");
  inscription.addEventListener("input", () => { state.text = inscription.value.trim(); render(); });
  buildDeco();
  render();
}
