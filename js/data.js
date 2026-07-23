// Catálogo de plantas: recomendaciones de cultivo y combinaciones (asociación de cultivos).
// Cada planta tiene un id estable usado para relaciones de compañerismo.
const BUILTIN_CATALOG = [
  { id: "tomate", nombre: "Tomate", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular y profundo, 2-3 veces por semana. Evitar mojar el follaje para prevenir hongos.",
    fertilizante: "Rico en fósforo y potasio al florecer. Compost al trasplantar, refuerzo cada 3-4 semanas.",
    espaciado: "40-50 cm entre plantas.", diasGerminacion: "6-14 días", diasCosecha: "60-85 días desde trasplante",
    heladaSensible: true,
    buenos: ["albahaca", "zanahoria", "perejil", "cebolla", "caléndula", "espinaca"],
    malos: ["maiz", "papa", "hinojo", "repollo"],
    notas: "Entutorar para mejor aireación. Muy sensible a heladas." },
  { id: "pimiento", nombre: "Pimiento / Morrón", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego constante, suelo húmedo pero sin encharcar.",
    fertilizante: "Compost al plantar, refuerzo con potasio en floración.",
    espaciado: "35-45 cm entre plantas.", diasGerminacion: "10-21 días", diasCosecha: "60-90 días desde trasplante",
    heladaSensible: true,
    buenos: ["albahaca", "cebolla", "zanahoria", "caléndula"],
    malos: ["hinojo", "poroto"],
    notas: "Prefiere calor estable, ideal para el Chaco en primavera-verano." },
  { id: "berenjena", nombre: "Berenjena", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular, no dejar secar el suelo por completo.",
    fertilizante: "Compost rico al plantar, refuerzo mensual.",
    espaciado: "45-60 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "70-90 días desde trasplante",
    heladaSensible: true,
    buenos: ["poroto", "albahaca"],
    malos: [],
    notas: "Muy sensible al frío, no trasplantar hasta que no haya riesgo de helada." },
  { id: "lechuga", nombre: "Lechuga", categoria: "hortaliza", sol: "semisombra", agua: "medio",
    riego: "Riego frecuente y liviano, mantener el suelo siempre húmedo.",
    fertilizante: "Compost liviano al plantar, nitrógeno moderado.",
    espaciado: "20-30 cm entre plantas.", diasGerminacion: "3-10 días", diasCosecha: "45-60 días",
    heladaSensible: false,
    buenos: ["zanahoria", "rabanito", "cebolla", "fresa"],
    malos: ["perejil"],
    notas: "Tolera frío leve, mejor en meses más frescos del año." },
  { id: "zanahoria", nombre: "Zanahoria", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego constante y uniforme para evitar raíces deformes.",
    fertilizante: "Evitar exceso de nitrógeno; suelo suelto y bien drenado.",
    espaciado: "5-8 cm entre plantas.", diasGerminacion: "14-21 días", diasCosecha: "70-80 días",
    heladaSensible: false,
    buenos: ["tomate", "lechuga", "cebolla", "arveja"],
    malos: ["eneldo"],
    notas: "Suelo profundo y sin piedras para raíces derechas." },
  { id: "cebolla", nombre: "Cebolla", categoria: "hortaliza", sol: "pleno", agua: "bajo",
    riego: "Riego moderado, reducir hacia la cosecha.",
    fertilizante: "Compost al plantar, poco nitrógeno adicional.",
    espaciado: "10-15 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "90-120 días",
    heladaSensible: false,
    buenos: ["tomate", "zanahoria", "lechuga", "pimiento"],
    malos: ["poroto", "arveja"],
    notas: "Buen repelente natural de plagas para varios cultivos." },
  { id: "ajo", nombre: "Ajo", categoria: "hortaliza", sol: "pleno", agua: "bajo",
    riego: "Riego moderado, suspender semanas antes de cosechar.",
    fertilizante: "Compost al plantar, fósforo moderado.",
    espaciado: "10-15 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "150-210 días",
    heladaSensible: false,
    buenos: ["tomate", "zanahoria", "fresa"],
    malos: ["poroto", "arveja"],
    notas: "Ciclo largo, tolera bien el frío del invierno chaqueño." },
  { id: "calabacin", nombre: "Calabacín / Zapallito", categoria: "hortaliza", sol: "pleno", agua: "alto",
    riego: "Riego abundante y regular, sobre todo en floración.",
    fertilizante: "Compost rico, refuerzo con potasio en fructificación.",
    espaciado: "60-90 cm entre plantas.", diasGerminacion: "5-10 días", diasCosecha: "45-55 días",
    heladaSensible: true,
    buenos: ["maiz", "caléndula"],
    malos: ["papa"],
    notas: "Necesita polinizadores; plantar flores cercanas ayuda." },
  { id: "calabaza", nombre: "Calabaza / Zapallo", categoria: "hortaliza", sol: "pleno", agua: "alto",
    riego: "Riego profundo y regular.",
    fertilizante: "Compost rico al plantar.",
    espaciado: "90-120 cm entre plantas.", diasGerminacion: "5-10 días", diasCosecha: "80-110 días",
    heladaSensible: true,
    buenos: ["maiz", "poroto"],
    malos: ["papa"],
    notas: "Requiere mucho espacio; ideal en cama de cultivo en el suelo." },
  { id: "sandia", nombre: "Sandía", categoria: "fruta", sol: "pleno", agua: "alto",
    riego: "Riego profundo, reducir cerca de la cosecha para concentrar dulzor.",
    fertilizante: "Compost rico, potasio en fructificación.",
    espaciado: "90-180 cm entre plantas.", diasGerminacion: "7-10 días", diasCosecha: "80-100 días",
    heladaSensible: true,
    buenos: ["maiz"],
    malos: ["papa"],
    notas: "Muy adaptada al calor del Chaco en verano." },
  { id: "melon", nombre: "Melón", categoria: "fruta", sol: "pleno", agua: "alto",
    riego: "Riego regular, reducir antes de cosechar.",
    fertilizante: "Compost rico, potasio en floración.",
    espaciado: "60-90 cm entre plantas.", diasGerminacion: "5-10 días", diasCosecha: "70-90 días",
    heladaSensible: true,
    buenos: ["maiz"],
    malos: ["papa"],
    notas: "Muy sensible al frío nocturno." },
  { id: "maiz", nombre: "Maíz", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular, crítico durante la floración.",
    fertilizante: "Alto en nitrógeno, refuerzo cuando la planta tiene rodilla alta.",
    espaciado: "25-30 cm entre plantas.", diasGerminacion: "6-10 días", diasCosecha: "70-100 días",
    heladaSensible: true,
    buenos: ["poroto", "calabaza", "sandia", "melon"],
    malos: ["tomate"],
    notas: "La combinación maíz-poroto-zapallo (las tres hermanas) funciona muy bien." },
  { id: "poroto", nombre: "Poroto / Frijol", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego moderado, evitar encharcar.",
    fertilizante: "Poco nitrógeno (fija el suyo propio), compost liviano.",
    espaciado: "10-15 cm entre plantas.", diasGerminacion: "6-10 días", diasCosecha: "50-65 días",
    heladaSensible: true,
    buenos: ["maiz", "calabaza", "pepino", "berenjena"],
    malos: ["cebolla", "ajo"],
    notas: "Fija nitrógeno en el suelo, buen antecesor para hojas verdes." },
  { id: "arveja", nombre: "Arveja", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego moderado y constante.",
    fertilizante: "Poco nitrógeno adicional, fósforo moderado.",
    espaciado: "5-10 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "60-70 días",
    heladaSensible: false,
    buenos: ["zanahoria", "rabanito"],
    malos: ["cebolla", "ajo"],
    notas: "Tolera bien el fresco de invierno en el Chaco." },
  { id: "rucula", nombre: "Rúcula", categoria: "hortaliza", sol: "semisombra", agua: "medio",
    riego: "Riego frecuente y liviano.",
    fertilizante: "Compost liviano, nitrógeno moderado.",
    espaciado: "10-15 cm entre plantas.", diasGerminacion: "3-7 días", diasCosecha: "30-40 días",
    heladaSensible: false,
    buenos: ["zanahoria", "remolacha"],
    malos: [],
    notas: "Ciclo muy corto, ideal para siembras escalonadas." },
  { id: "espinaca", nombre: "Espinaca", categoria: "hortaliza", sol: "semisombra", agua: "medio",
    riego: "Riego regular, suelo siempre húmedo.",
    fertilizante: "Compost rico en nitrógeno.",
    espaciado: "15-20 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "40-50 días",
    heladaSensible: false,
    buenos: ["tomate", "fresa"],
    malos: [],
    notas: "Prefiere temperaturas frescas, sembrar en otoño-invierno." },
  { id: "acelga", nombre: "Acelga", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular.",
    fertilizante: "Compost al plantar, nitrógeno moderado.",
    espaciado: "20-30 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "50-60 días",
    heladaSensible: false,
    buenos: ["cebolla", "rabanito"],
    malos: [],
    notas: "Muy resistente, cosecha continua cortando hojas externas." },
  { id: "remolacha", nombre: "Remolacha", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego constante para raíces parejas.",
    fertilizante: "Compost moderado, evitar exceso de nitrógeno.",
    espaciado: "10-15 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "55-70 días",
    heladaSensible: false,
    buenos: ["cebolla", "rucula"],
    malos: ["poroto"],
    notas: "Suelo suelto y profundo para buen desarrollo de raíz." },
  { id: "rabanito", nombre: "Rabanito", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular y constante.",
    fertilizante: "Compost liviano, poco nitrógeno.",
    espaciado: "5 cm entre plantas.", diasGerminacion: "3-7 días", diasCosecha: "25-35 días",
    heladaSensible: false,
    buenos: ["lechuga", "arveja", "zanahoria"],
    malos: [],
    notas: "Muy rápido, ideal para intercalar entre plantas de ciclo largo." },
  { id: "pepino", nombre: "Pepino", categoria: "hortaliza", sol: "pleno", agua: "alto",
    riego: "Riego abundante y regular.",
    fertilizante: "Compost rico, potasio en floración.",
    espaciado: "40-60 cm entre plantas.", diasGerminacion: "5-10 días", diasCosecha: "50-70 días",
    heladaSensible: true,
    buenos: ["poroto", "maiz"],
    malos: ["papa"],
    notas: "Se beneficia de tutorado vertical para ahorrar espacio." },
  { id: "papa", nombre: "Papa", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular, reducir antes de cosechar.",
    fertilizante: "Compost al plantar, potasio moderado.",
    espaciado: "30-40 cm entre plantas.", diasGerminacion: "14-21 días", diasCosecha: "90-120 días",
    heladaSensible: true,
    buenos: ["maiz"],
    malos: ["tomate", "calabaza", "pepino", "girasol"],
    notas: "Aporcar la tierra a medida que crece." },
  { id: "repollo", nombre: "Repollo", categoria: "hortaliza", sol: "pleno", agua: "medio",
    riego: "Riego regular y constante.",
    fertilizante: "Compost rico en nitrógeno.",
    espaciado: "40-50 cm entre plantas.", diasGerminacion: "7-12 días", diasCosecha: "70-100 días",
    heladaSensible: false,
    buenos: ["cebolla", "remolacha"],
    malos: ["tomate", "fresa"],
    notas: "Prefiere clima fresco, mejor otoño-invierno en el Chaco." },
  { id: "albahaca", nombre: "Albahaca", categoria: "hierba", sol: "pleno", agua: "medio",
    riego: "Riego regular, no dejar secar por completo.",
    fertilizante: "Compost liviano, sin exceso de nitrógeno.",
    espaciado: "20-25 cm entre plantas.", diasGerminacion: "5-10 días", diasCosecha: "60-70 días",
    heladaSensible: true,
    buenos: ["tomate", "pimiento"],
    malos: [],
    notas: "Repele algunos insectos, excelente compañera del tomate." },
  { id: "perejil", nombre: "Perejil", categoria: "hierba", sol: "semisombra", agua: "medio",
    riego: "Riego regular.",
    fertilizante: "Compost liviano.",
    espaciado: "15-20 cm entre plantas.", diasGerminacion: "14-28 días", diasCosecha: "70-90 días",
    heladaSensible: false,
    buenos: ["tomate"],
    malos: ["lechuga"],
    notas: "Germinación lenta, tener paciencia." },
  { id: "cilantro", nombre: "Cilantro", categoria: "hierba", sol: "semisombra", agua: "medio",
    riego: "Riego regular y liviano.",
    fertilizante: "Compost liviano.",
    espaciado: "15-20 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "40-50 días",
    heladaSensible: false,
    buenos: ["espinaca"],
    malos: ["hinojo"],
    notas: "Se va a flor rápido con calor; sembrar en tandas." },
  { id: "romero", nombre: "Romero", categoria: "hierba", sol: "pleno", agua: "bajo",
    riego: "Riego escaso, tolera bien la sequía una vez establecido.",
    fertilizante: "Mínimo, suelo bien drenado.",
    espaciado: "40-60 cm entre plantas.", diasGerminacion: "15-25 días", diasCosecha: "12-18 meses hasta planta madura",
    heladaSensible: false,
    buenos: ["repollo", "zanahoria"],
    malos: [],
    notas: "Perenne, ideal en bordes del bancal." },
  { id: "hinojo", nombre: "Hinojo", categoria: "hierba", sol: "pleno", agua: "medio",
    riego: "Riego regular.",
    fertilizante: "Compost moderado.",
    espaciado: "30-40 cm entre plantas.", diasGerminacion: "10-14 días", diasCosecha: "90-115 días",
    heladaSensible: false,
    buenos: [],
    malos: ["tomate", "pimiento", "cilantro"],
    notas: "Inhibe a muchas otras plantas; cultivar aislado." },
  { id: "menta", nombre: "Menta", categoria: "hierba", sol: "semisombra", agua: "alto",
    riego: "Riego frecuente, no le gusta que el suelo se seque del todo.",
    fertilizante: "Compost liviano una o dos veces al año, no necesita mucho.",
    espaciado: "30-40 cm entre plantas.", diasGerminacion: "10-15 días", diasCosecha: "60-90 días",
    heladaSensible: false,
    buenos: ["repollo", "tomate"],
    malos: [],
    notas: "Muy invasiva: sus rizomas se expanden rápido y puede ahogar otras plantas del bancal. Mejor cultivarla en una maceta enterrada o un contenedor aparte. Es perenne, rebrota cada primavera aunque el frío la haga perder las hojas." },
  { id: "eneldo", nombre: "Eneldo", categoria: "hierba", sol: "pleno", agua: "medio",
    riego: "Riego regular.",
    fertilizante: "Compost liviano.",
    espaciado: "20-30 cm entre plantas.", diasGerminacion: "10-14 días", diasCosecha: "40-60 días",
    heladaSensible: false,
    buenos: ["repollo"],
    malos: ["zanahoria"],
    notas: "Atrae insectos benéficos como avispas parasitoides." },
  { id: "fresa", nombre: "Fresa / Frutilla", categoria: "fruta", sol: "pleno", agua: "medio",
    riego: "Riego regular, evitar mojar los frutos.",
    fertilizante: "Compost al plantar, potasio en floración.",
    espaciado: "25-30 cm entre plantas.", diasGerminacion: "-", diasCosecha: "90-110 días desde plantín",
    heladaSensible: true,
    buenos: ["lechuga", "espinaca", "ajo"],
    malos: ["repollo"],
    notas: "Casi siempre se planta como plantín, no por semilla." },
  { id: "limonero", nombre: "Limonero", categoria: "fruta", sol: "pleno", agua: "medio",
    riego: "Riego profundo y espaciado, sin encharcar raíces.",
    fertilizante: "Cítricos: rico en nitrógeno, refuerzo cada 2-3 meses en crecimiento.",
    espaciado: "3-4 m entre plantas.", diasGerminacion: "-", diasCosecha: "2-3 años hasta primera cosecha",
    heladaSensible: true,
    buenos: [],
    malos: [],
    notas: "Proteger tronco joven en heladas fuertes del Chaco." },
  { id: "naranjo", nombre: "Naranjo", categoria: "fruta", sol: "pleno", agua: "medio",
    riego: "Riego profundo y espaciado.",
    fertilizante: "Cítricos: rico en nitrógeno, refuerzo estacional.",
    espaciado: "3-5 m entre plantas.", diasGerminacion: "-", diasCosecha: "2-3 años hasta primera cosecha",
    heladaSensible: true,
    buenos: [],
    malos: [],
    notas: "Sensible cuando joven, proteger en noches de helada." },
  { id: "girasol", nombre: "Girasol", categoria: "flor", sol: "pleno", agua: "medio",
    riego: "Riego regular, más en floración.",
    fertilizante: "Compost moderado, fósforo para floración.",
    espaciado: "30-60 cm entre plantas.", diasGerminacion: "7-14 días", diasCosecha: "70-90 días a floración",
    heladaSensible: true,
    buenos: ["maiz"],
    malos: ["papa"],
    notas: "Atrae polinizadores; puede dar sombra a cultivos bajos." },
  { id: "caléndula", nombre: "Caléndula", categoria: "flor", sol: "pleno", agua: "bajo",
    riego: "Riego moderado.",
    fertilizante: "Mínimo, suelo bien drenado.",
    espaciado: "20-30 cm entre plantas.", diasGerminacion: "5-10 días", diasCosecha: "50-60 días a floración",
    heladaSensible: false,
    buenos: ["tomate", "pimiento", "calabacin"],
    malos: [],
    notas: "Repele nematodos y atrae insectos benéficos." },
  { id: "petunia", nombre: "Petunia", categoria: "flor", sol: "pleno", agua: "medio",
    riego: "Riego regular, no encharcar.",
    fertilizante: "Compost liviano, floración prolongada con refuerzo mensual.",
    espaciado: "20-30 cm entre plantas.", diasGerminacion: "10-14 días", diasCosecha: "60-70 días a floración",
    heladaSensible: true,
    buenos: [],
    malos: [],
    notas: "Buena opción decorativa en bordes de bancales." },
  { id: "rosa", nombre: "Rosa", categoria: "flor", sol: "pleno", agua: "medio",
    riego: "Riego profundo, evitar mojar el follaje.",
    fertilizante: "Compost rico, refuerzo cada 4-6 semanas en floración.",
    espaciado: "50-100 cm entre plantas.", diasGerminacion: "-", diasCosecha: "-",
    heladaSensible: false,
    buenos: ["ajo", "caléndula"],
    malos: [],
    notas: "Casi siempre se planta como plantín injertado." },
  { id: "dalia", nombre: "Dalia", categoria: "flor", sol: "pleno", agua: "medio",
    riego: "Riego regular y profundo, más frecuente en floración; evitar encharcar el tubérculo.",
    fertilizante: "Bajo en nitrógeno y alto en fósforo/potasio para favorecer la floración (exceso de nitrógeno da mucha hoja y poca flor).",
    espaciado: "30-45 cm entre plantas (más para variedades altas).", diasGerminacion: "-", diasCosecha: "70-100 días desde brote del tubérculo hasta floración",
    heladaSensible: true,
    buenos: [],
    malos: [],
    notas: "Se planta por tubérculo, no por semilla. Entutorar las variedades altas. En zonas con heladas fuertes conviene levantar los tubérculos en invierno y guardarlos para replantar." },
  { id: "espuela_caballero", nombre: "Espuela de caballero (Consólida / Rittersporn)", categoria: "flor", sol: "pleno", agua: "medio",
    riego: "Riego regular, sin encharcar; algo más exigente en floración.",
    fertilizante: "Compost moderado al plantar, refuerzo con potasio antes de la floración.",
    espaciado: "25-40 cm entre plantas.", diasGerminacion: "14-21 días (germina mejor con temperaturas frescas, 10-18°C)", diasCosecha: "90-120 días a floración",
    heladaSensible: false,
    buenos: [],
    malos: [],
    notas: "Prefiere clima fresco; en el Chaco conviene sembrarla en otoño-invierno para que florezca antes de los grandes calores. Toda la planta es tóxica si se ingiere — tener cuidado si hay animales o niños cerca. Se entutora bien porque las flores en espiga pueden pesar y doblarse con viento." },
];

