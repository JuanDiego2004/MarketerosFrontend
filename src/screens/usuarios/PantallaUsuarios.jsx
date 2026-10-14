import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexto/ContextoAuth'
import DrawerFormulario from '../../componentes/DrawerFormulario'
import TablaGlass from '../../componentes/tablaGlass/TablaGlass'
import { crearUsuario, listarUsuarios, actualizarUsuario, cambiarEstadoUsuario } from '../../servicios/servicioUsuarios'
import { listarRolesAdministrador } from '../../servicios/servicioAdministrador'

const formularioVacio = { nombres: '', correo: '', contrasenaTemporal: '', idRol: '' }
const columnasUsuarios = [
  { clave: 'nombres', encabezado: 'Nombre' },
  { clave: 'correo', encabezado: 'Correo' },
  { clave: 'rol.nombreRol', encabezado: 'Rol' },
  { clave: 'estado', encabezado: 'Estado', tipo: 'estado' },
]
const clasesCampo = 'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/[.06]'

export default function PantallaUsuarios() {
  const { token } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [formulario, setFormulario] = useState(formularioVacio)
  const [edicion, setEdicion] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargar = useCallback(async () => {
    const [listaUsuarios, listaRoles] = await Promise.all([listarUsuarios(token), listarRolesAdministrador(token)])
    setUsuarios(listaUsuarios)
    setRoles(listaRoles)
  }, [token])

  useEffect(() => {
    let vigente = true
    Promise.all([listarUsuarios(token), listarRolesAdministrador(token)])
      .then(([listaUsuarios, listaRoles]) => { if (vigente) { setUsuarios(listaUsuarios); setRoles(listaRoles) } })
      .catch((errorCarga) => { if (vigente) setError(errorCarga.message) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [token])

  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false)
    setEdicion(null)
    setFormulario(formularioVacio)
  }, [])

  function crearRegistro() {
    setEdicion(null)
    setFormulario(formularioVacio)
    setError('')
    setMensaje('')
    setDrawerAbierto(true)
  }

  function editar(usuario) {
    setEdicion(usuario)
    setFormulario({ nombres: usuario.nombres, correo: usuario.correo, contrasenaTemporal: '', idRol: String(usuario.rol?.idRol ?? '') })
    setMensaje('')
    setError('')
    setDrawerAbierto(true)
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)
    try {
      if (edicion) await actualizarUsuario(edicion.idUsuario, { nombres: formulario.nombres, idRol: Number(formulario.idRol) }, token)
      else await crearUsuario({ ...formulario, idRol: Number(formulario.idRol) }, token)
      setMensaje(edicion ? 'Usuario actualizado.' : 'Usuario creado.')
      setCargando(true)
      await cargar()
      cerrarDrawer()
    } catch (errorGuardado) {
      setError(errorGuardado.message)
    } finally {
      setCargando(false)
      setGuardando(false)
    }
  }

  async function alternarEstado(usuario) {
    setError('')
    setMensaje('')
    try {
      await cambiarEstadoUsuario(usuario.idUsuario, usuario.estado !== 'ACTIVO', token)
      setMensaje('Estado actualizado.')
      setCargando(true)
      await cargar()
    } catch (errorActualizacion) {
      setError(errorActualizacion.message)
    } finally {
      setCargando(false)
    }
  }

  return <main className="w-full min-w-0 overflow-auto p-5 text-slate-900 md:p-8 xl:p-10">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Administración</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Gestión de usuarios</h1><p className="mt-2 text-sm text-slate-500">Crea cuentas de acceso, asigna roles y administra su estado.</p></div>
      <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Usuarios registrados</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{usuarios.length.toLocaleString('es-PE')}</p></div>
    </div>
    {error && !drawerAbierto && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {mensaje && !drawerAbierto && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{mensaje}</p>}
    <TablaGlass datos={usuarios} cargando={cargando} columnas={columnasUsuarios} claveId="idUsuario" alCrear={crearRegistro} textoCrear="Nuevo usuario" tituloTabla="Directorio de usuarios" descripcionTabla="Busca perfiles, revisa sus roles y actualiza su acceso." accionesFila={(usuario) => <div className="flex justify-end gap-2">
      <button type="button" onClick={() => editar(usuario)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100">Editar</button>
      <button type="button" onClick={() => alternarEstado(usuario)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">{usuario.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</button>
    </div>} />

    <DrawerFormulario abierto={drawerAbierto} alCerrar={cerrarDrawer} etiqueta="Administración de usuarios" titulo={edicion ? 'Editar usuario' : 'Registrar usuario'} descripcion="Completa los datos de acceso y asigna el rol correspondiente.">
      <form onSubmit={guardar} className="flex min-h-full flex-col">
        <div className="grid gap-5">
          <label className="text-xs font-semibold text-slate-600">Nombres<input className={clasesCampo} required autoFocus value={formulario.nombres} placeholder="Nombre y apellidos" onChange={(evento) => setFormulario({ ...formulario, nombres: evento.target.value })} /></label>
          <label className="text-xs font-semibold text-slate-600">Correo electrónico<input className={clasesCampo} type="email" required disabled={Boolean(edicion)} value={formulario.correo} placeholder="nombre@empresa.com" onChange={(evento) => setFormulario({ ...formulario, correo: evento.target.value })} /></label>
          {!edicion && <label className="text-xs font-semibold text-slate-600">Contraseña temporal<input className={clasesCampo} type="password" minLength={8} required value={formulario.contrasenaTemporal} placeholder="Mínimo 8 caracteres" onChange={(evento) => setFormulario({ ...formulario, contrasenaTemporal: evento.target.value })} /><span className="mt-1 block font-normal text-slate-400">El usuario podrá cambiarla después de ingresar.</span></label>}
          <label className="text-xs font-semibold text-slate-600">Rol<select className={clasesCampo} required value={formulario.idRol} onChange={(evento) => setFormulario({ ...formulario, idRol: evento.target.value })}><option value="">Selecciona un rol</option>{roles.map((rol) => <option key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</option>)}</select></label>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-6 mt-8">
          <button type="button" onClick={cerrarDrawer} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={guardando} className="h-10 rounded-xl bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{guardando ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </DrawerFormulario>
  </main>
}
