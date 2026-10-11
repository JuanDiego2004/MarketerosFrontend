const API_URL = import.meta.env.VITE_API_URL

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