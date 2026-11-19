import { numero } from "../../utils/analiticaPortal";

const COLUMNAS = [
  ["paisNombre", "País"],
  ["plataforma", "Plataforma"],
  ["campana", "Campaña"],
  ["contrato", "Contrato"],
  ["impresiones", "Impresiones"],
  ["clics", "Clics"],
  ["conversiones", "Conversiones"],
  ["ctr", "CTR"],
  ["moneda", "Moneda"],
  ["inversion", "Inversión"],
  ["ingresos_estimados", "Ingreso estimado"],
];

export default function TablaResultadosCliente({
  filas,
  orden,
  ordenar,
  pagina,
  cambiarPagina,
  seleccionarPais,
}) {
  const actual = Math.min(
    pagina,
    Math.max(0, Math.ceil(filas.length / 10) - 1),
  );
  return (
    <section
      className="portal-tabla-seccion"
      aria-label="Detalle de resultados"
    >
      <div className="portal-tabla-cabecera">
        <div>
          <h2>Resultados en detalle</h2>
          <p>
            País, plataforma y campaña · {numero(filas.length)} combinaciones
          </p>
        </div>
        <span className="portal-demo">Datos simulados</span>
      </div>
      <div
        className="portal-tabla-scroll"
        tabIndex={0}
        role="region"
        aria-label="Tabla de resultados; desplaza para ver todas las columnas"
      >
        <table>
          <caption className="portal-sr">
            Resultados filtrados de tu empresa. Importes separados por moneda.
            Los ingresos son estimaciones de Mockaroo.
          </caption>
          <thead>
            <tr>
              {COLUMNAS.map(([k, n]) => (
                <th
                  key={k}
                  scope="col"
                  aria-sort={
                    orden.campo === k
                      ? orden.direccion === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button onClick={() => ordenar(k)}>
                    {n}
                    {orden.campo === k ? (
                      <span aria-hidden="true">
                        {orden.direccion === 1 ? " ↑" : " ↓"}
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.slice(actual * 10, actual * 10 + 10).map((r) => (
              <tr key={r.clave}>
                <td>
                  <button
                    className="portal-pais-enlace"
                    onClick={() => seleccionarPais(r.pais)}
                  >
                    {r.paisNombre}
                  </button>
                </td>
                <td>{r.plataforma}</td>
                <td>{r.campana}</td>
                <td>{r.contrato}</td>
                <td>{numero(r.impresiones)}</td>
                <td>{numero(r.clics)}</td>
                <td>{numero(r.conversiones)}</td>
                <td>{r.ctr == null ? "—" : `${numero(r.ctr, 2)}%`}</td>
                <td>{r.moneda}</td>
                <td>{numero(r.inversion, 2)}</td>
                <td>{numero(r.ingresos_estimados, 2)}</td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={11}>
                  No hay resultados registrados para esta selección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="portal-paginacion">
        <span>
          {filas.length
            ? `${actual * 10 + 1}–${Math.min(filas.length, (actual + 1) * 10)} de ${filas.length}`
            : "0 resultados"}
        </span>
        <div>
          <button
            className="crm-boton"
            disabled={actual === 0}
            onClick={() => cambiarPagina(actual - 1)}
          >
            Anterior
          </button>
          <span>
            Página {actual + 1} de {Math.max(1, Math.ceil(filas.length / 10))}
          </span>
          <button
            className="crm-boton"
            disabled={(actual + 1) * 10 >= filas.length}
            onClick={() => cambiarPagina(actual + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
