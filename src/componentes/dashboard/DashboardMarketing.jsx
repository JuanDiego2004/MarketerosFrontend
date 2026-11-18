import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Globe2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerMarketingDashboard } from "../../servicios/servicioAdministrador";
import { GRUPOS_ROL, obtenerGrupoRol } from "../../utils/roles";
import GloboCampanas from "./GloboCampanas";
import EditorGeografia from "./EditorGeografia";
import ResumenCrmDashboard from "./ResumenCrmDashboard";
import { crearDemostracion } from "./demostracionMarketing";
import {
  agruparSerie,
  COLORES_ESTADO,
  dinero,
  fechaLocal,
  filtrarCampanas,
  numero,
  obtenerPuntos,
  resumirMetricas,
} from "./datosMarketing";
import "./DashboardMarketing.css";

const FILTROS_INICIALES = { busqueda: "", cliente: "", canal: "", estado: "" };
const etiquetaEstado = (estado) =>
  ({
    ACTIVA: "Activa",
    PLANIFICADA: "Planificada",
    PAUSADA: "Pausada",
    FINALIZADA: "Finalizada",
  })[estado] || estado;
const mostrarKpi = (valor, unidad = "") =>
  valor == null ? "Sin datos" : `${numero(valor)}${unidad}`;

function Tarjeta({ titulo, valor, ayuda, destacada = false }) {
  return (
    <article
      className={`marketing-kpi ${destacada ? "marketing-kpi-principal" : ""}`}
    >
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <small>{ayuda}</small>
    </article>
  );
}

