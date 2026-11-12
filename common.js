const DEFAULT_CITY = {
  name: "Hyderabad",
  country: "India",
  latitude: 17.3850,
  longitude: 78.4867,
  timezone: "Asia/Kolkata"
};

function getSavedCity() {
  try {
    const saved = JSON.parse(localStorage.getItem("weatherCity") || "null");
    return saved && Number.isFinite(Number(saved.latitude)) ? saved : DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
}

function saveCity(city) {
  localStorage.setItem("weatherCity", JSON.stringify(city));
}

function cityLabel(city = getSavedCity()) {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

async function api(path) {
  const response = await fetch(path);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function searchCity(name) {
  const data = await api(`/api/geocode?name=${encodeURIComponent(name)}`);
  return data.results || [];
}

function nav(active) {
  const pages = [
    ["index.html", "Dashboard", "⌂"],
    ["analytics.html", "Analytics", "▥"],
    ["locations.html", "Locations", "◎"],
    ["records.html", "Records", "▤"]
  ];
  return `<header class="topbar">
    <a class="brand" href="index.html"><span class="brand-mark">☁</span><span>SkyWatch<small>WEATHER MONITORING</small></span></a>
    <nav>${pages.map(([href, label, icon]) => `<a class="${active === href ? "active" : ""}" href="${href}"><span>${icon}</span>${label}</a>`).join("")}</nav>
    <div class="top-location">⌖ <span id="navCity">${escapeHtml(getSavedCity().name)}</span></div>
  </header>`;
}

function setNotice(id, message, error = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `notice${error ? " error" : ""}`;
}

function fmt(value, digits = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

function dateLabel(value, options = { weekday: "short", month: "short", day: "numeric" }) {
  return new Date(value).toLocaleDateString(undefined, options);
}

async function fillCitySelect(select, initialCity = getSavedCity()) {
  const city = initialCity;
  select.innerHTML = `<option value="${city.latitude},${city.longitude}">${escapeHtml(cityLabel(city))}</option>`;
}

function weatherQuery(city) {
  return `latitude=${encodeURIComponent(city.latitude)}&longitude=${encodeURIComponent(city.longitude)}`;
}
