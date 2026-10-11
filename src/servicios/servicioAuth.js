const API_URL = import.meta.env.VITE_API_URL
const CLAVE_SESION = 'sesionAgencia'

async function enviarSolicitud(ruta, cuerpo) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(cuerpo),
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

export const iniciarSesion = (correo, contrasena) =>
  enviarSolicitud('/auth/login', { correo, contrasena })

export const registrarUsuario = (nombres, correo, contrasena) =>
  enviarSolicitud('/auth/registro', { nombres, correo, password: contrasena })

export const cerrarSesion = async () => {
  localStorage.removeItem(CLAVE_SESION)
  return { error: null }
}

export const obtenerSesion = async () => {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null')
    if (!sesion?.token || Date.parse(sesion.fechaExpiracion) <= Date.now()) {
      localStorage.removeItem(CLAVE_SESION)
      return { sesion: null, error: null }
    }
    return { sesion, error: null }
  } catch (error) {
    return { sesion: null, error }
  }
}