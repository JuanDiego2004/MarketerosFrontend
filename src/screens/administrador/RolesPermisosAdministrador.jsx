import { useEffect, useState } from 'react'
import { useAuth } from '../../contexto/ContextoAuth'
import { actualizarPermisosRol, listarPermisosAdministrador, listarRolesAdministrador } from '../../servicios/servicioAdministrador'

function normalizarIdsPermisos(permisos = []) {
  return [...new Set(permisos
    .map((permiso) => Number(typeof permiso === 'object' ? permiso?.idPermiso : permiso))
    .filter(Number.isInteger))]
}

export default function RolesPermisosAdministrador() {
  const { token } = useAuth()
  const [roles, setRoles] = useState([])
  const [permisos, setPermisos] = useState([])
  const [seleccionado, setSeleccionado] = useState('')
  const [marcados, setMarcados] = useState([])
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let vigente = true
    Promise.all([listarRolesAdministrador(token), listarPermisosAdministrador(token)])
      .then(([listaRoles, listaPermisos]) => {
        if (!vigente) return
        const rolInicial = listaRoles[0]
        setRoles(listaRoles)
        setPermisos(listaPermisos)
        setSeleccionado(String(rolInicial?.idRol ?? ''))
        setMarcados(normalizarIdsPermisos(rolInicial?.permisos))
        setError('')
      })
      .catch((e) => { if (vigente) setError(e.message) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [token])
  const rolActual = roles.find((rol) => String(rol.idRol) === seleccionado)
  function cambiarRol(id) {
    setSeleccionado(id)
    const rol = roles.find((x) => String(x.idRol) === id)
    setMarcados(normalizarIdsPermisos(rol?.permisos))
    setError('')
    setMensaje('')
  }
  async function guardar() {
    if (!seleccionado) return
    setGuardando(true); setError(''); setMensaje('')
    try {
      await actualizarPermisosRol(Number(seleccionado), normalizarIdsPermisos(marcados), token)
      const listaActualizada = await listarRolesAdministrador(token)
      const rolActualizado = listaActualizada.find((rol) => String(rol.idRol) === seleccionado)
      setRoles(listaActualizada)
      setMarcados(normalizarIdsPermisos(rolActualizado?.permisos))
      setMensaje('Permisos guardados y verificados con el servidor.')
    }
    catch (e) { setError(e.message) } finally { setGuardando(false) }
  }
  const modulos = [...new Set(permisos.map((p) => p.modulo))]
  return <main className="w-full overflow-auto p-6 text-slate-900 md:p-10">
    <h1 className="mb-2 text-3xl font-semibold">Roles y permisos</h1><p className="mb-6 text-slate-600">Consulta los permisos por módulo y define las capacidades asociadas a cada rol.</p>
    <section className="mb-6 max-w-xl rounded-xl border border-slate-200 bg-white p-5"><label className="flex flex-col gap-2">Rol<select disabled={cargando || guardando} className="rounded-lg border p-2.5" value={seleccionado} onChange={(e) => cambiarRol(e.target.value)}>{roles.map((rol) => <option key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</option>)}</select></label></section>
    {cargando ? <p className="text-slate-500">Cargando roles y permisos…</p> : <div className="grid gap-4 xl:grid-cols-2">{modulos.map((modulo) => <section className="rounded-xl border border-slate-200 bg-white p-5" key={modulo}><h2 className="mb-3 font-semibold">{modulo}</h2><div className="grid gap-2 sm:grid-cols-2">{permisos.filter((permiso) => permiso.modulo === modulo).map((permiso) => { const idPermiso = Number(permiso.idPermiso); return <label key={idPermiso} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm"><input type="checkbox" checked={marcados.includes(idPermiso)} disabled={guardando} onChange={(e) => setMarcados((actual) => e.target.checked ? normalizarIdsPermisos([...actual, idPermiso]) : actual.filter((id) => id !== idPermiso))} /><span><strong className="block">{permiso.codigo}</strong>{permiso.descripcion}</span></label> })}</div></section>)}</div>}
    {permisos.length === 0 && !error && <p className="text-slate-500">El catálogo de permisos todavía está vacío.</p>}
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}{mensaje && <p role="status" className="mt-4 text-emerald-700">{mensaje}</p>}
    <button disabled={!rolActual || guardando} onClick={guardar} className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-white disabled:opacity-50">{guardando ? 'Guardando…' : 'Guardar permisos del rol'}</button>
  </main>
}
