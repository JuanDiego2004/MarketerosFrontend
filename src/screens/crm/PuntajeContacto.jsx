import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge } from "lucide-react";
import { solicitarCrm } from "../../servicios/servicioCrm";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol, GRUPOS_ROL } from "../../utils/roles";
export default function PuntajeContacto({ id }) {
  const { token, usuario } = useAuth();
  const [d, setD] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    solicitarCrm(`/operaciones/score/${id}`, token, { signal: c.signal })
      .then(setD)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, token]);
  return (
    <div className="crm-panel">
      <div className="crm-acciones">
        <Gauge size={18} />
        <h2>Puntuación del lead</h2>
        {obtenerGrupoRol(usuario?.rol?.nombreRol) !== GRUPOS_ROL.ANALISTA && (
          <Link className="crm-link" to="/scoring">
            Configurar reglas
          </Link>
        )}
      </div>
      {error ? (
        <p className="crm-error">{error}</p>
      ) : !d ? (
        <p role="status">Calculando…</p>
      ) : (
        <>
          <strong>{d.puntaje} puntos</strong>
          <p className="crm-ayuda">
            {d.reglas.length
              ? d.reglas.map((r) => `${r.nombre}: ${r.puntos}`).join(" · ")
              : "Sin reglas coincidentes"}
          </p>
        </>
      )}
    </div>
  );
}
