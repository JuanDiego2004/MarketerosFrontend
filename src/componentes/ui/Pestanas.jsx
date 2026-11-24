import { useId, useRef } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

/** Selector de vistas o paneles, controlado por el estado/URL del módulo. */
export default function Pestanas({ opciones, valor, alCambiar, etiqueta = "Vistas", tipo = "vistas", panelId, idBase, className = "" }) {
  const id = useId();
  const base = idBase || `pestana-${id}`;
  const lista = useRef(null);
  const reducido = useReducedMotion();
  const paneles = tipo === "paneles";
  function teclado(evento, indice) {
    const disponibles = opciones.filter((o) => !o.disabled);
    const actual = disponibles.findIndex((o) => o.valor === opciones[indice].valor);
    const siguiente = evento.key === "Home" ? disponibles[0] : evento.key === "End" ? disponibles.at(-1) : evento.key === "ArrowRight" ? disponibles[(actual + 1) % disponibles.length] : evento.key === "ArrowLeft" ? disponibles[(actual - 1 + disponibles.length) % disponibles.length] : null;
    if (!siguiente) return;
    evento.preventDefault();
    alCambiar(siguiente.valor);
    const boton = [...lista.current.querySelectorAll("button")].find((b) => b.dataset.valor === String(siguiente.valor));
    boton?.focus();
    boton?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }
  return <LayoutGroup id={id}><nav ref={lista} aria-label={etiqueta} role={paneles ? "tablist" : undefined} className={`ui-pestanas ${className}`}>
    {opciones.map((opcion, indice) => {
      const activa = opcion.valor === valor;
      const Icono = opcion.icono;
      return <button key={opcion.valor} type="button" data-valor={opcion.valor} data-activa={activa} disabled={opcion.disabled} id={paneles ? `${base}-${opcion.valor.replaceAll(" ", "-")}` : undefined} role={paneles ? "tab" : undefined} aria-selected={paneles ? activa : undefined} aria-pressed={paneles ? undefined : activa} aria-controls={paneles ? panelId : undefined} tabIndex={paneles && !activa ? -1 : undefined} onClick={() => alCambiar(opcion.valor)} onKeyDown={(evento) => teclado(evento, indice)}>
        {activa && <motion.span className="ui-pestana-indicador" layoutId={`pestana-${id}`} transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 430, damping: 38 }} />}
        {Icono && <Icono size={16} aria-hidden="true" />}<span>{opcion.etiqueta}</span>{opcion.cantidad != null && <small>{opcion.cantidad}</small>}
      </button>;
    })}
  </nav></LayoutGroup>;
}
