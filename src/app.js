import ENTRIES from "./data/entries.json";
import GUIDES from "./data/guides.json";
import qrcode from "qrcode-generator";
import { getReply, redact, filterEntryIds } from "./assistant.js";


"use strict";
const byId = Object.fromEntries(ENTRIES.map(e => [e.id, e]));

const ICONS = {
  health: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  government: '<path d="M4 9.5 12 5l8 4.5M5.5 10v8M10 10v8M14 10v8M18.5 10v8M4 19h16"/>',
  education: '<path d="M12 7c-2-1.4-4.5-1.8-7-1.5v12c2.5-.3 5 .1 7 1.5 2-1.4 4.5-1.8 7-1.5v-12c-2.5-.3-5 .1-7 1.5zM12 7v12"/>',
  money: '<rect x="3.5" y="6.5" width="17" height="11" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9.75h.01M17 14.25h.01"/>',
  food: '<path d="M4 11h16a8 8 0 0 1-16 0zM9 19.5h6M9.5 4c0 1.5 1.2 1.5 1.2 3M13.5 4c0 1.5 1.2 1.5 1.2 3"/>',
  shopping: '<path d="M6 8h12l1 12H5L6 8zM9 8V7a3 3 0 0 1 6 0v1"/>',
  stay: '<path d="M3.5 18.5v-10M3.5 14.5h17v4M20.5 14.5V13a3 3 0 0 0-3-3H10.5v4.5"/><circle cx="6.9" cy="11.6" r="1.4"/>',
  worship: '<path d="M5 20v-7a7 7 0 0 1 14 0v7M3.5 20h17M12 6V3.5M10 20v-4a2 2 0 0 1 4 0v4"/>',
  transport: '<rect x="5" y="4" width="14" height="13" rx="3"/><path d="M5 11h14M8 17v2.5M16 17v2.5M8.5 14h.01M15.5 14h.01"/>',
  leisure: '<path d="M12 21v-6M12 15a5 5 0 0 1-4.6-7A4.5 4.5 0 0 1 12 3a4.5 4.5 0 0 1 4.6 5A5 5 0 0 1 12 15z"/>',
  community: '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 6.5a3 3 0 0 1 0 5.5M17 14.2a5.5 5.5 0 0 1 3.5 4.8"/>',
  other: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
  all: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  chat: '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V16A2.5 2.5 0 0 1 5 13.5v-7z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>',
  qr: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><path d="M14 14h2.5v2.5H14zM20 14h.01M20 17.5V20h-2.5M14 20h.01"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>'
};
function icon(name) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "ico");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = ICONS[name] || ICONS.other;
  return s;
}

const CATS = {
  health: ["Health", "Kesihatan"],
  government: ["Government", "Kerajaan"],
  education: ["Education", "Pendidikan"],
  money: ["Banks", "Bank"],
  food: ["Food", "Makan"],
  shopping: ["Shopping", "Beli-belah"],
  stay: ["Hotels", "Hotel"],
  worship: ["Worship", "Ibadat"],
  transport: ["Transport", "Pengangkutan"],
  leisure: ["Leisure", "Riadah"],
  community: ["Community", "Komuniti"],
  other: ["Other", "Lain-lain"]
};
const KINDS_MS = {
  "hospital": "Hospital", "clinic": "Klinik", "dentist": "Klinik gigi", "dental office": "Pejabat pergigian",
  "pharmacy": "Farmasi", "health office": "Pejabat kesihatan", "veterinary office": "Pejabat veterinar",
  "council": "Majlis perbandaran", "government office": "Pejabat kerajaan", "police": "Polis",
  "fire station": "Balai bomba", "post office": "Pejabat pos", "utility": "Utiliti", "university": "Universiti",
  "college": "Kolej", "secondary school": "Sekolah menengah", "primary school": "Sekolah rendah",
  "religious school": "Sekolah agama", "kindergarten": "Tabika", "driving school": "Sekolah memandu",
  "special centre": "Pusat khas", "bank": "Bank", "food court": "Medan selera", "restaurant": "Restoran",
  "cafe": "Kafe", "bakery": "Kedai roti", "market": "Pasar", "supermarket": "Pasar raya",
  "convenience": "Kedai serbaneka", "hotel": "Hotel", "mosque": "Masjid", "surau": "Surau", "temple": "Kuil",
  "gurdwara": "Gurdwara", "church": "Gereja", "bus station": "Stesen bas", "fuel": "Stesen minyak",
  "sight": "Tempat menarik", "river cruise": "Pelayaran sungai", "park": "Taman", "stadium": "Stadium",
  "cinema": "Pawagam", "hall": "Dewan", "library": "Perpustakaan"
};
const USED_CATS = Object.keys(CATS).filter(c => ENTRIES.some(e => e.category === c));
const STARTER_ICONS = ["health", "education", "education", "other", "government"];

