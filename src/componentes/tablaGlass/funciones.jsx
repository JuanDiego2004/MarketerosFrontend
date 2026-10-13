export function extraerFilas(respuesta) {
  if (Array.isArray(respuesta)) return respuesta
  if (Array.isArray(respuesta?.datos)) return respuesta.datos
  if (Array.isArray(respuesta?.datos?.datos)) return respuesta.datos.datos
  if (Array.isArray(respuesta?.content)) return respuesta.content
  if (Array.isArray(respuesta?.items)) return respuesta.items
  return []
}

export function obtenerValor(fila, columna) {
  if (typeof columna.accesor === 'function') return columna.accesor(fila)
  const ruta = columna.clave ?? columna.accessorKey
  if (!ruta) return ''
  return String(ruta).split('.').reduce((valor, parte) => valor?.[parte], fila) ?? ''
}

export function textoPlano(valor) {
  if (valor == null) return ''
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') return String(valor)
  if (valor instanceof Date) return valor.toLocaleDateString()
  return ''
}

export function claseEstado(valor) {
  const estado = textoPlano(valor).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (['activo', 'activa', 'completado', 'completada', 'publicada', 'aprobado'].includes(estado)) return 'bg-emerald-100/80 text-emerald-800 ring-emerald-200/80'
  if (['pendiente', 'en curso', 'programada', 'borrador'].includes(estado)) return 'bg-amber-100/80 text-amber-800 ring-amber-200/80'
  if (['inactivo', 'inactiva', 'cancelado', 'cancelada', 'rechazado', 'error'].includes(estado)) return 'bg-rose-100/80 text-rose-800 ring-rose-200/80'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

export function IconoBuscar() {
  return <svg className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
}

export function IconoRecargar() {
  return <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6.4L20 12M4 12l2 5.6A7 7 0 0 0 18.4 15" /></svg>
}

export function IconoOrden({ direccion }) {
  return <svg className={`h-3 w-3 fill-none stroke-current ${direccion ? 'text-emerald-600' : 'text-slate-400'}`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16" aria-hidden="true">
    {direccion === 'asc' ? <path d="m4 10 4-4 4 4" /> : direccion === 'desc' ? <path d="m4 6 4 4 4-4" /> : <><path d="m4 6 4-3 4 3M4 10l4 3 4-3" /></>}
  </svg>
}