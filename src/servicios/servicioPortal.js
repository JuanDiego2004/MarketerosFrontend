import { supabaseConSesion } from "../lib/clienteSupabase";

export async function consultarAnaliticaPortal(token, filtros, signal) {
  const { data, error } = await supabaseConSesion(token)
    .rpc("crm_portal_estadisticas", {
      p_desde: filtros.desde,
      p_hasta: filtros.hasta,
      p_contrato: filtros.contrato ? Number(filtros.contrato) : null,
      p_campana: filtros.campana ? Number(filtros.campana) : null,
      p_plataforma: filtros.plataforma || null,
      p_pais: filtros.pais || null,
      p_moneda: filtros.moneda || null,
      p_busqueda: filtros.busqueda.trim(),
    })
    .abortSignal(signal || new AbortController().signal);
  if (error) {
    if (signal?.aborted)
      throw new DOMException("Consulta cancelada", "AbortError");
    if (error.code === "PGRST202")
      throw new Error(
        "La analítica todavía no está habilitada para este portal. Contacta con la agencia.",
      );
    if (error.code === "42501" || error.code === "PGRST301")
      throw new Error(
        "Tu sesión no tiene acceso a estos resultados. Inicia sesión de nuevo o consulta con la agencia.",
      );
    throw new Error(
      error.message || "No se pudieron consultar los resultados de tu empresa.",
    );
  }
  if (!data || data.simulado !== true || data.proveedor !== "MOCKAROO")
    throw new Error("La consulta no devolvió estadísticas DEMO válidas.");
  return data;
}
