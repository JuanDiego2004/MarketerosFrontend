import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./DrawerFormulario.css";

export default function DrawerFormulario({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  etiqueta = "Formulario",
  ocupado = false,
  ancho = "normal",
  className = "",
  children,
}) {
  const ref = useRef(null);
  const tituloId = useId();
  const descripcionId = useId();
  useEffect(() => {
    if (!abierto) return undefined;
    const dialogo = ref.current;
    const focoAnterior = document.activeElement;
    const desbordamientoAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogo.showModal();
    dialogo.querySelector("[autofocus], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])")?.focus();
    return () => {
      dialogo.close();
      document.body.style.overflow = desbordamientoAnterior;
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <dialog
      ref={ref}
      className="drawer-fondo"
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descripcion ? descripcionId : undefined}
      aria-busy={ocupado}
      onCancel={(evento) => { evento.preventDefault(); if (!ocupado) alCerrar(); }}
      onMouseDown={(evento) =>
        !ocupado && evento.target === evento.currentTarget && alCerrar()
      }
    >
      <section
        className={`drawer-panel ${ancho === "amplio" ? "drawer-panel-amplio" : ""}`}
      >
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
              {etiqueta}
            </p>
            <h2
              id={tituloId}
              className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
            >
              {titulo}
            </h2>
            {descripcion && (
              <p id={descripcionId} className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            disabled={ocupado}
            aria-label="Cerrar formulario"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </header>
        <div className={`drawer-contenido min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 ${className}`}>
          {children}
        </div>
      </section>
    </dialog>,
    document.body,
  );
}
