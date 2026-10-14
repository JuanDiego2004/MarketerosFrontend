import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexto/ContextoAuth'
import DrawerFormulario from '../../componentes/DrawerFormulario'
import TablaGlass from '../../componentes/tablaGlass/TablaGlass'
import { eliminarModuloAdministrador, guardarModuloAdministrador, listarModuloAdministrador } from '../../servicios/servicioAdministrador'

const modulos = {
  clientes: {
    titulo: 'Clientes', id: 'idCliente', campos: [['nombre', 'Nombre'], ['correo', 'Correo electrónico'], ['telefono', 'Teléfono']],
    columnas: [{ clave: 'nombre', encabezado: 'Cliente' }, { clave: 'correo', encabezado: 'Correo' }, { clave: 'telefono', encabezado: 'Teléfono' }, { clave: 'estado', encabezado: 'Estado', tipo: 'estado' }],
  },
  canales: {
    titulo: 'Canales de difusión', id: 'idCanal', campos: [['nombreCanal', 'Nombre del canal'], ['tipoCanal', 'Tipo de canal']],
    columnas: [{ clave: 'nombreCanal', encabezado: 'Canal' }, { clave: 'tipoCanal', encabezado: 'Tipo' }, { clave: 'estado', encabezado: 'Estado', tipo: 'estado' }],
  },
}
const clasesCampo = 'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/[.06]'
const tiposCanal = ['REDES_SOCIALES', 'BUSQUEDA', 'EMAIL', 'DISPLAY', 'VIDEO', 'TRADICIONAL', 'OTRO']

export default function ClientesCanalesAdministrador({ apiBase = '/api/admin' }) {
  const { token } = useAuth()
  const [activo, setActivo] = useState('clientes')
  const [registros, setRegistros] = useState([])
  const [formulario, setFormulario] = useState({})
  const [idEditando, setIdEditando] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const configuracion = modulos[activo]
  const entidad = activo === 'clientes' ? 'cliente' : 'canal de difusión'
  const etiquetaModulo = apiBase === '/api/admin' ? 'Administración' : 'Marketing'

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try { setRegistros(await listarModuloAdministrador(activo, token, apiBase)) }
    catch (errorCarga) { setError(errorCarga.message) }
    finally { setCargando(false) }
  }, [activo, token, apiBase])

  useEffect(() => {
    let vigente = true
    listarModuloAdministrador(activo, token, apiBase)
      .then((datos) => { if (vigente) { setRegistros(datos); setError('') } })
      .catch((errorCarga) => { if (vigente) setError(errorCarga.message) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [activo, token, apiBase])

  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false)
    setFormulario({})
    setIdEditando(null)
  }, [])

  function crearRegistro() {
    setFormulario({})
    setIdEditando(null)
    setError('')
    setMensaje('')
    setDrawerAbierto(true)
  }

  function editarRegistro(registro) {
    setIdEditando(registro[configuracion.id])
    setFormulario(registro)
    setError('')
    setMensaje('')
    setDrawerAbierto(true)
  }

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      await guardarModuloAdministrador(activo, formulario, token, idEditando, apiBase)
      cerrarDrawer()
      setMensaje(idEditando ? 'Cambios guardados.' : `${configuracion.titulo} registrado${activo === 'clientes' ? '' : 's'}.`)
      await cargar()
    } catch (errorGuardado) { setError(errorGuardado.message) }
    finally { setGuardando(false) }
  }

  async function desactivar(registro) {
    setError('')
    setMensaje('')
    try {
      await eliminarModuloAdministrador(activo, registro[configuracion.id], token, apiBase)
      setMensaje('Registro desactivado.')
      await cargar()
    } catch (errorActualizacion) { setError(errorActualizacion.message) }
  }

  return <main className="w-full min-w-0 overflow-auto p-5 text-slate-900 md:p-8 xl:p-10">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{etiquetaModulo}</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Clientes y canales</h1><p className="mt-2 text-sm text-slate-500">Administra los catálogos que se utilizan al crear campañas.</p></div>
      <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">{configuracion.titulo} registrados</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{registros.length.toLocaleString('es-PE')}</p></div>
    </div>
    <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {Object.entries(modulos).map(([clave, modulo]) => <button key={clave} type="button" onClick={() => { setActivo(clave); setCargando(true); setMensaje(''); setError('') }} className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${activo === clave ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>{modulo.titulo}</button>)}
    </div>
    {error && !drawerAbierto && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {mensaje && !drawerAbierto && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{mensaje}</p>}
    <TablaGlass datos={registros} cargando={cargando} columnas={configuracion.columnas} claveId={configuracion.id} alCrear={crearRegistro} textoCrear={`Nuevo ${entidad}`} tituloTabla={configuracion.titulo} descripcionTabla="Consulta, busca y actualiza los registros disponibles." accionesFila={(registro) => <div className="flex justify-end gap-2">
      <button type="button" onClick={() => editarRegistro(registro)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100">Editar</button>
      {registro.estado !== 'INACTIVO' && <button type="button" onClick={() => desactivar(registro)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">Desactivar</button>}
    </div>} />

    <DrawerFormulario abierto={drawerAbierto} alCerrar={cerrarDrawer} etiqueta="Catálogo administrativo" titulo={`${idEditando ? 'Editar' : 'Registrar'} ${entidad}`} descripcion="Los datos registrados estarán disponibles al configurar campañas.">
      <form onSubmit={guardar} className="flex min-h-full flex-col">
        <div className="grid gap-5">
          {configuracion.campos.map(([campo, etiqueta]) => <label key={campo} className="text-xs font-semibold text-slate-600">{etiqueta}
            {campo === 'tipoCanal' ? <select required className={clasesCampo} value={formulario[campo] ?? ''} onChange={(evento) => setFormulario({ ...formulario, [campo]: evento.target.value })}><option value="">Selecciona un tipo</option>{tiposCanal.map((tipo) => <option key={tipo} value={tipo}>{tipo.replaceAll('_', ' ')}</option>)}</select> : <input required={campo === 'nombre' || campo === 'nombreCanal'} type={campo === 'correo' ? 'email' : 'text'} className={clasesCampo} placeholder={campo === 'correo' ? 'contacto@empresa.com' : 'Escribe aquí'} value={formulario[campo] ?? ''} onChange={(evento) => setFormulario({ ...formulario, [campo]: evento.target.value })} />}
          </label>)}
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-auto mt-8 flex justify-end gap-2 border-t border-slate-100 pt-6">
          <button type="button" onClick={cerrarDrawer} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={guardando} className="h-10 rounded-xl bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{guardando ? 'Guardando…' : idEditando ? 'Guardar cambios' : 'Registrar'}</button>
        </div>
      </form>
    </DrawerFormulario>
  </main>
}
