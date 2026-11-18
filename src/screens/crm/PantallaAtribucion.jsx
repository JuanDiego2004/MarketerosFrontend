import { useEffect, useState } from "react";
import { Download, RefreshCw, Target } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import "./Crm.css";
import { obtenerGrupoRol, GRUPOS_ROL } from "../../utils/roles";
import ConversionesHistoricas from "./ConversionesHistoricas";
const formato = (v) =>
  Number(v).toLocaleString("es-PE", { maximumFractionDigits: 2 });
export default function PantallaAtribucion() {
  const { token, usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const desde =
    params.get("desde") || new Date().toISOString().slice(0, 8) + "01";
  const hasta = params.get("hasta") || new Date().toISOString().slice(0, 10);
  const modelo = params.get("modelo") || "PRIMERO";
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  function actualizarFiltros(cambio) {
    setD(null);
    setParams((prev) => {
      const siguientes = new URLSearchParams(prev);
      for (const [k, v] of Object.entries({ desde, hasta, modelo, ...cambio }))
        siguientes.set(k, v);
      return siguientes;
    });
  }
  useEffect(() => {
    document.title = "Atribución y embudo · MarketingSystem";
  }, []);
  useEffect(() => {
    const c = new AbortController();
    solicitarCrm(
      `/operaciones/atribucion?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&modelo=${encodeURIComponent(modelo)}`,
      token,
      { signal: c.signal },
    )
      .then((datos) => {
        if (!c.signal.aborted) {
          setD(datos);
          setError("");
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [desde, hasta, modelo, revision, token]);
  const filas =
    d?.campanas.flatMap((c) => {
      const ingresos = d.ingresos.filter(
        (x) => Number(x.campana_id) === Number(c.id_campana),
      );
      const gastos = d.gastos.filter(
        (x) => Number(x.campana_id) === Number(c.id_campana),
      );
      const monedas = [
        ...new Set([...ingresos, ...gastos].map((x) => x.moneda)),
      ];
      return (monedas.length ? monedas : ["—"]).map((moneda) => {
        const venta = ingresos.find((x) => x.moneda === moneda);
        const gasto = gastos.find((x) => x.moneda === moneda);
        const valor = Number(venta?.ingresos || 0),
          costo = Number(gasto?.gasto || 0),
          clientes = Number(venta?.ventas || 0);
        return {
          campana: c.nombre,
          leads: Number(c.leads),
          ventas: clientes,
          moneda,
          ingresos: valor,
          gasto: gasto ? costo : null,
          cpl: gasto && Number(c.leads) ? costo / Number(c.leads) : null,
          cac: gasto && clientes ? costo / clientes : null,
          roi: costo > 0 ? ((valor - costo) / costo) * 100 : null,
        };
      });
    }) || [];
  function exportar() {
    const columnas = [
      "campana",
      "leads",
      "ventas",
      "moneda",
      "ingresos",
      "gasto",
      "cpl",
      "cac",
      "roi",
    ];
    const celda = (v) => {
      let s = String(v ?? "");
      if (/^[=+@-]/.test(s.trimStart())) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    descargarCrm(
      new Blob(
        [
          "\uFEFFmodelo,desde,hasta," +
            columnas.join(",") +
            "\r\n" +
            filas
              .map((f) =>
                [modelo, desde, hasta, ...columnas.map((c) => f[c])]
                  .map(celda)
                  .join(","),
              )
              .join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
      `atribucion-${modelo.toLowerCase()}-${desde}-${hasta}.csv`,
    );
  }
  return (
    <section className="crm">
      <header className="crm-cabecera">
        <div>
          <p className="crm-kicker">Resultados · Atribución de marketing</p>
          <h1>Atribución y embudo</h1>
          <p className="crm-ayuda">
            Ingresos reales por cierre ganado, separados por moneda. Un gasto
            sin sincronizar se muestra como desconocido.
          </p>
        </div>
        <button
          className="crm-boton"
          disabled={!d || !!error}
          onClick={exportar}
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </header>
      <div className="crm-filtros">
        <label className="crm-campo">
          Modelo de ingresos
          <select
            value={modelo}
            onChange={(e) => {
              actualizarFiltros({ modelo: e.target.value });
            }}
          >
            <option value="PRIMERO">Primer origen</option>
            <option value="ULTIMO">Último origen antes del cierre</option>
            <option value="LINEAL">Lineal entre interacciones</option>
          </select>
        </label>
        <label className="crm-campo">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              actualizarFiltros({ desde: e.target.value });
            }}
          />
        </label>
        <label className="crm-campo">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => {
              actualizarFiltros({ hasta: e.target.value });
            }}
          />
        </label>
        <button className="crm-boton" onClick={() => setRevision((n) => n + 1)}>
          <RefreshCw size={16} />
          Actualizar
        </button>
        {obtenerGrupoRol(usuario?.rol?.nombreRol) !== GRUPOS_ROL.ANALISTA && (
          <Link className="crm-boton" to="/metas">
            <Target size={16} />
            Metas y alertas
          </Link>
        )}
      </div>
      {error ? (
        <p className="crm-error" role="alert">
          {error}
        </p>
      ) : !d ? (
        <p className="crm-vacio" role="status">
          Calculando resultados…
        </p>
      ) : (
        <>
          <p className="crm-ayuda">{d.modelo}</p>
          {modelo === "LINEAL" && (
            <p className="crm-ayuda">
              Una venta se reparte entre las interacciones anteriores al cierre.
              Las ventas equivalentes pueden ser fraccionarias; el total de
              ingresos no se multiplica.
            </p>
          )}
          <div className="crm-panel crm-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Campaña",
                    "Leads",
                    "Ventas atribuidas (equivalentes)",
                    "Moneda",
                    "Ingresos",
                    "Gasto",
                    "CPL",
                    "Costo por venta atribuida",
                    "ROI (%)",
                  ].map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={`${f.campana}-${f.moneda}`}>
                    {Object.entries(f).map(([k, v]) => (
                      <td key={k}>
                        {v == null
                          ? "Sin datos"
                          : typeof v === "number"
                            ? formato(v)
                            : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!filas.length && (
              <p className="crm-vacio">No hay campañas para mostrar.</p>
            )}
          </div>
          <ConversionesHistoricas datos={d.conversiones} />
          <div className="crm-resumen">
            <section className="crm-panel">
              <h2>Embudo de oportunidades</h2>
              <p className="crm-ayuda">
                Distribución actual de las oportunidades creadas en el período.
              </p>
              {d.embudo.map((e) => (
                <div className="crm-embudo" key={e.nombre}>
                  <span>{e.nombre}</span>
                  <meter
                    min="0"
                    max={Math.max(
                      1,
                      d.embudo.reduce((n, x) => n + Number(x.oportunidades), 0),
                    )}
                    value={e.oportunidades}
                  />
                  <strong>{e.oportunidades}</strong>
                </div>
              ))}
            </section>
            <section className="crm-panel">
              <h2>Rendimiento por responsable</h2>
              {d.responsables.length ? (
                d.responsables.map((r) => (
                  <p
                    className="crm-tarjeta"
                    key={`${r.responsable}-${r.moneda}`}
                  >
                    {r.responsable} · {r.oportunidades} oportunidades ·{" "}
                    {r.moneda} {formato(r.ingresos)} ganados
                  </p>
                ))
              ) : (
                <p className="crm-vacio">Sin oportunidades en este período.</p>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
