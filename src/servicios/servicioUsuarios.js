const API_URL = import.meta.env.VITE_API_URL

async function solicitarUsuario(ruta, token, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { Accept: 'application/json', ...(opciones.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
  })
  const cuerpo = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok || cuerpo.exito === false) throw new Error(cuerpo.error?.mensaje || cuerpo.mensaje || `Error HTTP ${respuesta.status}`)
  return cuerpo.datos ?? cuerpo
}

export const listarUsuarios = (token) => solicitarUsuario('/usuarios', token)
export const actualizarUsuario = (id, datos, token) => solicitarUsuario(`/usuarios/${id}`, token, { method: 'PUT', body: JSON.stringify(datos) })
export const cambiarEstadoUsuario = (id, activo, token) => solicitarUsuario(`/usuarios/${id}/estado?activo=${activo}`, token, { method: 'PATCH' })

export async function crearUsuario(datosUsuario, token) {
  const respuesta = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombres: datosUsuario.nombres,
      correo: datosUsuario.correo,
      contrasenaTemporal: datosUsuario.contrasenaTemporal,
      idRol: datosUsuario.idRol,
    }),
  })

  const texto = await respuesta.text()
  let resultado = {}
  if (texto) {
    try { resultado = JSON.parse(texto) } catch { resultado = { mensaje: texto } }
  }
  if (!respuesta.ok || !resultado.exito) {
    throw new Error(resultado.error?.mensaje || resultado.mensaje || `Error HTTP ${respuesta.status}`)
  }
  return resultado
}
