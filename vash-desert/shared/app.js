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

// Яндекс Метрика — только с номером счётчика (SITE.metrika) и только после «Принять все».
// Цели: wa, tel, route, insta, calc, bento, work, item, vitrina, works_<повод> — видно, сколько заявок дал сайт
function loadMetrika() {
  if (!SITE.metrika || window.ym) return;
  window.ym = function () { (ym.a = ym.a || []).push(arguments); };
  ym.l = Date.now();
  const s = document.createElement("script");
  s.async = true; s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  ym(SITE.metrika, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
}
const goal = name => { if (window.ym && SITE.metrika) ym(SITE.metrika, "reachGoal", name); };
if (store.get("cookie") === "all") loadMetrika();
document.addEventListener("click", e => {
  const a = e.target.closest("a");
  if (!a) return;
  const h = a.getAttribute("href") || "";
  if (a.id === "calcSend") goal("calc");
  else if (a.id === "sendBento") goal("bento");
  else if (a.dataset.goal) goal(a.dataset.goal);
  else if (h.startsWith("https://wa.me")) goal("wa");
  else if (h.startsWith("tel:")) goal("tel");
  else if (h.includes("2gis.ru")) goal(h.includes("reviews") ? "reviews" : "route");
  else if (h.includes("instagram.com")) goal("insta");
}, true);

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
  goal("item");
  const price = b.dataset.price ? ` Цена на сайте: ${b.dataset.price}.` : "";
  openSheet(`Здравствуйте! Хочу заказать: ${b.dataset.item}.${price} На какую дату можно?`);
}));

// ---------- Меню начинок: фильтр и «показать все» ----------
const menuList = $("#menuList"), moreBtn = $("#menuMore");
let menuOpen = false, group = "all";
const MENU_FIRST = 3;  // сколько начинок видно сразу — остальные по кнопке
function renderMenu() {
  const cards = $$("#menuList .fill").filter(c => group === "all" || c.dataset.group === group);
  $$("#menuList .fill").forEach(c => { c.hidden = true; });
  cards.forEach((c, i) => { c.hidden = !menuOpen && i >= MENU_FIRST; });
  const rest = cards.length - MENU_FIRST;
  moreBtn.parentElement.hidden = menuOpen || rest <= 0;
  moreBtn.textContent = group === "all" ? `Показать все начинки (${cards.length})` : `Показать ещё ${rest}`;
}
$("#menuFilter").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  $$("#menuFilter button").forEach(x => x.classList.toggle("is-on", x === b));
  group = b.dataset.group;
  menuOpen = false;
  renderMenu();
});
moreBtn.addEventListener("click", () => { menuOpen = true; renderMenu(); });
// открыт только один состав — раздел не разрастается
$$("#menuList .fill").forEach(d => d.addEventListener("toggle", () => {
  if (!d.open) return;
  menuList.classList.remove("is-hinting");  // понял, что строки открываются, — больше не подсказываем
  $$("#menuList .fill[open]").forEach(x => { if (x !== d) x.open = false; });
}));
$$(".is-more").forEach(el => el.classList.remove("is-more"));
renderMenu();

// Работы по поводам: во «Все» сначала 8, в поводе — все его работы
const worksMore = $("#worksMore");
let worksOpen = false, worksGroup = "all";
function renderWorks() {
  let shown = 0;
  $$("#worksList .work").forEach(w => {
    const visible = (worksGroup === "all" || w.dataset.group === worksGroup) && (worksOpen || worksGroup !== "all" || shown < 8);
    w.hidden = !visible;
    if (visible) { shown++; w.classList.add("in"); }
  });
  worksMore.parentElement.hidden = worksOpen || worksGroup !== "all";
}
$("#worksFilter").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  $$("#worksFilter button").forEach(x => x.classList.toggle("is-on", x === b));
  worksGroup = b.dataset.group;
  goal("works_" + worksGroup);
  renderWorks();
});
worksMore.addEventListener("click", () => { worksOpen = true; renderWorks(); });
renderWorks();
// «Хочу такой»: ссылка на фото уходит в сообщение — кондитер сразу видит, какой торт
$$("[data-photo]").forEach(b => b.addEventListener("click", () => {
  const url = new URL(b.dataset.photo, location.href).href;
  goal("work");
  openSheet(`Здравствуйте! Хочу такой торт: ${url}\nНа какую дату можно и сколько будет стоить?`);
}));

