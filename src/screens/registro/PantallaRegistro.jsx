import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Email from 'supercons/Email'
import PrivateOutline from 'supercons/PrivateOutline'
import Person from 'supercons/Person'
import Input from '../../componentes/Input.jsx'
import { useAuth } from '../../contexto/ContextoAuth'
import LayoutAuth from '../../componentes/LayoutAuth'

const PantallaRegistro = () => {
  const navegar = useNavigate()
  const { guardarSesion } = useAuth()
  const [nombres, setNombres] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setError('')
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ nombres, correo, password: contrasena }),
      })
      const texto = await respuesta.text()
      let cuerpo = {}
      if (texto) {
        try { cuerpo = JSON.parse(texto) } catch { cuerpo = { mensaje: texto } }
      }
      if (!respuesta.ok || !cuerpo.exito) {
        throw new Error(cuerpo.error?.mensaje || cuerpo.mensaje || `Error HTTP ${respuesta.status}`)
      }
      guardarSesion(cuerpo.datos)
      navegar(cuerpo.datos.rutaInicio || '/campanas', { replace: true })
    } catch (errorPeticion) {
      setError(errorPeticion instanceof Error ? errorPeticion.message : 'No se pudo registrar la cuenta.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <LayoutAuth>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="mt-2 text-sm opacity-70">Únete al sistema de marketing</p>
      </div>
      <form onSubmit={manejarEnvio} className="space-y-5">
        <Input label="Nombres" Icono={Person} value={nombres} onChange={(evento) => setNombres(evento.target.value)} required placeholder="Tus nombres" />
        <Input type="email" label="Correo electrónico" Icono={Email} value={correo} onChange={(evento) => setCorreo(evento.target.value)} required placeholder="tu@correo.com" />
        <Input type="password" label="Contraseña" Icono={PrivateOutline} value={contrasena} onChange={(evento) => setContrasena(evento.target.value)} required placeholder="Mínimo 8 caracteres" />
        <Input type="password" label="Confirmar contraseña" Icono={PrivateOutline} value={confirmarContrasena} onChange={(evento) => setConfirmarContrasena(evento.target.value)} required placeholder="Repite tu contraseña" />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={cargando} className="w-full py-3 px-6 rounded-xl font-semibold disabled:opacity-50 bg-white/90 text-gray-800 hover:bg-white">
          {cargando ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm opacity-70">
        ¿Ya tienes cuenta? <Link to="/login" className="font-semibold underline">Inicia sesión</Link>
      </p>
    </LayoutAuth>
  )
}

export default PantallaRegistro