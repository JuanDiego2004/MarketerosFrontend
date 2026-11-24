import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Globe2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import GloboCampanas from "../dashboard/GloboCampanas";
import PanelGlobo from "../dashboard/PanelGlobo";
import GraficoCliente from "./GraficoCliente";
import TablaResultadosCliente from "./TablaResultadosCliente";
import MapaPaisesAlternativo from "./MapaPaisesAlternativo";
import { consultarAnaliticaPortal } from "../../servicios/servicioPortal";
import { exportarPortal } from "../../servicios/exportarPortal";
import {
  METRICAS_MAPA,
  COLORES_MAPA,
  filtrosIniciales,
  resumir,
  numero,
  importe,
  nombrePais,
  valoresPaises,
  colorValor,
  agruparResultados,
  ordenarResultados,
} from "../../utils/analiticaPortal";

const VACIO = [];
const CAMPOS_IMPRESIONES = [["impresiones", "Impresiones", "#2e71d1"]];
const CAMPOS_ACCIONES = [
  ["clics", "Clics", "#2e71d1"],
  ["conversiones", "Conversiones", "#2f9e8f"],
];
const CAMPOS_IMPORTES = [
  ["inversion", "Inversión", "#2e71d1"],
  ["ingresos_estimados", "Ingreso estimado", "#c28a30"],
];

