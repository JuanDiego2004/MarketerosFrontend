import { createContext, useContext, useEffect, useState } from 'react'

const ContextoAuth = createContext(null)
const CLAVE_SESION = 'sesionAgencia'

function leerSesionGuardada() {
  try {
    const texto = localStorage.getItem(CLAVE_SESION)
    if (!texto) return null
    const sesion = JSON.parse(texto)
    const vence = Date.parse(sesion.fechaExpiracion)
    if (!sesion.token || !sesion.usuario || !Number.isFinite(vence) || vence <= Date.now()) {
      localStorage.removeItem(CLAVE_SESION)
      return null
    }
    return sesion
  } catch {
    localStorage.removeItem(CLAVE_SESION)
    return null
  }
}

export const ProveedorAuth = ({ children }) => {
  const [sesion, setSesion] = useState(leerSesionGuardada)

  const guardarSesion = (datosSesion) => {
    if (!datosSesion?.token || !datosSesion?.usuario || !datosSesion?.fechaExpiracion) {
      throw new Error('La respuesta no contiene los datos necesarios para iniciar sesión.')
    }
    localStorage.setItem(CLAVE_SESION, JSON.stringify(datosSesion))
    setSesion(datosSesion)
  }

  const cerrarSesion = () => {
    localStorage.removeItem(CLAVE_SESION)
    setSesion(null)
  }

  useEffect(() => {
    if (!sesion?.fechaExpiracion) return undefined
    const milisegundosRestantes = Date.parse(sesion.fechaExpiracion) - Date.now()
    if (!Number.isFinite(milisegundosRestantes) || milisegundosRestantes <= 0) {
      cerrarSesion()
      return undefined
    }
    const temporizador = window.setTimeout(cerrarSesion, milisegundosRestantes)
    return () => window.clearTimeout(temporizador)
  }, [sesion])

  useEffect(() => {
    const sincronizarOtraPestana = (evento) => {
      if (evento.key === CLAVE_SESION) setSesion(leerSesionGuardada())
    }
    window.addEventListener('storage', sincronizarOtraPestana)
    return () => window.removeEventListener('storage', sincronizarOtraPestana)
  }, [])

  const valor = {
    usuario: sesion?.usuario ?? null,
    token: sesion?.token ?? null,
    permisos: sesion?.permisos ?? [],
    sesion,
    cargando: false,
    guardarSesion,
    cerrarSesion,
  }

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
}

export const useAuth = () => {
  const contexto = useContext(ContextoAuth)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <ProveedorAuth>')
  return contexto
}