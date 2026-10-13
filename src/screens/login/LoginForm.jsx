import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Email from 'supercons/Email'
import PrivateOutline from 'supercons/PrivateOutline'
import Input from '../../componentes/Input.jsx'
import { useAuth } from '../../contexto/ContextoAuth'

export default function LoginForm() {
  const apiUrl = import.meta.env.VITE_API_URL
  const navegar = useNavigate()
  const { guardarSesion } = useAuth()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function iniciarSesion(evento) {
    evento.preventDefault()
    setError('')
    setCargando(true)

    try {
      const respuesta = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      })
      const texto = await respuesta.text()
      let cuerpo = {}
      if (texto) {
        try { cuerpo = JSON.parse(texto) } catch { cuerpo = { mensaje: texto } }
      }

      if (!respuesta.ok || !cuerpo.exito) {
        throw new Error(cuerpo.error?.mensaje || cuerpo.mensaje || `Error HTTP ${respuesta.status}`)
      }

      const datos = cuerpo.datos
      guardarSesion(datos)
      navegar('/dashboard', { replace: true })
    } catch (errorPeticion) {
      setError(errorPeticion instanceof Error ? errorPeticion.message : 'No se pudo iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={iniciarSesion}>
      <Input type="email"
             required value={correo}
             onChange={(evento) => setCorreo(evento.target.value)}
             label="INGRESE CORREO"
             Icono={Email} placeholder="Ingrese su correo..." />

      <Input
          type="password"
          required
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          label="INGRESE CONTRASEÑA" Icono={PrivateOutline} placeholder="***************" />
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={cargando}
        className="bg-white rounded-md text-gray-500 font-loxend px-2 py-2 w-full mt-4 font-medium hover:bg-gray-300 disabled:opacity-50">
        {cargando ? 'Iniciando sesión...' : 'INGRESAR'}
      </button>
    </form>
  )
}
