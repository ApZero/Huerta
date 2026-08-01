// Lógica principal: navegación, hojas modales, formularios.

let state = {
  editingBedId: null,      // bancal en edición (null = nuevo)
  currentBedId: null,      // bancal abierto en detalle
  editingPlantId: null,    // planta en edición (null = nueva)
  currentPlantId: null,    // planta abierta en detalle
  selectedCatalogId: null, // especie elegida en el formulario de planta
  plantOrigen: "semilla",
  bedTipo: "cama",
  targetBedForNewPlant: null, // si se agrega desde el detalle de un bancal
  editingCatalogId: null,     // especie personalizada en edición (null = nueva)
  currentCatalogDetailId: null,
  catalogMesesSeleccionados: [],
  photoViewContext: null,        // { context: 'bed'|'bitacora', entryId, parentId }
  currentBitacoraPlantId: null,
  bitacoraPhotoBlob: null
};

// ---------- Navegación entre vistas ----------
let currentView = "hoy";
function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${viewName}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === viewName));
  if (viewName === "hoy") renderHoy();
  if (viewName === "bancales") renderBeds();
  if (viewName === "plantas") renderPlants();
  if (viewName === "catalogo") renderCatalogoTab();
  if (viewName === "cosecha") renderCosechaView();
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
document.getElementById("fab-add").addEventListener("click", () => {
  if (currentView === "cosecha") {
    openQuickCosechaForm();
  } else {
    openSheet("sheet-fab-choice");
  }
});
document.getElementById("choice-bed").addEventListener("click", () => {
  closeAllSheets();
  openBedForm(null);
});
document.getElementById("choice-plant").addEventListener("click", () => {
  closeAllSheets();
  state.targetBedForNewPlant = null;
  openPlantForm(null);
});
document.getElementById("choice-catalog").addEventListener("click", () => {
  closeAllSheets();
  openCatalogForm(null);
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
  updateDateFieldsVisibility();
});
document.getElementById("plant-selected-slot").addEventListener("click", (e) => {
  if (e.target.id === "btn-clear-catalog") {
    state.selectedCatalogId = null;
    renderSelectedCatalogPlant(null);
    updateCompanionHintsInForm();
    updateDateFieldsVisibility();
  }
});

// Muestra u oculta los campos de flor/fruto según si la especie elegida los tiene
// (ej: cebolla o lechuga se cosechan directo después del brote, sin pasar por flor/fruto).
function updateDateFieldsVisibility() {
  const tipo = cycleType(state.selectedCatalogId);
  const showFlor = tipo !== "sinFlorFruto";
  const showFruto = tipo === "full";
  document.getElementById("field-flor-semilla").style.display = showFlor ? "block" : "none";
  document.getElementById("field-fruto-semilla").style.display = showFruto ? "block" : "none";
  document.getElementById("field-flor-plantin").style.display = showFlor ? "block" : "none";
  document.getElementById("field-fruto-plantin").style.display = showFruto ? "block" : "none";
}

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
    document.getElementById("plant-cantidad").value = plant.cantidad || 1;
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
    document.getElementById("plant-cantidad").value = 1;
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
  updateDateFieldsVisibility();
  updateCompanionHintsInForm();
  openSheet("sheet-plant-form");
}

