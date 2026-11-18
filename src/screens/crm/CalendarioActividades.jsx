import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
const iso = (d) => d.toLocaleDateString("en-CA", { timeZone: "America/Lima" });
export default function CalendarioActividades({
  revision,
  editar,
  gestionar,
  propias,
}) {
  const { token } = useAuth();
  const [desde, setDesde] = useState(iso(new Date()));
  const [filas, setFilas] = useState(null),
    [error, setError] = useState("");
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(desde + "T12:00:00-05:00");
    d.setDate(d.getDate() + i);
    return d;
  });
  const hasta = iso(dias[6]);
  useEffect(() => {
    const c = new AbortController();
    solicitarCrm(
      `/operaciones/actividades/calendario?desde=${desde}&hasta=${hasta}&propias=${propias}`,
      token,
      { signal: c.signal },
    )
      .then((d) => {
        if (!c.signal.aborted) {
          setFilas(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [desde, hasta, propias, revision, token]);
  function mover(n) {
    const d = new Date(desde + "T12:00:00-05:00");
    d.setDate(d.getDate() + n);
    setDesde(iso(d));
    setFilas(null);
  }
  return (
    <section>
      <div className="crm-filtros">
        <button
          className="crm-boton"
          aria-label="Semana anterior"
          onClick={() => mover(-7)}
        >
          <ChevronLeft size={16} />
        </button>
        <label className="crm-campo">
          Semana desde
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              if (e.target.value) {
                setDesde(e.target.value);
                setFilas(null);
              }
            }}
          />
        </label>
        <button
          className="crm-boton"
          aria-label="Semana siguiente"
          onClick={() => mover(7)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {error ? (
        <p className="crm-error" role="alert">
          {error}
        </p>
      ) : !filas ? (
        <p role="status">Cargando calendario…</p>
      ) : (
        <div className="crm-calendario">
          {dias.map((d) => (
            <section className="crm-columna" key={iso(d)}>
              <h2>
                {d.toLocaleDateString("es-PE", {
                  timeZone: "America/Lima",
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </h2>
              {filas
                .filter((f) => iso(new Date(f.fecha)) === iso(d))
                .map((f) => (
                  <article className="crm-tarjeta" key={f.id}>
                    <strong>{f.nombre}</strong>
                    <p>
                      {new Date(f.fecha).toLocaleTimeString("es-PE", {
                        timeZone: "America/Lima",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span className="crm-estado">{f.estado}</span>
                    {gestionar && (
                      <button className="crm-boton" onClick={() => editar(f)}>
                        Editar tarea
                      </button>
                    )}
                  </article>
                ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
