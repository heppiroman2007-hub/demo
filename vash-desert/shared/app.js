// «Ваш десерт»: меню, калькулятор торта, конструктор бенто, cookie. Данные — window.SITE (пишет build.py)
const SITE = window.SITE || {};
const waLink = text => `https://wa.me/${SITE.wa}?text=${encodeURIComponent(text)}`;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = n => Math.round(n).toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};

// Шапка заливается после первого экрана
const header = $("#header");
const onScroll = () => header.classList.toggle("solid", scrollY > 40);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

// Мобильное меню
const nav = $("#nav"), burger = $("#burger");
burger.addEventListener("click", () => burger.setAttribute("aria-expanded", nav.classList.toggle("open")));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }));

// Появление блоков при прокрутке
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: .1, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach(el => io.observe(el));

// Счётчик рейтинга
$$("[data-count]").forEach(el => {
  const end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0);
  const show = v => { el.textContent = v.toFixed(dec).replace(".", ","); };
  if (reduceMotion) return show(end);
  new IntersectionObserver((en, obs) => {
    if (!en[0].isIntersecting) return;
    obs.disconnect();
    const t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / 1200); show(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, { threshold: .5 }).observe(el);
});

// Кнопки «Заказать / Хочу такой»: data-item — что хотят, data-price — цена с сайта
$$("[data-item]").forEach(b => b.addEventListener("click", e => {
  e.preventDefault();
  const price = b.dataset.price ? ` Цена на сайте: ${b.dataset.price}.` : "";
  window.open(waLink(`Здравствуйте! Хочу заказать: ${b.dataset.item}.${price} На какую дату можно?`), "_blank", "noopener");
}));

// ---------- Меню начинок: фильтр и «показать все» ----------
const menuList = $("#menuList"), moreBtn = $("#menuMore");
let menuOpen = false, group = "all";
function renderMenu() {
  let shown = 0;
  $$("#menuList .fill").forEach(card => {
    const match = group === "all" || card.dataset.group === group;
    const visible = match && (menuOpen || group !== "all" || shown < 8);
    card.hidden = !visible;
    if (visible) shown++;
  });
  moreBtn.parentElement.hidden = menuOpen || group !== "all";
}
$("#menuFilter").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  $$("#menuFilter button").forEach(x => x.classList.toggle("is-on", x === b));
  group = b.dataset.group;
  renderMenu();
});
moreBtn.addEventListener("click", () => { menuOpen = true; renderMenu(); });
$$(".is-more").forEach(el => el.classList.remove("is-more"));
renderMenu();

// «Ещё работы»
const works = $$(".work"), worksMore = $("#worksMore");
works.forEach((w, i) => { if (i >= 8) w.hidden = true; });
worksMore.addEventListener("click", () => { works.forEach(w => { w.hidden = false; w.classList.add("in"); }); worksMore.parentElement.hidden = true; });

// ---------- Калькулятор торта ----------
const calc = { fill: 0, w: 2, cups: 0 };
const calcFill = $("#calcFill"), calcDate = $("#calcDate");
const dateRu = v => v ? v.split("-").reverse().join(".") : "";
function renderCalc() {
  const cake = SITE.cakes[calc.fill];
  const cakeSum = cake.price * calc.w, cupSum = SITE.cupcake * calc.cups;
  $("#calcTotal").textContent = fmt(cakeSum + cupSum);
  $("#calcLine").textContent = `торт ${fmt(cakeSum)}` + (calc.cups ? ` + капкейки ${fmt(cupSum)}` : "");
  $("#calcGuests").textContent = `≈ ${Math.round(calc.w * 5)}–${Math.round(calc.w * 6.5)} гостей`;
  const w = String(calc.w).replace(".", ",");
  const lines = [`Здравствуйте! Хочу торт:`, `• Начинка: ${cake.name}`, `• Вес: ${w} кг`];
  if (calc.cups) lines.push(`• Капкейки: ${calc.cups} шт`);
  if (calcDate.value) lines.push(`• Дата: ${dateRu(calcDate.value)}`);
  lines.push(`Сумма по сайту: ${fmt(cakeSum + cupSum)}. Подтвердите, пожалуйста, дату.`);
  $("#calcSend").href = waLink(lines.join("\n"));
}
function segment(id, attr, key) {
  $("#" + id).addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    [...b.parentElement.children].forEach(x => x.classList.toggle("is-on", x === b));
    calc[key] = Number(b.dataset[attr]);
    renderCalc();
  });
}
segment("calcWeight", "w", "w");
segment("calcCups", "n", "cups");
calcFill.addEventListener("change", () => { calc.fill = Number(calcFill.value); renderCalc(); });
calcDate.addEventListener("input", renderCalc);
calcDate.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
$$("[data-pick]").forEach(b => b.addEventListener("click", () => {
  calc.fill = Number(b.dataset.pick);
  calcFill.value = b.dataset.pick;
  renderCalc();
  const form = $("#cakeCalc");
  form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  form.classList.remove("flash"); void form.offsetWidth; form.classList.add("flash");
}));
renderCalc();