function GraficoEvolucion({ filas }) {
  const [campo, setCampo] = useState("inversion");
  const serie = useMemo(() => agruparSerie(filas, campo), [filas, campo]);
  const maximo = Math.max(1, ...serie.map((d) => d.valor));
  return (
    <article className="marketing-panel marketing-evolucion">
      <div className="marketing-panel-titulo">
        <div>
          <span className="marketing-eyebrow">A lo largo del tiempo</span>
          <h2>Evolución del rendimiento</h2>
        </div>
        <label className="marketing-campo">
          Métrica
          <select value={campo} onChange={(e) => setCampo(e.target.value)}>
            <option value="inversion">Inversión</option>
            <option value="ingresos">Ingresos</option>
            <option value="clics">Clics</option>
            <option value="conversiones">Conversiones</option>
          </select>
        </label>
      </div>
      {serie.length ? (
        <>
          <div
            className="marketing-barras"
            role="img"
            aria-label={`Evolución diaria de ${campo}. ${serie.length} fechas con registros.`}
          >
            {serie.map((dia) => (
              <div key={dia.fecha} className="marketing-barra-columna">
                <div
                  style={{
                    height: `${Math.max(2, (dia.valor / maximo) * 100)}%`,
                  }}
                >
                  <span>
                    {dia.fecha}
                    <br />
                    {numero(dia.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="marketing-eje">
            <span>{serie[0].fecha}</span>
            <span>{serie.at(-1).fecha}</span>
          </div>
          <details className="marketing-datos-grafico">
            <summary>Consultar valores</summary>
            <div className="marketing-tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>{campo}</th>
                  </tr>
                </thead>
                <tbody>
                  {serie.map((d) => (
                    <tr key={d.fecha}>
                      <td>{d.fecha}</td>
                      <td>{numero(d.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="marketing-vacio">Aún no hay métricas en este período.</p>
      )}
    </article>
  );
}

export default function DashboardMarketing({ apiBase = "/api/admin" }) {
  const { token, usuario } = useAuth();
  const [desde, setDesde] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 29);
    return fechaLocal(fecha);
  });
  const [hasta, setHasta] = useState(() => fechaLocal());
  const [datosReales, setDatosReales] = useState(null),
    [error, setError] = useState("");
  const [cargando, setCargando] = useState(true),
    [revision, setRevision] = useState(0);
  const [demo, setDemo] = useState(false),
    [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [seleccionado, setSeleccionado] = useState(null),
    [grupo, setGrupo] = useState(null);
  const [vista, setVista] = useState("COBERTURA"),
    [ubicacion, setUbicacion] = useState("");
  const [reinicio, setReinicio] = useState(0),
    [editor, setEditor] = useState(false);
  const grupoRol = obtenerGrupoRol(usuario?.rol?.nombreRol);
  const rangoValido =
    desde &&
    hasta &&
    desde <= hasta &&
    (new Date(hasta) - new Date(desde)) / 86400000 <= 366;

  useEffect(() => {
    document.title = "Dashboard de marketing · MarketingSystem";
  }, []);
  useEffect(() => {
    if (!rangoValido || demo) return;
    const controlador = new AbortController();
    obtenerMarketingDashboard(token, apiBase, desde, hasta, controlador.signal)
      .then((datos) => {
        if (!controlador.signal.aborted) {
          setDatosReales(datos);
          setError("");
          setCargando(false);
        }
      })
      .catch((e) => {
        if (!controlador.signal.aborted) {
          setError(e.message);
          setCargando(false);
        }
      });
    return () => controlador.abort();
  }, [token, apiBase, desde, hasta, revision, rangoValido, demo]);

  const datosDemo = useMemo(
    () => (rangoValido && demo ? crearDemostracion(desde, hasta) : null),
    [demo, desde, hasta, rangoValido],
  );
  const datos = demo ? datosDemo : datosReales;
  const campanas = useMemo(
    () => filtrarCampanas(datos?.campanas || [], filtros),
    [datos, filtros],
  );
  const campana = campanas.find(
    (c) => String(c.idCampana) === String(seleccionado),
  );
  const visibles = useMemo(
    () => (campana ? [campana] : campanas),
    [campana, campanas],
  );
  const ids = useMemo(
    () => new Set(visibles.map((c) => String(c.idCampana))),
    [visibles],
  );
  const resultados = useMemo(
    () =>
      (datos?.resultadosGeograficos || []).filter((r) =>
        ids.has(String(r.idCampana)),
      ),
    [datos, ids],
  );
  const puntos = useMemo(
    () => obtenerPuntos(datos?.ubicaciones || [], visibles, resultados, vista),
    [datos, visibles, resultados, vista],
  );
  const metricas = useMemo(() => {
    const fuente = ubicacion ? datos?.resultadosGeograficos : datos?.metricas;
    return (fuente || []).filter(
      (m) =>
        ids.has(String(m.idCampana)) &&
        (!ubicacion || String(m.idUbicacion) === ubicacion),
    );
  }, [datos, ids, ubicacion]);
  const totales = useMemo(() => resumirMetricas(metricas), [metricas]);
  const presupuesto = visibles.reduce(
    (total, c) => total + Number(c.presupuesto || 0),
    0,
  );
  const clientes = new Set(visibles.map((c) => c.idCliente)).size;
  const listado = grupo
    ? campanas.filter((c) =>
        grupo.campanas.some((g) => String(g.idCampana) === String(c.idCampana)),
      )
    : campanas;
  const canales = useMemo(
    () =>
      [...new Set(visibles.map((c) => c.canal))].map((canal) => {
        const idsCanal = new Set(
          visibles
            .filter((c) => c.canal === canal)
            .map((c) => String(c.idCampana)),
        );
        return {
          canal,
          ...resumirMetricas(
            metricas.filter((m) => idsCanal.has(String(m.idCampana))),
          ),
        };
      }),
    [visibles, metricas],
  );
  const ubicacionesCampana = useMemo(
    () => [
      ...new Map(
        (datos?.ubicaciones || [])
          .filter((u) => String(u.idCampana) === String(seleccionado))
          .map((u) => [String(u.idUbicacion), u]),
      ).values(),
    ],
    [datos, seleccionado],
  );
  const ubicacionesResultado = useMemo(
    () => [
      ...new Map(
        (datos?.ubicaciones || [])
          .filter(
            (u) => u.vista === "RESULTADOS" && ids.has(String(u.idCampana)),
          )
          .map((u) => [String(u.idUbicacion), u]),
      ).values(),
    ],
    [datos, ids],
  );

  function limpiarSeleccion() {
    setSeleccionado(null);
    setGrupo(null);
    setUbicacion("");
  }
  function cambiarFiltro(nombre, valor) {
    setFiltros((prev) => ({ ...prev, [nombre]: valor }));
    limpiarSeleccion();
  }
  function seleccionarCampana(id) {
    setSeleccionado(id);
    setUbicacion("");
  }
  function seleccionarPunto(punto) {
    setGrupo(punto);
    if (punto.campanas.length === 1)
      seleccionarCampana(punto.campanas[0].idCampana);
  }
  function cambiarFecha(campo, valor) {
    campo === "desde" ? setDesde(valor) : setHasta(valor);
    setCargando(true);
    setError("");
    limpiarSeleccion();
  }
  const listo = datos && rangoValido && (demo || !error);

  return (
    <main className="marketing-dashboard">
      <header className="marketing-cabecera">
        <div>
          <span className="marketing-eyebrow">Marketing intelligence</span>
          <h1>Una visión global.</h1>
          <p>Explora tus campañas y descubre dónde conectan.</p>
        </div>
        <div className="marketing-cabecera-acciones">
          <button
            className={`marketing-boton ${demo ? "marketing-boton-activo" : ""}`}
            aria-pressed={demo}
            onClick={() => {
              setDemo(!demo);
              limpiarSeleccion();
              if (demo) setCargando(true);
            }}
          >
            {demo ? "Volver a datos reales" : "Explorar demostración"}
          </button>
          <button
            className="marketing-boton marketing-boton-icono"
            aria-label="Actualizar datos"
            disabled={cargando && !demo}
            onClick={() => {
              setCargando(true);
              setRevision((v) => v + 1);
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>
      {demo && (
        <div className="marketing-aviso" role="status">
          Modo demostración · Campañas y resultados ficticios para explorar el
          Dashboard.
        </div>
      )}
      <section className="marketing-filtros" aria-label="Filtros del Dashboard">
        <label className="marketing-busqueda">
          <Search size={16} />
          <input
            aria-label="Buscar campaña o cliente"
            placeholder="Buscar campaña o cliente"
            value={filtros.busqueda}
            onChange={(e) => cambiarFiltro("busqueda", e.target.value)}
          />
        </label>
        <label className="marketing-campo">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => cambiarFecha("desde", e.target.value)}
          />
        </label>
        <label className="marketing-campo">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => cambiarFecha("hasta", e.target.value)}
          />
        </label>
        <label className="marketing-campo">
          Cliente
          <select
            value={filtros.cliente}
            onChange={(e) => cambiarFiltro("cliente", e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {[
              ...new Map(
                (datos?.campanas || []).map((c) => [
                  String(c.idCliente),
                  c.cliente,
                ]),
              ).entries(),
            ].map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="marketing-campo">
          Canal
          <select
            value={filtros.canal}
            onChange={(e) => cambiarFiltro("canal", e.target.value)}
          >
            <option value="">Todos los canales</option>
            {[
              ...new Map(
                (datos?.campanas || []).map((c) => [
                  String(c.idCanal),
                  c.canal,
                ]),
              ).entries(),
            ].map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="marketing-campo">
          Estado
          <select
            value={filtros.estado}
            onChange={(e) => cambiarFiltro("estado", e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.keys(COLORES_ESTADO).map((estado) => (
              <option key={estado} value={estado}>
                {etiquetaEstado(estado)}
              </option>
            ))}
          </select>
        </label>
      </section>
      {!rangoValido && (
        <p className="marketing-error" role="alert">
          Selecciona fechas válidas con un máximo de 367 días.
        </p>
      )}
      {!demo && error && (
        <p className="marketing-error" role="alert">
          {error}{" "}
          <button
            className="marketing-enlace"
            onClick={() => {
              setCargando(true);
              setRevision((v) => v + 1);
            }}
          >
            Reintentar
          </button>
        </p>
      )}
      {!demo && cargando && !error && (
        <p className="marketing-vacio" role="status">
          Consultando tus campañas…
        </p>
      )}
      {listo && (
        <div
          className="marketing-contenido"
          aria-busy={cargando && !demo}
          inert={cargando && !demo}
        >
          {!demo && !datos.geografiaDisponible && (
            <p className="marketing-aviso">
              La geografía está pendiente de configuración en el servidor.
            </p>
          )}
          <div className="marketing-contexto" aria-live="polite">
            <span>
              {campana ? campana.nombre : "Todas las campañas"}
              {ubicacion
                ? ` · ${ubicacionesResultado.find((u) => String(u.idUbicacion) === ubicacion)?.ciudad || "País seleccionado"}`
                : " · Resumen del período"}
            </span>
            {(campana || grupo || ubicacion) && (
              <button className="marketing-enlace" onClick={limpiarSeleccion}>
                Ver todas las campañas <X size={13} />
              </button>
            )}
          </div>
          <section className="marketing-escenario">
            <div className="marketing-mapa">
              <div className="marketing-mapa-titulo">
                <span className="marketing-eyebrow">
                  <Globe2 size={13} /> Presencia global
                </span>
                <button
                  className="marketing-boton marketing-boton-icono"
                  aria-label="Restablecer globo"
                  onClick={() => {
                    limpiarSeleccion();
                    setReinicio((v) => v + 1);
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>
              <GloboCampanas
                puntos={puntos}
                seleccionado={campana?.idCampana}
                alSeleccionar={seleccionarPunto}
                reinicio={reinicio}
              />
              <div className="marketing-kpis-flotantes">
                <Tarjeta
                  titulo="Inversión del período"
                  valor={dinero(totales.inversion)}
                  ayuda={`${numero(visibles.length)} campañas · ${numero(clientes)} clientes de la agencia`}
                  destacada
                />
                <Tarjeta
                  titulo="Ingresos registrados"
                  valor={dinero(totales.ingresos)}
                  ayuda="Según las métricas operativas"
                />
                <div className="marketing-kpi-doble">
                  <Tarjeta
                    titulo="Impresiones"
                    valor={numero(totales.impresiones)}
                    ayuda="Exposiciones registradas"
                  />
                  <Tarjeta
                    titulo="ROAS registrado"
                    valor={mostrarKpi(totales.roas, "×")}
                    ayuda="Ingresos / inversión"
                  />
                </div>
              </div>
              <div className="marketing-mapa-pie">
                <div
                  className="marketing-segmentado"
                  aria-label="Datos del mapa"
                >
                  {[
                    ["COBERTURA", "Cobertura"],
                    ["RESULTADOS", "Resultados"],
                  ].map(([valor, texto]) => (
                    <button
                      key={valor}
                      aria-pressed={vista === valor}
                      onClick={() => {
                        setVista(valor);
                        setGrupo(null);
                      }}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
                <span>
                  {puntos.length
                    ? `${puntos.length} ubicaciones · Arrastra para explorar`
                    : "Sin ubicaciones para estos filtros"}
                </span>
              </div>
            </div>
            <aside className="marketing-panel marketing-listado">
              <div className="marketing-panel-titulo">
                <div>
                  <span className="marketing-eyebrow">Tu actividad</span>
                  <h2>
                    Campañas{" "}
                    <span className="marketing-contador">
                      {campanas.length}
                    </span>
                  </h2>
                </div>
                <SlidersHorizontal size={17} />
              </div>
              {grupo && (
                <div className="marketing-grupo">
                  <MapPin size={14} />
                  <span>
                    {grupo.lugares.map((u) => u.ciudad || u.pais).join(" · ")}
                  </span>
                  <button
                    aria-label="Quitar filtro de grupo"
                    onClick={() => setGrupo(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="marketing-campanas-scroll">
                {listado.length ? (
                  listado.map((c) => {
                    const tieneUbicacion = datos.ubicaciones.some(
                      (u) => String(u.idCampana) === String(c.idCampana),
                    );
                    return (
                      <button
                        key={c.idCampana}
                        className={`marketing-campana ${String(c.idCampana) === String(campana?.idCampana) ? "seleccionada" : ""}`}
                        aria-pressed={
                          String(c.idCampana) === String(campana?.idCampana)
                        }
                        onClick={() => seleccionarCampana(c.idCampana)}
                      >
                        <span className="marketing-campana-estado">
                          <i style={{ background: COLORES_ESTADO[c.estado] }} />
                          {etiquetaEstado(c.estado)}
                          <small>{c.canal}</small>
                        </span>
                        <strong>{c.nombre}</strong>
                        <span className="marketing-campana-cliente">
                          {c.cliente}
                          <ChevronRight size={15} />
                        </span>
                        {!tieneUbicacion && (
                          <small className="marketing-sin-ubicacion">
                            Sin ubicación
                          </small>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="marketing-vacio">
                    No hay campañas que coincidan con los filtros.
                  </p>
                )}
              </div>
              <div className="marketing-leyenda">
                {Object.entries(COLORES_ESTADO).map(([estado, color]) => (
                  <span key={estado}>
                    <i style={{ background: color }} />
                    {etiquetaEstado(estado)}
                  </span>
                ))}
                <small>
                  El número indica campañas únicas. En Resultados, el tamaño
                  también refleja impresiones.
                </small>
              </div>
            </aside>
          </section>
          {campana && (
            <section
              className="marketing-panel marketing-detalle"
              aria-label="Detalle de campaña"
            >
              <div className="marketing-panel-titulo">
                <div>
                  <span className="marketing-eyebrow">
                    Campaña seleccionada
                  </span>
                  <h2>{campana.nombre}</h2>
                  <p>{campana.objetivo}</p>
                </div>
                {!demo && datos.geografiaDisponible && (
                  <button
                    className="marketing-boton"
                    onClick={() => setEditor(true)}
                  >
                    <MapPin size={15} /> Gestionar geografía
                  </button>
                )}
              </div>
              <dl>
                <div>
                  <dt>Cliente</dt>
                  <dd>{campana.cliente}</dd>
                </div>
                <div>
                  <dt>Canal</dt>
                  <dd>{campana.canal}</dd>
                </div>
                <div>
                  <dt>Responsable de creación</dt>
                  <dd>{campana.responsable || "Sin responsable"}</dd>
                </div>
                <div>
                  <dt>Vigencia</dt>
                  <dd>
                    {campana.fechaInicio} — {campana.fechaFin}
                  </dd>
                </div>
                <div>
                  <dt>Presupuesto total</dt>
                  <dd>{dinero(campana.presupuesto)}</dd>
                </div>
              </dl>
              <label className="marketing-campo marketing-filtro-geografico">
                Resultados por ubicación
                <select
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                >
                  <option value="">
                    Todas las ubicaciones · Total de campaña
                  </option>
                  {ubicacionesResultado.map((u) => (
                    <option key={u.idUbicacion} value={u.idUbicacion}>
                      {u.ciudad ? `${u.ciudad}, ` : ""}
                      {u.pais}
                    </option>
                  ))}
                </select>
              </label>
              {!ubicacionesCampana.length && (
                <p className="marketing-ayuda">
                  Esta campaña todavía no tiene una ubicación registrada.
                </p>
              )}
              {ubicacion && (
                <p className="marketing-ayuda">
                  El filtro utiliza únicamente el desglose geográfico
                  registrado. Puede representar una parte del total de campaña.
                </p>
              )}
            </section>
          )}
          <section className="marketing-kpis-secundarios">
            <Tarjeta
              titulo="Clics"
              valor={numero(totales.clics)}
              ayuda="Tráfico registrado"
            />
            <Tarjeta
              titulo="CTR"
              valor={mostrarKpi(totales.ctr, "%")}
              ayuda="Clics / impresiones"
            />
            <Tarjeta
              titulo="CPC"
              valor={totales.cpc == null ? "Sin datos" : dinero(totales.cpc)}
              ayuda="Inversión / clics"
            />
            <Tarjeta
              titulo="CPM"
              valor={totales.cpm == null ? "Sin datos" : dinero(totales.cpm)}
              ayuda="Costo por mil impresiones"
            />
            <Tarjeta
              titulo="Conversiones"
              valor={numero(totales.conversiones)}
              ayuda="Objetivos registrados"
            />
            <Tarjeta
              titulo="CPA"
              valor={totales.cpa == null ? "Sin datos" : dinero(totales.cpa)}
              ayuda="Inversión / conversiones"
            />
          </section>
          <section className="marketing-graficos">
            <GraficoEvolucion filas={metricas} />
            <article className="marketing-panel">
              <div className="marketing-panel-titulo">
                <div>
                  <span className="marketing-eyebrow">
                    Distribución de inversión
                  </span>
                  <h2>Rendimiento por canal</h2>
                </div>
                <ArrowUpRight size={19} />
              </div>
              {canales.map((c) => (
                <div className="marketing-canal" key={c.canal}>
                  <div>
                    <strong>{c.canal}</strong>
                    <span>{dinero(c.inversion)}</span>
                  </div>
                  <div className="marketing-progreso">
                    <span
                      style={{
                        width: `${totales.inversion ? (c.inversion / totales.inversion) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <small>
                    {numero(c.conversiones)} conversiones · ROAS{" "}
                    {mostrarKpi(c.roas, "×")}
                  </small>
                </div>
              ))}
              {!canales.length && (
                <p className="marketing-vacio">Sin canales para este filtro.</p>
              )}
              <div className="marketing-presupuesto">
                <span>Inversión del período / presupuesto total</span>
                <strong>
                  {presupuesto > 0
                    ? `${numero((totales.inversion / presupuesto) * 100)}%`
                    : "Sin presupuesto"}
                </strong>
              </div>
            </article>
          </section>
          <ResumenCrmDashboard
            token={token}
            desde={desde}
            hasta={hasta}
            campanas={visibles}
            demo={demo}
            revision={revision}
            filtroGeografico={!!ubicacion}
          />
          <footer className="marketing-fuente">
            <span>
              {datos.fuente} ·{" "}
              {datos.consultadoEn
                ? new Date(datos.consultadoEn).toLocaleString("es-PE")
                : ""}
            </span>
            <Link to="/atribucion">
              Consultar atribución y embudo CRM <ArrowUpRight size={13} />
            </Link>
          </footer>
          {editor && campana && (
            <EditorGeografia
              campana={campana}
              datos={datos}
              token={token}
              apiBase={apiBase}
              desde={desde}
              hasta={hasta}
              puedeCobertura={grupoRol !== GRUPOS_ROL.ANALISTA}
              cerrar={() => setEditor(false)}
              alGuardar={() => {
                setEditor(false);
                setUbicacion("");
                setCargando(true);
                setRevision((v) => v + 1);
              }}
            />
          )}
        </div>
      )}
    </main>
  );
}