const N = ENTRIES.length;
const T = {
  en: {
    tabAsk: "Ask", tabDirectory: "Directory", tabInsights: "Insights", tabScan: "Scan",
    scanTitle: "Scan to open TanyaLokal",
    scanLede: "Show this screen on a phone or a counter display. Scanning the code opens the Ask screen.",
    qrMissing: "The QR code couldn’t be drawn in this view. Share the link instead.",
    qrAlt: "QR code that opens",
    heroTitle: "Ask anything about Teluk Intan.",
    heroSub: "Answers come only from a list of " + N + " places in town.",
    topicsTitle: "Browse by topic",
    startersTitle: "Try asking",
    starters: [
      "Where can I get a root canal done?",
      "How do I apply for a school scholarship?",
      "Help me draft a university application letter",
      "Where can I get a foot massage?",
      "The road outside my house has a big pothole. Who do I tell?"
    ],
    placeholder: "Ask about Teluk Intan",
    send: "Send", stop: "Stop",
    fineVisit: "Demo replies from the supplied directory, without live AI. Questions stay in this visit only.",
    thinking: "Thinking…",
    stopped: "Stopped.",
    sourceLine: "From OpenStreetMap or Wikipedia. Not checked yet, so call before you go.",
    call: "Call", map: "Map",
    errUnavailable: "The assistant can’t run in this view. You can still browse the Directory.",
    errRate: "Too many questions at once. Wait a moment, then send it again.",
    errGeneric: "The answer didn’t arrive. Send your question again.",
    dirTitle: "Directory",
    dirLede: N + " places and services the assistant is allowed to recommend.",
    dirNotice: "None of these has been checked yet. Names, addresses and hours may be out of date.",
    searchPh: "Search by name, street or type",
    all: "All",
    countOne: "1 place", countMany: "{n} places",
    dirEmpty: "Nothing matches. Clear the search or pick another category.",
    attribution: "Place data © OpenStreetMap contributors (ODbL), with some names from Wikipedia.",
    insTitle: "What residents are asking",
    insLedeVisit: "Preview activity from this visit only. Questions are redacted in this view and disappear on reload. These are not town-wide statistics or submitted reports.",
    clear: "Clear this visit’s insights", clearConfirm: "Tap again to delete everything",
    insEmpty: "No questions yet. Ask one in the Ask tab and it shows up here.",
    statQ: "Questions", statGap: "No local answer", statIssue: "Problems mentioned",
    insByTopic: "By topic",
    insGaps: "No local answer yet",
    insGapsHint: "Each of these is something to add to the directory.",
    insIssues: "Problems mentioned",
    insIssuesHint: "For this preview only. Nothing is sent to an authority.",
    none: "None so far."
  },
  ms: {
    tabAsk: "Tanya", tabDirectory: "Direktori", tabInsights: "Laporan", tabScan: "Imbas",
    scanTitle: "Imbas untuk buka TanyaLokal",
    scanLede: "Tunjukkan skrin ini pada telefon atau paparan kaunter. Mengimbas kod akan membuka skrin Tanya.",
    qrMissing: "Kod QR tidak dapat dilukis dalam paparan ini. Kongsi pautan itu sahaja.",
    qrAlt: "Kod QR yang membuka",
    heroTitle: "Tanya apa saja pasal Teluk Intan.",
    heroSub: "Jawapan datang daripada senarai " + N + " tempat di bandar ini sahaja.",
    topicsTitle: "Lihat ikut topik",
    startersTitle: "Cuba tanya",
    starters: [
      "Di mana boleh buat rawatan akar gigi?",
      "Macam mana nak mohon biasiswa sekolah?",
      "Tolong draf surat permohonan universiti",
      "Urut kaki dekat mana?",
      "Jalan depan rumah saya berlubang besar. Nak adu pada siapa?"
    ],
    placeholder: "Tanya pasal Teluk Intan",
    send: "Hantar", stop: "Berhenti",
    fineVisit: "Jawapan demo daripada direktori, tanpa AI langsung. Soalan kekal untuk lawatan ini sahaja.",
    thinking: "Sedang berfikir…",
    stopped: "Dihentikan.",
    sourceLine: "Daripada OpenStreetMap atau Wikipedia. Belum disemak, jadi telefon dahulu sebelum pergi.",
    call: "Telefon", map: "Peta",
    errUnavailable: "Pembantu tidak dapat berjalan dalam paparan ini. Anda masih boleh melihat Direktori.",
    errRate: "Terlalu banyak soalan serentak. Tunggu sebentar, kemudian hantar semula.",
    errGeneric: "Jawapan tidak sampai. Hantar soalan anda sekali lagi.",
    dirTitle: "Direktori",
    dirLede: N + " tempat dan perkhidmatan yang boleh dicadangkan oleh pembantu.",
    dirNotice: "Semua ini belum disemak. Nama, alamat dan waktu operasi mungkin sudah berubah.",
    searchPh: "Cari nama, jalan atau jenis",
    all: "Semua",
    countOne: "1 tempat", countMany: "{n} tempat",
    dirEmpty: "Tiada padanan. Kosongkan carian atau pilih kategori lain.",
    attribution: "Data tempat © penyumbang OpenStreetMap (ODbL), dengan beberapa nama daripada Wikipedia.",
    insTitle: "Apa yang penduduk tanya",
    insLedeVisit: "Aktiviti pratonton untuk lawatan ini sahaja. Maklumat hubungan dibuang dalam paparan ini; soalan hilang apabila dimuat semula. Ini bukan statistik seluruh bandar atau laporan rasmi.",
    clear: "Padam laporan lawatan ini", clearConfirm: "Tekan sekali lagi untuk padam semua",
    insEmpty: "Belum ada soalan. Tanya satu di tab Tanya dan ia akan muncul di sini.",
    statQ: "Soalan", statGap: "Tiada jawapan tempatan", statIssue: "Masalah disebut",
    insByTopic: "Mengikut topik",
    insGaps: "Belum ada jawapan tempatan",
    insGapsHint: "Setiap satu ialah perkara untuk ditambah ke direktori.",
    insIssues: "Masalah yang disebut",
    insIssuesHint: "Untuk pratonton sahaja. Tiada aduan dihantar kepada pihak berkuasa.",
    none: "Belum ada."
  }
};