// ---------- Конструктор бенто ----------
{
  const B = SITE.bento;
  const SCALE = { s: .56, m: .68, l: .82 };
  const COLOR_NAMES = { "#fbf6ee": "белый", "#f7c9d4": "розовый", "#e9b3c6": "пыльная роза", "#d9c4f2": "лавандовый", "#c9ead8": "мятный", "#6b4430": "шоколадный" };
  const DECO = {
    raspberry: [["#e52a55", "#9c0e30", 9], ["#e52a55", "#9c0e30", 8], ["#7fb53a", "#3f7a1a", 4]],
    cherry: [["#b0102c", "#5c0414", 9], ["#3a1a10", "#1a0905", 6], ["#b0102c", "#5c0414", 8]],
    berry: [["#e52a55", "#9c0e30", 8], ["#5b4bb0", "#2a1f66", 8], ["#ff4d5e", "#b3122a", 9]],
    mango: [["#ffc23a", "#e3860b", 8], ["#f3b52a", "#b8790a", 7], ["#ffd76a", "#f0a020", 6]]
  };
  const st = { size: "s", fill: Object.keys(B.fills)[0], color: "#fbf6ee", text: "С днём рождения!", print: false };
  const cake = $("#cake"), rim = $("#rim"), deco = $("#deco"), cakeText = $("#cakeText"), input = $("#inscription");
  for (let i = 0, n = 28; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = document.createElement("i");
    d.style.left = 50 + Math.cos(a) * 44.5 + "%";
    d.style.top = 50 + Math.sin(a) * 44.5 + "%";
    rim.appendChild(d);
  }
  function buildDeco() {
    deco.innerHTML = "";
    const set = DECO[B.fills[st.fill].deco];
    for (let i = 0, pts = 13; i < pts; i++) {
      const a = (200 + i / (pts - 1) * 120) * Math.PI / 180, r = 33 - (i % 3) * 2.2;
      const [c1, c2, size] = set[i % set.length];
      const d = document.createElement("i");
      d.style.left = 50 + Math.cos(a) * r + "%";
      d.style.top = 50 + Math.sin(a) * r + "%";
      d.style.width = d.style.height = size + "%";
      d.style.background = `radial-gradient(circle at 34% 30%, rgba(255,255,255,.7) 0 9%, transparent 11%), radial-gradient(circle at 40% 38%, ${c1}, ${c2})`;
      if (B.fills[st.fill].deco === "mango" && i % 3 !== 1) d.style.borderRadius = "22%";
      d.style.animationDelay = i * 35 + "ms";
      deco.appendChild(d);
    }
  }
  function render() {
    const s = B.sizes[st.size], f = B.fills[st.fill];
    const price = s.price + (st.print ? B.print : 0);
    cake.style.setProperty("--size", SCALE[st.size]);
    cake.style.setProperty("--cream", st.color);
    cake.classList.toggle("dark", st.color === "#6b4430");
    cake.classList.toggle("print", st.print);
    cakeText.textContent = st.text || " ";
    cakeText.style.fontSize = `clamp(15px, ${(st.text.length > 16 ? 2.4 : 3.4) * SCALE[st.size] / .68}vw, ${st.text.length > 16 ? 24 : 34}px)`;
    $("#sizeLabel").textContent = `${s.label} · ${s.weight}`;
    $("#fillDesc").textContent = f.desc ? `Состав: ${f.desc}` : "";
    $("#price").textContent = fmt(price);
    $("#sendBento").href = waLink(`Здравствуйте! Хочу бенто-торт:\n• Размер: ${s.label} (${s.weight})\n• Начинка: ${f.name}\n• Крем: ${COLOR_NAMES[st.color]}\n• Надпись: «${st.text}»` +
      (st.print ? `\n• Сахарная печать (+${B.print} ₽) — пришлю картинку` : "") + `\nЦена на сайте: ${fmt(price)}. На какую дату можно?`);
  }
  function choose(id, attr, key, after) {
    $("#" + id).addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      [...b.parentElement.children].forEach(x => x.classList.toggle("is-on", x === b));
      st[key] = b.dataset[attr];
      if (after) after();
      render();
    });
  }
  choose("sizes", "size", "size");
  choose("fills", "fill", "fill", buildDeco);
  choose("colors", "color", "color");
  input.addEventListener("input", () => { st.text = input.value.trim(); render(); });
  $("#bentoPrint").addEventListener("change", e => { st.print = e.target.checked; render(); });
  buildDeco();
  render();
}

// ---------- Cookie ----------
const cookie = $("#cookie");
if (!store.get("cookie")) cookie.hidden = false;
cookie.addEventListener("click", e => {
  const b = e.target.closest("[data-cookie]");
  if (!b) return;
  store.set("cookie", b.dataset.cookie);
  cookie.hidden = true;
});
