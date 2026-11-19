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
  document.title = id === "welcome" ? "Yonyou Singapore 新人指南" : heading.textContent + " | Yonyou Singapore 新人指南";
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

const mobileSign = document.createElement("div");
mobileSign.className = "sign sign-hero-top";
mobileSign.dataset.sign = "";
$(".hero-copy").prepend(mobileSign);
$$("[data-sign]").forEach(sign => {
  sign.setAttribute("aria-hidden", "true");
  sign.innerHTML = '<span class="sign-glow"></span><span class="sign-face"><span>YONYOU</span><span>SINGAPORE</span></span>';
});
const motionButton = $("#motion-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionPaused = storage.read("yonyou-motion-paused", false);
function updateMotion() {
  const paused = reducedMotion.matches || motionPaused;
  const label = reducedMotion.matches ? "系统已开启减少动态效果" : paused ? "恢复招牌动效" : "暂停招牌动效";
  document.documentElement.dataset.motion = paused ? "paused" : "running";
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
  $("#checklist-count").textContent = "已完成 " + values.length + " / " + checklist.length + " 项";
  $("#checklist-progress").value = values.length;
  if (persist) storage.write("yonyou-first-day", values);
}
$("#first-checklist").addEventListener("change", () => updateChecklist(true));
$("#checklist-reset").addEventListener("click", () => {
  checklist.forEach(item => { item.checked = false; });
  updateChecklist(true);
});
updateChecklist();

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
      announce("复制失败，请长按或选中文字复制。");
      return;
    }
  }
  announce(button.dataset.feedback || "已复制");
}
function copyButton(value, label, feedback) {
  return `<button type="button" class="button outline" data-copy="${escapeHtml(value)}" data-feedback="${escapeHtml(feedback)}">${icon("copy")}${escapeHtml(label)}</button>`;
}

const office = window.OFFICE;
const networks = office?.networks ?? [];
$("#wifi-cards").innerHTML = networks.map(network =>
  `<article class="panel">
    <h3 class="wifi-heading">${icon("wifi")}${escapeHtml(network.label)}</h3>
    <div class="network-row"><b>${escapeHtml(network.name)}</b>${copyButton(network.name, "复制网络名称", "已复制网络名称")}</div>
    <p>${escapeHtml(network.passwordHelp)}</p>
  </article>`
).join("");

function imageButton(path, alt, title) {
  return `<button type="button" class="image-open" data-image="${escapeHtml(path)}" aria-label="${escapeHtml("放大查看 " + title)}" data-image-title="${escapeHtml(title)}">
    <img src="${escapeHtml(path)}" alt="${escapeHtml(alt)}" loading="lazy">
    <span>${icon("zoom")}放大截图</span>
  </button>`;
}
function renderSteps(steps, selector) {
  $(selector).innerHTML = steps.map(step =>
    `<li><div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div>
    ${step.image ? imageButton(step.image, step.alt, step.title) : ""}</li>`
  ).join("");
}
let printerIndex = 0;
function renderPrinter() {
  const printer = office.printers[printerIndex];
  $$("button", $("#printer-tabs")).forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === printerIndex));
  });
  $("#printer-spec").innerHTML = `<div><small>设备 · ${escapeHtml(printer.area)}</small><p class="printer-value">${escapeHtml(printer.name)}</p><p>${escapeHtml(printer.location)}</p></div>
    <div><small>TCP/IP 地址</small><div class="network-row"><b>${escapeHtml(printer.ip)}</b>${copyButton(printer.ip, "复制地址", "已复制打印机地址")}</div></div>`;
  const steps = office.printerSteps.map((step, index) => index === 3
    ? { ...step, text: step.text + " 当前所选地址为 " + printer.ip + "。" }
    : step);
  renderSteps(steps, "#printer-steps");
}
if (office) {
  $("#app-image").innerHTML = imageButton(office.appImage, "应用商店中红色图标及「友空间私有版」应用名称", "辨认友空间私有版");
  $("#leave-steps").textContent = Array.isArray(office.leave) ? office.leave.join(" ") : office.leave;
  renderSteps(office.attendance, "#attendance-steps");
  $("#printer-tabs").innerHTML = office.printers.map((printer, index) =>
    `<button type="button" data-printer="${index}">${escapeHtml(printer.area)}</button>`
  ).join("");
  $("#printer-tabs").addEventListener("click", event => {
    const button = event.target.closest("[data-printer]");
    if (!button) return;
    printerIndex = Number(button.dataset.printer);
    renderPrinter();
  });
  renderPrinter();
}

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
  return `<button type="button" data-${kind}="${escapeHtml(value)}" aria-pressed="false">${escapeHtml(label)}</button>`;
}
$("#category-filters").innerHTML = filterButton("category", "", "全部")
  + categories.map(category => filterButton("category", category, category)).join("");
$("#tag-filters").innerHTML = filterTags.map(tag => filterButton("tag", tag, tag)).join("");
$("#floor-controls").innerHTML = floors.filter(floor => floor === "L1" || dining.some(restaurant => restaurant.floor === floor))
  .map(floor => filterButton("floor", floor, floor)).join("");
$("#map-zones").innerHTML = zones.map(zone =>
  `<button type="button" class="zone-tile" style="--area:${zone.id}" data-zone="${zone.id}" aria-pressed="false">
    <b>${escapeHtml(zone.name)}</b><small></small>
  </button>`
).join("");