// Devuelve el catálogo completo: el catálogo base (con ediciones del usuario aplicadas
// encima, si las hay) + las plantas que el usuario agregó desde cero.
// Store.getCustomCatalog()/getCatalogOverrides() se definen en storage.js, cargado antes
// de que esto se use en tiempo de ejecución.
function getAllCatalog() {
  const overrides = (typeof Store !== "undefined" && Store.getCatalogOverrides) ? Store.getCatalogOverrides() : {};
  const custom = (typeof Store !== "undefined" && Store.getCustomCatalog) ? Store.getCustomCatalog() : [];
  const builtinMerged = BUILTIN_CATALOG.map(p => {
    const ov = overrides[p.id];
    return ov ? { ...p, ...ov, esOverride: true } : p;
  });
  return builtinMerged.concat(custom);
}

// Ícono a mostrar para una entrada de catálogo (o la de una planta, vía su catálogo)
function catalogIcon(p) {
  if (!p) return "🌱";
  return p.icono || CATEGORY_ICON[p.categoria] || "🌱";
}

// Manejo posterior a la flor/fruto (podar, replantar, cuántos años dura, etc.)
function getPostCosecha(catalogId) {
  const cat = getCatalogPlant(catalogId);
  if (cat && cat.manejoPosterior) return cat.manejoPosterior;
  return POST_COSECHA_INFO[catalogId] || null;
}

