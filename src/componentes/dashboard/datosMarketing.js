export const COLORES_ESTADO = {
  ACTIVA: "#3d8076",
  PLANIFICADA: "#6984b1",
  PAUSADA: "#bf8b45",
  FINALIZADA: "#89949e",
};

export const numero = (valor) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(valor);
export const dinero = (valor, moneda = "PEN") =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
  }).format(valor);
export const proporcion = (parte, total, escala = 1) =>
  total > 0 ? (parte / total) * escala : null;
export const fechaLocal = (fecha = new Date()) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

export function resumirMetricas(filas) {
  const totales = {
    impresiones: 0,
    clics: 0,
    conversiones: 0,
    inversion: 0,
    ingresos: 0,
  };
  for (const fila of filas) {
    for (const campo of Object.keys(totales))
      totales[campo] += Number(fila[campo] || 0);
  }
  return {
    ...totales,
    ctr: proporcion(totales.clics, totales.impresiones, 100),
    cpc: proporcion(totales.inversion, totales.clics),
    cpm: proporcion(totales.inversion, totales.impresiones, 1000),
    cpa: proporcion(totales.inversion, totales.conversiones),
    roas: proporcion(totales.ingresos, totales.inversion),
  };
}

export function filtrarCampanas(campanas, filtros) {
  const busqueda = filtros.busqueda.trim().toLocaleLowerCase("es");
  return campanas.filter(
    (c) =>
      (!filtros.cliente || String(c.idCliente) === filtros.cliente) &&
      (!filtros.canal || String(c.idCanal) === filtros.canal) &&
      (!filtros.estado || c.estado === filtros.estado) &&
      (!busqueda ||
        `${c.nombre} ${c.cliente}`.toLocaleLowerCase("es").includes(busqueda)),
  );
}

export function obtenerPuntos(ubicaciones, campanas, resultados, vista) {
  const porCampana = new Map(campanas.map((c) => [String(c.idCampana), c]));
  const porUbicacion = new Map();
  for (const ubicacion of ubicaciones) {
    const campana = porCampana.get(String(ubicacion.idCampana));
    if (
      !campana ||
      ubicacion.vista !== vista ||
      ubicacion.latitud == null ||
      ubicacion.longitud == null
    )
      continue;
    const lat = Number(ubicacion.latitud),
      lng = Number(ubicacion.longitud);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      continue;
    const clave = String(ubicacion.idUbicacion);
    if (!porUbicacion.has(clave))
      porUbicacion.set(clave, {
        ...ubicacion,
        lat,
        lng,
        campanas: [],
        impresiones: 0,
      });
    const punto = porUbicacion.get(clave);
    if (
      !punto.campanas.some(
        (c) => String(c.idCampana) === String(campana.idCampana),
      )
    )
      punto.campanas.push(campana);
  }
  for (const resultado of resultados) {
    const punto = porUbicacion.get(String(resultado.idUbicacion));
    if (punto && porCampana.has(String(resultado.idCampana)))
      punto.impresiones += Number(resultado.impresiones || 0);
  }
  return [...porUbicacion.values()];
}

export function agruparSerie(metricas, campo) {
  const dias = new Map();
  for (const fila of metricas)
    dias.set(
      fila.fecha,
      (dias.get(fila.fecha) || 0) + Number(fila[campo] || 0),
    );
  return [...dias]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, valor]) => ({ fecha, valor }));
}
