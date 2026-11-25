import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Maximize2, Minimize2, SlidersHorizontal, X } from "lucide-react";

export function FiltrosMapa({ children, resumen, activos = 0 }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null), boton = useRef(null), id = useId();
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false); };
    const cerrar = (e) => { if (e.key === "Escape") { setAbierto(false); boton.current?.focus(); } };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", cerrar);
    return () => { document.removeEventListener("pointerdown", fuera); document.removeEventListener("keydown", cerrar); };
  }, [abierto]);
  return <div className="mapa-filtro" ref={ref}>
    <button ref={boton} type="button" className="mapa-pill mapa-filtro-boton" aria-label="Filtros" aria-expanded={abierto} aria-controls={abierto ? id : undefined} onClick={() => setAbierto((v) => !v)}><SlidersHorizontal size={16}/><span>Filtros</span>{activos > 0 && <b aria-hidden="true">{activos}</b>}<ChevronDown size={13}/></button>
    {abierto && <section id={id} className="mapa-filtro-panel" aria-label="Filtros del mapa"><div className="mapa-filtro-titulo"><div><strong>Personaliza tu vista</strong><p>{resumen || "Todos los datos comparten estos filtros."}</p></div><button type="button" aria-label="Cerrar filtros" onClick={() => {setAbierto(false);boton.current?.focus();}}><X size={18}/></button></div><div className="mapa-filtro-campos">{children}</div><button type="button" className="mapa-filtro-listo" onClick={() => {setAbierto(false);boton.current?.focus();}}><Check size={15}/> Ver resultados</button></section>}
  </div>;
}

export function PantallaCompletaMapa() {
  const ref = useRef(null);
  const [completa, setCompleta] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const cambio = () => setCompleta(document.fullscreenElement === ref.current?.closest(".mapa-pantalla-completa"));
    document.addEventListener("fullscreenchange", cambio);
    return () => document.removeEventListener("fullscreenchange", cambio);
  }, []);
  async function alternar() {
    try {
      setError("");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await ref.current?.closest(".mapa-pantalla-completa")?.requestFullscreen();
    } catch { setError("No se pudo ampliar la vista. Puedes seguir explorando el mapa."); }
  }
  return <div className="mapa-ampliar"><button ref={ref} type="button" className="mapa-pill" aria-label={completa ? "Salir de pantalla completa" : "Ampliar mapa a pantalla completa"} title={completa ? "Salir de pantalla completa" : "Pantalla completa"} onClick={alternar}>{completa ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>{error && <p role="status">{error}</p>}</div>;
}
