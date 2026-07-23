// Funciones de renderizado de vistas y componentes compartidos.

const CATEGORY_ICON = { hortaliza: "🥕", fruta: "🍓", hierba: "🌿", flor: "🌼" };
const CATEGORY_LABEL = { hortaliza: "Hortaliza", fruta: "Fruta", hierba: "Hierba", flor: "Flor" };
const SUN_LABEL = { pleno: "☀️ Sol pleno", semisombra: "⛅ Semisombra", sombra: "🌥️ Sombra" };
const WATER_LABEL = { bajo: "💧 Riego bajo", medio: "💧💧 Riego medio", alto: "💧💧💧 Riego alto" };

function escapeHTML(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function plantDisplayName(plant) {
  const cat = plant.catalogId ? getCatalogPlant(plant.catalogId) : null;
  return plant.nombrePersonalizado || (cat ? cat.nombre : "Planta sin nombre");
}
function plantIcon(plant) {
  const cat = plant.catalogId ? getCatalogPlant(plant.catalogId) : null;
  return cat ? CATEGORY_ICON[cat.categoria] || "🌱" : "🌱";
}

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

function fmtSimpleDate(date) {
  const now = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  if (date.getFullYear() !== now.getFullYear()) {
    return `${day}/${month}/${date.getFullYear()}`;
  }
  return `${day}/${month}`;
}

// Proporciones típicas del tramo entre germinación (o trasplante) y cosecha
// que se reparten entre brote→flor, flor→fruto y fruto→cosecha.
const STAGE_SPLIT = { broteAFlor: 0.45, florAFruto: 0.20, frutoACosecha: 0.35 };
const DEFAULT_GERM_DIAS = 10;
const DEFAULT_COSECHA_DIAS = 70;

const STAGE_META = {
  brote: { label: "Brote", genero: "esperado" },
  primeraFlor: { label: "Flor", genero: "esperada" },
  primerFruto: { label: "Fruto", genero: "esperado" },
  cosecha: { label: "Cosecha", genero: "esperada" }
};

// Calcula la próxima etapa pendiente de una planta y su fecha estimada,
// usando la última etapa real registrada como punto de partida.
function nextStageEstimate(plant) {
  const cat = plant.catalogId ? getCatalogPlant(plant.catalogId) : null;
  const germRange = cat ? parseDayRange(cat.diasGerminacion) : null;
  const cosechaRange = cat ? parseDayRange(cat.diasCosecha) : null;
  const germAvg = germRange ? (germRange.min + germRange.max) / 2 : DEFAULT_GERM_DIAS;
  const cosechaAvg = cosechaRange ? (cosechaRange.min + cosechaRange.max) / 2 : DEFAULT_COSECHA_DIAS;

  let stages;
  let spanStart, spanEnd;
  if (plant.origen === "semilla") {
    stages = [
      { key: "siembra", date: plant.fechas.siembra },
      { key: "brote", date: plant.fechas.brote },
      { key: "primeraFlor", date: plant.fechas.primeraFlor },
      { key: "primerFruto", date: plant.fechas.primerFruto },
      { key: "cosecha", date: plant.fechas.cosecha }
    ];
    spanStart = germAvg; spanEnd = Math.max(cosechaAvg, germAvg + 1);
  } else {
    stages = [
      { key: "trasplante", date: plant.fechas.trasplante },
      { key: "primeraFlor", date: plant.fechas.primeraFlor },
      { key: "primerFruto", date: plant.fechas.primerFruto },
      { key: "cosecha", date: plant.fechas.cosecha }
    ];
    spanStart = 0; spanEnd = Math.max(cosechaAvg, 1);
  }

  let lastKnownIdx = -1;
  stages.forEach((s, i) => { if (s.date) lastKnownIdx = i; });
  if (lastKnownIdx === -1 || lastKnownIdx === stages.length - 1) return null; // sin punto de partida, o ya completo

  const nextStage = stages[lastKnownIdx + 1];
  const lastDate = stages[lastKnownIdx].date;
  const totalSpan = spanEnd - spanStart;

  let delta;
  if (nextStage.key === "brote") {
    delta = germAvg;
  } else if (nextStage.key === "primeraFlor") {
    delta = STAGE_SPLIT.broteAFlor * totalSpan;
  } else if (nextStage.key === "primerFruto") {
    delta = STAGE_SPLIT.florAFruto * totalSpan;
  } else if (nextStage.key === "cosecha") {
    delta = STAGE_SPLIT.frutoACosecha * totalSpan;
  } else {
    delta = 0;
  }

  const estDate = addDaysToDate(lastDate, Math.round(delta));
  const meta = STAGE_META[nextStage.key];
  return { key: nextStage.key, label: meta.label, genero: meta.genero, date: estDate };
}

// Extrae un rango de días de un texto como "6-14 días", "12-18 meses hasta planta madura"
// o "2-3 años hasta primera cosecha". Devuelve {min,max} en días, o null si no aplica (ej: "-").
function parseDayRange(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*-\s*(\d+)\s*(día|dias|mes|meses|año|años|anio|anios)/i);
  if (!m) return null;
  let min = parseInt(m[1], 10), max = parseInt(m[2], 10);
  const unit = m[3].toLowerCase();
  let mult = 1;
  if (unit.startsWith("mes")) mult = 30;
  else if (unit.startsWith("añ") || unit.startsWith("ani")) mult = 365;
  return { min: min * mult, max: max * mult };
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// --- Stage track (elemento distintivo) ---
function stageTrackHTML(plant) {
  let stages;
  if (plant.origen === "plantin") {
    stages = [
      { key: "trasplante", label: "Plantín", icon: "🌱", date: plant.fechas.trasplante },
      { key: "primeraFlor", label: "Flor", icon: "🌸", date: plant.fechas.primeraFlor },
      { key: "primerFruto", label: "Fruto", icon: "🍅", date: plant.fechas.primerFruto },
      { key: "cosecha", label: "Cosecha", icon: "🧺", date: plant.fechas.cosecha }
    ];
  } else {
    stages = [
      { key: "siembra", label: "Semilla", icon: "🌰", date: plant.fechas.siembra },
      { key: "brote", label: "Brote", icon: "🌱", date: plant.fechas.brote },
      { key: "primeraFlor", label: "Flor", icon: "🌸", date: plant.fechas.primeraFlor },
      { key: "primerFruto", label: "Fruto", icon: "🍅", date: plant.fechas.primerFruto },
      { key: "cosecha", label: "Cosecha", icon: "🧺", date: plant.fechas.cosecha }
    ];
  }
  let lastDoneIdx = -1;
  stages.forEach((s, i) => { if (s.date) lastDoneIdx = i; });

  let dotsHTML = "";
  stages.forEach((s, i) => {
    const done = i <= lastDoneIdx && s.date;
    const isCurrent = i === lastDoneIdx;
    dotsHTML += `<div class="stage-dot ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}" title="${s.label}${s.date ? ' — ' + fmtDate(s.date) : ''}">${s.icon}</div>`;
    if (i < stages.length - 1) {
      const segDone = i < lastDoneIdx;
      dotsHTML += `<div class="stage-seg ${segDone ? 'done' : ''}"></div>`;
    }
  });
  const labelsHTML = stages.map(s => `<span>${s.label}</span>`).join("");
  return `<div class="stage-track">${dotsHTML}</div><div class="stage-labels">${labelsHTML}</div>`;
}

// --- Bed helpers ---
function bedTypeLabel(tipo) { return tipo === "semillero" ? "Semillero" : "Cama"; }
function bedTypeIcon(tipo) { return tipo === "semillero" ? "🌱" : "🟫"; }

function populateBedSelect(selectEl, opts = {}) {
  const beds = Store.getBeds();
  selectEl.innerHTML = beds.map(b => `<option value="${b.id}">${bedTypeIcon(b.tipo)} ${escapeHTML(b.nombre)}</option>`).join("")
    || `<option value="">Sin bancales — creá uno primero</option>`;
  if (opts.selected) selectEl.value = opts.selected;
}

// --- Companion hints ---
function companionHintsForBed(catalogId, bedId, excludePlantId) {
  if (!catalogId || !bedId) return "";
  const plantsInBed = Store.getPlantsByBed(bedId).filter(p => p.id !== excludePlantId && p.catalogId);
  if (plantsInBed.length === 0) {
    return `<div class="companion-hint neutra">🌱 Este bancal no tiene otras plantas todavía. Sin conflictos de combinación.</div>`;
  }
  let buenas = [], malas = [];
  plantsInBed.forEach(p => {
    const rel = companionRelation(catalogId, p.catalogId);
    const otherName = plantDisplayName(p);
    if (rel === "buena") buenas.push(otherName);
    else if (rel === "mala") malas.push(otherName);
  });
  let html = "";
  if (malas.length) {
    html += `<div class="companion-hint mala">⚠️ No se lleva bien con: ${malas.map(escapeHTML).join(", ")}. Considerá otro bancal.</div>`;
  }
  if (buenas.length) {
    html += `<div class="companion-hint buena">✅ Buena combinación con: ${buenas.map(escapeHTML).join(", ")}.</div>`;
  }
  if (!malas.length && !buenas.length) {
    html += `<div class="companion-hint neutra">🌱 No hay una relación conocida marcada con las plantas de este bancal.</div>`;
  }
  return html;
}

function diaSemanaLargo(fecha) {
  return new Date(fecha + "T12:00").toLocaleDateString("es-PY", { weekday: "long" });
}

// Arma el HTML de alertas combinadas de helada y viento fuerte para los próximos días.
function buildAlertsHTML(heladaDias, ventoDias) {
  const partes = [];
  if (heladaDias.length) {
    partes.push(`<div>❄️ <b>Riesgo de helada:</b> ${heladaDias.map(d => `${diaSemanaLargo(d.fecha)} (mín. ${Math.round(d.min)}°C)`).join(" · ")}. Protegé las plantas sensibles.</div>`);
  }
  if (ventoDias.length) {
    partes.push(`<div>💨 <b>Viento fuerte:</b> ${ventoDias.map(d => `${diaSemanaLargo(d.fecha)} (ráfagas ~${Math.round(d.rafagaMax)} km/h)`).join(" · ")}. Reforzá tutores y protecciones.</div>`);
  }
  if (!partes.length) {
    return `<div class="frost-none">✅ Sin riesgo de helada ni viento fuerte en los próximos días.</div>`;
  }
  return `<div class="frost-alert">${partes.join("")}</div>`;
}

// ============ VISTA: HOY ============
async function renderHoy() {
  const beds = Store.getBeds();
  const plants = Store.getPlants().filter(p => p.activa !== false);
  const settings = Store.getSettings();

  document.getElementById("header-place").textContent = settings.lugar;

  document.getElementById("hoy-stats").innerHTML = `
    <div class="stats-pills">
      <span class="stat-pill">🟫 ${beds.length} bancal${beds.length === 1 ? "" : "es"}</span>
      <span class="stat-pill">🌿 ${plants.length} planta${plants.length === 1 ? "" : "s"}</span>
      <span class="stat-pill">🏷️ ${new Set(plants.map(p => p.catalogId).filter(Boolean)).size} especies</span>
    </div>
  `;

  // Próxima etapa esperada de cada planta, ordenada de la más próxima a la más lejana
  const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
  const pendientes = plants
    .map(p => ({ plant: p, est: nextStageEstimate(p) }))
    .filter(x => x.est);
  pendientes.sort((a, b) => a.est.date - b.est.date);

  const upcomingHTML = pendientes.map(({ plant: p, est }) => {
    const vencida = est.date <= hoy0;
    const texto = vencida
      ? `${est.label} ${est.genero} desde el ${fmtSimpleDate(est.date)}`
      : `${est.label} ${est.genero}: ${fmtSimpleDate(est.date)}`;
    return `<div class="card plant-card" data-plant-id="${p.id}" style="padding:12px 14px; cursor:pointer;"><div class="card-row">
      <div><div class="plant-name" style="font-size:0.88rem;">${plantIcon(p)} ${escapeHTML(plantDisplayName(p))}</div>
      <div class="plant-sub">${texto}</div></div>
      ${vencida ? `<span style="font-size:1rem;">⏰</span>` : ""}
    </div></div>`;
  }).join("") || `<div class="card" style="font-size:0.86rem; color:var(--tierra-soft);">Nada pendiente por ahora. Registrá las etapas de tus plantas en la pestaña Plantas.</div>`;
  document.getElementById("hoy-upcoming").innerHTML = upcomingHTML;

  // Clima: actual + próximos días + alertas de helada y viento
  try {
    const data = await Weather.getForecast();
    const dias = Weather.frostRisk(data);
    const vientoDias = Weather.windRisk(data);
    const hoyInfo = Weather.weatherCodeInfo(data.current.weathercode);
    const forecastStrip = dias.slice(0, 5).map(d => {
      const info = Weather.weatherCodeInfo(d.code);
      const dow = new Date(d.fecha + "T12:00").toLocaleDateString("es-PY", { weekday: "short" });
      return `<div class="forecast-day on-dark ${d.helada ? "helada" : ""}">
        <div class="dow">${dow}</div>
        <div class="icon">${d.helada ? "❄️" : info.icono}</div>
        <div class="temps"><b>${Math.round(d.max)}°</b> ${Math.round(d.min)}°</div>
      </div>`;
    }).join("");
    document.getElementById("hoy-weather-slot").innerHTML = `
      <div class="weather-hero">
        <div class="wh-top">
          <div>
            <div class="place">${escapeHTML(settings.lugar)}</div>
            <span class="temp-now">${Math.round(data.current.temperature_2m)}°C</span>
          </div>
          <div class="desc">${hoyInfo.icono} ${hoyInfo.texto}</div>
        </div>
        <div class="forecast-row" style="margin-top:10px;">${forecastStrip}</div>
      </div>`;
    const heladaDias = dias.filter(d => d.helada).slice(0, 3);
    const ventoFuerteDias = vientoDias.filter(d => d.ventoFuerte).slice(0, 3);
    document.getElementById("hoy-frost-slot").innerHTML = buildAlertsHTML(heladaDias, ventoFuerteDias);
  } catch (e) {
    document.getElementById("hoy-weather-slot").innerHTML = `<div class="card">No se pudo cargar el clima. Revisá tu conexión.</div>`;
    document.getElementById("hoy-frost-slot").innerHTML = "";
  }
}


// ============ VISTA: BANCALES ============
function renderBeds() {
  const beds = Store.getBeds();
  const container = document.getElementById("beds-list");
  if (beds.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🟫</div><h3>Sin bancales todavía</h3><p>Creá tu primer bancal elevado o cama de cultivo.</p></div>`;
    return;
  }
  container.innerHTML = beds.map(b => {
    const plants = Store.getPlantsByBed(b.id);
    return `<div class="card bed-card" data-bed-id="${b.id}">
      <div class="card-row">
        <h3 style="font-size:1rem;">${bedTypeIcon(b.tipo)} ${escapeHTML(b.nombre)}</h3>
        <span class="bed-type-pill ${b.tipo}">${bedTypeLabel(b.tipo)}</span>
      </div>
      <div class="bed-plant-count">${plants.length} planta${plants.length === 1 ? "" : "s"}</div>
      ${plants.length ? `<div class="bed-mini-plants">${plants.slice(0, 6).map(p => `<span class="mini-chip">${plantIcon(p)} ${escapeHTML(plantDisplayName(p))}</span>`).join("")}${plants.length > 6 ? `<span class="mini-chip">+${plants.length - 6}</span>` : ""}</div>` : ""}
    </div>`;
  }).join("");
}

function renderBedDetail(bedId) {
  const bed = Store.getBeds().find(b => b.id === bedId);
  if (!bed) return;
  document.getElementById("bed-detail-title").textContent = bed.nombre;
  document.getElementById("bed-detail-meta").innerHTML = `
    <span class="bed-type-pill ${bed.tipo}">${bedTypeLabel(bed.tipo)}</span>
    ${bed.notas ? `<div style="font-size:0.84rem; color:var(--tierra-soft); margin-top:8px;">${escapeHTML(bed.notas)}</div>` : ""}
  `;
  const plants = Store.getPlantsByBed(bedId);
  const container = document.getElementById("bed-detail-plants");
  container.innerHTML = plants.length
    ? plants.map(p => `<div class="card plant-card" data-plant-id="${p.id}" style="cursor:pointer;">
        <div class="plant-icon">${plantIcon(p)}</div>
        <div class="plant-info">
          <div class="plant-name">${escapeHTML(plantDisplayName(p))}</div>
          <div class="plant-sub">${p.variedad ? escapeHTML(p.variedad) + " · " : ""}${p.origen === "semilla" ? "De semilla" : "Plantín"}</div>
        </div>
      </div>`).join("")
    : `<div style="font-size:0.84rem; color:var(--tierra-soft); padding:8px 0;">No hay plantas en este bancal todavía.</div>`;
}

// ============ VISTA: PLANTAS ============
let plantFilterCategory = "todas";
let plantSearchTerm = "";
let plantShowFinalizadas = false;

function renderPlantFilters() {
  const cats = [["todas", "Todas"], ["hortaliza", "🥕 Hortalizas"], ["fruta", "🍓 Frutas"], ["hierba", "🌿 Hierbas"], ["flor", "🌼 Flores"]];
  document.getElementById("plant-filters").innerHTML = cats.map(([key, label]) =>
    `<button class="filter-chip ${plantFilterCategory === key ? "active" : ""}" data-cat="${key}">${label}</button>`
  ).join("");
}

function renderPlants() {
  renderPlantFilters();
  const beds = Store.getBeds();
  const bedNameById = Object.fromEntries(beds.map(b => [b.id, b.nombre]));
  let plants = Store.getPlants().filter(p => plantShowFinalizadas ? p.activa === false : p.activa !== false);
  if (plantFilterCategory !== "todas") {
    plants = plants.filter(p => {
      const cat = p.catalogId ? getCatalogPlant(p.catalogId) : null;
      return cat && cat.categoria === plantFilterCategory;
    });
  }
  if (plantSearchTerm.trim()) {
    const term = plantSearchTerm.toLowerCase();
    plants = plants.filter(p => plantDisplayName(p).toLowerCase().includes(term) || (p.variedad || "").toLowerCase().includes(term));
  }
  const container = document.getElementById("plants-list");
  if (plants.length === 0) {
    container.innerHTML = plantShowFinalizadas
      ? `<div class="empty-state"><div class="icon">🧺</div><h3>Sin ciclos finalizados</h3><p>Cuando termines el ciclo de una planta, va a aparecer acá.</p></div>`
      : `<div class="empty-state"><div class="icon">🌿</div><h3>Sin plantas</h3><p>Agregá tu primera planta a un bancal.</p></div>`;
    return;
  }
  container.innerHTML = plants.map(p => `
    <div class="card plant-card" data-plant-id="${p.id}" style="cursor:pointer; display:block;">
      <div style="display:flex; gap:12px; align-items:center;">
        <div class="plant-icon">${plantIcon(p)}</div>
        <div class="plant-info">
          <div class="plant-name">${escapeHTML(plantDisplayName(p))}</div>
          <div class="plant-sub">${p.bedId && bedNameById[p.bedId] ? escapeHTML(bedNameById[p.bedId]) : "Sin bancal asignado"} ${p.variedad ? "· " + escapeHTML(p.variedad) : ""}</div>
        </div>
      </div>
      ${stageTrackHTML(p)}
    </div>
  `).join("");
}

// ============ VISTA: CLIMA ============
async function renderClima() {
  const container = document.getElementById("clima-content");
  container.innerHTML = `<div class="card" style="text-align:center; color:var(--tierra-soft);">Cargando pronóstico...</div>`;
  try {
    const data = await Weather.getForecast(true);
    const dias = Weather.frostRisk(data);
    const vientoDias = Weather.windRisk(data);
    const settings = Store.getSettings();
    const heladaDias = dias.filter(d => d.helada);
    const ventoFuerteDias = vientoDias.filter(d => d.ventoFuerte);
    let html = buildAlertsHTML(heladaDias, ventoFuerteDias);
    html += `<div class="section-title">Próximos 7 días</div><div class="forecast-row">`;
    dias.forEach(d => {
      const info = Weather.weatherCodeInfo(d.code);
      const dow = new Date(d.fecha + "T12:00").toLocaleDateString("es-PY", { weekday: "short" });
      html += `<div class="forecast-day ${d.helada ? "helada" : ""}">
        <div class="dow">${dow}</div>
        <div class="icon">${d.helada ? "❄️" : info.icono}</div>
        <div class="temps"><b>${Math.round(d.max)}°</b> ${Math.round(d.min)}°</div>
      </div>`;
    });
    html += `</div>`;
    html += `<div class="section-title">Detalle diario</div>`;
    dias.forEach((d, i) => {
      const info = Weather.weatherCodeInfo(d.code);
      const viento = vientoDias[i];
      const fecha = new Date(d.fecha + "T12:00").toLocaleDateString("es-PY", { weekday: "long", day: "numeric", month: "short" });
      html += `<div class="card" style="padding:12px 14px;">
        <div class="card-row">
          <div style="font-size:0.86rem; text-transform:capitalize;">${fecha}</div>
          <div style="font-size:0.86rem;">${info.icono} ${info.texto}</div>
        </div>
        <div style="font-size:0.8rem; color:var(--tierra-soft); margin-top:4px;">Máx ${Math.round(d.max)}°C · Mín ${Math.round(d.min)}°C · Prob. lluvia ${d.precip}%${viento && viento.rafagaMax != null ? ` · Ráfagas ${Math.round(viento.rafagaMax)} km/h` : ""}</div>
        ${d.helada ? `<div style="font-size:0.8rem; color:var(--rojo-helada); margin-top:4px; font-weight:600;">❄️ Riesgo de helada</div>` : ""}
        ${viento && viento.ventoFuerte ? `<div style="font-size:0.8rem; color:var(--rojo-helada); margin-top:4px; font-weight:600;">💨 Viento fuerte</div>` : ""}
      </div>`;
    });
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="card">No se pudo cargar el clima. Revisá tu conexión a internet.</div>`;
  }
}

// ============ Catálogo de selección (formulario de planta) ============
function renderCatalogResults(query) {
  const el = document.getElementById("plant-catalog-results");
  if (!query || query.trim().length < 1) { el.innerHTML = ""; return; }
  const term = query.toLowerCase();
  const results = PLANT_CATALOG.filter(p => p.nombre.toLowerCase().includes(term)).slice(0, 8);
  el.innerHTML = results.map(p => `
    <div class="catalog-pick" data-catalog-id="${p.id}">
      <div class="plant-icon">${CATEGORY_ICON[p.categoria]}</div>
      <div><div style="font-weight:600; font-size:0.88rem;">${p.nombre}</div><div style="font-size:0.72rem; color:var(--tierra-soft);">${CATEGORY_LABEL[p.categoria]}</div></div>
    </div>
  `).join("") || `<div style="font-size:0.82rem; color:var(--tierra-soft); padding:8px 2px;">Sin resultados. Podés dejar el nombre personalizado.</div>`;
}

function renderSelectedCatalogPlant(catalogId) {
  const slot = document.getElementById("plant-selected-slot");
  if (!catalogId) { slot.style.display = "none"; slot.innerHTML = ""; return; }
  const p = getCatalogPlant(catalogId);
  if (!p) { slot.style.display = "none"; return; }
  slot.style.display = "block";
  slot.innerHTML = `<div class="card" style="padding:10px 12px; display:flex; align-items:center; gap:10px;">
    <div class="plant-icon">${CATEGORY_ICON[p.categoria]}</div>
    <div style="flex:1;"><div style="font-weight:600; font-size:0.88rem;">${p.nombre} seleccionado</div><div style="font-size:0.72rem; color:var(--tierra-soft);">${SUN_LABEL[p.sol] || ""} · ${WATER_LABEL[p.agua] || ""}</div></div>
    <button type="button" class="btn-ghost" id="btn-clear-catalog" style="font-size:0.78rem;">Cambiar</button>
  </div>`;
}

// ============ Detalle de planta ============
function renderPlantDetail(plantId) {
  const plant = Store.getPlants().find(p => p.id === plantId);
  if (!plant) return;
  const cat = plant.catalogId ? getCatalogPlant(plant.catalogId) : null;
  const bed = plant.bedId ? Store.getBeds().find(b => b.id === plant.bedId) : null;

  document.getElementById("plant-detail-title").textContent = plantDisplayName(plant);

  const estadoBadge = plant.activa === false
    ? `<span class="bed-type-pill semillero" style="margin-left:8px;">Ciclo finalizado</span>` : "";

  let recsHTML = "";
  if (cat) {
    recsHTML = `
      <div class="section-title">Recomendaciones</div>
      <div class="card">
        <div class="rec-item"><div class="rec-icon">☀️</div><div><div class="rec-label">Sol</div><div class="rec-text">${SUN_LABEL[cat.sol] || cat.sol}</div></div></div>
        <div class="rec-item"><div class="rec-icon">💧</div><div><div class="rec-label">Riego</div><div class="rec-text">${cat.riego}</div></div></div>
        <div class="rec-item"><div class="rec-icon">🌾</div><div><div class="rec-label">Fertilizante</div><div class="rec-text">${cat.fertilizante}</div></div></div>
        <div class="rec-item"><div class="rec-icon">📏</div><div><div class="rec-label">Espaciado</div><div class="rec-text">${cat.espaciado}</div></div></div>
        <div class="rec-item"><div class="rec-icon">🕐</div><div><div class="rec-label">Tiempos</div><div class="rec-text">Germinación: ${cat.diasGerminacion} · Cosecha: ${cat.diasCosecha}</div></div></div>
        ${cat.heladaSensible ? `<div class="rec-item"><div class="rec-icon">❄️</div><div><div class="rec-label">Heladas</div><div class="rec-text">Sensible al frío — proteger o cubrir en noches de helada.</div></div></div>` : ""}
        ${cat.notas ? `<div class="rec-item"><div class="rec-icon">📝</div><div><div class="rec-label">Nota</div><div class="rec-text">${cat.notas}</div></div></div>` : ""}
      </div>`;
  }

  const historialHTML = (plant.historial || []).slice().reverse().map(h => {
    const bedName = h.bedId ? (Store.getBeds().find(b => b.id === h.bedId)?.nombre || "bancal eliminado") : "sin bancal";
    const eventoLabel = h.evento === "creada" ? "Creada en" : "Trasplantada a";
    return `<div class="history-item"><div class="dot"></div><div><b>${eventoLabel} ${escapeHTML(bedName)}</b><br>${new Date(h.fecha).toLocaleDateString("es-PY")}${h.nota ? " — " + escapeHTML(h.nota) : ""}</div></div>`;
  }).join("");

  document.getElementById("plant-detail-body").innerHTML = `
    <div class="card">
      <div class="card-row">
        <div><div style="font-size:0.82rem; color:var(--tierra-soft);">${bed ? bedTypeIcon(bed.tipo) + " " + escapeHTML(bed.nombre) : "Sin bancal"}${estadoBadge}</div>
        ${plant.variedad ? `<div style="font-size:0.82rem; color:var(--tierra-soft);">Variedad: ${escapeHTML(plant.variedad)}</div>` : ""}</div>
      </div>
      ${stageTrackHTML(plant)}
      ${plant.notas ? `<div style="font-size:0.84rem; margin-top:10px; padding-top:10px; border-top:1px solid var(--line);">${escapeHTML(plant.notas)}</div>` : ""}
    </div>
    <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
      ${plant.activa === false ? `
        <button class="btn btn-secondary" style="flex:1;" id="btn-reactivate-plant">Reactivar</button>
      ` : `
        <button class="btn btn-secondary" style="flex:1;" id="btn-open-edit-plant">Editar</button>
        <button class="btn btn-secondary" style="flex:1;" id="btn-open-move-plant">Mover / trasplantar</button>
        <button class="btn btn-ghost" style="flex-basis:100%;" id="btn-finish-plant">🧺 Finalizar ciclo (archivar)</button>
      `}
    </div>
    ${recsHTML}
    <div class="section-title">Historial</div>
    <div class="card">${historialHTML || '<div style="font-size:0.82rem; color:var(--tierra-soft);">Sin movimientos registrados.</div>'}</div>
  `;
}