let lang = (navigator.language || "en").toLowerCase().startsWith("ms") ? "ms" : "en";
const t = k => (T[lang][k] !== undefined ? T[lang][k] : T.en[k]);
const catLabel = c => (CATS[c] || CATS.other)[lang === "ms" ? 1 : 0];
const kindLabel = k => {
  if (lang === "ms" && KINDS_MS[k]) return KINDS_MS[k];
  return k.charAt(0).toUpperCase() + k.slice(1);
};
const $ = id => document.getElementById(id);
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ---------- Place cards ---------- */
function placeCard(e, variant) {
  const li = el("li", "pcard " + variant);
  const art = el("div", "pcard-art");
  art.append(icon(e.category));
  const body = el("div", "pcard-body");
  body.append(el("p", "pcard-name", e.name));
  body.append(el("p", "pcard-meta", [kindLabel(e.kind), e.address].filter(Boolean).join(", ")));
  if (e.hours) body.append(el("p", "pcard-hours", e.hours));
  if (e.note) body.append(el("p", "pcard-note", e.note));
  body.append(el("p", "pcard-check", lang === "ms" ? "Belum disemak · Telefon dahulu" : "Not checked yet · Call first"));
  const actions = el("div", "pcard-actions");
  if (e.phone) {
    const a = el("a", "pill");
    a.append(icon("phone"), el("span", "", variant === "tile" ? t("call") : e.phone));
    a.href = "tel:" + e.phone.replace(/[^+\d]/g, "");
    a.setAttribute("aria-label", t("call") + " " + e.phone);
    actions.append(a);
  }
  if (e.lat !== null && e.lon !== null) {
    const a = el("a", "pill");
    a.append(icon("pin"), el("span", "", t("map")));
    a.href = "https://www.google.com/maps/search/?api=1&query=" + e.lat + "," + e.lon;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    actions.append(a);
  }
  if (actions.children.length) body.append(actions);
  li.append(art, body);
  return li;
}

