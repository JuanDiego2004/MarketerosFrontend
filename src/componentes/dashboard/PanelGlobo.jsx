import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function PanelGlobo({
  titulo,
  etiqueta,
  className = "",
  children,
}) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const panel = useRef(null);
  useEffect(() => {
    panel.current
      ?.closest(".escena-globo")
      ?.dispatchEvent(new Event("globo-panel-cambio"));
  }, [abierto]);
  return (
    <aside
      ref={panel}
      className={`globo-panel ${className}`}
      aria-label={etiqueta || titulo}
      data-abierto={abierto}
    >
      <button
        className="globo-panel-toggle"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
      >
        {titulo}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={id} className="globo-panel-contenido">
        {children}
      </div>
    </aside>
  );
}
