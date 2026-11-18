const porcentaje = (n, d) =>
  Number(d) > 0
    ? `${((Number(n) / Number(d)) * 100).toLocaleString("es-PE", { maximumFractionDigits: 1 })} %`
    : "—";
export default function ConversionesHistoricas({ datos }) {
  if (!datos) return null;
  return (
    <section className="crm-panel">
      <h2>Conversiones históricas observadas</h2>
      <p className="crm-ayuda">{datos.criterio}</p>
      <p className="crm-ayuda">
        Cohorte: {datos.cohorte} oportunidades · Excluidas por historial
        incompleto: {datos.sinHistorialCompleto}
      </p>
      {!datos.cohorte ? (
        <p className="crm-vacio">
          No hay oportunidades con historial completo en el período.
        </p>
      ) : (
        <>
          <div className="crm-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Etapa alcanzada</th>
                  <th scope="col">Oportunidades únicas</th>
                  <th scope="col">Porcentaje de la cohorte</th>
                </tr>
              </thead>
              <tbody>
                {datos.etapas.map((e, i) => (
                  <tr key={`${e.etapa_id}-${i}`}>
                    <td>{e.etapa_nombre}</td>
                    <td>{e.alcanzaron}</td>
                    <td>{porcentaje(e.alcanzaron, datos.cohorte)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="crm-ayuda">
            Conversión entre etapas realmente recorridas
          </h3>
          <div className="crm-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Etapa de salida",
                    "Destino",
                    "Llegaron al origen",
                    "Convirtieron",
                    "Conversión",
                  ].map((t) => (
                    <th key={t} scope="col">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.transiciones.map((t, i) => (
                  <tr key={i}>
                    <td>{t.origen || "Etapa no disponible"}</td>
                    <td>{t.destino}</td>
                    <td>{t.base}</td>
                    <td>{t.convirtieron}</td>
                    <td>{porcentaje(t.convirtieron, t.base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!datos.transiciones.length && (
              <p className="crm-vacio">
                Todavía no hay cambios de etapa observados.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
