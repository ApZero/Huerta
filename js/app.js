// Lógica principal: navegación, hojas modales, formularios.

let state = {
  editingBedId: null,      // bancal en edición (null = nuevo)
  currentBedId: null,      // bancal abierto en detalle
  editingPlantId: null,    // planta en edición (null = nueva)
  currentPlantId: null,    // planta abierta en detalle
  selectedCatalogId: null, // especie elegida en el formulario de planta
  plantOrigen: "semilla",
  bedTipo: "cama",
  targetBedForNewPlant: null // si se agrega desde el detalle de un bancal
};

// ---------- Navegación entre vistas ----------
function switchView(viewName) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${viewName}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === viewName));
  if (viewName === "hoy") renderHoy();
  if (viewName === "bancales") renderBeds();
  if (viewName === "plantas") renderPlants();
  if (viewName === "clima") renderClima();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

// ---------- Sheets (hojas modales) ----------
const backdrop = document.getElementById("backdrop");
function openSheet(id) {
  backdrop.classList.add("active");
  document.getElementById(id).classList.add("active");
}
function closeAllSheets() {
  backdrop.classList.remove("active");
  document.querySelectorAll(".sheet").forEach(s => s.classList.remove("active"));
}
backdrop.addEventListener("click", closeAllSheets);
document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", closeAllSheets));

// ---------- FAB ----------
document.getElementById("fab-add").addEventListener("click", () => openSheet("sheet-fab-choice"));
document.getElementById("choice-bed").addEventListener("click", () => {
  closeAllSheets();
  openBedForm(null);
});
document.getElementById("choice-plant").addEventListener("click", () => {
  closeAllSheets();
  state.targetBedForNewPlant = null;
  openPlantForm(null);
});

// ---------- Formulario de bancal ----------
document.querySelectorAll("#bed-tipo-control button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#bed-tipo-control button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.bedTipo = btn.dataset.val;
  });
});

function openBedForm(bedId) {
  state.editingBedId = bedId;
  const deleteBtn = document.getElementById("btn-delete-bed");
  if (bedId) {
    const bed = Store.getBeds().find(b => b.id === bedId);
    document.getElementById("bed-form-title").textContent = "Editar bancal";
    document.getElementById("bed-nombre").value = bed.nombre;
    document.getElementById("bed-notas").value = bed.notas || "";
    state.bedTipo = bed.tipo;
    deleteBtn.style.display = "block";
  } else {
    document.getElementById("bed-form-title").textContent = "Nuevo bancal";
    document.getElementById("bed-nombre").value = "";
    document.getElementById("bed-notas").value = "";
    state.bedTipo = "cama";
    deleteBtn.style.display = "none";
  }
  document.querySelectorAll("#bed-tipo-control button").forEach(b => b.classList.toggle("active", b.dataset.val === state.bedTipo));
  openSheet("sheet-bed-form");
}

document.getElementById("btn-save-bed").addEventListener("click", () => {
  const nombre = document.getElementById("bed-nombre").value.trim();
  if (!nombre) { toast("Poné un nombre para el bancal"); return; }
  const notas = document.getElementById("bed-notas").value.trim();
  if (state.editingBedId) {
    Store.updateBed(state.editingBedId, { nombre, tipo: state.bedTipo, notas });
    toast("Bancal actualizado");
  } else {
    Store.addBed({ nombre, tipo: state.bedTipo, notas });
    toast("Bancal creado");
  }
  closeAllSheets();
  renderBeds();
});

document.getElementById("btn-delete-bed").addEventListener("click", () => {
  if (!state.editingBedId) return;
  if (!confirm("¿Eliminar este bancal? Las plantas quedarán sin bancal asignado.")) return;
  Store.deleteBed(state.editingBedId);
  closeAllSheets();
  renderBeds();
  toast("Bancal eliminado");
});

// ---------- Lista de bancales -> detalle ----------
document.getElementById("beds-list").addEventListener("click", (e) => {
  const card = e.target.closest(".bed-card");
  if (!card) return;
  openBedDetail(card.dataset.bedId);
});

function openBedDetail(bedId) {
  state.currentBedId = bedId;
  renderBedDetail(bedId);
  openSheet("sheet-bed-detail");
}

document.getElementById("btn-edit-bed").addEventListener("click", () => {
  closeAllSheets();
  openBedForm(state.currentBedId);
});

