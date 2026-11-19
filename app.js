"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const storage = {
  read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* The controls remain usable when browser storage is unavailable. */ }
  }
};

const htmlChars = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => htmlChars[char]);
const icon = name => '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const external = (url, label, className = "") =>
  `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;

let language = storage.read("yonyou-language", "zh-Hans");
if (language !== "en-SG") language = "zh-Hans";

function t(key, values = {}) {
  const template = language === "en-SG" ? window.ENGLISH[key] ?? key : key;
  return template.replace(/\{(\w+)\}/g, (token, name) => values[name] ?? token);
}

// Capture authored text once. Updating the original nodes keeps controls and focus intact.
const staticTranslations = [];
const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (textWalker.nextNode()) {
  const node = textWalker.currentNode;
  const original = node.nodeValue;
  const key = original.trim();
  if (Object.hasOwn(window.ENGLISH, key)) {
    staticTranslations.push(() => { node.nodeValue = original.replace(key, () => t(key)); });
  }
}
const translatedAttributes = ["aria-label", "alt", "placeholder", "content"];
document.querySelectorAll("[aria-label], [alt], [placeholder], meta[name='description']").forEach(element => {
  translatedAttributes.forEach(attribute => {
    const key = element.getAttribute(attribute);
    if (key && Object.hasOwn(window.ENGLISH, key)) {
      staticTranslations.push(() => element.setAttribute(attribute, t(key)));
    }
  });
});

const nav = $("#nav");
const menuButton = $("#menu-toggle");
const pageIds = $$(".page").map(page => page.id);
let currentPage = "";
function setMenu(open) {
  nav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
}
menuButton.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    setMenu(false);
    menuButton.focus();
  }
});
function updateTitle() {
  const title = t("Yonyou Singapore 新人指南");
  const heading = $("h1", document.getElementById(currentPage));
  document.title = currentPage === "welcome" ? title : heading.textContent + " | " + title;
}
function showPage(focusHeading = false) {
  const hash = location.hash.slice(1);
  if (hash === "main" && currentPage) return;
  const id = pageIds.includes(hash) ? hash : "welcome";
  const page = document.getElementById(id);
  const changed = id !== currentPage;
  $$(".page").forEach(section => { section.hidden = section !== page; });
  $$("a", nav).forEach(link => {
    if (link.hash === "#" + id) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  setMenu(false);
  currentPage = id;
  const heading = $("h1", page);
  updateTitle();
  if (id === "welcome" && !document.documentElement.classList.contains("hero-visited")) {
    document.documentElement.classList.add("hero-visited");
    $(".hero-image").classList.add("hero-entrance");
    $(".level-marker").addEventListener("animationend", () => {
      $(".hero-image").classList.remove("hero-entrance");
    }, { once: true });
  }
  if (focusHeading && changed) {
    $("#toast")?.classList.remove("active");
    heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      if (currentPage !== id) return;
      heading.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    });
  }
}
window.addEventListener("hashchange", () => showPage(true));
window.addEventListener("popstate", () => showPage(true));
document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !pageIds.includes(link.hash.slice(1)) || event.defaultPrevented
      || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  if (link.hash !== location.hash) history.pushState(null, "", link.hash);
  const oldPage = currentPage;
  showPage(true);
  if (oldPage === currentPage) {
    $("h1", document.getElementById(currentPage)).focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
});
showPage();
if (location.hash && location.hash !== "#main") requestAnimationFrame(() => window.scrollTo(0, 0));

$$("[data-sign]").forEach(sign => {
  sign.setAttribute("aria-hidden", "true");
  sign.innerHTML = '<span class="sign-glow"></span><span class="sign-face"><span>YONYOU</span><span>SINGAPORE</span></span>';
});
const motionButton = $("#motion-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionPaused = storage.read("yonyou-motion-paused", false);
function updateMotion() {
  const paused = reducedMotion.matches || motionPaused;
  const label = t(reducedMotion.matches ? "系统已开启减少动态效果" : paused ? "恢复招牌动效" : "暂停招牌动效");
  document.documentElement.dataset.motion = paused ? "paused" : "running";
  if (paused) {
    $(".hero-image").classList.remove("hero-entrance");
    for (const element of $$("#floor-plate, .food-art, .poster-halo")) {
      element.getAnimations().forEach(animation => animation.cancel());
    }
  }
  motionButton.disabled = reducedMotion.matches;
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.setAttribute("aria-label", label);
  motionButton.title = label;
  motionButton.innerHTML = icon(paused ? "play" : "pause");
}
motionButton.addEventListener("click", () => {
  motionPaused = !motionPaused;
  storage.write("yonyou-motion-paused", motionPaused);
  updateMotion();
});
reducedMotion.addEventListener("change", updateMotion);
updateMotion();

const checklist = $$("input", $("#first-checklist"));
const checked = storage.read("yonyou-first-day", []);
checklist.forEach(item => { item.checked = Array.isArray(checked) && checked.includes(item.value); });
function updateChecklist(persist = false) {
  const values = checklist.filter(item => item.checked).map(item => item.value);
  $("#checklist-count").textContent = t("已完成 {count} / {total} 项", { count: values.length, total: checklist.length });
  $("#checklist-progress").value = values.length;
  if (persist) storage.write("yonyou-first-day", values);
}
const liftGuide = $("#lift-guide");
function setLift(level) {
  liftGuide.dataset.level = level;
  $$("[data-lift]", liftGuide).forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.lift === level));
  });
}
function checklistLevel(input) {
  return ["office", "face"].includes(input.value) ? "L10" : "L1";
}
liftGuide.addEventListener("click", event => {
  const button = event.target.closest("[data-lift]");
  if (button) setLift(button.dataset.lift);
});
$("#first-checklist").addEventListener("focusin", event => {
  if (checklist.includes(event.target)) setLift(checklistLevel(event.target));
});
$("#first-checklist").addEventListener("change", event => {
  setLift(checklistLevel(event.target));
  updateChecklist(true);
});
$("#checklist-reset").addEventListener("click", () => {
  checklist.forEach(item => { item.checked = false; });
  setLift("L1");
  updateChecklist(true);
});
updateChecklist();
const lastChecked = checklist.filter(item => item.checked).at(-1);
if (lastChecked) setLift(checklistLevel(lastChecked));

const toast = $("#toast");
let toastTimer;
function announce(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("active");
  toastTimer = setTimeout(() => toast.classList.remove("active"), 2800);
}
async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const copy = document.createElement("textarea");
    copy.value = value;
    copy.style.cssText = "position:fixed;left:0;top:0;opacity:0;pointer-events:none";
    document.body.append(copy);
    copy.select();
    let success = false;
    try { success = document.execCommand("copy"); }
    catch { /* Clipboard access may be restricted by the host. */ }
    copy.remove();
    button.focus({ preventScroll: true });
    if (!success) {
      announce(t("复制失败，请长按或选中文字复制。"));
      return;
    }
  }
  announce(t(button.dataset.feedback || "已复制"));
}
function copyButton(value, label, feedback) {
  return `<button type="button" class="button outline" data-copy="${escapeHtml(value)}" data-feedback="${escapeHtml(feedback)}">${icon("copy")}${escapeHtml(t(label))}</button>`;
}

const office = window.OFFICE;
const networks = office?.networks ?? [];
function renderNetworks() {
  $("#wifi-cards").innerHTML = networks.map(network =>
    `<article class="panel">
      <h3 class="wifi-heading">${icon("wifi")}${escapeHtml(t(network.label))}</h3>
      <div class="network-row"><b>${escapeHtml(network.name)}</b>${copyButton(network.name, "复制网络名称", "已复制网络名称")}</div>
      <p>${escapeHtml(t(network.passwordHelp))}</p>
    </article>`
  ).join("");
}

function imageButton(path, alt, title) {
  return `<button type="button" class="image-open" data-image="${escapeHtml(path)}" aria-label="${escapeHtml(t("放大查看 {title}", { title: t(title) }))}" data-image-title="${escapeHtml(t(title))}">
    <img src="${escapeHtml(path)}" alt="${escapeHtml(t(alt))}" loading="lazy">
    <span>${icon("zoom")}${escapeHtml(t("放大截图"))}</span>
  </button>`;
}
function renderSteps(steps, selector) {
  $(selector).innerHTML = steps.map(step =>
    `<li><div><h3>${escapeHtml(t(step.title))}</h3><p>${escapeHtml(t(step.text))}</p></div>
    ${step.image ? imageButton(step.image, step.alt, step.title) : ""}</li>`
  ).join("");
}
let printerIndex = 0;
function renderPrinter() {
  const printer = office.printers[printerIndex];
  $$("button", $("#printer-tabs")).forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === printerIndex));
  });
  $("#printer-spec").innerHTML = `<div><small>${t("设备")} · ${escapeHtml(t(printer.area))}</small><p class="printer-value">${escapeHtml(printer.name)}</p><p>${escapeHtml(t(printer.location))}</p></div>
    <div><small>${t("TCP/IP 地址")}</small><div class="network-row"><b>${escapeHtml(printer.ip)}</b>${copyButton(printer.ip, "复制地址", "已复制打印机地址")}</div></div>`;
  const steps = office.printerSteps.map((step, index) => index === 3
    ? { ...step, text: t(step.text) + " " + t("当前所选地址为 {address}。", { address: printer.ip }) }
    : step);
  renderSteps(steps, "#printer-steps");
}
function renderOffice() {
  if (!office) return;
  renderNetworks();
  $("#app-image").innerHTML = imageButton(office.appImage, "应用商店中红色图标及「友空间私有版」应用名称", "辨认友空间私有版");
  $("#leave-steps").textContent = office.leave.map(line => t(line)).join(" ");
  renderSteps(office.attendance, "#attendance-steps");
  $("#printer-tabs").innerHTML = office.printers.map((printer, index) =>
    `<button type="button" data-printer="${index}">${escapeHtml(t(printer.area))}</button>`
  ).join("");
  renderPrinter();
}
$("#printer-tabs").addEventListener("click", event => {
  const button = event.target.closest("[data-printer]");
  if (!button) return;
  printerIndex = Number(button.dataset.printer);
  renderPrinter();
});

const dialog = $("#image-dialog");
let imageTrigger;
let scrollBeforeDialog;
function openImage(button) {
  const image = $("img", dialog);
  image.src = button.dataset.image;
  image.alt = $("img", button).alt;
  $("#image-title").textContent = button.dataset.imageTitle;
  imageTrigger = button;
  scrollBeforeDialog = window.scrollY;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.style.overflow = "hidden";
}
$("#image-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  document.body.style.overflow = "";
  imageTrigger?.focus({ preventScroll: true });
  window.scrollTo(0, scrollBeforeDialog);
});
document.addEventListener("click", event => {
  const copy = event.target.closest("button[data-copy]");
  const image = event.target.closest("button[data-image]");
  if (copy) copyText(copy.dataset.copy, copy);
  if (image) openImage(image);
});

const indoorUrl = "https://maps.inmapz.com/suntec-city-mall-3484817437";
const mapSource = "https://suntec-res.com/portfolio/suntec-city/";
const layoutSource = "https://links.sgx.com/FileOpen/Suntec-FY2017%20Presentation.ashx?AnncID=G6G87R8XXHE1A79I&App=ArchiveAnnouncement&FileID=486210";
const featured = new Map(["Paradise Dynasty", "ASTONS Specialities", "Aburi-EN", "Food Republic"].map((name, index) => [name, index]));
const dining = [...(window.DINING ?? [])].sort((first, second) =>
  (featured.get(first.name) ?? featured.size) - (featured.get(second.name) ?? featured.size)
);
const categories = ["咖啡", "午餐·中餐", "午餐·西餐", "午餐·日本菜", "简餐", "甜品"];
const foodArt = {
  "": "coffee",
  "咖啡": "coffee",
  "午餐·中餐": "chinese",
  "午餐·西餐": "western",
  "午餐·日本菜": "japanese",
  "简餐": "quick-meals",
  "甜品": "desserts"
};
const filterTags = ["港式", "新加坡本地菜"];
const floors = ["B1", "L1", "L2", "L3", "L4"];
const zones = [
  { id: "east", name: "East Wing" },
  { id: "north", name: "North Wing" },
  { id: "west", name: "West Wing" },
  { id: "fountain", name: "Fountain Court" },
  { id: "other", name: "按铺位查找" }
];
const zoneId = restaurant => zones.find(zone => zone.name === restaurant.zone)?.id ?? "other";
const restaurantList = $("#restaurant-list");
const detail = $("#restaurant-detail");
const mapLayout = $("#map-layout");
const state = {
  category: "",
  tag: "",
  search: "",
  floor: "B1",
  lockedFloor: false,
  zone: "",
  selected: dining.find(restaurant => restaurant.name === "Paradise Dynasty") ?? dining[0],
  view: "map"
};

function filterButton(kind, value, label) {
  return `<button type="button" data-${kind}="${escapeHtml(value)}" aria-pressed="false">${escapeHtml(t(label))}</button>`;
}
function renderDiningControls() {
  $("#category-filters").innerHTML = filterButton("category", "", "全部")
    + categories.map(category => filterButton("category", category, category)).join("");
  $("#tag-filters").innerHTML = filterTags.map(tag => filterButton("tag", tag, tag)).join("");
  $("#floor-controls").innerHTML = floors.filter(floor => floor === "L1" || dining.some(restaurant => restaurant.floor === floor))
    .map(floor => filterButton("floor", floor, floor)).join("");
  $("#map-zones").innerHTML = zones.map(zone =>
    `<button type="button" class="zone-tile" style="--area:${zone.id}" data-zone="${zone.id}" aria-pressed="false">
      <b>${escapeHtml(t(zone.name))}</b><small></small>
    </button>`
  ).join("");
}

function baseMatches() {
  const search = state.search.toLowerCase().trim();
  return dining.filter(restaurant => {
    const matchesCategory = !state.category || restaurant.category === state.category;
    const matchesTag = !state.tag || restaurant.tags.includes(state.tag);
    const matchesSearch = !search || [restaurant.name, restaurant.unit, restaurant.zone, restaurant.note, window.ENGLISH[restaurant.note]].some(value => String(value ?? "").toLowerCase().includes(search));
    return matchesCategory && matchesTag && matchesSearch;
  });
}
function visibleRestaurants(base) {
  if (!state.zone) return base;
  return base.filter(restaurant => restaurant.floor === state.floor && zoneId(restaurant) === state.zone);
}
function selectRestaurant(restaurant) {
  state.selected = restaurant;
  if (restaurant) state.floor = restaurant.floor;
}
function routeText(restaurant) {
  const change = {
    B1: "按楼层标识下到 B1",
    L1: "留在 L1",
    L2: "按楼层标识上到 L2",
    L3: "按楼层标识上到 L3",
    L4: "按楼层标识上到 L4"
  };
  const area = restaurant.zone ? t("，找 {zone} 区域", { zone: restaurant.zone }) : "";
  return t("从 Suntec Tower 3 一楼大堂进入 Suntec City 商场，{change}{area}，按商场铺号找到 {unit}。", {
    change: change[restaurant.floor] ? t(change[restaurant.floor]) : t("前往 {floor}", { floor: restaurant.floor }),
    area,
    unit: restaurant.unit
  });
}
function mapsUrl(restaurant) {
  return "https://www.google.com/maps/dir/?" + new URLSearchParams({
    api: "1", origin: "Suntec Tower Three, Singapore",
    destination: restaurant.name + ", Suntec City Mall, " + restaurant.unit + ", Singapore", travelmode: "walking"
  });
}
function renderDetail(restaurant) {
  if (!restaurant) {
    detail.innerHTML = `<p class="panel">${t("当前楼层或筛选没有可显示的门店。可切换楼层、查看门店列表或调整筛选。")}</p>`;
    return;
  }
  const copyLocation = restaurant.name + " · Suntec City Mall · " + restaurant.unit + " · 3 Temasek Boulevard, Singapore 038983";
  detail.innerHTML = `<article class="panel restaurant-detail">
    <h2 tabindex="-1">${escapeHtml(restaurant.name)}</h2>
    <button class="button outline focus-map" type="button" data-focus-map>${t("在地图中定位")}</button>
    <div class="chips">${[restaurant.category, ...restaurant.tags].map(tag => "<span>" + escapeHtml(t(tag)) + "</span>").join("")}</div>
    <p class="unit-line"><strong>${escapeHtml(restaurant.floor)} · ${escapeHtml(restaurant.unit)}</strong>${restaurant.zone ? " · " + escapeHtml(restaurant.zone) : ""}${restaurant.note ? " · " + escapeHtml(t(restaurant.note)) : ""}</p>
    <p class="route">${escapeHtml(routeText(restaurant))}</p>
    <div>${external(indoorUrl, t("查看室内楼层图"), "button outline")}
    ${external(mapsUrl(restaurant), t("打开 Google Maps"), "button primary")}
    ${copyButton(copyLocation, "复制店名与地址", "已复制店名、地址和铺位")}</div>
    <details class="source-details"><summary>${t("来源与核对日期")}</summary>
    <p>${t("核对日期")} ${escapeHtml(restaurant.checked)} · ${external(restaurant.source, t("门店及铺位来源"))}${restaurant.zoneSource ? " · " + external(restaurant.zoneSource, t("门店区域来源")) : ""}</p>
    <p>${external(mapSource, t("商场分区资料"))} · ${external(layoutSource, t("Tower 3 与 East Wing 布局来源"))}</p></details>
  </article>`;
}
const poster = $("#lunch-poster");
const posterFood = $(".food-art", poster);
const posterHalo = $(".poster-halo", poster);
function updateLunchPoster() {
  const categoryChanged = poster.dataset.category !== state.category;
  poster.dataset.category = state.category;
  poster.dataset.food = foodArt[state.category];
  $("#poster-title").textContent = t(state.category || "午餐在 Suntec");
  const zone = state.selected?.zone;
  $("#poster-zone").textContent = zone || "";
  $("#poster-zone").hidden = !zone;
  if (!categoryChanged || currentPage !== "dining" || document.documentElement.dataset.motion !== "running") return;

  for (const element of [posterFood, posterHalo]) {
    element.getAnimations().forEach(animation => animation.cancel());
  }
  posterFood.animate([
    { transform: "translateY(6px) scale(.96)", opacity: .78 },
    { transform: "translateY(-8px) scale(1.02)", opacity: 1, offset: .48 },
    { transform: "translateY(0) scale(1)", opacity: 1 }
  ], { duration: 460, easing: "cubic-bezier(.21,.61,.35,1)" });
  posterHalo.animate([
    { transform: "scale(.8)", opacity: .3 },
    { transform: "scale(1)", opacity: .86, offset: .4 },
    { transform: "scale(1.28)", opacity: .3 }
  ], { duration: 520, easing: "ease-out" });
}

function renderDining({ list = true, preserveSelection = false } = {}) {
  const base = baseMatches();
  const restaurants = visibleRestaurants(base);
  if (!preserveSelection && !restaurants.includes(state.selected)) {
    if (state.lockedFloor) state.selected = restaurants.find(restaurant => restaurant.floor === state.floor);
    else selectRestaurant(restaurants.find(restaurant => restaurant.floor === state.floor) ?? restaurants[0]);
  }
  $$("[data-category]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === state.category)));
  $$("[data-tag]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.tag === state.tag)));
  $$("[data-floor]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.floor === state.floor)));
  $$(".view-toggle [data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
  mapLayout.dataset.view = state.view;
  $("#plate-label").textContent = state.floor;
  $(".mall-diagram").classList.toggle("has-destination", Boolean(state.selected));
  $$(".zone-tile").forEach(button => {
    const zone = button.dataset.zone;
    const matches = base.filter(restaurant => restaurant.floor === state.floor && zoneId(restaurant) === zone);
    $("small", button).textContent = t("{count} 家", { count: matches.length });
    button.setAttribute("aria-pressed", String(state.zone === zone));
    button.classList.toggle("is-current", state.selected?.floor === state.floor && zoneId(state.selected) === zone);
  });
  $("#result-count").textContent = t(restaurants.length === 1 ? "1 家门店" : "{count} 家门店", { count: restaurants.length }) + (state.zone ? " · " + state.floor : "");
  if (list) {
    restaurantList.innerHTML = restaurants.map(restaurant =>
      `<button type="button" class="restaurant-item" data-index="${dining.indexOf(restaurant)}" aria-pressed="false" aria-controls="restaurant-detail">
        <span><strong>${escapeHtml(restaurant.name)}</strong>
        <small>${[restaurant.category, ...restaurant.tags, restaurant.zone].filter(Boolean).map(value => escapeHtml(t(value))).join(" · ")}</small></span>
        <span class="restaurant-unit">${escapeHtml(restaurant.unit)}</span>
      </button>`
    ).join("") || `<p class="note">${t("没有符合筛选的门店。")}</p>`;
    restaurantList.scrollTop = 0;
  }
  $$(".restaurant-item", restaurantList).forEach(button => {
    button.setAttribute("aria-pressed", String(dining[Number(button.dataset.index)] === state.selected));
  });
  const selected = state.selected;
  const plate = $("#floor-plate");
  const destination = (selected ? selected.name + "|" + selected.unit : "") + "|" + state.floor;
  if (plate.dataset.destination !== destination) {
    plate.dataset.destination = destination;
    plate.getAnimations().forEach(animation => animation.cancel());
    if (document.documentElement.dataset.motion === "running" && currentPage === "dining") {
      plate.animate([
        { transform: "translateY(2px)" },
        { transform: "translateY(-5px)", offset: .55 },
        { transform: "translateY(0)" }
      ], { duration: 380, easing: "ease-out" });
    }
  }
  $("#map-current").innerHTML = selected
    ? `<div class="map-current"><strong>${escapeHtml(selected.floor)} · ${escapeHtml(selected.unit)}</strong>　${escapeHtml(selected.name)}</div>`
    : "";
  renderDetail(selected);
  updateLunchPoster();
}
$("#category-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  state.lockedFloor = false;
  state.zone = "";
  renderDining();
});
$("#tag-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-tag]");
  if (!button) return;
  state.tag = state.tag === button.dataset.tag ? "" : button.dataset.tag;
  state.lockedFloor = false;
  state.zone = "";
  renderDining();
});
$("#restaurant-search").addEventListener("input", event => {
  state.search = event.target.value;
  state.lockedFloor = false;
  state.zone = "";
  renderDining();
});
$("#floor-controls").addEventListener("click", event => {
  const button = event.target.closest("[data-floor]");
  if (!button) return;
  state.floor = button.dataset.floor;
  state.lockedFloor = true;
  state.zone = "";
  state.selected = baseMatches().find(restaurant => restaurant.floor === state.floor);
  renderDining();
});
$("#map-zones").addEventListener("click", event => {
  const button = event.target.closest("[data-zone]");
  if (!button) return;
  state.zone = state.zone === button.dataset.zone ? "" : button.dataset.zone;
  const showList = state.zone && window.matchMedia("(max-width: 640px)").matches;
  if (showList) state.view = "list";
  renderDining();
  if (showList) $(".view-toggle [data-view='list']").focus({ preventScroll: true });
});
$(".view-toggle").addEventListener("click", event => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  state.view = button.dataset.view;
  mapLayout.dataset.view = state.view;
  $$(".view-toggle [data-view]").forEach(toggle => toggle.setAttribute("aria-pressed", String(toggle === button)));
});
detail.addEventListener("click", event => {
  if (!event.target.closest("[data-focus-map]")) return;
  const mapToggle = $(".view-toggle [data-view='map']");
  mapToggle.click();
  mapToggle.focus({ preventScroll: true });
  $(".view-toggle").scrollIntoView({ block: "start" });
});
restaurantList.addEventListener("click", event => {
  const button = event.target.closest("[data-index]");
  if (!button) return;
  state.lockedFloor = false;
  selectRestaurant(dining[Number(button.dataset.index)]);
  renderDining({ list: false });
  if (window.matchMedia("(max-width: 640px)").matches) {
    $("h2", detail)?.focus({ preventScroll: true });
    detail.scrollIntoView({ block: "start" });
  }
});
function renderLanguage({ preserveSelection = false } = {}) {
  const scroll = restaurantList.scrollTop;
  const sourceOpen = $(".source-details", detail)?.open;
  const currentToast = toast.classList.contains("active");
  document.documentElement.lang = language;
  staticTranslations.forEach(update => update());
  $$("[data-language]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
  });
  updateTitle();
  updateMotion();
  updateChecklist();
  renderOffice();
  renderDiningControls();
  renderDining({ preserveSelection });
  restaurantList.scrollTop = scroll;
  if (sourceOpen && $(".source-details", detail)) $(".source-details", detail).open = true;
  if (currentToast) toast.classList.remove("active");
}
$(".language-toggle").addEventListener("click", event => {
  const button = event.target.closest("[data-language]");
  if (!button || button.dataset.language === language) return;
  language = button.dataset.language;
  storage.write("yonyou-language", language);
  renderLanguage({ preserveSelection: true });
});
renderLanguage();
