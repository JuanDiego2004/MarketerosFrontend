import { useEffect, useState } from "react";
import { Target, TriangleAlert } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
export default function AlertasMetas({ revision }) {
  const { token } = useAuth();
  const [filas, setFilas] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    solicitarCrm("/operaciones/metas/alertas", token, { signal: c.signal })
      .then(setFilas)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [token, revision]);
  return (
    <div className="crm-resumen">
      {error && (
        <p className="crm-error" role="alert">
          {error}
        </p>
      )}
      {filas.map((m) => {
        const desviada =
          Number(m.leads_actuales) <
            Number(m.leads) * Number(m.avance_periodo) ||
          Number(m.ingresos_actuales) <
            Number(m.ingresos) * Number(m.avance_periodo);
        return (
          <article className="crm-panel" key={m.id}>
            <div className="crm-acciones">
              {desviada ? <TriangleAlert size={18} /> : <Target size={18} />}
              <h2>{m.nombre}</h2>
            </div>
            <p className={desviada ? "crm-error" : "crm-exito"}>
              {desviada
                ? "Por debajo del avance esperado"
                : "Dentro del objetivo esperado"}
            </p>
            <p>
              Leads: {m.leads_actuales} / {m.leads}
            </p>
            <p>
              Ingresos: {m.moneda}{" "}
              {Number(m.ingresos_actuales).toLocaleString("es-PE")} /{" "}
              {Number(m.ingresos).toLocaleString("es-PE")}
            </p>
            <p className="crm-ayuda">
              Avance del período: {Math.round(Number(m.avance_periodo) * 100)}{" "}
              %. Comparación lineal desde {m.desde} hasta {m.hasta}.
            </p>
          </article>
        );
      })}
    </div>
  );
}