document.getElementById("bed-detail-plants").addEventListener("click", (e) => {
  const card = e.target.closest(".plant-card");
  if (!card) return;
  closeAllSheets();
  openPlantDetail(card.dataset.plantId);
});

document.getElementById("btn-add-plant-to-bed").addEventListener("click", () => {
  const bedId = state.currentBedId;
  closeAllSheets();
  state.targetBedForNewPlant = bedId;
  openPlantForm(null);
});

// ---------- Formulario de planta ----------
document.querySelectorAll("#plant-origen-control button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#plant-origen-control button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.plantOrigen = btn.dataset.val;
    document.getElementById("plant-dates-semilla").style.display = state.plantOrigen === "semilla" ? "block" : "none";
    document.getElementById("plant-dates-plantin").style.display = state.plantOrigen === "plantin" ? "block" : "none";
  });
});

document.getElementById("plant-catalog-search").addEventListener("input", (e) => {
  renderCatalogResults(e.target.value);
});
document.getElementById("plant-catalog-results").addEventListener("click", (e) => {
  const pick = e.target.closest(".catalog-pick");
  if (!pick) return;
  state.selectedCatalogId = pick.dataset.catalogId;
  document.getElementById("plant-catalog-search").value = "";
  document.getElementById("plant-catalog-results").innerHTML = "";
  renderSelectedCatalogPlant(state.selectedCatalogId);
  updateCompanionHintsInForm();
});
document.getElementById("plant-selected-slot").addEventListener("click", (e) => {
  if (e.target.id === "btn-clear-catalog") {
    state.selectedCatalogId = null;
    renderSelectedCatalogPlant(null);
    updateCompanionHintsInForm();
  }
});

document.getElementById("plant-bed-select").addEventListener("change", updateCompanionHintsInForm);
function updateCompanionHintsInForm() {
  const bedId = document.getElementById("plant-bed-select").value;
  document.getElementById("plant-companion-hints").innerHTML =
    companionHintsForBed(state.selectedCatalogId, bedId, state.editingPlantId);
}

function openPlantForm(plantId) {
  state.editingPlantId = plantId;
  const deleteBtn = document.getElementById("btn-delete-plant");
  const bedSelect = document.getElementById("plant-bed-select");

  if (plantId) {
    const plant = Store.getPlants().find(p => p.id === plantId);
    document.getElementById("plant-form-title").textContent = "Editar planta";
    document.getElementById("plant-nombre-custom").value = plant.nombrePersonalizado || "";
    document.getElementById("plant-variedad").value = plant.variedad || "";
    document.getElementById("plant-notas").value = plant.notas || "";
    state.selectedCatalogId = plant.catalogId;
    state.plantOrigen = plant.origen;
    populateBedSelect(bedSelect, { selected: plant.bedId });
    document.getElementById("fecha-siembra").value = plant.fechas.siembra || "";
    document.getElementById("fecha-brote").value = plant.fechas.brote || "";
    document.getElementById("fecha-flor").value = plant.fechas.primeraFlor || "";
    document.getElementById("fecha-fruto").value = plant.fechas.primerFruto || "";
    document.getElementById("fecha-cosecha").value = plant.fechas.cosecha || "";
    document.getElementById("fecha-trasplante-inicial").value = plant.fechas.trasplante || "";
    document.getElementById("fecha-flor-2").value = plant.fechas.primeraFlor || "";
    document.getElementById("fecha-fruto-2").value = plant.fechas.primerFruto || "";
    document.getElementById("fecha-cosecha-2").value = plant.fechas.cosecha || "";
    deleteBtn.style.display = "block";
  } else {
    document.getElementById("plant-form-title").textContent = "Nueva planta";
    document.getElementById("plant-nombre-custom").value = "";
    document.getElementById("plant-variedad").value = "";
    document.getElementById("plant-notas").value = "";
    state.selectedCatalogId = null;
    state.plantOrigen = "semilla";
    populateBedSelect(bedSelect, { selected: state.targetBedForNewPlant });
    ["fecha-siembra", "fecha-brote", "fecha-flor", "fecha-fruto", "fecha-cosecha", "fecha-trasplante-inicial", "fecha-flor-2", "fecha-fruto-2", "fecha-cosecha-2"]
      .forEach(id => document.getElementById(id).value = "");
    deleteBtn.style.display = "none";
  }
  document.getElementById("plant-catalog-search").value = "";
  document.getElementById("plant-catalog-results").innerHTML = "";
  renderSelectedCatalogPlant(state.selectedCatalogId);
  document.querySelectorAll("#plant-origen-control button").forEach(b => b.classList.toggle("active", b.dataset.val === state.plantOrigen));
  document.getElementById("plant-dates-semilla").style.display = state.plantOrigen === "semilla" ? "block" : "none";
  document.getElementById("plant-dates-plantin").style.display = state.plantOrigen === "plantin" ? "block" : "none";
  updateCompanionHintsInForm();
  openSheet("sheet-plant-form");
}

