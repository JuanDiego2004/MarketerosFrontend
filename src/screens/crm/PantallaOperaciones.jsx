import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Columns3,
  List,
  CalendarDays,
  Download,
  Play,
  Users,
  History,
} from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import { operaciones, etiquetas } from "./configuracionOperaciones";
import "./Crm.css";
import AlertasMetas from "./AlertasMetas";
import CalendarioActividades from "./CalendarioActividades";
import CanalesCrm from "./CanalesCrm";

const fechaLocal = (v) =>
  v
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date(v))
        .replace(" ", "T")
    : "";
const presentar = (v) =>
  v == null || v === ""
    ? "—"
    : typeof v === "boolean"
      ? v
        ? "Sí"
        : "No"
      : String(v);

export default function PantallaOperaciones({ recurso }) {
  return recurso === "integraciones" ? <CanalesCrm/> : <OperacionesGenerales recurso={recurso}/>;
}

function OperacionesGenerales({ recurso }) {
  const { token } = useAuth();
  const cfg = operaciones[recurso];
  const [params, setParams] = useSearchParams();
  const pagina = Math.max(0, Number(params.get("pagina")) || 0);
  const vista = params.get("vista") || "lista";
  const propias = params.get("propias") === "true";
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [datos, setDatos] = useState(null);
  const [opciones, setOpciones] = useState({});
  const [cap, setCap] = useState({});
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState(null);
  const [sucio, setSucio] = useState(false);
  const [descartar, setDescartar] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [vencidas, setVencidas] = useState([]);
  const searchRef = useRef(null);
  const gestionar = cap[`${recurso}Gestionar`];
  const api = (ruta, args) => solicitarCrm(`/operaciones${ruta}`, token, args);
  useEffect(() => {
    document.title = `${cfg.titulo} · MarketingSystem`;
  }, [cfg.titulo]);
  useEffect(() => {
    const c = new AbortController();
    queueMicrotask(() => {
      if (!c.signal.aborted) {
        setCargando(true);
        setError("");
      }
    });
    Promise.all([
      solicitarCrm(
        `/operaciones/${recurso}?pagina=${pagina}&propias=${propias}&q=${encodeURIComponent(q)}`,
        token,
        { signal: c.signal },
      ),
      solicitarCrm("/operaciones/capacidades", token, { signal: c.signal }),
      recurso === "auditoria"
        ? Promise.resolve({})
        : solicitarCrm(`/operaciones/${recurso}/opciones`, token, {
            signal: c.signal,
          }),
    ])
      .then(([d, permisos, opts]) => {
        if (c.signal.aborted) return;
        setDatos(d);
        setCap(permisos);
        setOpciones(opts);
        if (pagina > 0 && d.total <= pagina * 25)
          setParams(
            (p) => {
              p.set("pagina", String(Math.max(0, Math.ceil(d.total / 25) - 1)));
              return p;
            },
            { replace: true },
          );
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setCargando(false);
      });
    return () => c.abort();
  }, [recurso, pagina, propias, q, token, revision, setParams]);
  useEffect(() => {
    const c = new AbortController();
    if (recurso === "actividades")
      solicitarCrm("/operaciones/notificaciones", token, { signal: c.signal })
        .then(setVencidas)
        .catch(() => {});
    return () => c.abort();
  }, [recurso, token, revision]);
  useEffect(() => {
    if (!sucio) return;
    const aviso = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sucio]);
  const cambiarParams = (k, v) =>
    setParams((p) => {
      p.set(k, String(v));
      if (k === "vista") p.set("pagina", "0");
      return p;
    });
  const buscar = (valor) => {
    setQ(valor);
    cambiarParams("pagina", 0);
  };
  function abrir(fila) {
    const d = { ...fila };
    for (const c of cfg.campos) {
      if (c.tipo === "datetime-local") d[c.id] = fechaLocal(d[c.id]);
      else if (d[c.id] == null)
        d[c.id] =
          c.tipo === "checkbox"
            ? false
            : c.id === "responsable_id"
              ? opciones.usuarioId || ""
              : c.opciones && c.requerido
                ? c.opciones[0]
                : "";
    }
    setForm(d);
    setSucio(false);
    setError("");
  }
  async function actuar(fn, exito) {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      await fn();
      if (exito) setMensaje(exito);
      setRevision((v) => v + 1);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  }
  async function guardar(e) {
    e.preventDefault();
    const invalidos = [...e.currentTarget.elements].filter(
      (el) => el.willValidate && !el.validity.valid,
    );
    for (const el of e.currentTarget.elements) {
      if (el.willValidate) {
        el.setAttribute("aria-invalid", String(!el.validity.valid));
        if (!el.validity.valid)
          el.setAttribute("aria-describedby", "operacion-error");
        else el.removeAttribute("aria-describedby");
      }
    }
    if (invalidos.length) {
      setError(
        "Revisa los campos marcados: completa los obligatorios y respeta sus límites.",
      );
      invalidos[0].focus();
      return;
    }
    const body = { ...form };
    for (const c of cfg.campos)
      if (c.tipo === "datetime-local" && body[c.id])
        body[c.id] = new Date(body[c.id] + "-05:00").toISOString();
    const ok = await actuar(
      () =>
        api(`/${recurso}${form.id ? `/${form.id}` : ""}`, {
          method: form.id ? "PUT" : "POST",
          body,
        }),
      "Registro guardado",
    );
    if (ok) {
      setForm(null);
      setSucio(false);
    }
  }
  const cerrar = () => {
    if (sucio) setDescartar(true);
    else setForm(null);
  };
  function valor(fila, clave) {
    const c = cfg.campos.find((x) => x.id === clave);
    if (c?.catalogo)
      return (
        opciones[c.catalogo]?.find((x) => Number(x.id) === Number(fila[clave]))
          ?.nombre || presentar(fila[clave])
      );
    if (["fecha", "created_at"].includes(clave) && fila[clave])
      return new Date(fila[clave]).toLocaleString("es-PE", {
        timeZone: "America/Lima",
      });
    return presentar(fila[clave]);
  }
  const acciones = (f) => (
    <div className="crm-acciones">
      {gestionar && (
        <>
          {!f.flujo_visual && <button
            className="crm-boton"
            onClick={() => abrir(f)}
            aria-label={`Editar ${f.nombre}`}
          >
            <Pencil size={15} />
            Editar
          </button>}
          <button
            className="crm-boton crm-peligro"
            onClick={() => setConfirmacion({ tipo: "eliminar", fila: f })}
            aria-label={`Eliminar ${f.nombre}`}
          >
            <Trash2 size={15} />
          </button>
        </>
      )}
      {recurso === "automatizaciones" && gestionar && <Link className="crm-boton" to={`/automatizaciones/${f.id}/flujo`}>Editor visual</Link>}
      {recurso === "segmentos" && (
        <>
          <button
            className="crm-boton"
            disabled={ocupado}
            onClick={() =>
              actuar(async () =>
                setDetalle({
                  titulo: `Miembros · ${f.nombre}`,
                  ...(await api(`/segmentos/${f.id}/miembros`)),
                  segmento: f.id,
                  pagina: 0,
                }),
              )
            }
          >
            <Users size={15} />
            Miembros
          </button>
          <button
            className="crm-boton"
            disabled={ocupado}
            onClick={() =>
              actuar(async () =>
                descargarCrm(
                  await api(`/segmentos/${f.id}/csv`, { archivo: true }),
                  "segmento.csv",
                ),
              )
            }
          >
            <Download size={15} />
            CSV
          </button>
        </>
      )}
      {recurso === "automatizaciones" && (
        <>
          <button
            className="crm-boton"
            disabled={ocupado}
            onClick={() => setConfirmacion({ tipo: "ejecutar", fila: f })}
          >
            <Play size={15} />
            Ejecutar
          </button>
          <button
            className="crm-boton"
            disabled={ocupado}
            onClick={() =>
              actuar(async () =>
                setDetalle({
                  titulo: `Ejecuciones · ${f.nombre}`,
                  filas: await api(`/automatizaciones/${f.id}/ejecuciones`),
                }),
              )
            }
          >
            <History size={15} />
            Historial
          </button>
        </>
      )}

    </div>
  );
  const filas = datos?.filas || [];
  return (
    <section className="crm">
      <header className="crm-cabecera">
        <div>
          <p className="crm-kicker">Agencia · Operación CRM</p>
          <h1>{cfg.titulo}</h1>
          <p className="crm-ayuda">{cfg.descripcion}</p>
        </div>
        {gestionar && (
          <button className="crm-boton crm-primario" onClick={() => abrir({})}>
            <Plus size={17} />
            Crear registro
          </button>
        )}
      </header>
      {recurso === "pipeline" && (
        <div className="crm-acciones">
          {cap.etapasLeer && (
            <Link className="crm-boton" to="/pipeline/etapas">
              Configurar etapas
            </Link>
          )}
          <button
            className="crm-boton"
            onClick={() => cambiarParams("vista", "tablero")}
          >
            <Columns3 size={16} />
            Tablero
          </button>
          <button
            className="crm-boton"
            onClick={() => cambiarParams("vista", "lista")}
          >
            <List size={16} />
            Lista
          </button>
        </div>
      )}
      {recurso === "actividades" && (
        <>
          <label className="crm-campo">
            Mostrar
            <select
              value={propias ? "propias" : "todas"}
              onChange={(e) => {
                cambiarParams("propias", e.target.value === "propias");
                cambiarParams("pagina", 0);
              }}
            >
              <option value="todas">Actividades disponibles para mi rol</option>
              <option value="propias">Mis tareas</option>
            </select>
          </label>
          <div className="crm-acciones">
            <button
              className="crm-boton"
              onClick={() => cambiarParams("vista", "calendario")}
            >
              <CalendarDays size={16} />
              Calendario semanal
            </button>
            <button
              className="crm-boton"
              onClick={() => cambiarParams("vista", "lista")}
            >
              <List size={16} />
              Lista
            </button>
          </div>
          {vencidas.length > 0 && (
            <div className="crm-error" role="status">
              Tienes {vencidas.length} tareas pendientes vencidas.{" "}
              {vencidas
                .slice(0, 3)
                .map((x) => x.nombre)
                .join(" · ")}
            </div>
          )}
        </>
      )}
      {error && !form && (
        <div className="crm-error" role="alert">
          {error}
          <button
            className="crm-boton"
            onClick={() => setRevision((n) => n + 1)}
          >
            Reintentar
          </button>
        </div>
      )}
      {mensaje && (
        <p className="crm-exito" role="status">
          {mensaje}
        </p>
      )}
      {recurso === "metas" && <AlertasMetas revision={revision} />}
      <div className="crm-panel">
        {recurso !== "auditoria" && (
          <form
            noValidate
            className="crm-filtros"
            onSubmit={(e) => {
              e.preventDefault();
              buscar(busqueda);
            }}
          >
            <label className="crm-campo">
              Buscar por nombre
              <div className="crm-busqueda">
                <input
                  ref={searchRef}
                  maxLength={160}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button
                    type="button"
                    className="crm-boton"
                    aria-label="Limpiar búsqueda"
                    onClick={() => {
                      setBusqueda("");
                      buscar("");
                      searchRef.current?.focus();
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
                <button className="crm-boton">
                  <Search size={16} />
                  Buscar
                </button>
              </div>
            </label>
          </form>
        )}
        {cargando ? (
          <p className="crm-vacio" role="status">
            Cargando registros…
          </p>
        ) : error ? (
          <p className="crm-vacio">No se pudieron cargar los registros.</p>
        ) : recurso === "actividades" && vista === "calendario" ? (
          <CalendarioActividades
            revision={revision}
            editar={abrir}
            gestionar={gestionar}
            propias={propias}
          />
        ) : filas.length === 0 ? (
          <p className="crm-vacio">
            {q
              ? "Sin coincidencias. Prueba otra búsqueda."
              : "Todavía no hay registros."}
          </p>
        ) : recurso === "pipeline" && vista === "tablero" ? (
          <div className="crm-tablero">
            {opciones.etapas?.map((etapa) => (
              <section
                className="crm-columna"
                key={etapa.id}
                onDragOver={(e) => {
                  if (gestionar && !ocupado) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!gestionar || ocupado) return;
                  const fila = filas.find(
                    (f) =>
                      String(f.id) === e.dataTransfer.getData("text/plain"),
                  );
                  if (fila) abrir({ ...fila, etapa_id: etapa.id });
                }}
              >
                <h2>{etapa.nombre}</h2>
                <p className="crm-ayuda">
                  {
                    filas.filter((f) => Number(f.etapa_id) === Number(etapa.id))
                      .length
                  }{" "}
                  en esta página
                </p>
                {filas
                  .filter((f) => Number(f.etapa_id) === Number(etapa.id))
                  .map((f) => (
                    <article
                      className="crm-tarjeta"
                      key={f.id}
                      draggable={!!gestionar && !ocupado}
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", String(f.id))
                      }
                    >
                      <strong>{f.nombre}</strong>
                      <p>
                        {f.moneda} {f.valor}
                      </p>
                      <p className="crm-ayuda">{valor(f, "responsable_id")}</p>
                      <label className="crm-campo">
                        Mover a etapa
                        <select
                          disabled={!gestionar || ocupado}
                          value={f.etapa_id}
                          onChange={(e) => {
                            abrir({ ...f, etapa_id: e.target.value });
                          }}
                        >
                          <option value={f.etapa_id}>{etapa.nombre}</option>
                          {opciones.etapas
                            .filter((x) => Number(x.id) !== Number(f.etapa_id))
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.nombre}
                              </option>
                            ))}
                        </select>
                      </label>
                      {acciones(f)}
                    </article>
                  ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="crm-scroll">
            <table>
              <thead>
                <tr>
                  {cfg.columnas.map((k) => (
                    <th scope="col" key={k}>
                      {etiquetas[k] || k}
                    </th>
                  ))}
                  {recurso !== "auditoria" && <th scope="col">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    {cfg.columnas.map((k) => (
                      <td key={k}>{valor(f, k)}</td>
                    ))}
                    {recurso !== "auditoria" && <td>{acciones(f)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {datos && (
          <div className="crm-paginacion">
            <span>
              {datos.total} registros · página {pagina + 1} de{" "}
              {Math.max(1, Math.ceil(datos.total / 25))} (25 por página)
            </span>
            <div className="crm-acciones">
              <button
                className="crm-boton"
                disabled={pagina === 0 || cargando}
                onClick={() => cambiarParams("pagina", pagina - 1)}
              >
                Anterior
              </button>
              <button
                className="crm-boton"
                disabled={(pagina + 1) * 25 >= datos.total || cargando}
                onClick={() => cambiarParams("pagina", pagina + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
      {form && !descartar && (
        <DialogoCrm
          titulo={form.id ? `Editar · ${form.nombre}` : `Nuevo registro`}
          cerrar={cerrar}
          ocupado={ocupado}
        >
          <form
            noValidate
            className="crm-formulario"
            onSubmit={guardar}
            onChange={() => setSucio(true)}
          >
            {cfg.campos.map((c) => (
              <label
                className={`crm-campo ${c.tipo === "textarea" ? "crm-ancho" : ""}`}
                key={c.id}
                htmlFor={`op-${c.id}`}
              >
                {c.nombre}
                {c.requerido ? " *" : ""}
                {c.tipo === "select" ? (
                  <select
                    id={`op-${c.id}`}
                    value={form[c.id] ?? ""}
                    required={c.requerido}
                    onChange={(e) =>
                      setForm({ ...form, [c.id]: e.target.value })
                    }
                  >
                    <option value="">Seleccionar…</option>
                    {(c.catalogo
                      ? opciones[c.catalogo] || []
                      : c.opciones.map((v) => ({ id: v, nombre: v }))
                    ).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                ) : c.tipo === "textarea" ? (
                  <textarea
                    id={`op-${c.id}`}
                    required={c.requerido}
                    maxLength={c.maxLength}
                    value={form[c.id] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [c.id]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    id={`op-${c.id}`}
                    type={c.tipo}
                    required={
                      c.requerido ||
                      (c.tipo === "number" && !(recurso === "segmentos"))
                    }
                    min={c.min}
                    max={c.max}
                    step={
                      c.tipo === "number"
                        ? ["valor", "ingresos"].includes(c.id)
                          ? "0.01"
                          : "1"
                        : undefined
                    }
                    maxLength={c.maxLength}
                    pattern={c.pattern}
                    checked={c.tipo === "checkbox" ? !!form[c.id] : undefined}
                    value={
                      c.tipo === "checkbox" ? undefined : (form[c.id] ?? "")
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [c.id]:
                          c.tipo === "checkbox"
                            ? e.target.checked
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            {error && (
              <p
                className="crm-error crm-ancho"
                id="operacion-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="crm-acciones crm-ancho">
              <button
                className="crm-boton"
                type="button"
                disabled={ocupado}
                onClick={cerrar}
              >
                Cancelar
              </button>
              <button
                className="crm-boton crm-primario"
                disabled={ocupado}
                aria-busy={ocupado}
              >
                {ocupado ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </DialogoCrm>
      )}
      {descartar && (
        <DialogoCrm
          titulo="Descartar cambios"
          cerrar={() => setDescartar(false)}
        >
          <p>Se perderán los cambios de este formulario.</p>
          <div className="crm-acciones">
            <button className="crm-boton" onClick={() => setDescartar(false)}>
              Seguir editando
            </button>
            <button
              className="crm-boton crm-peligro"
              onClick={() => {
                setDescartar(false);
                setForm(null);
                setSucio(false);
              }}
            >
              Descartar cambios
            </button>
          </div>
        </DialogoCrm>
      )}
      {confirmacion && (
        <DialogoCrm
          titulo={
            confirmacion.tipo === "eliminar"
              ? "Eliminar registro"
              : "Ejecutar automatización"
          }
          ocupado={ocupado}
          cerrar={() => setConfirmacion(null)}
        >
          <p>
            {confirmacion.tipo === "eliminar"
              ? `Se eliminará «${confirmacion.fila.nombre}». Los registros relacionados pueden impedir la eliminación.`
              : `«${confirmacion.fila.nombre}» procesará el segmento y podrá enviar correos reales a contactos con consentimiento. Cada contacto se procesa una sola vez por flujo.`}
          </p>
          {error && (
            <p className="crm-error" role="alert">
              {error}
            </p>
          )}
          <div className="crm-acciones">
            <button
              className="crm-boton"
              disabled={ocupado}
              onClick={() => setConfirmacion(null)}
            >
              Cancelar
            </button>
            <button
              className="crm-boton crm-peligro"
              disabled={ocupado}
              onClick={async () => {
                const ok = await actuar(
                  () =>
                    api(
                      `/${recurso}/${confirmacion.fila.id}${confirmacion.tipo === "ejecutar" ? "/ejecutar" : ""}`,
                      {
                        method:
                          confirmacion.tipo === "eliminar" ? "DELETE" : "POST",
                      },
                    ),
                  confirmacion.tipo === "eliminar"
                    ? "Registro eliminado"
                    : "Ejecución terminada. Consulta el historial para ver cada resultado.",
                );
                if (ok) setConfirmacion(null);
              }}
            >
              {confirmacion.tipo === "eliminar" ? "Eliminar" : "Ejecutar flujo"}
            </button>
          </div>
        </DialogoCrm>
      )}
      {detalle && (
        <DialogoCrm titulo={detalle.titulo} cerrar={() => setDetalle(null)}>
          <p className="crm-ayuda">
            {detalle.total != null
              ? `${detalle.total} contactos en el segmento`
              : "Últimas 100 ejecuciones"}
          </p>
          <div className="crm-scroll">
            <table>
              <thead>
                <tr>
                  {(detalle.segmento
                    ? ["nombre", "estado"]
                    : ["contacto_id", "estado", "detalle"]
                  ).map((k) => (
                    <th key={k}>{etiquetas[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detalle.filas?.map((f) => (
                  <tr key={f.id}>
                    {(detalle.segmento
                      ? ["nombre", "estado"]
                      : ["contacto_id", "estado", "detalle"]
                    ).map((k) => (
                      <td key={k}>{presentar(f[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detalle.segmento && (
            <div className="crm-acciones">
              <button
                className="crm-boton"
                disabled={ocupado || detalle.pagina === 0}
                onClick={() =>
                  actuar(async () =>
                    setDetalle({
                      ...detalle,
                      ...(await api(
                        `/segmentos/${detalle.segmento}/miembros?pagina=${detalle.pagina - 1}`,
                      )),
                      pagina: detalle.pagina - 1,
                    }),
                  )
                }
              >
                Anterior
              </button>
              <button
                className="crm-boton"
                disabled={ocupado || (detalle.pagina + 1) * 25 >= detalle.total}
                onClick={() =>
                  actuar(async () =>
                    setDetalle({
                      ...detalle,
                      ...(await api(
                        `/segmentos/${detalle.segmento}/miembros?pagina=${detalle.pagina + 1}`,
                      )),
                      pagina: detalle.pagina + 1,
                    }),
                  )
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </DialogoCrm>
      )}
    </section>
  );
}
