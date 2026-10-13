import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Email from 'supercons/Email'
import PrivateOutline from 'supercons/PrivateOutline'
import Person from 'supercons/Person'
import Input from '../../componentes/Input.jsx'
import Toast from '../../componentes/Toast.jsx'
import { useAuth } from '../../contexto/ContextoAuth'

export default function RegistroForm() {
  const apiUrl = import.meta.env.VITE_API_URL
  const navegar = useNavigate()
  const { guardarSesion } = useAuth()
  const [nombres, setNombres] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [toast, setToast] = useState({ visible: false, tipo: 'error', titulo: '', descripcion: '' })

  async function registrar(evento) {
    evento.preventDefault()
    if (cargando) return
    setCargando(true)
    try {
      const respuesta = await fetch(`${apiUrl}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ nombres, correo, password }),
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
    } catch (error) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'Error de registro',
        descripcion: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={registrar}>
        <Input value={nombres} onChange={(evento) => setNombres(evento.target.value)} required
          colorLabel="text-gray-400" label="INGRESE NOMBRES" Icono={Person} placeholder="Ingrese sus nombres..." />
        <Input type="email" value={correo} onChange={(evento) => setCorreo(evento.target.value)} required
          colorLabel="text-gray-400" label="INGRESE CORREO" Icono={Email} placeholder="Ingrese su correo..." />
        <Input type="password" value={password} onChange={(evento) => setPassword(evento.target.value)} required
          colorLabel="text-gray-400" label="INGRESE CONTRASEÑA" Icono={PrivateOutline} placeholder="***************" />
        <button type="submit" disabled={cargando}
          className="bg-white/50 rounded-md text-gray-200 font-loxend px-2 py-2 w-full mt-4 font-medium hover:bg-gray-300 disabled:opacity-50">
          {cargando ? 'Registrando...' : 'REGISTRARME'}
        </button>
      </form>
      <div className="absolute bottom-0 left-0">
        <Toast visible={toast.visible} onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
          tipo={toast.tipo} titulo={toast.titulo} descripcion={toast.descripcion} />
      </div>
    </div>
  )
}