document.getElementById("btn-save-plant").addEventListener("click", () => {
  const bedId = document.getElementById("plant-bed-select").value || null;
  const nombrePersonalizado = document.getElementById("plant-nombre-custom").value.trim() || null;
  const variedad = document.getElementById("plant-variedad").value.trim();
  const cantidad = Math.max(1, parseInt(document.getElementById("plant-cantidad").value, 10) || 1);
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
      catalogId: state.selectedCatalogId, nombrePersonalizado, variedad, cantidad, bedId, origen: state.plantOrigen, fechas, notas
    });
    toast("Planta actualizada");
  } else {
    Store.addPlant({
      catalogId: state.selectedCatalogId, nombrePersonalizado, variedad, cantidad, bedId, origen: state.plantOrigen, fechas, notas
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
  if (e.target.id === "btn-add-bitacora") {
    openBitacoraForm(state.currentPlantId);
  }
  if (e.target.id === "btn-change-cantidad") {
    openCantidadForm(state.currentPlantId);
  }
  const photoImg = e.target.closest("[data-photo-entry-id][data-context='bitacora']");
  if (photoImg) {
    openPhotoView(photoImg.src, "bitacora", photoImg.dataset.photoEntryId, photoImg.dataset.plantId);
  }
});

// ---------- Fotos: ver en grande y eliminar ----------
function openPhotoView(url, context, entryId, parentId) {
  state.photoViewContext = { context, entryId, parentId };
  document.getElementById("photo-view-body").innerHTML = `
    <img src="${url}" style="width:100%; border-radius:12px; margin-bottom:12px;">
    <button class="btn btn-danger btn-block" id="btn-delete-photo">Eliminar foto</button>
  `;
  openSheet("sheet-photo-view");
}

document.getElementById("photo-view-body").addEventListener("click", (e) => {
  if (e.target.id !== "btn-delete-photo") return;
  if (!confirm("¿Eliminar esta foto?")) return;
  const { context, entryId, parentId } = state.photoViewContext;
  if (context === "bed") {
    Store.deleteBedPhoto(parentId, entryId);
    closeAllSheets();
    renderBedPhotosGrid(parentId);
  } else if (context === "bitacora") {
    Store.deleteBitacoraEntry(parentId, entryId);
    closeAllSheets();
    const plant = Store.getPlants().find(p => p.id === parentId);
    if (plant) renderBitacoraTimeline(plant);
  }
  toast("Foto eliminada");
});

// ---------- Fotos de bancal ----------
document.getElementById("btn-add-bed-photo").addEventListener("click", () => {
  document.getElementById("bed-photo-input").click();
});
document.getElementById("bed-photo-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  toast("Guardando foto...");
  try {
    const blob = await PhotoStore.compressImage(file);
    const fotoId = PhotoStore.newPhotoId();
    await PhotoStore.save(fotoId, blob);
    Store.addBedPhoto(state.currentBedId, { fotoId });
    renderBedPhotosGrid(state.currentBedId);
    toast("Foto agregada");
  } catch (err) {
    toast("No se pudo guardar la foto");
  }
  e.target.value = "";
});
document.getElementById("bed-photos-grid").addEventListener("click", (e) => {
  const img = e.target.closest("[data-photo-entry-id][data-context='bed']");
  if (!img) return;
  openPhotoView(img.src, "bed", img.dataset.photoEntryId, img.dataset.bedId);
});

// ---------- Bitácora de planta (fotos + notas a lo largo del tiempo) ----------
function openBitacoraForm(plantId) {
  state.currentBitacoraPlantId = plantId;
  state.bitacoraPhotoBlob = null;
  document.getElementById("bitacora-photo-preview").innerHTML = "";
  document.getElementById("bitacora-fecha").value = new Date().toISOString().slice(0, 10);
  document.getElementById("bitacora-etapa").value = "";
  document.getElementById("bitacora-gramos").value = "";
  document.getElementById("bitacora-frutos").value = "";
  document.getElementById("bitacora-cosecha-fields").style.display = "none";
  document.getElementById("bitacora-nota").value = "";
  openSheet("sheet-bitacora-form");
}
document.getElementById("bitacora-etapa").addEventListener("change", (e) => {
  document.getElementById("bitacora-cosecha-fields").style.display = e.target.value === "cosecha" ? "block" : "none";
});
document.getElementById("btn-pick-bitacora-photo").addEventListener("click", () => {
  document.getElementById("bitacora-photo-input").click();
});
document.getElementById("bitacora-photo-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const blob = await PhotoStore.compressImage(file);
    state.bitacoraPhotoBlob = blob;
    const url = URL.createObjectURL(blob);
    document.getElementById("bitacora-photo-preview").innerHTML = `<img src="${url}" style="width:100%; border-radius:10px; margin-top:6px;">`;
  } catch (err) {
    toast("No se pudo procesar la foto");
  }
  e.target.value = "";
});
document.getElementById("btn-save-bitacora").addEventListener("click", async () => {
  const fecha = document.getElementById("bitacora-fecha").value || new Date().toISOString().slice(0, 10);
  const etapa = document.getElementById("bitacora-etapa").value || null;
  const nota = document.getElementById("bitacora-nota").value.trim();
  const gramos = etapa === "cosecha" ? parseFloat(document.getElementById("bitacora-gramos").value) || null : null;
  const cantidadFrutos = etapa === "cosecha" ? parseInt(document.getElementById("bitacora-frutos").value, 10) || null : null;
  if (!nota && !state.bitacoraPhotoBlob && !gramos) { toast("Agregá una foto, una nota o los gramos cosechados"); return; }
  let fotoId = null;
  if (state.bitacoraPhotoBlob) {
    fotoId = PhotoStore.newPhotoId();
    await PhotoStore.save(fotoId, state.bitacoraPhotoBlob);
  }
  Store.addBitacoraEntry(state.currentBitacoraPlantId, { etapa, nota, fotoId, fecha, gramos, cantidadFrutos });
  closeAllSheets();
  const plant = Store.getPlants().find(p => p.id === state.currentBitacoraPlantId);
  if (plant) renderBitacoraTimeline(plant);
  toast(gramos ? "Cosecha registrada" : "Agregado a la bitácora");
});

