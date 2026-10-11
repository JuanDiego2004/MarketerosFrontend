import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexto/ContextoAuth'
import { crearUsuario } from '../../servicios/servicioUsuarios'

export default function PantallaUsuarios() {
  const navegar = useNavigate()
  const { usuario, token, cerrarSesion } = useAuth()
  const [nombres, setNombres] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasenaTemporal, setContrasenaTemporal] = useState('')
  const [idRol, setIdRol] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [creado, setCreado] = useState(null)

  async function enviar(evento) {
    evento.preventDefault()
    setCargando(true)
    setError('')
    setCreado(null)
    try {
      const resultado = await crearUsuario({ nombres, correo, contrasenaTemporal, idRol: Number(idRol) }, token)
      setCreado(resultado.datos)
      setNombres('')
      setCorreo('')
      setContrasenaTemporal('')
      setIdRol('')
    } catch (errorPeticion) {
      setError(errorPeticion instanceof Error ? errorPeticion.message : 'No se pudo crear el usuario.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 p-6 text-white">
      <header className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Crear usuario</h1><p>{usuario?.nombres}</p></div>
        <button type="button" onClick={() => { cerrarSesion(); navegar('/login', { replace: true }) }}>Cerrar sesión</button>
      </header>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label>Nombres<input className="w-full rounded border p-2 text-black" required value={nombres} onChange={(e) => setNombres(e.target.value)} /></label>
        <label>Correo<input className="w-full rounded border p-2 text-black" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} /></label>
        <label>Contraseña temporal<input className="w-full rounded border p-2 text-black" type="password" required value={contrasenaTemporal} onChange={(e) => setContrasenaTemporal(e.target.value)} /></label>
        <label>ID de rol<input className="w-full rounded border p-2 text-black" type="number" min="1" required value={idRol} onChange={(e) => setIdRol(e.target.value)} /></label>
        <button disabled={cargando} className="rounded bg-white p-2 font-medium text-gray-800 disabled:opacity-50">{cargando ? 'Creando...' : 'Crear usuario'}</button>
      </form>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {creado && <section role="status" className="rounded bg-white/10 p-4"><h2>{creado.nombres} creado correctamente</h2><p>{creado.correo}</p><p>Estado: {creado.estado}</p><p>Rol: {creado.rol?.nombreRol}</p><p>Fecha: {creado.fechaCreacion}</p></section>}
    </main>
  )
}
