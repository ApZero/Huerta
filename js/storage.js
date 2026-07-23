// Capa de almacenamiento: bancales, plantas, historial y respaldo automático.
const STORAGE_KEYS = {
  beds: "huerto_beds",
  plants: "huerto_plants",
  backupMeta: "huerto_backup_meta",
  settings: "huerto_settings",
  customCatalog: "huerto_custom_catalog",
  catalogOverrides: "huerto_catalog_overrides"
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Error leyendo", key, e);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Store = {
  getBeds() { return loadJSON(STORAGE_KEYS.beds, []); },
  saveBeds(beds) { saveJSON(STORAGE_KEYS.beds, beds); },

  addBed({ nombre, tipo, notas }) {
    const beds = this.getBeds();
    const bed = { id: uid(), nombre, tipo, notas: notas || "", creado: new Date().toISOString(), fotos: [] };
    beds.push(bed);
    this.saveBeds(beds);
    return bed;
  },

  updateBed(id, changes) {
    const beds = this.getBeds();
    const idx = beds.findIndex(b => b.id === id);
    if (idx === -1) return null;
    beds[idx] = { ...beds[idx], ...changes };
    this.saveBeds(beds);
    return beds[idx];
  },

  deleteBed(id) {
    const bed = this.getBeds().find(b => b.id === id);
    const beds = this.getBeds().filter(b => b.id !== id);
    this.saveBeds(beds);
    // Las plantas de ese bancal quedan sin bancal (huérfanas visibles para reasignar)
    const plants = this.getPlants().map(p => p.bedId === id ? { ...p, bedId: null } : p);
    this.savePlants(plants);
    // Borra también las fotos guardadas de ese bancal
    if (bed && bed.fotos) bed.fotos.forEach(f => PhotoStore.delete(f.id).catch(() => {}));
  },

  addBedPhoto(bedId, { fotoId, fecha, nota }) {
    const beds = this.getBeds();
    const idx = beds.findIndex(b => b.id === bedId);
    if (idx === -1) return null;
    const entry = { id: uid(), fotoId, fecha: fecha || new Date().toISOString().slice(0, 10), nota: nota || "" };
    beds[idx].fotos = [...(beds[idx].fotos || []), entry];
    this.saveBeds(beds);
    return entry;
  },

  deleteBedPhoto(bedId, entryId) {
    const beds = this.getBeds();
    const idx = beds.findIndex(b => b.id === bedId);
    if (idx === -1) return;
    const entry = (beds[idx].fotos || []).find(f => f.id === entryId);
    beds[idx].fotos = (beds[idx].fotos || []).filter(f => f.id !== entryId);
    this.saveBeds(beds);
    if (entry) PhotoStore.delete(entry.fotoId).catch(() => {});
  },

  getPlants() { return loadJSON(STORAGE_KEYS.plants, []); },
  savePlants(plants) { saveJSON(STORAGE_KEYS.plants, plants); },

  getPlantsByBed(bedId) { return this.getPlants().filter(p => p.bedId === bedId && p.activa !== false); },

  addPlant({ catalogId, nombrePersonalizado, variedad, bedId, origen, fechas, notas }) {
    const plants = this.getPlants();
    const now = new Date().toISOString();
    const plant = {
      id: uid(),
      catalogId: catalogId || null,
      nombrePersonalizado: nombrePersonalizado || null,
      variedad: variedad || "",
      bedId: bedId || null,
      origen: origen, // 'semilla' | 'plantin'
      fechas: fechas || {}, // {siembra, brote, primeraFlor, primerFruto, trasplante}
      notas: notas || "",
      activa: true,
      historial: [{ fecha: now, evento: "creada", bedId: bedId || null }],
      bitacora: [] // registro visual: fotos + notas a lo largo del tiempo
    };
    plants.push(plant);
    this.savePlants(plants);
    return plant;
  },

  updatePlant(id, changes) {
    const plants = this.getPlants();
    const idx = plants.findIndex(p => p.id === id);
    if (idx === -1) return null;
    plants[idx] = { ...plants[idx], ...changes };
    this.savePlants(plants);
    return plants[idx];
  },

  movePlant(id, newBedId, fecha, nota) {
    const plants = this.getPlants();
    const idx = plants.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const evento = { fecha: fecha || new Date().toISOString(), evento: "trasplante", bedId: newBedId, nota: nota || "" };
    plants[idx].bedId = newBedId;
    plants[idx].historial = [...(plants[idx].historial || []), evento];
    this.savePlants(plants);
    return plants[idx];
  },

  addBitacoraEntry(plantId, { etapa, nota, fotoId, fecha }) {
    const plants = this.getPlants();
    const idx = plants.findIndex(p => p.id === plantId);
    if (idx === -1) return null;
    const entry = { id: uid(), fecha: fecha || new Date().toISOString().slice(0, 10), etapa: etapa || null, nota: nota || "", fotoId: fotoId || null };
    plants[idx].bitacora = [...(plants[idx].bitacora || []), entry];
    this.savePlants(plants);
    return entry;
  },

  deleteBitacoraEntry(plantId, entryId) {
    const plants = this.getPlants();
    const idx = plants.findIndex(p => p.id === plantId);
    if (idx === -1) return;
    const entry = (plants[idx].bitacora || []).find(e => e.id === entryId);
    plants[idx].bitacora = (plants[idx].bitacora || []).filter(e => e.id !== entryId);
    this.savePlants(plants);
    if (entry && entry.fotoId) PhotoStore.delete(entry.fotoId).catch(() => {});
  },

  archivePlant(id) {
    return this.updatePlant(id, { activa: false });
  },

  deletePlant(id) {
    const plant = this.getPlants().find(p => p.id === id);
    const plants = this.getPlants().filter(p => p.id !== id);
    this.savePlants(plants);
    if (plant && plant.bitacora) plant.bitacora.forEach(e => { if (e.fotoId) PhotoStore.delete(e.fotoId).catch(() => {}); });
  },

  getSettings() {
    const defaults = { lat: -22.34, lon: -60.03, lugar: "Filadelfia, Chaco, Paraguay", umbralHelada: 3, umbralViento: 40, diasAviso: 3 };
    const saved = loadJSON(STORAGE_KEYS.settings, {});
    return { ...defaults, ...saved };
  },
  saveSettings(s) { saveJSON(STORAGE_KEYS.settings, s); },

  // --- Catálogo personalizado (plantas agregadas por el usuario) ---
  getCustomCatalog() { return loadJSON(STORAGE_KEYS.customCatalog, []); },
  saveCustomCatalog(list) { saveJSON(STORAGE_KEYS.customCatalog, list); },

  addCustomCatalogEntry(entry) {
    const list = this.getCustomCatalog();
    const item = { ...entry, id: entry.id || ("custom_" + uid()), personalizada: true };
    list.push(item);
    this.saveCustomCatalog(list);
    return item;
  },

  updateCustomCatalogEntry(id, changes) {
    const list = this.getCustomCatalog();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...changes };
    this.saveCustomCatalog(list);
    return list[idx];
  },

  deleteCustomCatalogEntry(id) {
    const list = this.getCustomCatalog().filter(p => p.id !== id);
    this.saveCustomCatalog(list);
  },

  // --- Overrides sobre el catálogo incluido (para poder editar especies hardcodeadas) ---
  getCatalogOverrides() { return loadJSON(STORAGE_KEYS.catalogOverrides, {}); },
  saveCatalogOverrides(obj) { saveJSON(STORAGE_KEYS.catalogOverrides, obj); },

  setCatalogOverride(id, changes) {
    const overrides = this.getCatalogOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...changes };
    this.saveCatalogOverrides(overrides);
  },

  clearCatalogOverride(id) {
    const overrides = this.getCatalogOverrides();
    delete overrides[id];
    this.saveCatalogOverrides(overrides);
  },

  async exportAll() {
    let photos = [];
    try {
      const entries = await PhotoStore.getAllEntries();
      photos = await Promise.all(entries.map(async e => ({ id: e.id, dataURL: await PhotoStore.blobToDataURL(e.blob) })));
    } catch (e) {
      console.error("No se pudieron incluir las fotos en el respaldo", e);
    }
    return {
      version: 1,
      exportadoEn: new Date().toISOString(),
      beds: this.getBeds(),
      plants: this.getPlants(),
      settings: this.getSettings(),
      customCatalog: this.getCustomCatalog(),
      catalogOverrides: this.getCatalogOverrides(),
      photos
    };
  },

  async importAll(data) {
    if (!data || typeof data !== "object") throw new Error("Archivo inválido");
    if (Array.isArray(data.beds)) this.saveBeds(data.beds);
    if (Array.isArray(data.plants)) this.savePlants(data.plants);
    if (data.settings) this.saveSettings(data.settings);
    if (Array.isArray(data.customCatalog)) this.saveCustomCatalog(data.customCatalog);
    if (data.catalogOverrides) this.saveCatalogOverrides(data.catalogOverrides);
    if (Array.isArray(data.photos)) {
      for (const p of data.photos) {
        try {
          const blob = PhotoStore.dataURLToBlob(p.dataURL);
          await PhotoStore.save(p.id, blob);
        } catch (e) {
          console.error("No se pudo restaurar una foto", e);
        }
      }
    }
  }
};

// --- Respaldo automático diario ---
const Backup = {
  getMeta() { return loadJSON(STORAGE_KEYS.backupMeta, { lastAutoBackup: null }); },
  setMeta(meta) { saveJSON(STORAGE_KEYS.backupMeta, meta); },

  todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },

  async downloadBackup(filenamePrefix = "huerto-backup") {
    const data = await Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${this.todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  async maybeAutoBackup() {
    const meta = this.getMeta();
    const today = this.todayStr();
    if (meta.lastAutoBackup !== today) {
      // Solo si hay algo que respaldar
      if (Store.getBeds().length > 0 || Store.getPlants().length > 0) {
        await this.downloadBackup("huerto-autobackup");
      }
      this.setMeta({ lastAutoBackup: today });
      return true;
    }
    return false;
  }
};