// ---------- Cambio de cantidad de plantas ----------
function openCantidadForm(plantId) {
  state.currentPlantId = plantId;
  const plant = Store.getPlants().find(p => p.id === plantId);
  document.getElementById("cantidad-nueva").value = plant ? (plant.cantidad || 1) : 1;
  document.getElementById("cantidad-fecha").value = new Date().toISOString().slice(0, 10);
  document.getElementById("cantidad-nota").value = "";
  openSheet("sheet-cantidad-form");
}
document.getElementById("btn-save-cantidad").addEventListener("click", () => {
  const nueva = parseInt(document.getElementById("cantidad-nueva").value, 10);
  if (isNaN(nueva) || nueva < 0) { toast("Poné una cantidad válida"); return; }
  const fecha = document.getElementById("cantidad-fecha").value || new Date().toISOString().slice(0, 10);
  const nota = document.getElementById("cantidad-nota").value.trim();
  Store.updatePlantCantidad(state.currentPlantId, nueva, fecha, nota);
  closeAllSheets();
  renderPlantDetail(state.currentPlantId);
  toast("Cantidad actualizada");
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
  document.getElementById("settings-dias-aviso").value = s.diasAviso;
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
  const diasAviso = Math.max(1, Math.min(7, parseInt(document.getElementById("settings-dias-aviso").value, 10) || 3));
  Store.saveSettings({ lugar, lat, lon, umbralHelada, umbralViento, diasAviso });
  toast("Ubicación guardada");
});

document.getElementById("btn-manual-backup").addEventListener("click", async () => {
  toast("Preparando respaldo...");
  await Backup.downloadBackup("huerto-backup");
  toast("Respaldo descargado");
});