// Devuelve info de catálogo por id (busca en catálogo base y en el personalizado)
function getCatalogPlant(id) {
  return getAllCatalog().find(p => p.id === id) || null;
}

// Evalúa relación entre dos plantas del catálogo: 'buena' | 'mala' | 'neutra'
function companionRelation(idA, idB) {
  if (idA === idB) return "neutra";
  const a = getCatalogPlant(idA), b = getCatalogPlant(idB);
  if (!a || !b) return "neutra";
  if ((a.malos || []).includes(idB) || (b.malos || []).includes(idA)) return "mala";
  if ((a.buenos || []).includes(idB) || (b.buenos || []).includes(idA)) return "buena";
  return "neutra";
}

// --- Clasificación del ciclo de etapas ---
// Algunas plantas (de hoja, raíz o bulbo, y la mayoría de las hierbas de hoja) se cosechan
// antes de florecer o directamente no producen un "fruto" relevante para el huerto — para
// esas, no tiene sentido esperar una etapa de flor/fruto entre el brote y la cosecha.
// Las flores ornamentales sí florecen (esa es la etapa principal) pero no dan fruto.
const CATALOG_SIN_FLOR_FRUTO = new Set([
  "lechuga", "zanahoria", "cebolla", "ajo", "rucula", "espinaca", "acelga", "remolacha", "rabanito", "papa", "repollo",
  "albahaca", "perejil", "cilantro", "romero", "hinojo", "eneldo", "menta"
]);
const CATALOG_FLOR_SIN_FRUTO = new Set([
  "girasol", "caléndula", "petunia", "rosa", "dalia", "espuela_caballero"
]);

