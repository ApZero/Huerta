// Capa de almacenamiento: bancales, plantas, historial y respaldo automático.
const STORAGE_KEYS = {
  beds: "huerto_beds",
  plants: "huerto_plants",
  backupMeta: "huerto_backup_meta",
  settings: "huerto_settings",
  customCatalog: "huerto_custom_catalog"
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
    const bed = { id: uid(), nombre, tipo, notas: notas || "", creado: new Date().toISOString() };
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
    const beds = this.getBeds().filter(b => b.id !== id);
    this.saveBeds(beds);
    // Las plantas de ese bancal quedan sin bancal (huérfanas visibles para reasignar)
    const plants = this.getPlants().map(p => p.bedId === id ? { ...p, bedId: null } : p);
    this.savePlants(plants);
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
      historial: [{ fecha: now, evento: "creada", bedId: bedId || null }]
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

  archivePlant(id) {
    return this.updatePlant(id, { activa: false });
  },

  deletePlant(id) {
    const plants = this.getPlants().filter(p => p.id !== id);
    this.savePlants(plants);
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

  exportAll() {
    return {
      version: 1,
      exportadoEn: new Date().toISOString(),
      beds: this.getBeds(),
      plants: this.getPlants(),
      settings: this.getSettings(),
      customCatalog: this.getCustomCatalog()
    };
  },

  importAll(data) {
    if (!data || typeof data !== "object") throw new Error("Archivo inválido");
    if (Array.isArray(data.beds)) this.saveBeds(data.beds);
    if (Array.isArray(data.plants)) this.savePlants(data.plants);
    if (data.settings) this.saveSettings(data.settings);
    if (Array.isArray(data.customCatalog)) this.saveCustomCatalog(data.customCatalog);
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

  downloadBackup(filenamePrefix = "huerto-backup") {
    const data = Store.exportAll();
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

  maybeAutoBackup() {
    const meta = this.getMeta();
    const today = this.todayStr();
    if (meta.lastAutoBackup !== today) {
      // Solo si hay algo que respaldar
      if (Store.getBeds().length > 0 || Store.getPlants().length > 0) {
        this.downloadBackup("huerto-autobackup");
      }
      this.setMeta({ lastAutoBackup: today });
      return true;
    }
    return false;
  }
};