document.getElementById("btn-import-backup").addEventListener("click", () => {
  document.getElementById("import-file-input").click();
});
document.getElementById("import-file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (!confirm("Esto reemplazará los datos actuales con los del respaldo. ¿Continuar?")) return;
      toast("Importando...");
      await Store.importAll(data);
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

document.getElementById("hoy-stats").addEventListener("click", (e) => {
  const pill = e.target.closest("[data-filter-type]");
  if (!pill) return;
  const tipo = pill.dataset.filterType;
  if (hoyFilterType === tipo) {
    hoyFilterType = null;
    hoyFilterValue = null;
  } else {
    hoyFilterType = tipo;
    hoyFilterValue = null;
  }
  renderHoy();
});
document.getElementById("hoy-filter-row").addEventListener("click", (e) => {
  const chip = e.target.closest(".filter-chip");
  if (!chip) return;
  const id = chip.dataset.filterId;
  hoyFilterValue = hoyFilterValue === id ? null : id;
  renderHoy();
});

// ---------- Cosecha (rendimiento) ----------
document.getElementById("btn-open-cosecha-quick").addEventListener("click", openQuickCosechaForm);

function openQuickCosechaForm() {
  const beds = Store.getBeds();
  const bedSelect = document.getElementById("cosecha-quick-bed");
  bedSelect.innerHTML = beds.map(b => `<option value="${b.id}">${bedTypeIcon(b.tipo)} ${escapeHTML(b.nombre)}</option>`).join("")
    || `<option value="">Sin bancales — creá uno primero</option>`;
  populateQuickPlantSelect(bedSelect.value);
  document.getElementById("cosecha-quick-gramos").value = "";
  document.getElementById("cosecha-quick-frutos").value = "";
  document.getElementById("cosecha-quick-fecha").value = new Date().toISOString().slice(0, 10);
  document.getElementById("cosecha-quick-nota").value = "";
  openSheet("sheet-cosecha-quick");
}

function populateQuickPlantSelect(bedId) {
  const plants = bedId ? Store.getPlantsByBed(bedId) : [];
  const select = document.getElementById("cosecha-quick-plant");
  select.innerHTML = plants.map(p => `<option value="${p.id}">${plantIcon(p)} ${escapeHTML(plantDisplayName(p))}</option>`).join("")
    || `<option value="">Sin plantas activas en este bancal</option>`;
}
document.getElementById("cosecha-quick-bed").addEventListener("change", (e) => populateQuickPlantSelect(e.target.value));

function saveQuickCosecha(keepOpen) {
  const plantId = document.getElementById("cosecha-quick-plant").value;
  if (!plantId) { toast("Elegí una planta"); return; }
  const gramos = parseFloat(document.getElementById("cosecha-quick-gramos").value);
  if (!gramos || gramos <= 0) { toast("Poné los gramos cosechados"); return; }
  const cantidadFrutos = parseInt(document.getElementById("cosecha-quick-frutos").value, 10) || null;
  const fecha = document.getElementById("cosecha-quick-fecha").value || new Date().toISOString().slice(0, 10);
  const nota = document.getElementById("cosecha-quick-nota").value.trim();
  Store.addBitacoraEntry(plantId, { etapa: "cosecha", gramos, cantidadFrutos, fecha, nota });
  toast("Cosecha registrada");
  if (keepOpen) {
    document.getElementById("cosecha-quick-gramos").value = "";
    document.getElementById("cosecha-quick-frutos").value = "";
    document.getElementById("cosecha-quick-nota").value = "";
  } else {
    closeAllSheets();
  }
  renderCosechaView();
}
document.getElementById("btn-save-cosecha-quick").addEventListener("click", () => saveQuickCosecha(false));
document.getElementById("btn-save-cosecha-quick-otra").addEventListener("click", () => saveQuickCosecha(true));

document.getElementById("cosecha-periodo-control").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  cosechaPeriodo = btn.dataset.val;
  renderCosechaView();
});
document.getElementById("cosecha-agrupar-control").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  cosechaAgrupar = btn.dataset.val;
  renderCosechaView();
});

// ---------- Catálogo (recetario de plantas) ----------
document.getElementById("catalogo-tab-control").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  document.querySelectorAll("#catalogo-tab-control button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  catalogoActiveSubtab = btn.dataset.val;
  document.getElementById("catalogo-plantas-tab").style.display = catalogoActiveSubtab === "plantas" ? "block" : "none";
  document.getElementById("catalogo-calendario-tab").style.display = catalogoActiveSubtab === "calendario" ? "block" : "none";
  renderCatalogoTab();
});

document.getElementById("catalogo-search").addEventListener("input", (e) => {
  catalogoSearchTerm = e.target.value;
  renderCatalogoLista();
});
document.getElementById("catalogo-filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".filter-chip");
  if (!chip) return;
  catalogoFilterCategory = chip.dataset.cat;
  renderCatalogoLista();
});
document.getElementById("calendario-meses").addEventListener("click", (e) => {
  const chip = e.target.closest(".filter-chip");
  if (!chip) return;
  catalogoMesSeleccionado = parseInt(chip.dataset.mes, 10);
  renderCalendarioLista();
});

