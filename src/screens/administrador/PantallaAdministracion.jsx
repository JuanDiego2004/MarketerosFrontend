import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexto/ContextoAuth'
import DrawerFormulario from '../../componentes/DrawerFormulario'
import TablaGlass from '../../componentes/tablaGlass/TablaGlass'
import {
  compararCampanasAdministrador,
  calcularKpisAdministrador,
  eliminarModuloAdministrador,
  exportarReporteCampanas,
  obtenerKpisAdministrador,
  listarModuloAdministrador,
  guardarModuloAdministrador,
  vincularAudienciaAdministrador,
} from '../../servicios/servicioAdministrador'

const configuracion = {
  '/campanas': {
    modulo: 'campanas', titulo: 'Gestión de campañas', campos: [
      ['nombre', 'Nombre', 'text'], ['idCliente', 'Cliente', 'catalogo', 'clientes'], ['idCanal', 'Canal', 'catalogo', 'canales'],
      ['objetivo', 'Objetivo', 'text'], ['presupuestoAsignado', 'Presupuesto', 'number'],
      ['fechaInicio', 'Fecha de inicio', 'date'], ['fechaFin', 'Fecha de fin', 'date'], ['estado', 'Estado', 'select', ['PLANIFICADA', 'ACTIVA', 'PAUSADA', 'FINALIZADA']],
    ], columnas: ['nombre', 'cliente', 'canal', 'estado', 'presupuestoAsignado', 'fechaInicio', 'fechaFin'], id: 'idCampana',
  },
  '/audiencias': {
    modulo: 'audiencias', titulo: 'Gestión de audiencias', campos: [
      ['nombre', 'Nombre del segmento', 'text'], ['descripcion', 'Descripción', 'text'], ['criterios', 'Criterios', 'text'],
      ['edadMin', 'Edad mínima', 'number'], ['edadMax', 'Edad máxima', 'number'], ['ubicacionGeografica', 'Ubicación', 'text'],
      ['nivelSocioeconomico', 'Nivel socioeconómico (A-E)', 'select', ['A', 'B', 'C', 'D', 'E']], ['intereses', 'Intereses separados por coma', 'text'], ['estado', 'Estado', 'select', ['ACTIVO', 'INACTIVO']],
    ], columnas: ['nombre', 'descripcion', 'edadMin', 'edadMax', 'ubicacionGeografica', 'nivelSocioeconomico'], id: 'idSegmento',
  },
  '/metricas': {
    modulo: 'metricas', titulo: 'Métricas operativas', campos: [
      ['idCampana', 'Campaña', 'catalogo', 'campanas'], ['fecha', 'Fecha', 'date'], ['tipoMetrica', 'Periodicidad', 'select', ['DIARIA', 'SEMANAL', 'MENSUAL']],
      ['impresiones', 'Impresiones', 'number'], ['clics', 'Clics', 'number'], ['alcance', 'Alcance', 'number'],
      ['interacciones', 'Interacciones', 'number'], ['conversiones', 'Conversiones', 'number'], ['inversion', 'Inversión', 'number'], ['ingresos', 'Ingresos', 'number'],
    ], columnas: ['campana', 'fecha', 'tipoMetrica', 'impresiones', 'clics', 'alcance', 'interacciones', 'conversiones', 'inversion', 'ingresos'], id: 'idMetrica',
  },
}

const etiquetas = {
  idCampana: 'Campaña', nombre: 'Nombre', cliente: 'Cliente', canal: 'Canal', estado: 'Estado',
  presupuestoAsignado: 'Presupuesto', fechaInicio: 'Inicio', fechaFin: 'Fin', descripcion: 'Descripción',
  edadMin: 'Edad mín.', edadMax: 'Edad máx.', ubicacionGeografica: 'Ubicación', nivelSocioeconomico: 'Nivel',
  fecha: 'Fecha', tipoMetrica: 'Tipo', impresiones: 'Impresiones', clics: 'Clics', alcance: 'Alcance',
  interacciones: 'Interacciones', conversiones: 'Conversiones', inversion: 'Inversión', ingresos: 'Ingresos',
  ctr: 'CTR (%)', roi: 'ROI (%)',
}
const clasesCampoFormulario = 'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/[.06]'

function prepararColumnasTabla(claves) {
  return claves.map((clave) => ({
    clave,
    encabezado: etiquetas[clave] || clave,
    tipo: clave === 'estado' ? 'estado' : undefined,
    render: ['presupuestoAsignado', 'inversion', 'ingresos'].includes(clave)
      ? (valor) => valor === '' || valor == null ? '—' : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(Number(valor))
      : undefined,
  }))
}

