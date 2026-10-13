import { useEffect, useMemo, useState } from 'react'
import {
  claseEstado,
  extraerFilas,
  IconoBuscar,
  IconoOrden,
  IconoRecargar,
  obtenerValor,
  textoPlano,
} from './funciones.jsx'

export default function TablaGlass({
  columnas = [],
  datos,
  cargarDatos,
  cargando: cargandoExterno = false,
  error: errorExterno = '',
  filasPorPagina = 8,
  accionesFila,
  tituloVacio = 'Todavía no hay registros',
  descripcionVacia = 'Cuando haya información disponible aparecerá aquí.',
}) {
  const [filasCargadas, setFilasCargadas] = useState([])
  const [cargandoLocal, setCargandoLocal] = useState(false)
  const [errorLocal, setErrorLocal] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [orden, setOrden] = useState({ clave: '', direccion: '' })

  useEffect(() => {
    let vigente = true
    if (Array.isArray(datos)) {
      setFilasCargadas(datos)
      setErrorLocal('')
      setCargandoLocal(false)
      return () => { vigente = false }
    }
    if (typeof cargarDatos !== 'function') {
      setFilasCargadas([])
      setCargandoLocal(false)
      return () => { vigente = false }
    }
    setCargandoLocal(true)
    setErrorLocal('')
    Promise.resolve().then(cargarDatos)
      .then((respuesta) => { if (vigente) setFilasCargadas(extraerFilas(respuesta)) })
      .catch((errorCarga) => { if (vigente) setErrorLocal(errorCarga?.message || 'No se pudieron cargar los datos.') })
      .finally(() => { if (vigente) setCargandoLocal(false) })
    return () => { vigente = false }
  }, [datos, cargarDatos])

  const recargar = async () => {
    if (typeof cargarDatos !== 'function') return
    setCargandoLocal(true)
    setErrorLocal('')
    try {
      setFilasCargadas(extraerFilas(await cargarDatos()))
      setPagina(1)
    } catch (errorCarga) {
      setErrorLocal(errorCarga?.message || 'No se pudieron cargar los datos.')
    } finally {
      setCargandoLocal(false)
    }
  }

  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase()
    let resultado = termino
      ? filasCargadas.filter((fila) => columnas.some((columna) =>
          textoPlano(obtenerValor(fila, columna)).toLocaleLowerCase().includes(termino)))
      : [...filasCargadas]

    if (orden.clave) {
      const columna = columnas.find((item) => (item.clave ?? item.accessorKey) === orden.clave)
      if (columna) {
        resultado.sort((a, b) => {
          const valorA = obtenerValor(a, columna)
          const valorB = obtenerValor(b, columna)
          const numeroA = Number(valorA)
          const numeroB = Number(valorB)
          const comparacion = !Number.isNaN(numeroA) && !Number.isNaN(numeroB)
            ? numeroA - numeroB
            : textoPlano(valorA).localeCompare(textoPlano(valorB), 'es', { numeric: true, sensitivity: 'base' })
          return orden.direccion === 'asc' ? comparacion : -comparacion
        })
      }
    }
    return resultado
  }, [filasCargadas, busqueda, columnas, orden])

  const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / filasPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const filasVisibles = filasFiltradas.slice((paginaActual - 1) * filasPorPagina, paginaActual * filasPorPagina)
  const cargando = cargandoExterno || cargandoLocal
  const error = errorExterno || errorLocal
  const primeraFila = filasFiltradas.length === 0 ? 0 : (paginaActual - 1) * filasPorPagina + 1
  const ultimaFila = Math.min(paginaActual * filasPorPagina, filasFiltradas.length)

  const cambiarOrden = (columna) => {
    if (columna.ordenable === false) return
    const clave = columna.clave ?? columna.accessorKey
    if (!clave) return
    setOrden((actual) => ({
      clave,
      direccion: actual.clave !== clave ? 'asc' : actual.direccion === 'asc' ? 'desc' : actual.direccion === 'desc' ? '' : 'asc',
    }))
  }

  return (
    <section className="w-full rounded-3xl border border-white/70 bg-black/25 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.03] backdrop-blur-md sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <label className="flex h-11 w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 text-slate-500 shadow-sm shadow-slate-900/[0.03] transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-400/10">
          <IconoBuscar />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1) }}
            placeholder="Buscar en la tabla..."
            aria-label="Buscar registros"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-00 outline-none placeholder:text-slate-400"
          />
        </label>
        {cargarDatos && (
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-wait disabled:opacity-50"
            type="button"
            onClick={recargar}
            disabled={cargando}
            aria-label="Recargar datos"
            title="Recargar"
          >
            <IconoRecargar />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/45 shadow-inner shadow-slate-900/[0.025]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead className="bg-slate-100/65">
              <tr>
                {columnas.map((columna, indice) => {
                  const clave = columna.clave ?? columna.accessorKey ?? `columna-${indice}`
                  const ordenable = columna.ordenable !== false && Boolean(columna.clave ?? columna.accessorKey)
                  return (
                    <th key={clave} className={`h-12 whitespace-nowrap border-b border-slate-200/70 px-4 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 sm:px-5 ${columna.encabezadoClassName || ''}`} style={{ width: columna.ancho }}>
                      <button type="button" className="inline-flex items-center gap-1.5 disabled:cursor-default" onClick={() => cambiarOrden(columna)} disabled={!ordenable}>
                        {columna.encabezado ?? columna.header ?? clave}
                        {ordenable && <IconoOrden direccion={orden.clave === clave ? orden.direccion : ''} />}
                      </button>
                    </th>
                  )
                })}
                {accionesFila && <th className="h-12 whitespace-nowrap border-b border-slate-200/70 px-4 text-right text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 sm:px-5">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? Array.from({ length: Math.min(filasPorPagina, 5) }, (_, indice) => (
                <tr key={`skeleton-${indice}`}>
                  {columnas.map((columna, celda) => <td key={columna.clave ?? celda} className="h-14 border-b border-slate-200/50 px-4 sm:px-5"><span className="block h-2.5 w-3/4 animate-pulse rounded-full bg-slate-200/80" /></td>)}
                  {accionesFila && <td className="border-b border-slate-200/50 px-4"><span className="ml-auto block h-7 w-12 animate-pulse rounded-lg bg-slate-200/80" /></td>}
                </tr>
              )) : error ? (
                <tr><td colSpan={columnas.length + (accionesFila ? 1 : 0)}>
                  <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 bg-rose-50 text-sm font-bold text-rose-600">!</span>
                    <strong className="mt-3 text-sm font-semibold text-slate-700">No se pudieron cargar los datos</strong>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{error}</p>
                    {cargarDatos && <button type="button" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100" onClick={recargar}>Intentar de nuevo</button>}
                  </div>
                </td></tr>
              ) : filasVisibles.length > 0 ? filasVisibles.map((fila, indiceFila) => (
                <tr className="group transition-colors hover:bg-emerald-50/55" key={fila.id ?? fila.idCliente ?? fila.idUsuario ?? `${paginaActual}-${indiceFila}`}>
                  {columnas.map((columna, indiceColumna) => {
                    const valor = obtenerValor(fila, columna)
                    const contenido = columna.render ? columna.render(valor, fila) : columna.tipo === 'estado'
                      ? <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${claseEstado(valor)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{textoPlano(valor)}</span>
                      : <span className="inline-block max-w-[360px] overflow-hidden text-ellipsis align-middle whitespace-nowrap text-sm text-slate-700">{textoPlano(valor) || '—'}</span>
                    return <td key={columna.clave ?? indiceColumna} className={`h-[58px] border-b border-slate-200/55 px-4 text-sm last:border-b-0 sm:px-5 ${columna.className || ''}`}>{contenido}</td>
                  })}
                  {accionesFila && <td className="h-[58px] border-b border-slate-200/55 px-4 text-right last:border-b-0 sm:px-5">{accionesFila(fila)}</td>}
                </tr>
              )) : (
                <tr><td colSpan={columnas.length + (accionesFila ? 1 : 0)}>
                  <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
                    <div className="flex h-10 items-end gap-1 rounded-xl border border-slate-200 bg-white/70 p-2 shadow-sm"><span className="h-3 w-1.5 rounded-t bg-emerald-300" /><span className="h-5 w-1.5 rounded-t bg-emerald-400" /><span className="h-4 w-1.5 rounded-t bg-emerald-200" /></div>
                    <strong className="mt-3 text-sm font-semibold text-slate-700">{busqueda ? 'No encontramos coincidencias' : tituloVacio}</strong>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{busqueda ? 'Prueba con otro término de búsqueda.' : descripcionVacia}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4 text-xs text-slate-500">
        <span>Mostrando <strong className="font-semibold text-slate-700">{primeraFila}–{ultimaFila}</strong> de <strong className="font-semibold text-slate-700">{filasFiltradas.length}</strong></span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPagina(1)} disabled={paginaActual <= 1} aria-label="Primera página" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white/70 text-lg text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-default disabled:opacity-35">«</button>
          <button type="button" onClick={() => setPagina((actual) => Math.max(1, actual - 1))} disabled={paginaActual <= 1} aria-label="Página anterior" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white/70 text-xl text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-default disabled:opacity-35">‹</button>
          <span className="min-w-14 px-1 text-center text-[11px]"><strong className="font-semibold text-slate-700">{paginaActual}</strong><span className="mx-1.5 text-slate-400">/</span>{totalPaginas}</span>
          <button type="button" onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} disabled={paginaActual >= totalPaginas} aria-label="Página siguiente" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white/70 text-xl text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-default disabled:opacity-35">›</button>
          <button type="button" onClick={() => setPagina(totalPaginas)} disabled={paginaActual >= totalPaginas} aria-label="Última página" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white/70 text-lg text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-default disabled:opacity-35">»</button>
        </div>
      </footer>
    </section>
  )
}