export default function AnaliticaCliente({
  token,
  portal,
  contrato,
  seleccionarContrato,
  alCargarContexto,
  revision,
  actualizar,
}) {
  const [locales, setLocales] = useState(filtrosIniciales);
  const [datos, setDatos] = useState(null);
  const [consultaResuelta, setConsultaResuelta] = useState("");
  const [error, setError] = useState("");
  const [geografia, setGeografia] = useState(null);
  const [errorMapa, setErrorMapa] = useState("");
  const [exportando, setExportando] = useState(false);
  const controlExportacion = useRef(null);
  useEffect(() => () => controlExportacion.current?.abort(), [token]);
  const [errorExportar, setErrorExportar] = useState("");
  const [orden, setOrden] = useState({ campo: "impresiones", direccion: -1 });
  const [pagina, setPagina] = useState(0);
  const [verFiltros, setVerFiltros] = useState(false);
  const filtros = { ...locales, contrato };
  const { metrica, ...consulta } = filtros;
  const clave = JSON.stringify(consulta);
  const rangoValido = Boolean(
    filtros.desde && filtros.hasta && filtros.desde <= filtros.hasta,
  );
  const cargando =
    !error && rangoValido && consultaResuelta !== `${clave}:${revision}`;
  const registros = datos?.registros || VACIO;
  const catalogo = datos || portal;
  const resumen = useMemo(() => resumir(registros), [registros]);
  const filas = useMemo(
    () => ordenarResultados(agruparResultados(registros), orden),
    [registros, orden],
  );
  const valores = useMemo(
    () => valoresPaises(registros, metrica),
    [registros, metrica],
  );
  const maximo = Math.max(0, ...valores.values());
  const monedas = Object.keys(resumen.monedas);
  const monedaMapa = filtros.moneda || (monedas.length === 1 ? monedas[0] : "");
  const regiones = useMemo(
    () =>
      (geografia?.features || []).map((r) => {
        const valor = valores.get(r.properties.iso);
        return {
          ...r,
          properties: {
            ...r.properties,
            color: colorValor(valor, maximo),
            conDatos: valor != null,
            valor: valor || 0,
            etiquetaValor:
              valor == null
                ? "Sin resultados"
                : `${METRICAS_MAPA[metrica]} · ${metrica === "inversion" ? importe(valor, monedaMapa) : numero(valor)}`,
            tooltip: `${r.properties.nombre} · ${valor == null ? "Sin resultados en este filtro" : `${METRICAS_MAPA[metrica]}: ${metrica === "inversion" ? importe(valor, monedaMapa) : numero(valor)}`}`,
          },
        };
      }),
    [geografia, valores, maximo, metrica, monedaMapa],
  );

  useEffect(() => {
    const control = new AbortController();
    const filtro = JSON.parse(clave);
    if (!filtro.desde || !filtro.hasta || filtro.desde > filtro.hasta)
      return () => control.abort();
    const espera = setTimeout(() => {
      consultarAnaliticaPortal(token, filtro, control.signal)
        .then((d) => {
          if (control.signal.aborted) return;
          setDatos(d);
          setError("");
          setConsultaResuelta(`${clave}:${revision}`);
          alCargarContexto({ empresa: d.empresa, contratos: d.contratos });
        })
        .catch((e) => {
          if (!control.signal.aborted) {
            setError(e.message);
            setConsultaResuelta(`${clave}:${revision}`);
          }
        });
    }, 220);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [token, clave, revision, alCargarContexto]);
  useEffect(() => {
    const control = new AbortController();
    fetch("/mapa/paises-110m.geojson", { signal: control.signal })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar la geografía del mapa.");
        return r.json();
      })
      .then((d) => {
        if (!control.signal.aborted) {
          setGeografia(d);
          setErrorMapa("");
        }
      })
      .catch((e) => {
        if (!control.signal.aborted) setErrorMapa(e.message);
      });
    return () => control.abort();
  }, [revision]);

  function cambiar(campo, valor) {
    if (campo !== "metrica") setError("");
    setErrorExportar("");
    setPagina(0);
    if (campo === "contrato") {
      seleccionarContrato(valor);
      setLocales((f) => ({ ...f, campana: "" }));
    } else
      setLocales((f) => ({
        ...f,
        [campo]: valor,
        ...(campo === "metrica" && valor === "inversion" && !f.moneda
          ? { moneda: monedaMapa }
          : {}),
        ...(campo === "moneda" && !valor && f.metrica === "inversion"
          ? { metrica: "impresiones" }
          : {}),
      }));
  }
  function limpiar() {
    setLocales(filtrosIniciales());
    seleccionarContrato("");
    setError("");
    setErrorExportar("");
    setPagina(0);
  }
  function ordenar(campo) {
    setOrden((o) => ({
      campo,
      direccion: o.campo === campo ? -o.direccion : 1,
    }));
    setPagina(0);
  }
  async function exportar(formato) {
    if (cargando || exportando || error || !datos) return;
    setExportando(true);
    setErrorExportar("");
    const activos = { ...filtros };
    const control = new AbortController();
    controlExportacion.current = control;
    try {
      // Revalidar acceso: una revocación posterior a la carga también impide exportar.
      const vigentes = await consultarAnaliticaPortal(
        token,
        activos,
        control.signal,
      );
      if (control.signal.aborted) return;
      const resultados = ordenarResultados(
        agruparResultados(vigentes.registros),
        orden,
      );
      if (!resultados.length)
        throw new Error(
          "No hay resultados disponibles para exportar con estos filtros.",
        );
      await exportarPortal(
        formato,
        vigentes,
        activos,
        resultados,
        control.signal,
      );
    } catch (e) {
      if (!control.signal.aborted) setErrorExportar(e.message);
    } finally {
      setExportando(false);
    }
  }
  const campanas = (datos?.campanas || []).filter(
    (c) => !contrato || c.contratos.some((id) => String(id) === contrato),
  );
  const sinDatos = !registros.length;
  const bloqueado = cargando || Boolean(error) || !rangoValido;
  return (
    <>
      <section className="portal-barra" aria-label="Filtros de resultados">
        <div className="portal-barra-superior">
          <div className="portal-busqueda">
            <Search size={18} />
            <input
              aria-label="Buscar campaña, anuncio o contrato"
              placeholder="Buscar campaña, anuncio o contrato"
              value={filtros.busqueda}
              onChange={(e) => cambiar("busqueda", e.target.value)}
            />
          </div>
          <div className="portal-botones">
            <button
              className="crm-boton portal-toggle"
              aria-expanded={verFiltros}
              aria-controls="portal-filtros"
              onClick={() => setVerFiltros((v) => !v)}
            >
              <SlidersHorizontal size={16} />
              Filtros
            </button>
            <button className="crm-boton" onClick={limpiar}>
              Limpiar filtros
            </button>
            <button
              className="crm-boton portal-refrescar"
              aria-label="Actualizar resultados"
              onClick={() => {
                setError("");
                actualizar();
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="crm-boton"
              disabled={bloqueado || exportando || sinDatos}
              onClick={() => exportar("csv")}
            >
              <Download size={16} />
              CSV
            </button>
            <button
              className="crm-boton"
              disabled={bloqueado || exportando || sinDatos}
              onClick={() => exportar("pdf")}
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        </div>
        <div
          className={`portal-filtros ${verFiltros ? "portal-filtros-abiertos" : ""}`}
          id="portal-filtros"
        >
          <Campo titulo="Contrato">
            <select
              aria-label="Mi contrato"
              value={contrato}
              onChange={(e) => cambiar("contrato", e.target.value)}
            >
              <option value="">Todos mis contratos</option>
              {catalogo?.contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo titulo="Campaña">
            <select
              aria-label="Campaña"
              value={filtros.campana}
              onChange={(e) => cambiar("campana", e.target.value)}
            >
              <option value="">Todas las campañas</option>
              {campanas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo titulo="Plataforma">
            <select
              aria-label="Plataforma"
              value={filtros.plataforma}
              onChange={(e) => cambiar("plataforma", e.target.value)}
            >
              <option value="">Todas</option>
              {datos?.plataformas.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Campo>
          <Campo titulo="País">
            <select
              aria-label="País"
              value={filtros.pais}
              onChange={(e) => cambiar("pais", e.target.value)}
            >
              <option value="">Todos los países</option>
              {datos?.paises.map((p) => (
                <option key={p} value={p}>
                  {nombrePais(p)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo titulo="Desde">
            <input
              aria-label="Desde"
              type="date"
              value={filtros.desde}
              max={filtros.hasta}
              onChange={(e) => cambiar("desde", e.target.value)}
            />
          </Campo>
          <Campo titulo="Hasta">
            <input
              aria-label="Hasta"
              type="date"
              value={filtros.hasta}
              min={filtros.desde}
              onChange={(e) => cambiar("hasta", e.target.value)}
            />
          </Campo>
          <Campo titulo="Moneda">
            <select
              aria-label="Moneda"
              value={filtros.moneda}
              onChange={(e) => cambiar("moneda", e.target.value)}
            >
              <option value="">Separadas</option>
              {datos?.monedas.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Campo>
        </div>
      </section>
      {!rangoValido && (
        <p className="crm-error" role="alert">
          Indica un rango de fechas válido.
        </p>
      )}
      {error && (
        <p className="crm-error" role="alert">
          {error}{" "}
          <button
            className="crm-boton"
            onClick={() => {
              setError("");
              actualizar();
            }}
          >
            Reintentar
          </button>
        </p>
      )}
      {errorExportar && (
        <p className="crm-error" role="alert">
          {errorExportar}
        </p>
      )}
      {exportando && (
        <p role="status">
          Preparando el informe con tus filtros y permisos actuales…
        </p>
      )}
      {cargando && (
        <p className="portal-estado" role="status">
          Consultando resultados de tu empresa…
        </p>
      )}
      {datos && (
        <div
          className="portal-resultados"
          aria-busy={cargando}
          inert={bloqueado ? true : undefined}
        >
          {!cargando && !error && sinDatos && (
            <div className="portal-vacio" role="status">
              <Globe2 size={24} />
              <div>
                <strong>Sin resultados para estos filtros</strong>
                <p>
                  Prueba otro periodo o limpia los filtros. Solo se muestran
                  estadísticas registradas.
                </p>
              </div>
            </div>
          )}
          <div className="portal-panel-principal escena-globo escena-globo-cliente">
            <PanelGlobo
              titulo="Indicadores"
              className="portal-kpis"
              etiqueta="Indicadores publicitarios"
            >
              <div className="portal-titulo-panel">
                <span>RENDIMIENTO</span>
                <small>Datos simulados</small>
              </div>
              <Kpi
                nombre="Impresiones"
                valor={sinDatos ? "—" : numero(resumen.impresiones)}
                principal
              />
              <Kpi
                nombre="Alcance"
                valor="—"
                detalle="No disponible en estos registros"
              />
              <Kpi
                nombre="Clics"
                valor={sinDatos ? "—" : numero(resumen.clics)}
              />
              <Kpi
                nombre="Conversiones"
                valor={sinDatos ? "—" : numero(resumen.conversiones)}
                detalle="Acciones publicitarias; no ventas"
              />
              <Kpi
                nombre="Gasto publicitario"
                valor={<Importes monedas={resumen.monedas} campo="inversion" />}
              />
              <Kpi
                nombre="CTR"
                valor={resumen.ctr == null ? "—" : `${numero(resumen.ctr, 2)}%`}
              />
              <Kpi
                nombre="CPC"
                valor={<Importes monedas={resumen.monedas} campo="cpc" />}
              />
              <Kpi
                nombre="CPM"
                valor={<Importes monedas={resumen.monedas} campo="cpm" />}
              />
              <Kpi
                nombre="ROAS / ROI"
                valor="—"
                detalle="Sin ingresos y costos verificados"
              />
            </PanelGlobo>
            <section className="portal-mapa" aria-label="Resultados por país">
              <div className="portal-mapa-cabecera">
                <div>
                  <h2>Tu impacto en el mundo</h2>
                  <p>Resultados agregados por país</p>
                </div>
                <Campo titulo="Métrica del mapa">
                  <select
                    aria-label="Métrica del mapa"
                    value={metrica}
                    onChange={(e) => cambiar("metrica", e.target.value)}
                  >
                    {Object.entries(METRICAS_MAPA).map(([k, n]) => (
                      <option
                        key={k}
                        value={k}
                        disabled={k === "inversion" && !monedaMapa}
                      >
                        {n}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
              <div className="portal-mapa-superficie">
                {errorMapa ? (
                  <p role="status">
                    {errorMapa} Puedes consultar el detalle en la tabla.
                  </p>
                ) : geografia ? (
                  <GloboCampanas
                    alternativa={
                      <MapaPaisesAlternativo
                        regiones={regiones}
                        seleccionado={filtros.pais}
                        seleccionar={(p) => cambiar("pais", p)}
                      />
                    }
                    temaClaro
                    modoPaises
                    alRestablecer={() => cambiar("pais", "")}
                    regiones={regiones}
                    regionSeleccionada={filtros.pais}
                    alSeleccionarRegion={(p) => cambiar("pais", p)}
                    reinicio={revision}
                  />
                ) : (
                  <p role="status">Preparando el mapa…</p>
                )}
              </div>
              <div className="portal-leyenda">
                <div>
                  <span className="portal-sin-resultados" />
                  Sin datos
                </div>
                <div>
                  <span>0</span>
                  <div className="portal-escala">
                    {COLORES_MAPA.map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                  </div>
                  <span>
                    {numero(maximo, metrica === "inversion" ? 2 : 0)}
                    {metrica === "inversion" ? ` ${monedaMapa}` : ""}
                  </span>
                </div>
              </div>
              <div className="portal-pais-detalle">
                <div>
                  <strong>
                    {filtros.pais
                      ? nombrePais(filtros.pais)
                      : "Todos los países"}
                  </strong>
                  <p>
                    {valores.size}{" "}
                    {valores.size === 1
                      ? "país con resultados"
                      : "países con resultados"}{" "}
                    · {METRICAS_MAPA[metrica].toLowerCase()}
                  </p>
                </div>
                {filtros.pais ? (
                  <button
                    className="crm-boton"
                    onClick={() => cambiar("pais", "")}
                  >
                    <X size={15} />
                    Todos los países
                  </button>
                ) : (
                  <span>Selecciona un país en el globo</span>
                )}
              </div>
            </section>
            <PanelGlobo
              titulo="Tendencias"
              className="portal-tendencias"
              etiqueta="Tendencias de resultados"
            >
              <GraficoCliente
                titulo="Impresiones"
                registros={registros}
                campos={CAMPOS_IMPRESIONES}
              />
              <GraficoCliente
                titulo="Clics y conversiones"
                registros={registros}
                campos={CAMPOS_ACCIONES}
              />
              <section className="portal-grafico portal-grafico-inversion">
                <h3>Inversión e ingresos estimados</h3>
                {monedas.length ? (
                  monedas.map((m) => (
                    <GraficoCliente
                      key={m}
                      compacto
                      titulo={m}
                      registros={registros}
                      moneda={m}
                      campos={CAMPOS_IMPORTES}
                    />
                  ))
                ) : (
                  <p className="portal-sin-datos">Sin datos del periodo</p>
                )}
                <p className="portal-nota">
                  Ingresos simulados, sin retorno verificado.
                </p>
              </section>
            </PanelGlobo>
          </div>
          <TablaResultadosCliente
            filas={filas}
            orden={orden}
            ordenar={ordenar}
            pagina={pagina}
            cambiarPagina={setPagina}
            seleccionarPais={(p) => cambiar("pais", p)}
          />
          <p className="portal-nota">
            Estadísticas DEMO de Mockaroo. Las conversiones son acciones
            publicitarias y no acreditan ventas. No se combinan monedas; el
            alcance y el ROAS/ROI requieren datos que no están disponibles en
            estos registros.
          </p>
        </div>
      )}
    </>
  );
}

function Campo({ titulo, children }) {
  return (
    <label className="portal-campo">
      <span>{titulo}</span>
      {children}
    </label>
  );
}
function Kpi({ nombre, valor, detalle, principal }) {
  return (
    <section
      className={`portal-kpi ${principal ? "portal-kpi-principal" : ""}`}
    >
      <h3>{nombre}</h3>
      <strong>{valor}</strong>
      {detalle && <p>{detalle}</p>}
    </section>
  );
}
function Importes({ monedas, campo }) {
  const entradas = Object.entries(monedas);
  return entradas.length
    ? entradas.map(([m, v]) => (
        <span className="portal-importe" key={m}>
          {v[campo] == null ? "—" : importe(v[campo], m)}
        </span>
      ))
    : "—";
}