// ---------- Калькулятор торта ----------
// Счётчик капкейков «− 🧁 N +»: число — в data-n, при изменении — событие cupschange
const cupsOf = kind => Number($(`[data-cups="${kind}"]`).dataset.n || 0);
$$("[data-cups]").forEach(box => {
  const v = box.querySelector(".stepper__v"), [minus, plus] = box.querySelectorAll("[data-step]");
  const set = n => {
    box.dataset.n = n;
    v.querySelector("b").textContent = n;
    box.classList.toggle("is-on", n > 0);
    minus.disabled = n <= 0; plus.disabled = n >= SITE.cupsMax;
    v.classList.remove("bump"); void v.offsetWidth; v.classList.add("bump");
    box.dispatchEvent(new Event("cupschange"));
  };
  box.addEventListener("click", e => {
    const b = e.target.closest("[data-step]");
    if (b) set(Math.min(SITE.cupsMax, Math.max(0, cupsOf(box.dataset.cups) + Number(b.dataset.step))));
  });
  box.dataset.n = 0; minus.disabled = true;
});
const cupsLine = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "капкейк" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "капкейка" : "капкейков"}`;

const calc = { fill: 0, w: 2, addons: new Set() };
const calcFill = $("#calcFill"), calcDate = $("#calcDate"), corpusPick = $("#corpusPick");
const dateRu = v => v ? v.split("-").reverse().join(".") : "";
function renderCalc() {
  const cake = SITE.cakes[calc.fill];
  const cakeSum = cake.price * calc.w;
  const extras = [...calc.addons].map(k => SITE.addons[k]);
  const n = cupsOf("cake");
  if (n) extras.push({ name: cupsLine(n), price: n * SITE.cupcake });
  // корпусные: цена из прайса за упаковку (лимон — за 2 шт), счётчик считает упаковки
  const cn = cupsOf("corpus"), cp = SITE.corpus[Number(corpusPick.value)];
  if (cn) extras.push({ name: `Корпусный «${cp.name}» × ${cn}${cp.pack > 1 ? ` (по ${cp.pack} шт)` : ""}`, price: cn * cp.price });
  const total = cakeSum + extras.reduce((s, a) => s + a.price, 0);
  $("#calcTotal").textContent = fmt(total);
  $("#calcLine").textContent = `торт ${fmt(cakeSum)}` + extras.map(a => ` + ${a.name.toLowerCase()} ${fmt(a.price)}`).join("");
  $("#calcGuests").textContent = `≈ ${Math.round(calc.w * 5)}–${Math.round(calc.w * 6.5)} гостей`;
  const w = String(calc.w).replace(".", ",");
  const lines = [`Здравствуйте! Хочу торт:`, `• Начинка: ${cake.name}`, `• Вес: ${w} кг`];
  extras.forEach(a => lines.push(`• ${a.name} (+${fmt(a.price)})`));
  if (calc.when === "date" && calcDate.value) lines.push(`• Дата: ${dateRu(calcDate.value)}`);
  else if (calc.when && calc.when !== "date") lines.push(`• Когда: ${calc.when}`);
  lines.push(`Сумма по сайту: ${fmt(total)}. Подтвердите, пожалуйста, дату.`);
  $("#calcSend").href = waLink(lines.join("\n"));
}
$('[data-cups="cake"]').addEventListener("cupschange", () => renderCalc());
$('[data-cups="corpus"]').addEventListener("cupschange", () => renderCalc());
// выбрал вкус — сразу ставим 1 шт, иначе выбор ничего не меняет в сумме
corpusPick.addEventListener("change", () => {
  if (!cupsOf("corpus")) $('[data-cups="corpus"] [data-step="1"]').click(); else renderCalc();
});
$("#calcAddons").addEventListener("change", e => {
  const k = e.target.dataset.addon;
  if (!k) return;
  e.target.checked ? calc.addons.add(k) : calc.addons.delete(k);
  renderCalc();
});
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
// «Когда нужен торт» — необязательно: повторный клик снимает выбор, дата — только по «Выберу дату»
$("#calcWhen").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  calc.when = calc.when === b.dataset.when ? "" : b.dataset.when;
  $$("#calcWhen button").forEach(x => x.classList.toggle("is-on", x.dataset.when === calc.when));
  calcDate.hidden = calc.when !== "date";
  if (calc.when === "date") calcDate.focus();
  renderCalc();
});
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

// Плашка «Рассчитать» внизу не нужна, когда калькулятор уже на экране — и не закрывает его поля
const sticky = $(".sticky-cta");
new IntersectionObserver(([e]) => sticky.classList.toggle("is-away", e.isIntersecting), { threshold: .15 }).observe($("#calc"));

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
  const st = { size: "s", fill: Object.keys(B.fills)[0], color: "#fbf6ee", text: "С днём рождения!", addons: new Set() };
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
    const extras = [...st.addons].map(k => B.addons[k]);
    const n = cupsOf("bento");
    if (n) extras.push({ name: `${cupsLine(n)} в набор`, price: n * SITE.cupcake });
    const price = s.price + extras.reduce((sum, a) => sum + (a.price || 0), 0);
    cake.style.setProperty("--size", SCALE[st.size]);
    cake.style.setProperty("--cream", st.color);
    cake.classList.toggle("dark", st.color === "#6b4430");
    cake.classList.toggle("print", st.addons.has("print"));
    cakeText.textContent = st.text || " ";
    cakeText.style.fontSize = `clamp(15px, ${(st.text.length > 16 ? 2.4 : 3.4) * SCALE[st.size] / .68}vw, ${st.text.length > 16 ? 24 : 34}px)`;
    $("#sizeLabel").textContent = `${s.label} · ${s.weight}`;
    $("#fillDesc").textContent = f.desc ? `Состав: ${f.desc}` : "";
    $("#price").textContent = fmt(price);
    $("#sendBento").href = waLink(`Здравствуйте! Хочу бенто-торт:\n• Размер: ${s.label} (${s.weight})\n• Начинка: ${f.name}\n• Крем: ${COLOR_NAMES[st.color]}\n• Надпись: «${st.text}»` +
      extras.map(a => `\n• ${a.name}${a.price ? ` (+${fmt(a.price)})` : " — подскажите цену"}`).join("") +
      (st.addons.has("print") ? "\nКартинку для печати пришлю." : "") + `\nЦена на сайте: ${fmt(price)}. На какую дату можно?`);
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
  $('[data-cups="bento"]').addEventListener("cupschange", render);
  $("#bentoAddons").addEventListener("change", e => {
    const k = e.target.dataset.baddon;
    if (!k) return;
    e.target.checked ? st.addons.add(k) : st.addons.delete(k);
    render();
  });
  buildDeco();
  render();
}

// ---------- Выбор мессенджера: WhatsApp или MAX — для любого заказа и вопроса ----------
// WhatsApp подставляет текст сам; MAX по ссылке не умеет — копируем текст в буфер и открываем её чат.
// Все ссылки wa.me на странице (шапка, первый экран, калькулятор, бенто, контакты) открывают это окно.
let openSheet;
{
  const sheet = $("#askSheet"), hint = $("#askHint");
  let askText = "";
  openSheet = (text, ask) => {
    askText = text;
    $("#askText").textContent = text;
    $("#askTitle").innerHTML = ask ? "Где удобнее <em>спросить?</em>" : "Куда отправить <em>заказ?</em>";
    $("#askWa").href = waLink(text);
    hint.hidden = true;
    sheet.hidden = false;
    goal(ask ? "ask" : "order");
  };
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="https://wa.me"]');
    if (!a || a.id === "askWa") return;
    e.preventDefault();
    openSheet(new URL(a.href).searchParams.get("text") || "Здравствуйте!");
  });
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove(); return ok;
  };
  const close = () => { sheet.hidden = true; };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ask]");
    if (b) openSheet(b.dataset.ask, true);
  });
  $("#askWa").addEventListener("click", close);
  $("#askMax").addEventListener("click", async () => {
    // окно MAX открываем сразу в обработчике клика — после await браузер его заблокирует
    const copied = copy(askText);
    if (SITE.max) window.open(SITE.max, "_blank", "noopener");
    const ok = await copied;
    goal("ask_max");
    if (SITE.max) {
      hint.textContent = ok ? "Текст скопирован ✓ Вставьте его в чат и отправьте." : "Скопируйте сообщение выше и отправьте его в чат.";
    } else {
      hint.textContent = ok ? `Текст скопирован ✓ Откройте MAX, найдите ${SITE.phone} и вставьте сообщение.` : `Скопируйте сообщение выше и отправьте в MAX на ${SITE.phone}.`;
    }
    hint.hidden = false;
  });
  $("#askClose").addEventListener("click", close);
  sheet.addEventListener("click", e => { if (e.target === sheet) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });
}

// ---------- Cookie ----------
const cookie = $("#cookie");
if (!store.get("cookie")) cookie.hidden = false;
cookie.addEventListener("click", e => {
  const b = e.target.closest("[data-cookie]");
  if (!b) return;
  store.set("cookie", b.dataset.cookie);
  cookie.hidden = true;
  if (b.dataset.cookie === "all") loadMetrika();
});