function accionesRegistro(fila, { alEditar, alDesactivar, modulo, puedeEliminar = true }) {
  return <div className="flex justify-end gap-2">
    <button type="button" onClick={() => alEditar(fila)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100">Editar</button>
    {alDesactivar && puedeEliminar && fila.estado !== 'INACTIVO' && !(modulo === 'campanas' && fila.estado === 'FINALIZADA') && <button type="button" onClick={() => alDesactivar(fila)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">{modulo === 'metricas' ? 'Eliminar' : modulo === 'campanas' ? 'Finalizar' : 'Desactivar'}</button>}
  </div>
}

function Campo({ campo, valor, cambiar, catalogos }) {
  const [nombre, etiqueta, tipo, opciones] = campo
  if (tipo === 'catalogo') return <label className="text-xs font-semibold text-slate-600">{etiqueta}<select className={clasesCampoFormulario} required value={valor ?? ''} onChange={(e) => cambiar(nombre, e.target.value)}><option value="">Seleccionar</option>{(catalogos[opciones] || []).map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}</select></label>
  if (tipo === 'select') return <label className="text-xs font-semibold text-slate-600">{etiqueta}<select className={clasesCampoFormulario} value={valor ?? ''} onChange={(e) => cambiar(nombre, e.target.value)} required><option value="">Seleccionar</option>{opciones.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}</select></label>
  return <label className="text-xs font-semibold text-slate-600">{etiqueta}<input className={clasesCampoFormulario} type={tipo} min={tipo === 'number' ? 0 : undefined} step={nombre === 'presupuestoAsignado' || nombre === 'inversion' || nombre === 'ingresos' ? '0.01' : '1'} value={valor ?? ''} onChange={(e) => cambiar(nombre, e.target.value)} required={!['descripcion', 'criterios', 'edadMin', 'edadMax', 'ubicacionGeografica', 'nivelSocioeconomico', 'intereses'].includes(nombre)} /></label>
}

export default function PantallaAdministracion({ apiBase = '/api/admin' }) {
  const { pathname } = useLocation()
  const { token, usuario } = useAuth()
  const [registros, setRegistros] = useState([])
  const [formulario, setFormulario] = useState({})
  const [idEditando, setIdEditando] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [comparacion, setComparacion] = useState([])
  const [seleccion, setSeleccion] = useState([])
  const [catalogos, setCatalogos] = useState({ clientes: [], canales: [], campanas: [] })
  const [kpis, setKpis] = useState([])
  const [campanaKpi, setCampanaKpi] = useState('')
  const [segmentoVinculo, setSegmentoVinculo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const modulo = configuracion[pathname]
  const nombreModulo = modulo?.modulo || 'campanas'
  const esComparacion = pathname === '/analisis-comparativo'
  const esReporte = pathname === '/reportes'
  const rolNormalizado = usuario?.rol?.nombreRol?.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() || ''
  const esAnalista = rolNormalizado.includes('analista') || rolNormalizado.includes('operador')
  const esAdministrador = rolNormalizado.includes('admin')
  const etiquetaModulo = esAdministrador ? 'Administración' : 'Marketing'

  const cargar = useCallback(async () => {
    setCargando(true); setError('')
    try { setRegistros(await listarModuloAdministrador(nombreModulo, token, apiBase)) }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }, [nombreModulo, token, apiBase])
  useEffect(() => {
    let vigente = true
    listarModuloAdministrador(nombreModulo, token, apiBase)
      .then((datos) => { if (vigente) { setRegistros(datos); setError('') } })
      .catch((e) => { if (vigente) setError(e.message) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [nombreModulo, pathname, token, apiBase])
  useEffect(() => {
    let vigente = true
    const solicitudes = []
    if (pathname === '/campanas') {
      solicitudes.push(listarModuloAdministrador('clientes', token, apiBase), listarModuloAdministrador('canales', token, apiBase))
    } else if (pathname === '/audiencias' || pathname === '/metricas') {
      solicitudes.push(listarModuloAdministrador('campanas', token, apiBase))
    }
    Promise.all(solicitudes)
      .then((resultados) => {
        if (!vigente) return
        if (pathname === '/campanas') {
          const [clientes, canales] = resultados
          setCatalogos((actual) => ({ ...actual, clientes: clientes.map((x) => ({ id: x.idCliente, nombre: x.nombre })), canales: canales.map((x) => ({ id: x.idCanal, nombre: x.nombreCanal })) }))
        } else if (pathname === '/audiencias' || pathname === '/metricas') {
          const [campanas] = resultados
          setCatalogos((actual) => ({ ...actual, campanas: campanas.map((x) => ({ id: x.idCampana, nombre: x.nombre })) }))
        }
      })
      .catch(() => {
        if (vigente) setCatalogos({ clientes: [], canales: [], campanas: [] })
      })
    return () => { vigente = false }
  }, [pathname, token, apiBase])
  useEffect(() => { if (pathname === '/metricas') obtenerKpisAdministrador(token, apiBase).then(setKpis).catch((e) => setError(e.message)) }, [pathname, token, apiBase])

  const cambiar = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))
  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false)
    setIdEditando(null)
    setFormulario({})
  }, [])
  const crearRegistro = () => {
    setFormulario({})
    setIdEditando(null)
    setError('')
    setMensaje('')
    setDrawerAbierto(true)
  }
  const iniciarEdicion = (registro) => {
    setIdEditando(registro[modulo.id]);
    const datos = { ...registro }
    if (Array.isArray(datos.intereses)) datos.intereses = datos.intereses.join(', ')
    setFormulario(datos); setMensaje(''); setError(''); setDrawerAbierto(true)
  }
  async function guardar(evento) {
    evento.preventDefault(); setGuardando(true); setError(''); setMensaje('')
    const datos = { ...formulario }
    for (const [campo, , tipo] of modulo.campos) if ((tipo === 'number' || tipo === 'catalogo') && datos[campo] !== '' && datos[campo] != null) datos[campo] = Number(datos[campo])
    for (const campo of ['edadMin', 'edadMax', 'nivelSocioeconomico']) if (datos[campo] === '') datos[campo] = null
    if (modulo.modulo === 'audiencias') datos.intereses = (datos.intereses || '').split(',').map((x) => x.trim()).filter(Boolean)
    try { await guardarModuloAdministrador(modulo.modulo, datos, token, idEditando, apiBase); setMensaje(idEditando ? 'Cambios guardados.' : 'Registro creado.'); cerrarDrawer(); await cargar() }
    catch (e) { setError(e.message) }
    finally { setGuardando(false) }
  }
  async function comparar() {
    setError(''); setMensaje('')
    try { setComparacion(await compararCampanasAdministrador(seleccion, token, apiBase)) }
    catch (e) { setError(e.message) }
  }
  async function calcularKpis() {
    setError(''); setMensaje('')
    try { await calcularKpisAdministrador(Number(campanaKpi), desde, hasta, token, apiBase); setKpis(await obtenerKpisAdministrador(token, apiBase)); setMensaje('KPIs calculados para el periodo.') }
    catch (e) { setError(e.message) }
  }
  async function vincularAudiencia() {
    setError(''); setMensaje('')
    try { await vincularAudienciaAdministrador(Number(campanaKpi), Number(segmentoVinculo), token, apiBase); setMensaje('Audiencia vinculada a la campaña.') }
    catch (e) { setError(e.message) }
  }
  async function desactivar(registro) {
    setError(''); setMensaje('')
    try {
      await eliminarModuloAdministrador(modulo.modulo, registro[modulo.id], token, apiBase)
      setMensaje(modulo.modulo === 'metricas' ? 'Métrica eliminada.' : 'Registro desactivado.')
      await cargar()
    } catch (e) { setError(e.message) }
  }
  async function descargarReporte(evento) {
    evento.preventDefault(); setError(''); setMensaje('')
    try { const blob = await exportarReporteCampanas(desde, hasta, token, apiBase); const url = URL.createObjectURL(blob); const enlace = document.createElement('a'); enlace.href = url; enlace.download = 'reporte-campanas.csv'; enlace.click(); URL.revokeObjectURL(url); setMensaje('Reporte descargado.') }
    catch (e) { setError(e.message) }
  }

  if (esComparacion || esReporte) return <main className="w-full min-w-0 overflow-auto p-5 text-slate-900 md:p-8 xl:p-10">
    <div className="mb-7">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{etiquetaModulo}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{esComparacion ? 'Análisis comparativo' : 'Reportes y exportación'}</h1>
      <p className="mt-2 text-sm text-slate-500">{esComparacion ? 'Compara los resultados agregados de tus campañas.' : 'Genera un archivo CSV con campañas y métricas del periodo.'}</p>
    </div>
    {esComparacion ?
        <section className="mb-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Selecciona campañas para comparar</h2>
          <div className="grid gap-2 sm:grid-cols-2">{registros.map((campana) => <label className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-700" key={campana.idCampana}>
            <input type="checkbox" checked={seleccion.includes(campana.idCampana)} onChange={(evento) => setSeleccion((actual) => evento.target.checked ? [...actual, campana.idCampana] : actual.filter((id) => id !== campana.idCampana))} />{campana.nombre}</label>)}
          </div>
          <button type="button" onClick={comparar} className="mt-4 h-10 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800">Comparar campañas</button>
        </section> :
        <form onSubmit={descargarReporte} className="mb-6 grid max-w-2xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Desde
          <input className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" type="date" required value={desde} onChange={(evento) => setDesde(evento.target.value)} />
          </label><label className="text-xs font-semibold text-slate-600">Hasta<input className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" type="date" required value={hasta} onChange={(evento) => setHasta(evento.target.value)} /></label>
          <button className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 sm:col-span-2">Descargar CSV</button>
        </form>}
    {comparacion.length > 0 && <TablaGlass datos={comparacion} columnas={prepararColumnasTabla(['nombre', 'estado', 'impresiones', 'clics', 'inversion', 'ingresos', 'ctr', 'roi'])} claveId="idCampana" tituloTabla="Resultados comparativos" />}
    {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}{mensaje && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{mensaje}</p>}
  </main>

  return <main className="w-full min-w-0 overflow-auto p-5 text-slate-900 md:p-8 xl:p-10">
    <div className="mb-7">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{etiquetaModulo}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{modulo.titulo}</h1>
      <p className="mt-2 text-sm text-slate-500">Administra los registros del sistema de marketing.</p>
    </div>
    {error && !drawerAbierto && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}{mensaje && !drawerAbierto && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{mensaje}</p>}
    {modulo.modulo === 'audiencias' && <section className="mb-6 grid max-w-3xl gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
      <h2 className="text-sm font-semibold text-slate-900 md:col-span-3">Vincular un segmento a una campaña</h2>
      <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={campanaKpi} onChange={(evento) => setCampanaKpi(evento.target.value)}><option value="">Campaña</option>{catalogos.campanas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select><select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={segmentoVinculo} onChange={(evento) => setSegmentoVinculo(evento.target.value)}><option value="">Segmento</option>{registros.map((x) => <option key={x.idSegmento} value={x.idSegmento}>{x.nombre}</option>)}</select><button type="button" onClick={vincularAudiencia} className="h-11 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800">Vincular</button></section>}
    {modulo.modulo === 'metricas' && <>
      {!esAnalista && <section className="mb-6 grid max-w-5xl gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4"><h2 className="text-sm font-semibold text-slate-900 md:col-span-4">Calcular indicadores del periodo</h2><select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={campanaKpi} onChange={(evento) => setCampanaKpi(evento.target.value)}><option value="">Campaña</option>{catalogos.campanas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select><input aria-label="Desde" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" type="date" value={desde} onChange={(evento) => setDesde(evento.target.value)} /><input aria-label="Hasta" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" type="date" value={hasta} onChange={(evento) => setHasta(evento.target.value)} /><button type="button" onClick={calcularKpis} className="h-11 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800">Calcular KPIs</button></section>}
      <div className="mb-6"><TablaGlass datos={kpis} columnas={prepararColumnasTabla(['campana', 'periodoInicio', 'periodoFin', 'ctr', 'cpc', 'cpm', 'roi'])} claveId="idIndicador" tituloTabla="Indicadores calculados" /></div>
    </>}
    <TablaGlass datos={registros} cargando={cargando} columnas={prepararColumnasTabla(modulo.columnas)} claveId={modulo.id} alCrear={crearRegistro} textoCrear={modulo.modulo === 'metricas' ? 'Registrar métrica' : modulo.modulo === 'campanas' ? 'Nueva campaña' : 'Nuevo segmento'} tituloTabla={modulo.titulo} descripcionTabla="Busca y administra los registros de este módulo." accionesFila={modulo.modulo === 'metricas' && !esAdministrador ? undefined : (fila) => accionesRegistro(fila, { alEditar: iniciarEdicion, alDesactivar: desactivar, modulo: modulo.modulo })} />

    <DrawerFormulario abierto={drawerAbierto} alCerrar={cerrarDrawer} etiqueta={modulo.titulo} titulo={`${idEditando ? 'Editar' : 'Registrar'} ${modulo.modulo === 'campanas' ? 'campaña' : modulo.modulo === 'audiencias' ? 'segmento de audiencia' : 'métrica'}`} descripcion="Completa los campos para guardar la información del módulo.">
      <form onSubmit={guardar} className="flex min-h-full flex-col">
        <div className="grid gap-5 sm:grid-cols-2">{modulo.campos.map((campo) => <Campo key={campo[0]} campo={campo} valor={formulario[campo[0]]} cambiar={cambiar} catalogos={catalogos} />)}</div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-6 mt-8"><button type="button" onClick={cerrarDrawer} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button><button disabled={guardando} className="h-10 rounded-xl bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{guardando ? 'Guardando…' : idEditando ? 'Guardar cambios' : 'Registrar'}</button></div>
      </form>
    </DrawerFormulario>
  </main>
}