function cycleType(catalogId) {
  if (!catalogId) return "full";
  if (CATALOG_SIN_FLOR_FRUTO.has(catalogId)) return "sinFlorFruto";
  if (CATALOG_FLOR_SIN_FRUTO.has(catalogId)) return "florSinFruto";
  return "full";
}

// Devuelve, en orden, las etapas relevantes después de la etapa de origen (siembra/trasplante).
function relevantStageKeys(catalogId) {
  const tipo = cycleType(catalogId);
  if (tipo === "sinFlorFruto") return ["brote", "cosecha"];
  if (tipo === "florSinFruto") return ["brote", "primeraFlor", "cosecha"];
  return ["brote", "primeraFlor", "primerFruto", "cosecha"];
}

// --- Calendario de siembra para el Chaco paraguayo ---
// Meses del 1 (enero) al 12 (diciembre) recomendados para sembrar/plantar cada especie,
// pensados para el clima subtropical/semiárido del Chaco (veranos muy calurosos, inviernos
// suaves con heladas ocasionales, sobre todo en junio-julio). Es una guía general — puede
// variar según el año y el microclima de cada lugar.
const SIEMBRA_MESES = {
  tomate: [8, 9, 1, 2], pimiento: [8, 9, 1, 2], berenjena: [8, 9, 1],
  lechuga: [3, 4, 5, 8, 9], zanahoria: [3, 4, 5, 8, 9], cebolla: [4, 5, 6], ajo: [4, 5, 6],
  calabacin: [8, 9, 10, 1, 2], calabaza: [8, 9, 10], sandia: [9, 10, 11], melon: [9, 10, 11],
  maiz: [8, 9, 10, 1], poroto: [8, 9, 10, 1, 2], arveja: [4, 5, 6],
  rucula: [3, 4, 5, 8, 9], espinaca: [3, 4, 5, 6, 7, 8], acelga: [3, 4, 5, 8, 9], remolacha: [3, 4, 5, 8, 9],
  rabanito: [3, 4, 5, 6, 7, 8, 9], pepino: [9, 10, 1, 2], papa: [4, 5, 6], repollo: [3, 4, 5, 8, 9],
  albahaca: [9, 10, 11, 12, 1], perejil: [3, 4, 5, 8, 9], cilantro: [3, 4, 5, 8, 9], romero: [8, 9, 10],
  hinojo: [3, 4, 5, 8, 9], eneldo: [3, 4, 5, 8, 9], menta: [8, 9, 10],
  fresa: [3, 4, 5, 8, 9], limonero: [8, 9], naranjo: [8, 9],
  girasol: [8, 9, 10, 1], "caléndula": [3, 4, 8, 9], petunia: [8, 9, 10], rosa: [7, 8, 9],
  dalia: [8, 9], espuela_caballero: [4, 5, 6]
};