document.getElementById("btn-save-plant").addEventListener("click", () => {
  const bedId = document.getElementById("plant-bed-select").value || null;
  const nombrePersonalizado = document.getElementById("plant-nombre-custom").value.trim() || null;
  const variedad = document.getElementById("plant-variedad").value.trim();
  const notas = document.getElementById("plant-notas").value.trim();

  if (!state.selectedCatalogId && !nombrePersonalizado) {
    toast("Elegí una especie del catálogo o poné un nombre personalizado");
    return;
  }

  let fechas = {};
  if (state.plantOrigen === "semilla") {
    fechas = {
      siembra: document.getElementById("fecha-siembra").value || null,
      brote: document.getElementById("fecha-brote").value || null,
      primeraFlor: document.getElementById("fecha-flor").value || null,
      primerFruto: document.getElementById("fecha-fruto").value || null,
      cosecha: document.getElementById("fecha-cosecha").value || null
    };
  } else {
    fechas = {
      trasplante: document.getElementById("fecha-trasplante-inicial").value || null,
      primeraFlor: document.getElementById("fecha-flor-2").value || null,
      primerFruto: document.getElementById("fecha-fruto-2").value || null,
      cosecha: document.getElementById("fecha-cosecha-2").value || null
    };
  }

  if (state.editingPlantId) {
    Store.updatePlant(state.editingPlantId, {
      catalogId: state.selectedCatalogId, nombrePersonalizado, variedad, bedId, origen: state.plantOrigen, fechas, notas
    });
    toast("Planta actualizada");
  } else {
    Store.addPlant({
      catalogId: state.selectedCatalogId, nombrePersonalizado, variedad, bedId, origen: state.plantOrigen, fechas, notas
    });
    toast("Planta agregada");
  }
  closeAllSheets();
  renderBeds();
  renderPlants();
});

document.getElementById("btn-delete-plant").addEventListener("click", () => {
  if (!state.editingPlantId) return;
  if (!confirm("¿Eliminar esta planta? Se perderá su historial.")) return;
  Store.deletePlant(state.editingPlantId);
  closeAllSheets();
  renderBeds();
  renderPlants();
  toast("Planta eliminada");
});

// ---------- Lista de plantas -> detalle ----------
document.getElementById("plants-list").addEventListener("click", (e) => {
  const card = e.target.closest(".plant-card");
  if (!card) return;
  openPlantDetail(card.dataset.plantId);
});
document.getElementById("plant-search").addEventListener("input", (e) => {
  plantSearchTerm = e.target.value;
  renderPlants();
});
document.getElementById("plant-filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".filter-chip");
  if (!chip) return;
  plantFilterCategory = chip.dataset.cat;
  renderPlants();
});
document.getElementById("plant-status-control").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  document.querySelectorAll("#plant-status-control button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  plantShowFinalizadas = btn.dataset.val === "finalizadas";
  renderPlants();
});

function openPlantDetail(plantId) {
  state.currentPlantId = plantId;
  renderPlantDetail(plantId);
  openSheet("sheet-plant-detail");
}

document.getElementById("plant-detail-body").addEventListener("click", (e) => {
  if (e.target.id === "btn-open-edit-plant") {
    closeAllSheets();
    openPlantForm(state.currentPlantId);
  }
  if (e.target.id === "btn-open-move-plant") {
    closeAllSheets();
    openMoveSheet(state.currentPlantId);
  }
  if (e.target.id === "btn-finish-plant") {
    if (!confirm("¿Marcar el ciclo de esta planta como finalizado? Va a pasar a Finalizadas, con su historial guardado.")) return;
    Store.archivePlant(state.currentPlantId);
    closeAllSheets();
    renderBeds(); renderPlants();
    toast("Ciclo finalizado");
  }
  if (e.target.id === "btn-reactivate-plant") {
    Store.updatePlant(state.currentPlantId, { activa: true });
    renderPlantDetail(state.currentPlantId);
    renderBeds(); renderPlants();
    toast("Planta reactivada");
  }
});

