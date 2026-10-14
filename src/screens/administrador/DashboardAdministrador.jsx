import { useEffect, useState } from 'react'
import { useAuth } from '../../contexto/ContextoAuth'
import { obtenerDashboardAdministrador } from '../../servicios/servicioAdministrador'
import TablaGlass from '../../componentes/tablaGlass/TablaGlass'

const tarjetas = [
  ['campanasActivas', 'Campañas activas'], ['clientes', 'Clientes activos'], ['audiencias', 'Segmentos de audiencia'],
  ['inversion', 'Inversión registrada', true], ['ingresos', 'Ingresos registrados', true], ['impresiones', 'Impresiones'],
]
const dinero = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const numero = new Intl.NumberFormat('es-PE')

export default function DashboardAdministrador({ apiBase = '/api/admin' }) {
  const { token, usuario } = useAuth()
  const nombreRol = usuario?.rol?.nombreRol?.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() || ''
  const esAnalista = nombreRol.includes('analista') || nombreRol.includes('operador')
  const esLider = nombreRol.includes('lider') || nombreRol.includes('project manager')
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let vigente = true
    obtenerDashboardAdministrador(token, apiBase).then((datos) => { if (vigente) setResumen(datos) }).catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [token, apiBase])

  const columnasCampanas = [
    { clave: 'nombre', encabezado: 'Campaña' },
    { clave: 'estado', encabezado: 'Estado', tipo: 'estado' },
    { clave: 'impresiones', encabezado: 'Impresiones' },
    { clave: 'clics', encabezado: 'Clics' },
    { clave: 'inversion', encabezado: 'Inversión', render: (valor) => dinero.format(Number(valor || 0)) },
    { clave: 'ingresos', encabezado: 'Ingresos', render: (valor) => dinero.format(Number(valor || 0)) },
  ]

  return <main className="w-full min-w-0 overflow-auto p-5 text-slate-900 md:p-8 xl:p-10">
    <div className="mb-7"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Panel de control</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{esAnalista ? 'Resumen operativo' : esLider ? 'Resumen de marketing' : 'Resumen administrativo'}</h1><p className="mt-2 text-sm text-slate-500">Vista general de campañas, clientes, audiencias e inversión.</p></div>
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    {!resumen && !error && <p className="text-slate-500">Cargando resumen…</p>}
    {resumen && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tarjetas.map(([campo, titulo, moneda]) => <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)]" key={campo}><div className="flex items-start justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{titulo}</p><div className="flex h-7 items-end gap-1" aria-hidden="true">{[12, 19, 10, 24, 16].map((altura, indice) => <span key={indice} className="w-1 rounded-t-sm bg-slate-300" style={{ height: `${altura}px` }} />)}</div></div><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-950">{moneda ? dinero.format(Number(resumen[campo] || 0)) : numero.format(Number(resumen[campo] || 0))}</p><p className="mt-1 text-[10px] text-slate-400">Datos registrados en la plataforma</p></article>)}</section>
      <div className="mt-6"><TablaGlass datos={resumen.campanas || []} columnas={columnasCampanas} claveId="idCampana" tituloTabla="Campañas recientes" descripcionTabla="Rendimiento agregado de las últimas campañas registradas." tituloVacio="No hay campañas registradas" /></div>
    </>}
  </main>
}
