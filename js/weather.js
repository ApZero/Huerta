// Clima y alertas de helada usando Open-Meteo (sin API key).
const Weather = {
  cacheKey: "huerto_weather_cache",

  async getForecast(force = false) {
    const settings = Store.getSettings();
    const cache = loadJSON(this.cacheKey, null);
    const now = Date.now();
    if (!force && cache && (now - cache.ts) < 1000 * 60 * 60 && cache.lat === settings.lat && cache.lon === settings.lon) {
      return cache.data;
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max,windgusts_10m_max` +
      `&current=temperature_2m,weathercode` +
      `&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo obtener el clima");
    const data = await res.json();
    saveJSON(this.cacheKey, { ts: now, lat: settings.lat, lon: settings.lon, data });
    return data;
  },

  weatherCodeInfo(code) {
    const map = {
      0: { icono: "☀️", texto: "Despejado" }, 1: { icono: "🌤️", texto: "Mayormente despejado" },
      2: { icono: "⛅", texto: "Parcialmente nublado" }, 3: { icono: "☁️", texto: "Nublado" },
      45: { icono: "🌫️", texto: "Neblina" }, 48: { icono: "🌫️", texto: "Neblina escarchada" },
      51: { icono: "🌦️", texto: "Llovizna leve" }, 53: { icono: "🌦️", texto: "Llovizna" }, 55: { icono: "🌦️", texto: "Llovizna intensa" },
      61: { icono: "🌧️", texto: "Lluvia leve" }, 63: { icono: "🌧️", texto: "Lluvia" }, 65: { icono: "🌧️", texto: "Lluvia intensa" },
      71: { icono: "🌨️", texto: "Nieve leve" }, 80: { icono: "🌧️", texto: "Chubascos" }, 81: { icono: "🌧️", texto: "Chubascos" }, 82: { icono: "⛈️", texto: "Chubascos fuertes" },
      95: { icono: "⛈️", texto: "Tormenta" }, 96: { icono: "⛈️", texto: "Tormenta con granizo" }, 99: { icono: "⛈️", texto: "Tormenta con granizo" }
    };
    return map[code] || { icono: "🌡️", texto: "—" };
  },

  // Devuelve lista de días (próximos 7) con riesgo de helada según umbral configurado
  frostRisk(data) {
    const settings = Store.getSettings();
    const umbral = settings.umbralHelada ?? 3;
    const dias = data.daily.time.map((fecha, i) => ({
      fecha,
      min: data.daily.temperature_2m_min[i],
      max: data.daily.temperature_2m_max[i],
      precip: data.daily.precipitation_probability_max[i],
      code: data.daily.weathercode[i],
      helada: data.daily.temperature_2m_min[i] <= umbral
    }));
    return dias;
  },

  // Devuelve lista de días con riesgo de viento fuerte según umbral configurado (ráfagas en km/h)
  windRisk(data) {
    const settings = Store.getSettings();
    const umbral = settings.umbralViento ?? 40;
    const rafagas = data.daily.windgusts_10m_max || [];
    const velocidad = data.daily.windspeed_10m_max || [];
    return data.daily.time.map((fecha, i) => ({
      fecha,
      rafagaMax: rafagas[i],
      velocidadMax: velocidad[i],
      ventoFuerte: (rafagas[i] ?? 0) >= umbral
    }));
  }
};
