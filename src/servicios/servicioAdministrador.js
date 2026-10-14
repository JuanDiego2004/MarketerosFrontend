const API_URL = import.meta.env.VITE_API_URL

async function solicitar(ruta, token, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      Accept: 'application/json',
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...opciones.headers,
    },
  })
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}))
    throw new Error(cuerpo.error?.mensaje || cuerpo.mensaje || `Error HTTP ${respuesta.status}`)
  }
  if (respuesta.status === 204) return null
  const resultado = await respuesta.json()
  return resultado?.exito === undefined ? resultado : resultado.datos
}

export const obtenerDashboardAdministrador = (token, apiBase = '/api/admin') => solicitar(`${apiBase}/dashboard`, token)
export const listarModuloAdministrador = (modulo, token, apiBase = '/api/admin') => solicitar(`${apiBase}/${modulo}`, token)
export const guardarModuloAdministrador = (modulo, datos, token, id, apiBase = '/api/admin') => solicitar(
  id ? `${apiBase}/${modulo}/${id}` : `${apiBase}/${modulo}`,
  token,
  { method: id ? 'PUT' : 'POST', body: JSON.stringify(datos) },
)
export const eliminarModuloAdministrador = (modulo, id, token, apiBase = '/api/admin') => solicitar(`${apiBase}/${modulo}/${id}`, token, { method: 'DELETE' })
export const listarRolesAdministrador = (token, apiBase = '/api/admin') => solicitar(`${apiBase}/roles`, token)
export const listarPermisosAdministrador = (token, apiBase = '/api/admin') => solicitar(`${apiBase}/permisos`, token)
export const actualizarPermisosRol = (idRol, idPermisos, token, apiBase = '/api/admin') => solicitar(
  `${apiBase}/roles/${idRol}/permisos`, token,
  { method: 'PUT', body: JSON.stringify({ idPermisos }) },
)
export const obtenerKpisAdministrador = (token, apiBase = '/api/admin') => solicitar(`${apiBase}/kpis`, token)
export const calcularKpisAdministrador = (idCampana, fechaDesde, fechaHasta, token, apiBase = '/api/admin') => solicitar(
  `${apiBase}/campanas/${idCampana}/kpis`, token,
  { method: 'POST', body: JSON.stringify({ fechaDesde, fechaHasta }) },
)
export const vincularAudienciaAdministrador = (idCampana, idSegmento, token, apiBase = '/api/admin') => solicitar(
  `${apiBase}/campanas/${idCampana}/audiencias/${idSegmento}`, token,
  { method: 'POST' },
)
export const compararCampanasAdministrador = (ids, token, apiBase = '/api/admin') => solicitar(`${apiBase}/comparacion?${ids.map((id) => `ids=${id}`).join('&')}`, token)

export async function exportarReporteCampanas(desde, hasta, token, apiBase = '/api/admin') {
  const respuesta = await fetch(`${API_URL}${apiBase}/reportes/campanas.csv?desde=${desde}&hasta=${hasta}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}))
    throw new Error(cuerpo.error?.mensaje || cuerpo.mensaje || 'No se pudo generar el reporte')
  }
  return respuesta.blob()
}