function getMesesSiembra(catalogId) {
  const cat = getCatalogPlant(catalogId);
  if (cat && cat.mesesSiembra && cat.mesesSiembra.length) return cat.mesesSiembra;
  return SIEMBRA_MESES[catalogId] || null;
}

// --- Manejo después de la flor/fruto ---
// ¿Es anual o perenne? ¿Hay que podar, replantar, guardar semilla, rotar el cultivo?
// Guía general para el Chaco paraguayo.
const POST_COSECHA_INFO = {
  tomate: "Anual. Una vez terminada la cosecha, arrancar la planta y rotar el cultivo (evitar replantar tomate en el mismo lugar al año siguiente).",
  pimiento: "Anual, aunque en climas templados puede seguir 2 temporadas si se protege del frío. Al final, arrancar y rotar el cultivo.",
  berenjena: "Anual (a veces sigue un poco más en climas cálidos). Cosecha continua mientras esté sana; al final de temporada, arrancar y rotar.",
  lechuga: "Anual de ciclo corto. Cosechar antes de que florezca (se pone amarga); una vez que sube a flor, arrancar y resembrar.",
  zanahoria: "Se cosecha la raíz antes de que florezca — si florece se pone leñosa, no vale la pena esperar.",
  cebolla: "Cosechar cuando el follaje se dobla y amarillea. No conviene dejarla florecer: el bulbo pierde calidad.",
  ajo: "Guardar unos dientes de cada cosecha como semilla para el ciclo siguiente. Cosechar cuando las hojas empiezan a secarse.",
  calabacin: "Anual. Sigue dando frutos mientras se coseche seguido; al final de temporada, arrancar y rotar el cultivo.",
  calabaza: "Da una sola cosecha grande hacia el final del ciclo; luego arrancar la planta.",
  sandia: "Anual. Después de cosechar los frutos la planta declina — arrancar y rotar el cultivo.",
  melon: "Anual. Igual que la sandía: después de la cosecha, arrancar y rotar.",
  maiz: "Cada planta da una o dos mazorcas; después de cosechar, arrancar y rotar (agota el suelo — abonar bien antes de repetir).",
  poroto: "Sigue floreciendo y dando vainas por semanas si se cosecha seguido. Al arrancarla deja nitrógeno en el suelo, buena antecesora de hojas verdes.",
  arveja: "Cosecha continua mientras dure el fresco; con el calor deja de producir y se puede arrancar.",
  rucula: "Ciclo muy corto, se va a flor rápido con calor. Una vez que florece se pone picante — mejor resembrar seguido en tandas.",
  espinaca: "Se va a flor con el calor; cosechar antes de que eso pase. Resembrar en la próxima temporada fresca.",
  acelga: "Se puede cosechar cortando hojas externas por meses sin arrancar la planta, mientras no suba a flor.",
  remolacha: "Cosechar la raíz mientras es tierna; no conviene dejarla florecer.",
  rabanito: "Ciclo muy corto — se pone leñoso y picante si florece. Cosechar rápido y resembrar seguido.",
  pepino: "Sigue dando frutos varias semanas si se cosecha seguido; al final de temporada, arrancar y rotar.",
  papa: "Se cosecha cuando el follaje se seca. Guardar algunos tubérculos sanos como semilla para la próxima siembra.",
  repollo: "Se cosecha la cabeza entera cuando está compacta — no se puede volver a cosechar la misma planta.",
  albahaca: "Despuntar las flores para que siga dando hojas más tiempo. Se pierde con la primera helada — resembrar en primavera.",
  perejil: "Se puede seguir cosechando hojas por meses; al año siguiente florece y se pone amarga — conviene resembrar.",
  cilantro: "Se va a flor rápido con calor. Dejar secar las semillas para volver a sembrar (coriandro), o resembrar en tandas.",
  romero: "Perenne, dura muchos años. Podar después de la floración para mantener buena forma; no hace falta replantar.",
  hinojo: "Cosechar el bulbo antes de que suba a flor.",
  menta: "Perenne, rebrota cada primavera durante años. Podar después de floración para renovar el follaje; dividir la planta cada 2-3 años si se pone leñosa.",
  eneldo: "Se va a flor con calor. Dejar secar las semillas para resembrar, o sembrar en tandas.",
  fresa: "Perenne, productiva 2-3 años. Después baja la producción — dividir los estolones y replantar cada 2-3 años.",
  limonero: "Perenne, productivo por muchos años (décadas). Podar cada año después de la cosecha para mantener forma y renovar ramas.",
  naranjo: "Perenne, productivo por muchos años. Podar cada año después de la cosecha; puede tardar 2-3 años en dar la primera cosecha completa.",
  girasol: "Anual. Si se deja secar la flor se pueden cosechar semillas; luego arrancar la planta.",
  "caléndula": "Anual (a veces se resiembra sola). Despuntar flores marchitas para prolongar la floración.",
  petunia: "Anual en climas con heladas. Podar/despuntar para prolongar floración; no suele sobrevivir heladas fuertes.",
  rosa: "Perenne, dura muchos años. Podar después de cada floración (y una poda más fuerte en invierno) para que rebrote con más flores.",
  dalia: "Perenne por tubérculo. En zonas con heladas conviene levantar los tubérculos después de la floración, guardarlos y replantar la próxima primavera; dividirlos cada 2-3 años.",
  espuela_caballero: "Anual o bianual según la variedad. Dejar secar para juntar semilla; en climas cálidos como el Chaco no suele sobrevivir al verano."
};