/* ---------- Directory ---------- */
let dirCat = "all";
function renderCats() {
  const wrap = $("cats");
  wrap.textContent = "";
  for (const c of ["all"].concat(USED_CATS)) {
    const b = el("button");
    b.type = "button";
    b.append(icon(c), el("span", "", c === "all" ? t("all") : catLabel(c)));
    b.setAttribute("aria-pressed", String(c === dirCat));
    b.addEventListener("click", () => { dirCat = c; renderCats(); renderDir(); });
    wrap.append(b);
  }
}
function renderDir() {
  const q = $("search").value.trim().toLowerCase();
  const list = ENTRIES.filter(e => {
    if (dirCat !== "all" && e.category !== dirCat) return false;
    if (!q) return true;
    const hay = [e.name, e.address, e.kind, KINDS_MS[e.kind] || "", e.note, catLabel(e.category)].join(" ").toLowerCase();
    return q.split(/\s+/).every(w => hay.includes(w));
  });
  const ul = $("dir-list");
  ul.textContent = "";
  for (const e of list) ul.append(placeCard(e, "row"));
  ul.hidden = list.length === 0;
  $("dir-empty").hidden = list.length !== 0;
  $("count").textContent = list.length === 1 ? t("countOne") : t("countMany").replace("{n}", list.length);
}
function renderTopics() {
  const wrap = $("topics");
  wrap.textContent = "";
  for (const c of USED_CATS) {
    const b = el("button", "topic");
    b.type = "button";
    const tile = el("span", "topic-ico");
    tile.append(icon(c));
    b.append(tile, el("span", "", catLabel(c)));
    b.addEventListener("click", () => {
      dirCat = c;
      $("search").value = "";
      renderCats();
      renderDir();
      location.hash = "directory";
    });
    wrap.append(b);
  }
}

