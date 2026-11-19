export const METRICAS_MAPA = {
  impresiones: "Impresiones",
  clics: "Clics",
  conversiones: "Conversiones",
  inversion: "Inversión",
};
export const COLORES_MAPA = [
  "#dceafc",
  "#a9cbfa",
  "#6fa8f4",
  "#357de4",
  "#1750ac",
];
export const numero = (n, decimales = 0) =>
  n == null
    ? "—"
    : Number(n).toLocaleString("es-PE", { maximumFractionDigits: decimales });
export const importe = (n, moneda) => `${numero(n, 2)} ${moneda}`;
const nombresPais = new Intl.DisplayNames(["es"], { type: "region" });
export function nombrePais(iso) {
  try {
    return nombresPais.of(iso) || iso;
  } catch {
    return iso || "Sin país";
  }
}
export function filtrosIniciales() {
  const hasta = new Date(),
    desde = new Date();
  desde.setDate(desde.getDate() - 29);
  const fecha = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    desde: fecha(desde),
    hasta: fecha(hasta),
    contrato: "",
    campana: "",
    plataforma: "",
    pais: "",
    moneda: "",
    busqueda: "",
    metrica: "impresiones",
  };
}
export function resumir(registros) {
  const total = {
    impresiones: 0,
    clics: 0,
    conversiones: 0,
    monedas: {},
    alcance: null,
    roas: null,
    roi: null,
  };
  for (const r of registros) {
    for (const k of ["impresiones", "clics", "conversiones"])
      total[k] += Number(r[k]);
    const m = (total.monedas[r.moneda] ||= {
      inversion: 0,
      ingresos_estimados: 0,
      clics: 0,
      impresiones: 0,
    });
    for (const k of ["inversion", "ingresos_estimados", "clics", "impresiones"])
      m[k] += Number(r[k]);
  }
  total.ctr = total.impresiones
    ? (100 * total.clics) / total.impresiones
    : null;
  for (const m of Object.values(total.monedas)) {
    m.cpc = m.clics ? m.inversion / m.clics : null;
    m.cpm = m.impresiones ? (m.inversion * 1000) / m.impresiones : null;
  }
  return total;
}
export function agruparResultados(registros) {
  const grupos = new Map();
  for (const r of registros) {
    const clave = JSON.stringify([
      r.pais,
      r.plataforma,
      r.campana_id,
      r.contrato_id,
      r.moneda,
    ]);
    if (!grupos.has(clave))
      grupos.set(clave, {
        ...r,
        clave,
        impresiones: 0,
        clics: 0,
        conversiones: 0,
        inversion: 0,
        ingresos_estimados: 0,
      });
    const g = grupos.get(clave);
    for (const k of [
      "impresiones",
      "clics",
      "conversiones",
      "inversion",
      "ingresos_estimados",
    ])
      g[k] += Number(r[k]);
  }
  return [...grupos.values()].map((r) => ({
    ...r,
    paisNombre: nombrePais(r.pais),
    ctr: r.impresiones ? (100 * r.clics) / r.impresiones : null,
    cpc: r.clics ? r.inversion / r.clics : null,
    cpm: r.impresiones ? (r.inversion * 1000) / r.impresiones : null,
  }));
}
export function ordenarResultados(filas, orden) {
  return [...filas].sort((a, b) => {
    const x = a[orden.campo],
      y = b[orden.campo];
    return (
      (typeof x === "number"
        ? x - y
        : String(x ?? "").localeCompare(String(y ?? ""), "es", {
            numeric: true,
          })) * orden.direccion
    );
  });
}
export function serieDiaria(registros, moneda = null) {
  const dias = new Map();
  for (const r of registros) {
    if (!dias.has(r.fecha))
      dias.set(r.fecha, {
        fecha: r.fecha,
        impresiones: 0,
        clics: 0,
        conversiones: 0,
        inversion: 0,
        ingresos_estimados: 0,
      });
    const d = dias.get(r.fecha);
    for (const k of ["impresiones", "clics", "conversiones"])
      d[k] += Number(r[k]);
    if (r.moneda === moneda)
      for (const k of ["inversion", "ingresos_estimados"]) d[k] += Number(r[k]);
  }
  return [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
export function valoresPaises(registros, metrica) {
  // Una inversión geográfica solo tiene sentido en una moneda concreta.
  if (
    metrica === "inversion" &&
    new Set(registros.map((r) => r.moneda)).size > 1
  )
    return new Map();
  const valores = new Map();
  for (const r of registros)
    valores.set(r.pais, (valores.get(r.pais) || 0) + Number(r[metrica]));
  return valores;
}
export function colorValor(valor, maximo) {
  return valor == null
    ? "#edf1f5"
    : COLORES_MAPA[Math.min(4, Math.floor((maximo ? valor / maximo : 0) * 5))];
}
export function descripcionFiltros(filtros, datos) {
  return [
    `${filtros.desde} a ${filtros.hasta}`,
    datos.contratos.find((c) => String(c.id) === filtros.contrato)?.nombre ||
      "Todos los contratos",
    datos.campanas.find((c) => String(c.id) === filtros.campana)?.nombre ||
      "Todas las campañas",
    filtros.plataforma || "Todas las plataformas",
    filtros.pais ? nombrePais(filtros.pais) : "Todos los países",
    filtros.moneda || "Monedas separadas",
    filtros.busqueda ? `Búsqueda: ${filtros.busqueda}` : "",
    `Mapa: ${METRICAS_MAPA[filtros.metrica]}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
export const COLUMNAS_REPORTE = [
  ["paisNombre", "País"],
  ["plataforma", "Plataforma"],
  ["campana", "Campaña"],
  ["contrato", "Contrato"],
  ["moneda", "Moneda"],
  ["impresiones", "Impresiones"],
  ["clics", "Clics"],
  ["conversiones", "Conversiones publicitarias"],
  ["inversion", "Inversión"],
  ["ingresos_estimados", "Ingresos estimados"],
  ["ctr", "CTR (%)"],
  ["cpc", "CPC"],
  ["cpm", "CPM"],
];
export function celdaCsv(valor) {
  const texto = String(valor ?? "");
  return `"${(/^[\s]*[=+@-]/.test(texto) ? "'" + texto : texto).replaceAll('"', '""')}"`;
}
export function crearCsvPortal(datos, filtros, filas) {
  const registros = [
    ["Datos simulados", "MOCKAROO"],
    ["Empresa", datos.empresa.nombre],
    ["Filtros", descripcionFiltros(filtros, datos)],
    [
      "Nota",
      "Conversiones publicitarias no son ventas confirmadas. Ingresos estimados; ROAS/ROI no disponibles. Importes separados por moneda.",
    ],
    [],
    COLUMNAS_REPORTE.map(([, titulo]) => titulo),
    ...filas.map((r) => COLUMNAS_REPORTE.map(([k]) => r[k])),
  ];
  return (
    "\uFEFF" + registros.map((r) => r.map(celdaCsv).join(",")).join("\r\n")
  );
}
