import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './DrawerFormulario.css'

export default function DrawerFormulario({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  etiqueta = 'Formulario',
  children,
}) {
  useEffect(() => {
    if (!abierto) return undefined

    const desbordamientoAnterior = document.body.style.overflow
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') alCerrar()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.body.style.overflow = desbordamientoAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto, alCerrar])

  if (!abierto) return null

  return createPortal(
    <div className="drawer-fondo" onMouseDown={(evento) => evento.target === evento.currentTarget && alCerrar()}>
      <section className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-drawer">
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{etiqueta}</p>
            <h2 id="titulo-drawer" className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{titulo}</h2>
            {descripcion && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{descripcion}</p>}
          </div>
          <button type="button" onClick={alCerrar} aria-label="Cerrar formulario" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