function openCatalogDetail(id) {
  state.currentCatalogDetailId = id;
  renderCatalogDetail(id);
  openSheet("sheet-catalog-detail");
}
document.getElementById("catalogo-list").addEventListener("click", (e) => {
  const pick = e.target.closest("[data-catalog-detail-id]");
  if (!pick) return;
  openCatalogDetail(pick.dataset.catalogDetailId);
});
document.getElementById("calendario-list").addEventListener("click", (e) => {
  const pick = e.target.closest("[data-catalog-detail-id]");
  if (!pick) return;
  openCatalogDetail(pick.dataset.catalogDetailId);
});
document.getElementById("catalog-detail-body").addEventListener("click", (e) => {
  if (e.target.id === "btn-edit-catalog-entry") {
    closeAllSheets();
    openCatalogForm(state.currentCatalogDetailId);
  }
  if (e.target.id === "btn-reset-catalog-entry") {
    if (!confirm("¿Restablecer esta especie a sus valores originales? Se perderán tus cambios.")) return;
    Store.clearCatalogOverride(state.currentCatalogDetailId);
    closeAllSheets();
    renderCatalogoTab();
    toast("Especie restablecida");
  }
  if (e.target.id === "btn-remove-catalog-entry") {
    if (!confirm("¿Eliminar esta especie del catálogo?")) return;
    Store.deleteCustomCatalogEntry(state.currentCatalogDetailId);
    closeAllSheets();
    renderCatalogoTab();
    toast("Especie eliminada");
  }
});

// --- Formulario manual del catálogo ---
const ICONOS_SUGERIDOS = ["🍅", "🌶️", "🍆", "🥬", "🥕", "🧅", "🧄", "🎃", "🍉", "🍈", "🌽", "🫘", "🥒", "🥔",
  "🍓", "🍋", "🍊", "🌻", "🌼", "🌹", "💐", "🌾", "🌿", "🍄", "🌵", "🪻", "🌸", "🍇", "🍑", "🌰"];

function renderCatIconoSugeridos() {
  document.getElementById("cat-icono-sugeridos").innerHTML = ICONOS_SUGERIDOS.map(ic =>
    `<button type="button" class="filter-chip" data-icono="${ic}" style="font-size:1rem; padding:6px 10px;">${ic}</button>`
  ).join("");
}
document.getElementById("cat-icono-sugeridos").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  document.getElementById("cat-icono").value = btn.dataset.icono;
});

function fillCatalogForm(data) {
  document.getElementById("cat-nombre").value = data.nombre || "";
  document.getElementById("cat-icono").value = data.icono || "";
  document.getElementById("cat-categoria").value = data.categoria || "hortaliza";
  document.getElementById("cat-sol").value = data.sol || "pleno";
  document.getElementById("cat-agua").value = data.agua || "medio";
  document.getElementById("cat-riego").value = data.riego || "";
  document.getElementById("cat-fertilizante").value = data.fertilizante || "";
  document.getElementById("cat-espaciado").value = data.espaciado || "";
  document.getElementById("cat-germinacion").value = data.diasGerminacion || "";
  document.getElementById("cat-cosecha").value = data.diasCosecha || "";
  document.getElementById("cat-manejo-posterior").value = data.manejoPosterior || "";
  document.getElementById("cat-notas").value = data.notas || "";
  const helada = !!data.heladaSensible;
  document.querySelectorAll("#cat-helada-control button").forEach(b => b.classList.toggle("active", b.dataset.val === (helada ? "si" : "no")));
  const perenne = !!data.perenne;
  document.querySelectorAll("#cat-perenne-control button").forEach(b => b.classList.toggle("active", b.dataset.val === (perenne ? "si" : "no")));
}

function renderCatMesesChips() {
  document.getElementById("cat-meses-siembra").innerHTML = MESES_CORTOS.map((m, i) =>
    `<button type="button" class="filter-chip ${state.catalogMesesSeleccionados.includes(i + 1) ? "active" : ""}" data-mes="${i + 1}">${m}</button>`
  ).join("");
}
document.getElementById("cat-meses-siembra").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const mes = parseInt(btn.dataset.mes, 10);
  const idx = state.catalogMesesSeleccionados.indexOf(mes);
  if (idx === -1) state.catalogMesesSeleccionados.push(mes);
  else state.catalogMesesSeleccionados.splice(idx, 1);
  renderCatMesesChips();
});

document.getElementById("cat-helada-control").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  document.querySelectorAll("#cat-helada-control button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
});
document.getElementById("cat-perenne-control").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  document.querySelectorAll("#cat-perenne-control button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
});

