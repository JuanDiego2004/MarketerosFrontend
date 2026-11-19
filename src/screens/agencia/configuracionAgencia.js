const campo = (key, label, type = "text", extra = {}) => ({ key, label, type, required: true, ...extra });
const sel = (key, label, options, extra) => campo(key, label, "select", { options, ...extra });
const servicios = [["DIFUSION", "Gestión y difusión"], ["ANALISIS", "Monitoreo y análisis"], ["INTEGRAL", "Gestión integral"]];
const monedas = [["PEN", "PEN"], ["USD", "USD"]];
const acuerdo = [sel("empresa_id", "Empresa", "empresas"), campo("nombre", "Nombre"), sel("servicio", "Servicio", servicios), sel("modalidad", "Modalidad", [["ORGANICA", "Orgánica"], ["PAGADA", "Pagada"], ["MIXTA", "Mixta"]]), campo("desde", "Inicio", "date"), campo("hasta", "Finalización", "date"), sel("responsable_id", "Responsable", "usuarios"), sel("moneda", "Moneda", monedas), campo("honorarios", "Honorarios de la agencia", "number"), campo("presupuesto", "Presupuesto autorizado / inversión a analizar", "number"), campo("produccion", "Precio de producción", "number"), campo("plataformas", "Plataformas incluidas"), campo("alcance", "Alcance y cantidades acordadas", "textarea"), campo("frecuencia", "Frecuencia de informes y pago"), campo("condiciones", "Condiciones, revisiones y aceptación", "textarea", { required: false }), sel("origen_id", "Cotización aprobada", "cotizaciones", { required: false })];
const trabajo = [sel("contrato_id", "Contrato", "contratos"), campo("nombre", "Nombre"), campo("descripcion", "Descripción y justificación", "textarea"), campo("fecha", "Fecha prevista", "date"), campo("cantidad", "Cantidad", "number", { min: 1, max: 10000 }), campo("importe", "Importe de referencia", "number"), sel("anuncio_id", "Anuncio relacionado", "anuncios", { required: false })];
export const secciones = {
 contratos: { titulo: "Contratos y servicios", singular: "contrato", campos: acuerdo },
 cotizaciones: { titulo: "Cotizaciones", singular: "cotización", campos: acuerdo.filter(f => f.key !== "origen_id") },
 "cuentas-publicitarias": { titulo: "Cuentas publicitarias", singular: "cuenta publicitaria", campos: [sel("empresa_id", "Empresa", "empresas"), campo("nombre", "Nombre"), campo("codigo", "ID de cuenta ficticio"), sel("plataforma", "Plataforma", ["FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE", "GOOGLE", "OTRO"].map(v => [v, v])), sel("moneda", "Moneda", monedas)] },
 anuncios: { titulo: "Anuncios y publicaciones", singular: "anuncio", campos: [sel("contrato_id", "Contrato", "contratos"), sel("cuenta_id", "Cuenta publicitaria", "cuentas"), sel("campana_id", "Campaña del contrato", "campanas"), campo("nombre", "Nombre"), campo("codigo", "ID de anuncio ficticio"), sel("formato", "Formato", ["VIDEO", "IMAGEN", "TEXTO"].map(v => [v,v])), campo("fecha", "Fecha de publicación / referencia", "date"), sel("contenido_id", "Contenido aprobado", "contenidos", { required: false })] },
 entregables: { titulo: "Entregables", singular: "entregable", campos: [...trabajo,sel("prestacion","Prestación del contrato",["PRODUCCION","EDICION","PUBLICACION","ANALISIS","INFORMES"].map(v=>[v,v]))] },
 recomendaciones: { titulo: "Recomendaciones", singular: "recomendación", campos: trabajo },
 ajustes: { titulo: "Ajustes autorizados", singular: "ajuste", campos: trabajo.map(f => f.key === "importe" ? { ...f, label: "Incremento propuesto de presupuesto" } : f) },
 informes: { titulo: "Informes por contrato", singular: "informe", campos: trabajo },
 servicios: { titulo: "Catálogo de servicios", singular: "servicio", campos: [] },
 calendario: { titulo: "Calendario editorial", singular: "publicación", campos: [] },
};
export const etiquetasEstado = { PUBLICADO_SIMULADO: "Publicado (simulado)", EXTERNO_SIMULADO: "Anuncio de demostración", EN_REVISION: "En revisión" };
export function siguientes(r, e) {
 if (["contratos", "cotizaciones"].includes(r)) return ({ BORRADOR: ["EN_REVISION", "CANCELADO"], EN_REVISION: ["APROBADO", "BORRADOR", "CANCELADO"], APROBADO: r === "contratos" ? ["ACTIVO", "CANCELADO"] : [], ACTIVO: ["FINALIZADO", "CANCELADO"] })[e] || [];
 if (r === "anuncios") return ({ BORRADOR: ["EN_REVISION", "CANCELADO"], EN_REVISION: ["APROBADO", "BORRADOR"], APROBADO: ["PROGRAMADO", "CANCELADO"], PROGRAMADO: ["PUBLICADO_SIMULADO", "CANCELADO"], PUBLICADO_SIMULADO: ["FINALIZADO"] })[e] || [];
 return ({ PENDIENTE: ["APROBADO", "RECHAZADO"], APROBADO: ["COMPLETADO"] })[e] || [];
}
