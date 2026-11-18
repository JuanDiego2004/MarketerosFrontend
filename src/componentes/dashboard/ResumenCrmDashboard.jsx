import { useEffect, useMemo, useState } from "react";
import { solicitarCrm } from "../../servicios/servicioCrm";
import { dinero, numero, proporcion } from "./datosMarketing";

export default function ResumenCrmDashboard({
  token,
  desde,
  hasta,
  campanas,
  demo,
  revision,
  filtroGeografico,
}) {
  const [estado, setEstado] = useState({ datos: null, error: "", clave: "" });
  const [modelo, setModelo] = useState("PRIMERO");
  const clave = `${desde}/${hasta}/${modelo}/${revision}`;
  useEffect(() => {
    if (demo) return;
    const controlador = new AbortController();
    solicitarCrm(
      `/operaciones/atribucion?${new URLSearchParams({ desde, hasta, modelo })}`,
      token,
      { signal: controlador.signal },
    )
      .then((datos) => {
        if (!controlador.signal.aborted) setEstado({ datos, error: "", clave });
      })
      .catch((e) => {
        if (!controlador.signal.aborted)
          setEstado({ datos: null, error: e.message, clave });
      });
    return () => controlador.abort();
  }, [token, desde, hasta, modelo, clave, demo]);
  const datos = useMemo(
    () =>
      demo
        ? {
            campanas: campanas.map((c) => ({
              id_campana: c.idCampana,
              leads: c.idCampana * 23,
            })),
            ingresos: campanas.map((c) => ({
              campana_id: c.idCampana,
              moneda: "PEN",
              ingresos: c.idCampana * 1350,
              ventas: c.idCampana * 4,
            })),
            gastos: campanas.map((c) => ({
              campana_id: c.idCampana,
              moneda: "PEN",
              gasto: c.idCampana * 430,
            })),
            embudoCampanas: campanas.flatMap((c) =>
              ["Nuevo", "Calificado", "Propuesta", "Ganado"].map(
                (nombre, orden) => ({
                  campana_id: c.idCampana,
                  nombre,
                  orden,
                  oportunidades: c.idCampana * (7 - orden),
                }),
              ),
            ),
          }
        : estado.datos,
    [demo, campanas, estado],
  );
  const ids = new Set(campanas.map((c) => String(c.idCampana)));
  const leads = (datos?.campanas || [])
    .filter((c) => ids.has(String(c.id_campana)))
    .reduce((s, c) => s + Number(c.leads || 0), 0);
  const ingresos = (datos?.ingresos || []).filter((r) =>
    ids.has(String(r.campana_id)),
  );
  const gastos = (datos?.gastos || []).filter((r) =>
    ids.has(String(r.campana_id)),
  );
  const monedas = [...new Set([...ingresos, ...gastos].map((r) => r.moneda))];
  const etapas = new Map();
  for (const etapa of datos?.embudoCampanas || []) {
    if (!ids.has(String(etapa.campana_id))) continue;
    etapas.set(etapa.nombre, {
      ...etapa,
      oportunidades:
        Number(etapa.oportunidades) +
        (etapas.get(etapa.nombre)?.oportunidades || 0),
    });
  }
  const embudo = [...etapas.values()].sort((a, b) => a.orden - b.orden);
  const maximo = Math.max(1, ...embudo.map((e) => e.oportunidades));
  return (
    <section
      className="marketing-panel marketing-crm"
      aria-label="Captación y ventas CRM"
    >
      <div className="marketing-panel-titulo">
        <div>
          <span className="marketing-eyebrow">Del interés a la venta</span>
          <h2>Captación y ventas</h2>
          <p>
            Leads por primer origen. Ingresos por cierres ganados, separados por
            moneda.
          </p>
        </div>
        <label className="marketing-campo">
          Atribución de ingresos
          <select value={modelo} onChange={(e) => setModelo(e.target.value)}>
            <option value="PRIMERO">Primer origen</option>
            <option value="ULTIMO">Último origen</option>
            <option value="LINEAL">Lineal</option>
          </select>
        </label>
      </div>
      {filtroGeografico ? (
        <p className="marketing-ayuda">
          El CRM aún no dispone de un desglose por ubicación para este filtro.
        </p>
      ) : !demo && estado.clave !== clave ? (
        <p className="marketing-vacio" role="status">
          Consultando captación y ventas…
        </p>
      ) : !demo && estado.error ? (
        <p className="marketing-ayuda" role="status">
          CRM pendiente de consulta. {estado.error}
        </p>
      ) : (
        <div className="marketing-crm-grid">
          <div>
            <div className="marketing-crm-leads">
              <strong>{numero(leads)}</strong>
              <span>Leads creados en el período</span>
            </div>
            <div className="marketing-tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Moneda</th>
                    <th>Gasto sincronizado</th>
                    <th>Ingresos atribuidos</th>
                    <th>Ventas acreditadas</th>
                    <th>CPL registrado</th>
                    <th>ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {monedas.map((moneda) => {
                    const costos = gastos.filter((r) => r.moneda === moneda);
                    const gasto = costos.reduce(
                      (s, r) => s + Number(r.gasto),
                      0,
                    );
                    const ventas = ingresos.filter((r) => r.moneda === moneda);
                    const ingreso = ventas.reduce(
                      (s, r) => s + Number(r.ingresos),
                      0,
                    );
                    const cpl = costos.length ? proporcion(gasto, leads) : null;
                    const roas = costos.length
                      ? proporcion(ingreso, gasto)
                      : null;
                    return (
                      <tr key={moneda}>
                        <td>{moneda}</td>
                        <td>
                          {costos.length
                            ? dinero(gasto, moneda)
                            : "Sin sincronizar"}
                        </td>
                        <td>{dinero(ingreso, moneda)}</td>
                        <td>
                          {numero(
                            ventas.reduce((s, r) => s + Number(r.ventas), 0),
                          )}
                        </td>
                        <td>
                          {cpl == null ? "Sin datos" : dinero(cpl, moneda)}
                        </td>
                        <td>
                          {roas == null ? "Sin datos" : `${numero(roas)}×`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!monedas.length && (
                <p className="marketing-ayuda">
                  Aún no hay gastos sincronizados ni ingresos atribuidos para
                  estas campañas.
                </p>
              )}
            </div>
          </div>
          <div>
            <h3>Oportunidades por etapa actual</h3>
            <p className="marketing-ayuda">
              Creadas en el período y asociadas por primer origen.
            </p>
            {embudo.map((e) => (
              <div className="marketing-canal" key={e.nombre}>
                <div>
                  <strong>{e.nombre}</strong>
                  <span>{numero(e.oportunidades)}</span>
                </div>
                <div className="marketing-progreso">
                  <span
                    style={{ width: `${(e.oportunidades / maximo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!embudo.length && (
              <p className="marketing-ayuda">
                Sin oportunidades registradas para estas campañas.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