// state.editingCatalogId puede ser: null (nueva especie personalizada), un id "custom_..."
// (especie personalizada existente), o un id del catálogo incluido (ej. "tomate") que se
// guarda como override en vez de reemplazar el original.
function openCatalogForm(id) {
  state.editingCatalogId = id;
  const deleteBtn = document.getElementById("btn-delete-catalog");
  const resetBtn = document.getElementById("btn-reset-catalog");
  const builtinNote = document.getElementById("catalog-form-builtin-note");
  renderCatIconoSugeridos();

  if (id) {
    const cat = getCatalogPlant(id);
    if (!cat) return;
    document.getElementById("catalog-form-title").textContent = "Editar especie";
    fillCatalogForm(cat);
    state.catalogMesesSeleccionados = getMesesSiembra(id) ? [...getMesesSiembra(id)] : [];
    if (cat.personalizada) {
      deleteBtn.style.display = "block";
      resetBtn.style.display = "none";
      builtinNote.style.display = "none";
    } else {
      deleteBtn.style.display = "none";
      resetBtn.style.display = cat.esOverride ? "block" : "none";
      builtinNote.style.display = "block";
    }
  } else {
    document.getElementById("catalog-form-title").textContent = "Nueva especie";
    fillCatalogForm({});
    state.catalogMesesSeleccionados = [];
    deleteBtn.style.display = "none";
    resetBtn.style.display = "none";
    builtinNote.style.display = "none";
  }
  renderCatMesesChips();
  openSheet("sheet-catalog-form");
}

document.getElementById("btn-save-catalog").addEventListener("click", () => {
  const nombre = document.getElementById("cat-nombre").value.trim();
  if (!nombre) { toast("Ponele un nombre a la especie"); return; }
  const heladaSensible = document.querySelector("#cat-helada-control button.active").dataset.val === "si";
  const perenne = document.querySelector("#cat-perenne-control button.active").dataset.val === "si";
  const fields = {
    nombre,
    icono: document.getElementById("cat-icono").value.trim(),
    categoria: document.getElementById("cat-categoria").value,
    sol: document.getElementById("cat-sol").value,
    agua: document.getElementById("cat-agua").value,
    riego: document.getElementById("cat-riego").value.trim(),
    fertilizante: document.getElementById("cat-fertilizante").value.trim(),
    espaciado: document.getElementById("cat-espaciado").value.trim(),
    diasGerminacion: document.getElementById("cat-germinacion").value.trim(),
    diasCosecha: document.getElementById("cat-cosecha").value.trim(),
    heladaSensible,
    perenne,
    manejoPosterior: document.getElementById("cat-manejo-posterior").value.trim(),
    mesesSiembra: [...state.catalogMesesSeleccionados].sort((a, b) => a - b),
    notas: document.getElementById("cat-notas").value.trim()
  };

  const isBuiltin = state.editingCatalogId && BUILTIN_CATALOG.some(p => p.id === state.editingCatalogId);
  if (isBuiltin) {
    Store.setCatalogOverride(state.editingCatalogId, fields);
    toast("Especie actualizada");
  } else if (state.editingCatalogId) {
    Store.updateCustomCatalogEntry(state.editingCatalogId, { ...fields, buenos: [], malos: [] });
    toast("Especie actualizada");
  } else {
    Store.addCustomCatalogEntry({ ...fields, buenos: [], malos: [] });
    toast("Especie agregada al catálogo");
  }
  closeAllSheets();
  renderCatalogoTab();
});

document.getElementById("btn-reset-catalog").addEventListener("click", () => {
  if (!state.editingCatalogId) return;
  if (!confirm("¿Restablecer esta especie a sus valores originales? Se perderán tus cambios.")) return;
  Store.clearCatalogOverride(state.editingCatalogId);
  closeAllSheets();
  renderCatalogoTab();
  toast("Especie restablecida");
});

document.getElementById("btn-delete-catalog").addEventListener("click", () => {
  if (!state.editingCatalogId) return;
  if (!confirm("¿Eliminar esta especie del catálogo? Las plantas que ya la usan van a mantener sus datos, pero dejarán de mostrar sus recomendaciones.")) return;
  Store.deleteCustomCatalogEntry(state.editingCatalogId);
  closeAllSheets();
  renderCatalogoTab();
  toast("Especie eliminada");
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
async function init() {
  migrateOldBedTypes();
  loadSettingsForm();
  switchView("hoy");
  await Backup.maybeAutoBackup();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
init();