/* ---------- Insights: this visit only; no resident data is transmitted. ---------- */
const log = [];
function insightData() { return log; }
function renderInsights() {
  const data = insightData();
  const has = data.length > 0;
  $("ins-empty").hidden = has;
  $("ins-body").hidden = !has;
  if (!has) return;
  const gaps = data.filter(x => x.answered === "no");
  const issues = data.filter(x => x.issue);
  $("st-q").textContent = String(data.length);
  $("st-gap").textContent = String(gaps.length);
  $("st-issue").textContent = String(issues.length);

  const counts = {};
  for (const x of data) counts[x.category] = (counts[x.category] || 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = rows[0][1];
  const bars = $("ins-bars");
  bars.textContent = "";
  for (const [c, n] of rows) {
    const r = el("div", "bar-row");
    const track = el("div", "bar-track");
    const bar = el("div", "bar");
    bar.style.width = Math.round((n / max) * 100) + "%";
    track.append(bar);
    r.append(icon(c), el("span", "", catLabel(c)), track, el("span", "bar-n", String(n)));
    bars.append(r);
  }
  const day = x => (x.t ? ", " + new Date(x.t).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", { day: "numeric", month: "short" }) : "");
  fillList($("ins-gaps"), gaps.map(x => ({ main: x.q, sub: catLabel(x.category) + day(x) })));
  fillList($("ins-issues"), issues.map(x => ({ main: x.issue, sub: x.q })));
}
function fillList(ul, items) {
  ul.textContent = "";
  if (!items.length) { ul.append(el("li", "", t("none"))); return; }
  for (const it of items) {
    const li = el("li", "", it.main);
    if (it.sub) li.append(el("span", "sub", it.sub));
    ul.append(li);
  }
}
function updateStoreUi() {
  $("fineprint").textContent = t("fineVisit");
  $("ins-lede").textContent = t("insLedeVisit");
  $("ins-note").hidden = true;
  $("ins-clear").hidden = log.length === 0;
  if (!$("ins-clear").dataset.armed) $("ins-clear").textContent = t("clear");
  renderInsights();
}
function record(entry) {
  log.push({ ...entry, q: redact(entry.q), issue: entry.issue ? redact(entry.issue) : null });
  if (log.length > 150) log.shift();
  updateStoreUi();
}
function clearSaved() {
  const btn = $("ins-clear");
  if (!btn.dataset.armed) {
    btn.dataset.armed = "1";
    btn.textContent = t("clearConfirm");
    setTimeout(() => { delete btn.dataset.armed; btn.textContent = t("clear"); }, 4000);
    return;
  }
  delete btn.dataset.armed;
  log.length = 0;
  updateStoreUi();
}

/* ---------- Deterministic demo assistant; no model or API key. ---------- */
let busy = false;
let ctl = null;
function scrollDown() {
  const th = $("thread");
  th.scrollTop = th.scrollHeight;
}
function setBusy(on) {
  busy = on;
  const b = $("send");
  b.replaceChildren(icon(on ? "stop" : "send"));
  b.setAttribute("aria-label", on ? t("stop") : t("send"));
  b.classList.toggle("stop", on);
  b.disabled = false;
  $("box").disabled = false;
}
function addBot() {
  const wrap = el("div", "msg-bot pending");
  const bubble = el("div", "bubble");
  const body = el("p", "body", t("thinking"));
  bubble.append(body);
  wrap.append(bubble);
  $("msgs").append(wrap);
  scrollDown();
  return { wrap: wrap, bubble: bubble, body: body };
}

async function ask(raw) {
  const text = raw.trim().slice(0, 600);
  if (!text || busy) return;
  $("hero").hidden = true;
  const mine = el("div", "msg-user", text);
  $("msgs").append(mine);
  setBusy(true);
  const node = addBot();
  ctl = new AbortController();
  const signal = ctl.signal;
  try {
    const out = getReply(text, { entries: ENTRIES, guides: GUIDES, lang });
    // Animate a deterministic local reply. This is not network/model streaming.
    const chunks = out.body.match(/.{1,36}(?:\s|$)|.{1,36}/gs) || [out.body];
    node.body.textContent = "";
    node.wrap.classList.remove("pending");
    for (const chunk of chunks) {
      if (signal.aborted) throw new DOMException("Stopped", "AbortError");
      node.body.textContent += chunk;
      scrollDown();
      await new Promise(resolve => setTimeout(resolve, 12));
    }
    const ids = filterEntryIds(out.meta.ids, ENTRIES);
    if (ids.length) {
      const ul = el("ul", "scroller carousel");
      for (const id of ids) ul.append(placeCard(byId[id], "tile"));
      node.wrap.append(ul, el("p", "source-line", t("sourceLine")));
    }
    record({ t: Date.now(), q: redact(text).slice(0,200), ...out.meta });
  } catch (error) {
    node.wrap.classList.remove("pending");
    node.body.textContent = error.name === "AbortError" ? t("stopped") : t("errGeneric");
  } finally {
    ctl = null;
    setBusy(false);
    mine.scrollIntoView({ block: "start" });
  }
}

/* ---------- QR opens this deployment, never a third-party artifact. ---------- */
function drawQr(link) {
  const box = $("qr-box");
  box.textContent = "";
  $("qr-link-text").textContent = link;
  if (typeof qrcode !== "function") { box.append(el("p", "qr-missing", t("qrMissing"))); return; }
  let qr;
  try {
    qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();
  } catch (err) { box.append(el("p", "qr-missing", t("qrMissing"))); return; }
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += "M" + c + " " + r + "h1v1h-1z";
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "-4 -4 " + (n + 8) + " " + (n + 8));
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", t("qrAlt") + " " + link);
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "#111111");
  svg.append(path);
  box.append(svg);
}
function renderScan() {
  drawQr(new URL("/teluk-intan?src=scan-screen", location.origin).href);
}
/* ---------- Wiring ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  $("hero-sub").textContent = t("heroSub");
  $("dir-lede").textContent = t("dirLede");
  $("ins-empty").textContent = t("insEmpty");
  $("dir-empty").textContent = t("dirEmpty");
  $("box").placeholder = t("placeholder");
  $("box").setAttribute("aria-label", t("placeholder"));
  $("search").placeholder = t("searchPh");
  $("search").setAttribute("aria-label", t("searchPh"));
  $("send").setAttribute("aria-label", busy ? t("stop") : t("send"));
  const st = $("starters");
  st.textContent = "";
  t("starters").forEach((q, i) => {
    const li = el("li");
    const b = el("button");
    b.type = "button";
    const tile = el("span", "starter-ico");
    tile.append(icon(STARTER_ICONS[i] || "other"));
    b.append(tile, el("span", "", q));
    b.addEventListener("click", () => ask(q));
    li.append(b);
    st.append(li);
  });
  renderTopics();
  renderCats();
  renderDir();
  renderScan();
  updateStoreUi();
}
const VIEWS = ["ask", "directory", "insights", "scan"];
function route() {
  const h = location.hash.replace("#", "");
  const v = VIEWS.includes(h) ? h : "ask";
  for (const name of VIEWS) $("view-" + name).classList.toggle("on", name === v);
  document.querySelectorAll(".tabbar a").forEach(a => {
    if (a.dataset.tab === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}
document.querySelectorAll("[data-ico]").forEach(n => n.prepend(icon(n.dataset.ico)));
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; applyLang(); }));
$("send").addEventListener("click", () => {
  if (busy) { if (ctl) ctl.abort(); return; }
  const box = $("box");
  const v = box.value;
  if (!v.trim()) { box.focus(); return; }
  box.value = "";
  box.style.height = "";
  ask(v);
});
$("box").addEventListener("keydown", ev => {
  if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); $("send").click(); }
});
$("box").addEventListener("input", ev => {
  const b = ev.target;
  b.style.height = "";
  b.style.height = Math.min(b.scrollHeight, 120) + "px";
});
$("search").addEventListener("input", renderDir);
$("ins-clear").addEventListener("click", clearSaved);
window.addEventListener("hashchange", route);
setBusy(false);
applyLang();
route();