// ---------- Mover / trasplantar ----------
function openMoveSheet(plantId) {
  state.currentPlantId = plantId;
  const plant = Store.getPlants().find(p => p.id === plantId);
  const select = document.getElementById("move-bed-select");
  populateBedSelect(select, { selected: plant.bedId });
  document.getElementById("move-fecha").value = new Date().toISOString().slice(0, 10);
  document.getElementById("move-nota").value = "";
  updateMoveCompanionHints();
  openSheet("sheet-move-plant");
}
document.getElementById("move-bed-select").addEventListener("change", updateMoveCompanionHints);
function updateMoveCompanionHints() {
  const plant = Store.getPlants().find(p => p.id === state.currentPlantId);
  if (!plant) return;
  const bedId = document.getElementById("move-bed-select").value;
  document.getElementById("move-companion-hints").innerHTML = companionHintsForBed(plant.catalogId, bedId, plant.id);
}
document.getElementById("btn-confirm-move").addEventListener("click", () => {
  const bedId = document.getElementById("move-bed-select").value || null;
  const fecha = document.getElementById("move-fecha").value || new Date().toISOString().slice(0, 10);
  const nota = document.getElementById("move-nota").value.trim();
  Store.movePlant(state.currentPlantId, bedId, new Date(fecha).toISOString(), nota);
  closeAllSheets();
  renderBeds();
  renderPlants();
  toast("Planta movida");
});

// ---------- Ajustes ----------
function loadSettingsForm() {
  const s = Store.getSettings();
  document.getElementById("settings-lugar").value = s.lugar;
  document.getElementById("settings-lat").value = s.lat;
  document.getElementById("settings-lon").value = s.lon;
  document.getElementById("settings-umbral").value = s.umbralHelada;
  document.getElementById("settings-umbral-viento").value = s.umbralViento;
  const meta = Backup.getMeta();
  document.getElementById("last-backup-label").textContent = meta.lastAutoBackup
    ? `Último respaldo automático: ${meta.lastAutoBackup}`
    : "Todavía no se hizo un respaldo automático";
}

document.getElementById("btn-save-settings").addEventListener("click", () => {
  const lugar = document.getElementById("settings-lugar").value.trim();
  const lat = parseFloat(document.getElementById("settings-lat").value);
  const lon = parseFloat(document.getElementById("settings-lon").value);
  const umbralHelada = parseFloat(document.getElementById("settings-umbral").value);
  const umbralViento = parseFloat(document.getElementById("settings-umbral-viento").value);
  Store.saveSettings({ lugar, lat, lon, umbralHelada, umbralViento });
  toast("Ubicación guardada");
});

document.getElementById("btn-manual-backup").addEventListener("click", () => {
  Backup.downloadBackup("huerto-backup");
  toast("Respaldo descargado");
});

document.getElementById("btn-import-backup").addEventListener("click", () => {
  document.getElementById("import-file-input").click();
});
document.getElementById("import-file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!confirm("Esto reemplazará los datos actuales con los del respaldo. ¿Continuar?")) return;
      Store.importAll(data);
      toast("Respaldo importado");
      renderBeds(); renderPlants(); loadSettingsForm();
    } catch (err) {
      toast("No se pudo leer el archivo");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("hoy-upcoming").addEventListener("click", (e) => {
  const card = e.target.closest(".plant-card");
  if (!card) return;
  openPlantDetail(card.dataset.plantId);
});

// ---------- Migración de datos ----------
function migrateOldBedTypes() {
  const beds = Store.getBeds();
  let changed = false;
  const migrated = beds.map(b => {
    if (b.tipo === "raised") { changed = true; return { ...b, tipo: "cama" }; }
    if (b.tipo === "ground") { changed = true; return { ...b, tipo: "semillero" }; }
    return b;
  });
  if (changed) Store.saveBeds(migrated);
}

// ---------- Inicio ----------
function init() {
  migrateOldBedTypes();
  loadSettingsForm();
  switchView("hoy");
  Backup.maybeAutoBackup();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
init();