function baseMatches() {
  const search = state.search.toLowerCase().trim();
  return dining.filter(restaurant => {
    const matchesCategory = !state.category || restaurant.category === state.category;
    const matchesTag = !state.tag || restaurant.tags.includes(state.tag);
    const matchesSearch = !search || [restaurant.name, restaurant.unit, restaurant.zone, restaurant.note].some(value => String(value ?? "").toLowerCase().includes(search));
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
  const area = restaurant.zone ? "，找 " + restaurant.zone + " 区域" : "";
  return "从 Suntec Tower 3 一楼大堂进入 Suntec City 商场，" + (change[restaurant.floor] ?? "前往 " + restaurant.floor)
    + area + "，按商场铺号找到 " + restaurant.unit + "。";
}
function mapsUrl(restaurant) {
  return "https://www.google.com/maps/dir/?" + new URLSearchParams({
    api: "1", origin: "Suntec Tower Three, Singapore",
    destination: restaurant.name + ", Suntec City Mall, " + restaurant.unit + ", Singapore", travelmode: "walking"
  });
}
function renderDetail(restaurant) {
  if (!restaurant) {
    detail.innerHTML = '<p class="panel">当前楼层或筛选没有可显示的门店。可切换楼层、查看门店列表或调整筛选。</p>';
    return;
  }
  const copyLocation = restaurant.name + " · Suntec City Mall · " + restaurant.unit + " · 3 Temasek Boulevard, Singapore 038983";
  detail.innerHTML = `<article class="panel restaurant-detail">
    <h2 tabindex="-1">${escapeHtml(restaurant.name)}</h2>
    <button class="button outline focus-map" type="button" data-focus-map>在地图中定位</button>
    <div class="chips">${[restaurant.category, ...restaurant.tags].map(tag => "<span>" + escapeHtml(tag) + "</span>").join("")}</div>
    <p class="unit-line"><strong>${escapeHtml(restaurant.floor)} · ${escapeHtml(restaurant.unit)}</strong>${restaurant.zone ? " · " + escapeHtml(restaurant.zone) : ""}${restaurant.note ? " · " + escapeHtml(restaurant.note) : ""}</p>
    <p class="route">${escapeHtml(routeText(restaurant))}</p>
    <div>${external(indoorUrl, "查看室内楼层图", "button outline")}
    ${external(mapsUrl(restaurant), "打开 Google Maps", "button primary")}
    ${copyButton(copyLocation, "复制店名与地址", "已复制店名、地址和铺位")}</div>
    <details class="source-details"><summary>来源与核对日期</summary>
    <p>核对日期 ${escapeHtml(restaurant.checked)} · ${external(restaurant.source, "门店及铺位来源")}${restaurant.zoneSource ? " · " + external(restaurant.zoneSource, "门店区域来源") : ""}</p>
    <p>${external(mapSource, "商场分区资料")} · ${external(layoutSource, "Tower 3 与 East Wing 布局来源")}</p></details>
  </article>`;
}
function renderDining({ list = true } = {}) {
  const base = baseMatches();
  const restaurants = visibleRestaurants(base);
  if (!restaurants.includes(state.selected)) {
    if (state.lockedFloor) state.selected = restaurants.find(restaurant => restaurant.floor === state.floor);
    else selectRestaurant(restaurants.find(restaurant => restaurant.floor === state.floor) ?? restaurants[0]);
  }
  $$("[data-category]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === state.category)));
  $$("[data-tag]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.tag === state.tag)));
  $$("[data-floor]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.floor === state.floor)));
  $$(".view-toggle [data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
  mapLayout.dataset.view = state.view;
  $$(".zone-tile").forEach(button => {
    const zone = button.dataset.zone;
    const matches = base.filter(restaurant => restaurant.floor === state.floor && zoneId(restaurant) === zone);
    $("small", button).textContent = matches.length + " 家";
    button.setAttribute("aria-pressed", String(state.zone === zone));
    button.classList.toggle("is-current", state.selected?.floor === state.floor && zoneId(state.selected) === zone);
  });
  $("#result-count").textContent = restaurants.length + " 家门店" + (state.zone ? " · " + state.floor : "");
  if (list) {
    restaurantList.innerHTML = restaurants.map(restaurant =>
      `<button type="button" class="restaurant-item" data-index="${dining.indexOf(restaurant)}" aria-pressed="false" aria-controls="restaurant-detail">
        <span><strong>${escapeHtml(restaurant.name)}</strong>
        <small>${[restaurant.category, ...restaurant.tags, restaurant.zone].filter(Boolean).map(escapeHtml).join(" · ")}</small></span>
        <span class="restaurant-unit">${escapeHtml(restaurant.unit)}</span>
      </button>`
    ).join("") || '<p class="note">没有符合筛选的门店。</p>';
    restaurantList.scrollTop = 0;
  }
  $$(".restaurant-item", restaurantList).forEach(button => {
    button.setAttribute("aria-pressed", String(dining[Number(button.dataset.index)] === state.selected));
  });
  const selected = state.selected;
  $("#map-current").innerHTML = selected
    ? `<div class="map-current"><strong>${escapeHtml(selected.floor)} · ${escapeHtml(selected.unit)}</strong>　${escapeHtml(selected.name)}</div>`
    : "";
  renderDetail(selected);
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
renderDining();



