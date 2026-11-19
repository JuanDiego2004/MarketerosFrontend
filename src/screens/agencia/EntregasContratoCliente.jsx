import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import { VistaMaterial } from "./CentroEntregas";
import "../crm/Crm.css";

export default function EntregasContratoCliente({ contrato: c }) {
  const { token } = useAuth(),
    [datos, setDatos] = useState(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [ocupado, setOcupado] = useState(false),
    [decision, setDecision] = useState(null),
    [observacion, setObservacion] = useState(""),
    [previa, setPrevia] = useState(null);
  useEffect(() => {
    const control = new AbortController();
    solicitarCrm(`/entregas/portal/contratos/${c.id}`, token, {
      signal: control.signal,
    })
      .then((d) => {
        if (!control.signal.aborted) setDatos(d);
      })
      .catch((e) => {
        if (!control.signal.aborted) setError(e.message);
      });
    return () => control.abort();
  }, [token, c.id, revision]);
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa.url);
    },
    [previa],
  );
  async function descargar(f) {
    setOcupado(true);
    try {
      descargarCrm(
        await solicitarCrm(`/entregas/portal/versiones/${f.id}/pdf`, token, {
          archivo: true,
        }),
        `informe-v${f.numero}.pdf`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function mostrar(r) {
    setOcupado(true);
    try {
      const blob = await solicitarCrm(
        `/entregas/portal/medios/${r.media_id}`,
        token,
        { archivo: true },
      );
      setPrevia({
        url: URL.createObjectURL(blob),
        mime: blob.type,
        nombre: r.nombre,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function responder() {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      await solicitarCrm(
        `/entregas/portal/revisiones/${decision.fila.id}`,
        token,
        {
          method: "POST",
          body: {
            estado: decision.estado,
            version: decision.fila.version,
            observacion,
          },
        },
      );
      setDecision(null);
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <section className="crm-panel">
        <h2>{c.nombre}</h2>
        <p>
          {c.servicio} · {c.estado} · {c.desde} a {c.hasta}
        </p>
        <p>{c.alcance}</p>
        <div className="crm-demo-kpis">
          {[
            ["Honorarios previstos", c.honorarios],
            ...(c.servicio === "ANALISIS"
              ? []
              : [
                  ["Producción", c.produccion],
                  ["Presupuesto autorizado", c.presupuesto],
                ]),
          ].map(([k, v]) => (
            <section className="crm-panel" key={k}>
              {k}
              <strong>
                {Number(v).toLocaleString("es-PE")} {c.moneda}
              </strong>
            </section>
          ))}
        </div>
      </section>
      {error && (
        <p role="alert" className="crm-error">
          {error}
          <button
            className="crm-boton"
            onClick={() => {
              setError("");
              setRevision((v) => v + 1);
            }}
          >
            Reintentar
          </button>
        </p>
      )}
      {!datos ? (
        <p role="status">Cargando entregas…</p>
      ) : (
        <>
          <section className="crm-panel">
            <h2>Mis entregables</h2>
            {datos.entregables.length ? (
              datos.entregables.map((t, i) => (
                <p key={i}>
                  {t.fecha} · {t.nombre} · {t.cantidad} unidades · {t.estado}
                </p>
              ))
            ) : (
              <p>Aún no hay entregables registrados.</p>
            )}
            <h3>Prestaciones contratadas</h3>
            {datos.prestaciones.map((p) => (
              <p key={p.prestacion}>
                {p.prestacion} · {p.cantidad}
              </p>
            ))}
          </section>
          {c.servicio !== "ANALISIS" &&
            datos.prestaciones.some(
              (p) => p.prestacion === "PUBLICACION" && Number(p.cantidad) > 0,
            ) && (
              <section className="crm-panel">
                <h2>Materiales y aprobaciones</h2>
                {!datos.revisiones.length ? (
                  <p>No hay materiales enviados para tu revisión.</p>
                ) : (
                  datos.revisiones.map((r) => (
                    <section className="crm-panel" key={r.id}>
                      <h3>
                        {r.codigo} · {r.nombre}
                      </h3>
                      <p>
                        {r.estado} · {r.observacion}
                      </p>
                      <div className="crm-acciones">
                        <button
                          className="crm-boton"
                          disabled={ocupado}
                          onClick={() => mostrar(r)}
                        >
                          Ver material
                        </button>
                        {r.estado === "PENDIENTE" &&
                          ["APROBADO", "RECHAZADO"].map((e) => (
                            <button
                              key={e}
                              className="crm-boton"
                              disabled={ocupado}
                              onClick={() => {
                                setDecision({ fila: r, estado: e });
                                setObservacion("");
                              }}
                            >
                              {e === "APROBADO"
                                ? "Aprobar material"
                                : "Solicitar cambios"}
                            </button>
                          ))}
                      </div>
                    </section>
                  ))
                )}
              </section>
            )}
          <section className="crm-panel">
            <h2>
              {c.servicio === "ANALISIS"
                ? "Anuncios analizados"
                : "Mis publicaciones"}
            </h2>
            {datos.anuncios.map((a) => (
              <p key={a.id}>
                {a.fecha} · {a.codigo} · {a.nombre} · {a.estado}
              </p>
            ))}
          </section>
          <section className="crm-panel">
            <h2>Mis informes y resultados</h2>
            <p>
              Descarga los resultados y recomendaciones que la agencia publicó
              para tu empresa.
            </p>
            {datos.informes.length ? (
              datos.informes.map((f) => (
                <p key={f.id}>
                  {f.titulo} · Versión {f.numero}{" "}
                  <button
                    className="crm-boton"
                    disabled={ocupado}
                    onClick={() => descargar(f)}
                  >
                    <Download size={16} />
                    Descargar PDF
                  </button>
                </p>
              ))
            ) : (
              <p>Aún no se publicaron informes.</p>
            )}
          </section>
        </>
      )}
      {previa && (
        <VistaMaterial previa={previa} cerrar={() => setPrevia(null)} />
      )}
      {decision && (
        <DialogoCrm
          titulo="Confirmar decisión del material"
          ocupado={ocupado}
          cerrar={() => setDecision(null)}
        >
          <p>
            {decision.estado === "APROBADO"
              ? "La agencia podrá continuar con la publicación simulada de este material."
              : "Describe los cambios que solicitas a la agencia."}
          </p>
          <label className="crm-campo">
            Observación
            <textarea
              rows={4}
              maxLength={2000}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </label>
          {error && (
            <p className="crm-error" role="alert">
              {error}
            </p>
          )}
          <div className="crm-acciones">
            <button
              className="crm-boton"
              disabled={ocupado}
              onClick={() => setDecision(null)}
            >
              Cancelar
            </button>
            <button
              className="crm-boton crm-primario"
              disabled={
                ocupado ||
                (decision.estado === "RECHAZADO" && !observacion.trim())
              }
              onClick={responder}
            >
              Registrar decisión
            </button>
          </div>
        </DialogoCrm>
      )}
    </>
  );
}
