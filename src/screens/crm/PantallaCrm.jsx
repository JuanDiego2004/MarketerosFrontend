import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Download,
  FileUp,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import { leerCsvCrm } from "../../utils/csvCrm";
import "./Crm.css";
import PuntajeContacto from "./PuntajeContacto";
import RelacionesContacto from "./RelacionesContacto";
import ValoresPersonalizados from "./ValoresPersonalizados";
import MensajesWhatsApp from "./MensajesWhatsApp";

const estados = ["NUEVO", "CONTACTADO", "CALIFICADO", "CLIENTE", "DESCARTADO"];
const fecha = (valor) =>
  valor
    ? new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
      }).format(new Date(valor))
    : "—";
const camposContacto = [
  ["nombre", "Nombre completo", "text", true],
  ["correo", "Correo", "email"],
  ["telefono", "Teléfono con prefijo de país", "tel"],
  ["estado", "Estado", estados, true],
  ["origen", "Origen", "text", true],
  ["etiquetas", "Etiquetas separadas por comas", "text"],
  ["cuentaId", "Empresa", "cuentas"],
  ["campanaId", "Campaña de origen", "campanas"],
  ["responsableId", "Responsable", "responsables"],
];
const camposCuenta = [
  ["nombre", "Nombre de la empresa", "text", true],
  ["correo", "Correo de la empresa", "email"],
  ["telefono", "Teléfono de la empresa", "tel"],
  ["sector", "Sector", "text"],
  ["sitioWeb", "Sitio web", "url"],
  ["estado", "Estado de la empresa", ["ACTIVO", "INACTIVO"], true],
];
const inicial = {
  nombre: "",
  correo: "",
  telefono: "",
  origen: "MANUAL",
  estado: "NUEVO",
  etiquetas: "",
};

export default function PantallaCrm({ recurso = "contactos" }) {
  const { token } = useAuth();
  const navegar = useNavigate();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [capacidades, setCapacidades] = useState(null);
  const [datos, setDatos] = useState(null);
  const [opciones, setOpciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [revision, setRevision] = useState(0);
  const [revisionRelaciones, setRevisionRelaciones] = useState(0);
  const [tab, setTab] = useState("Resumen");
  const [modal, setModal] = useState(null);
  const [borrador, setBorrador] = useState(inicial);
  const [sucio, setSucio] = useState(false);
  const [abandonar, setAbandonar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [importacion, setImportacion] = useState([]);
  const [nota, setNota] = useState("");
  const archivoCsv = useRef(null);
  const pagina = Math.max(0, Number(params.get("pagina")) || 0);
  const estado = params.get("estado") || "";
  const contactos = recurso === "contactos";
  const titulo = contactos ? "Contactos" : "Clientes / Empresas";
  const rutaFicha = contactos ? "contactos" : "empresas";
  const gestionar = capacidades?.[`${recurso}Gestionar`] === true;

  useEffect(() => {
    const control = new AbortController();
    solicitarCrm("/capacidades", token, { signal: control.signal })
      .then(setCapacidades)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => control.abort();
  }, [token, revision]);

  useEffect(() => {
    const control = new AbortController();
    Promise.resolve().then(() => {
      if (!control.signal.aborted) {
        setCargando(true);
        setError("");
        setDatos(null);
      }
    });
    const ruta = id
      ? `/${recurso}/${id}`
      : `/${recurso}?${new URLSearchParams({ q: consulta, estado, pagina })}`;
    solicitarCrm(ruta, token, { signal: control.signal })
      .then((d) => {
        if (!control.signal.aborted) setDatos(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!control.signal.aborted) setCargando(false);
      });
    return () => control.abort();
  }, [token, recurso, id, consulta, estado, pagina, revision]);

  useEffect(() => {
    if (!gestionar) return;
    const control = new AbortController();
    solicitarCrm(`/${recurso}/opciones`, token, { signal: control.signal })
      .then(setOpciones)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => control.abort();
  }, [token, recurso, gestionar]);

  useEffect(() => {
    document.title = `${titulo}${id ? " · Ficha" : ""} — MarketingSystem`;
  }, [titulo, id]);
  useEffect(() => {
    if (!sucio) return;
    const prevenir = (evento) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", prevenir);
    return () => window.removeEventListener("beforeunload", prevenir);
  }, [sucio]);

  function filtrar(clave, valor) {
    setParams((actual) => {
      const siguientes = new URLSearchParams(actual);
      siguientes.set(clave, valor);
      if (clave !== "pagina") siguientes.delete("pagina");
      return siguientes;
    });
  }
  function abrir(tipo) {
    setErrorModal("");
    setAbandonar(false);
    setSucio(false);
    setBorrador(tipo === "editar" ? { ...datos } : { ...inicial, estado: contactos ? "NUEVO" : "ACTIVO" });
    setModal(tipo);
  }
  function cerrar() {
    if (ocupado) return;
    if (sucio) setAbandonar(true);
    else setModal(null);
  }
  function cambiar(campo, valor) {
    setBorrador((d) => ({ ...d, [campo]: valor }));
    setSucio(true);
  }
  async function operacion(ruta, method, body) {
    if (ocupado) return false;
    setOcupado(true);
    setErrorModal("");
    setError("");
    try {
      await solicitarCrm(ruta, token, { method, body });
      setSucio(false);
      setModal(null);
      setNota("");
      setMensaje("Cambios guardados.");
      setRevision((r) => r + 1);
      return true;
    } catch (e) {
      setErrorModal(e.message);
      setError(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  }
  function validarFormulario(formulario) {
    for (const campo of formulario.elements)
      if (campo.willValidate && !campo.validity.valid) {
        campo.setAttribute("aria-invalid", "true");
        campo.setAttribute("aria-describedby", "crm-error-formulario");
        campo.focus();
        setErrorModal(
          `Revisa el campo ${campo.labels?.[0]?.textContent || campo.name}.`,
        );
        return false;
      }
    return true;
  }
  async function guardar(evento) {
    evento.preventDefault();
    if (!validarFormulario(evento.currentTarget)) return;
    if (contactos && !borrador.correo?.trim() && !borrador.telefono?.trim()) {
      setErrorModal("Indica un correo o teléfono.");
      return;
    }
    const body = { ...borrador };
    for (const campo of ["cuentaId", "campanaId", "responsableId", "clienteId"])
      body[campo] = body[campo] ? Number(body[campo]) : null;
    await operacion(
      `/${recurso}${modal === "editar" ? `/${id}` : ""}`,
      modal === "editar" ? "PUT" : "POST",
      body,
    );
  }
  async function exportar() {
    setOcupado(true);
    setError("");
    try {
      descargarCrm(
        await solicitarCrm(
          `/contactos/exportacion?${new URLSearchParams({ q: consulta, estado })}`,
          token,
          { archivo: true },
        ),
        "contactos.csv",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function leerArchivo(evento) {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (!archivo) return;
    setError("");
    try {
      if (archivo.size > 1048576)
        throw new Error(
          "El CSV debe pesar como máximo 1 MB y contener hasta 500 filas.",
        );
      setImportacion(leerCsvCrm(await archivo.text()));
      abrir("importar");
    } catch (e) {
      setError(e.message);
    }
  }
  async function importar() {
    setOcupado(true);
    setErrorModal("");
    try {
      const resultado = await solicitarCrm("/contactos/importacion", token, {
        method: "POST",
        body: { filas: importacion },
      });
      setModal(null);
      setRevision((r) => r + 1);
      setMensaje(
        `${resultado.creados} contactos importados; ${resultado.omitidos} duplicados omitidos.${resultado.filasDuplicadas.length ? ` Filas: ${resultado.filasDuplicadas.join(", ")}.` : ""}`,
      );
    } catch (e) {
      setErrorModal(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function subir(evento) {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (!archivo) return;
    if (archivo.size > 5242880) {
      setError("El adjunto no debe superar 5 MB.");
      return;
    }
    const body = new FormData();
    body.append("archivo", archivo);
    await operacion(`/${recurso}/${id}/archivos`, "POST", body);
  }
  const tabs = contactos
    ? ["Resumen", "Línea de tiempo", "Notas", "Consentimiento", "Archivos"]
    : ["Resumen", "Campañas", "Contactos", "Oportunidades", "Actividades", "Línea de tiempo", "Notas", "Archivos"];

  return (
    <section className="crm">
      <header className="crm-cabecera">
        <div>
          <p className="crm-kicker">Relaciones con clientes · CRM</p>
          <h1>{id ? datos?.nombre || "Ficha CRM" : titulo}</h1>
          <p className="crm-ayuda">
            {contactos
              ? "Personas interesadas, empresa y campaña de origen, con su historial de seguimiento."
              : "Una ficha por empresa: datos, campañas, contactos y seguimiento comercial."}
          </p>
        </div>
        <div className="crm-acciones">
          {id ? (
            <Link className="crm-boton" to={`/${rutaFicha}`}>
              <ArrowLeft size={16} /> Volver
            </Link>
          ) : (
            <button
              className="crm-boton"
              onClick={() => setRevision((r) => r + 1)}
              disabled={cargando}
            >
              <RefreshCw size={16} /> Actualizar
            </button>
          )}
          {!id && contactos && (
            <button
              className="crm-boton"
              onClick={exportar}
              disabled={ocupado || !capacidades?.contactosLeer}
            >
              <Download size={16} /> Exportar CSV
            </button>
          )}
          {!id && contactos && gestionar && (
            <>
              <input
                ref={archivoCsv}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={leerArchivo}
              />
              <button
                className="crm-boton"
                disabled={ocupado}
                onClick={() => archivoCsv.current.click()}
              >
                <FileUp size={16} /> Importar CSV
              </button>
            </>
          )}
          {gestionar && (!id || datos) && (
            <button
              className="crm-boton crm-primario"
              disabled={ocupado}
              onClick={() => abrir(id ? "editar" : "crear")}
            >
              <Plus size={16} />
              {id
                ? "Editar ficha"
                : contactos
                  ? "Nuevo contacto"
                  : "Nueva empresa"}
            </button>
          )}
        </div>
      </header>
      {mensaje && (
        <p role="status" className="crm-exito">
          {mensaje}
        </p>
      )}
      {error && (
        <div role="alert" className="crm-error">
          {error}{" "}
          <button
            className="crm-boton"
            onClick={() => setRevision((r) => r + 1)}
          >
            Reintentar
          </button>
        </div>
      )}
      {!id && (
        <form
          noValidate
          className="crm-filtros"
          onSubmit={(e) => {
            e.preventDefault();
            setConsulta(busqueda);
            filtrar("pagina", "0");
          }}
        >
          <label className="crm-campo">
            Buscar {titulo.toLowerCase()}
            <span className="crm-busqueda">
              <input
                value={busqueda}
                maxLength={160}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={
                  contactos ? "Nombre, correo o teléfono" : "Nombre de empresa"
                }
              />
              {busqueda && (
                <button
                  type="button"
                  className="crm-boton"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setBusqueda("");
                    setConsulta("");
                    filtrar("pagina", "0");
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <button className="crm-boton" aria-label="Buscar">
                <Search size={16} />
              </button>
            </span>
          </label>
          {(
            <label className="crm-campo">
              Estado
              <select
                aria-label="Estado"
                value={estado}
                onChange={(e) => filtrar("estado", e.target.value)}
              >
                <option value="">Todos los estados</option>
                {(contactos ? estados : ["ACTIVO", "INACTIVO"]).map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
          )}
        </form>
      )}
      <div className="crm-panel" aria-busy={cargando}>
        {cargando ? (
          <p role="status" className="crm-vacio">
            <LoaderCircle size={22} className="inline" /> Cargando{" "}
            {titulo.toLowerCase()}…
          </p>
        ) : !datos ? (
          <p className="crm-vacio">
            No se pudieron obtener los datos. Reintenta la consulta.
          </p>
        ) : !id ? (
          <>
            {!datos.filas.length ? (
              <div className="crm-vacio">
                {contactos ? (
                  <UsersRound className="mx-auto mb-3" />
                ) : (
                  <Building2 className="mx-auto mb-3" />
                )}
                <p>
                  {consulta || estado
                    ? "No hay coincidencias con estos filtros."
                    : `Todavía no hay ${titulo.toLowerCase()} registrados.`}
                </p>
              </div>
            ) : (
              <div className="crm-scroll">
                <table>
                  <caption className="sr-only">
                    Listado de {titulo.toLowerCase()}
                  </caption>
                  <thead>
                    <tr>
                      {(contactos
                        ? [
                            "Contacto",
                            "Estado",
                            "Empresa",
                            "Responsable",
                            "Origen",
                            "Ficha",
                          ]
                        : ["Empresa", "Sector", "Correo", "Teléfono", "Estado", "Ficha"]
                      ).map((c) => (
                        <th scope="col" key={c}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.filas.map((f) => (
                      <tr key={f.id}>
                        <td>
                          {f.nombre}
                          {contactos && (
                            <small className="block font-normal text-slate-500">
                              {f.correo || f.telefono}
                            </small>
                          )}
                        </td>
                        {contactos ? (
                          <>
                            <td>
                              <span className="crm-estado">{f.estado}</span>
                            </td>
                            <td>{f.cuenta || "Sin empresa"}</td>
                            <td>{f.responsable}</td>
                            <td>{f.origen}</td>
                          </>
                        ) : (
                          <>
                            <td>{f.sector || "—"}</td>
                            <td>{f.correo || "—"}</td>
                            <td>{f.telefono || "—"}</td>
                            <td>{f.estado}</td>
                          </>
                        )}
                        <td>
                          <Link className="crm-link" to={`/${rutaFicha}/${f.id}`}>
                            Ver ficha
                            <span className="sr-only"> de {f.nombre}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="crm-paginacion">
              <span>
                {datos.total} registros · Página {pagina + 1} de{" "}
                {Math.max(1, Math.ceil(datos.total / 20))}
              </span>
              <div className="crm-acciones">
                <button
                  className="crm-boton"
                  disabled={!pagina}
                  onClick={() => filtrar("pagina", String(pagina - 1))}
                >
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button
                  className="crm-boton"
                  disabled={(pagina + 1) * 20 >= datos.total}
                  onClick={() => filtrar("pagina", String(pagina + 1))}
                >
                  Siguiente <ArrowRight size={16} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Secciones de la ficha"
              className="crm-tabs"
            >
              {tabs.map((t) => (
                <button
                  key={t}
                  id={`crm-tab-${t.replaceAll(" ", "-")}`}
                  role="tab"
                  aria-selected={tab === t}
                  aria-controls="crm-tabpanel"
                  tabIndex={tab === t ? 0 : -1}
                  className="crm-boton"
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => {
                    const paso =
                      e.key === "ArrowRight"
                        ? 1
                        : e.key === "ArrowLeft"
                          ? -1
                          : 0;
                    if (paso) {
                      e.preventDefault();
                      const siguiente =
                        tabs[
                          (tabs.indexOf(tab) + paso + tabs.length) % tabs.length
                        ];
                      setTab(siguiente);
                      document
                        .getElementById(
                          `crm-tab-${siguiente.replaceAll(" ", "-")}`,
                        )
                        ?.focus();
                    }
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="crm-tabpanel"
              aria-labelledby={`crm-tab-${tab.replaceAll(" ", "-")}`}
              tabIndex={0}
            >
              {tab === "Resumen" && (
                <>
                  <dl className="crm-resumen">
                    {(contactos
                      ? [
                          ["Correo", datos.correo],
                          ["Teléfono", datos.telefono],
                          ["Estado", datos.estado],
                          ["Origen", datos.origen],
                          ["Empresa", datos.cuenta],
                          ["Campaña de origen", datos.campana],
                          ["Responsable", datos.responsable],
                          ["Etiquetas", datos.etiquetas],
                        ]
                      : [
                          ["Correo", datos.correo],
                          ["Teléfono", datos.telefono],
                          ["Estado", datos.estado],
                          ["Sector", datos.sector],
                          ["Sitio web", datos.sitioWeb],
                        ]
                    )
                      .concat([
                        ["Creado", fecha(datos.createdAt)],
                        ["Actualizado", fecha(datos.updatedAt)],
                      ])
                      .map(([etiqueta, valor]) => (
                        <div key={etiqueta}>
                          <dt>{etiqueta}</dt>
                          <dd>{valor || "—"}</dd>
                        </div>
                      ))}
                  </dl>
                  {contactos && (
                    <PuntajeContacto
                      key={`${id}-${revision}-${revisionRelaciones}`}
                      id={id}
                    />
                  )}
                  {contactos && (
                    <RelacionesContacto
                      id={id}
                      gestionar={gestionar}
                      revision={revision}
                      actualizado={(rel) => {
                        setDatos((prev) => ({
                          ...prev,
                          etiquetas: rel.etiquetas
                            .map((e) => e.nombre)
                            .join(","),
                          updatedAt: rel.updatedAt || prev.updatedAt,
                        }));
                        setRevisionRelaciones((n) => n + 1);
                      }}
                    />
                  )}
                  {contactos && <ValoresPersonalizados id={id} gestionar={gestionar}/>}
                  {contactos && <MensajesWhatsApp key={id} id={id}/>}
                  {gestionar && (
                    <button
                      className="crm-boton crm-peligro mt-8"
                      onClick={() => abrir("eliminar")}
                    >
                      <Trash2 size={16} /> {contactos ? "Eliminar contacto" : "Archivar empresa"}
                    </button>
                  )}
                </>
              )}
              {!contactos && ["Campañas", "Oportunidades", "Actividades"].includes(tab) && <section aria-label={tab}>
                <h2>{tab} de la empresa</h2>
                {(datos[tab === "Campañas" ? "campanas" : tab.toLowerCase()] || []).length ? <div className="crm-scroll"><table><thead><tr><th scope="col">Nombre</th><th scope="col">Estado</th>{tab === "Oportunidades" && <th scope="col">Valor</th>}{tab === "Actividades" && <th scope="col">Fecha</th>}</tr></thead><tbody>{datos[tab === "Campañas" ? "campanas" : tab.toLowerCase()].map((f) => <tr key={f.id}><td>{f.nombre}</td><td>{f.etapa || f.estado}</td>{tab === "Oportunidades" && <td>{Number(f.valor).toLocaleString("es-PE", { maximumFractionDigits: 2 })} {f.moneda}</td>}{tab === "Actividades" && <td>{fecha(f.fecha)}</td>}</tr>)}</tbody></table></div> : <p className="crm-vacio">No hay {tab.toLowerCase()} registradas para esta empresa.</p>}
              </section>}
              {tab === "Contactos" &&
                (datos.contactos.length ? (
                  datos.contactos.map((c) => (
                    <p key={c.id} className="crm-evento">
                      <Link className="crm-link" to={`/contactos/${c.id}`}>
                        {c.nombre}
                      </Link>{" "}
                      · {c.estado}
                    </p>
                  ))
                ) : (
                  <p className="crm-vacio">
                    Esta empresa aún no tiene contactos vinculados.
                  </p>
                ))}
              {tab === "Línea de tiempo" &&
                (datos.eventos.length ? (
                  datos.eventos.map((e) => (
                    <article className="crm-evento" key={e.id}>
                      <p>{e.detalle}</p>
                      <small>
                        {e.autor} · {fecha(e.createdAt)}
                      </small>
                    </article>
                  ))
                ) : (
                  <p className="crm-vacio">Todavía no hay eventos.</p>
                ))}
              {tab === "Notas" && (
                <>
                  {gestionar && (
                    <form
                      noValidate
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (nota.trim())
                          operacion(`/${recurso}/${id}/notas`, "POST", {
                            texto: nota,
                          });
                      }}
                    >
                      <label className="crm-campo">
                        Nueva nota
                        <textarea
                          className="resize-none"
                          maxLength={4000}
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                        />
                      </label>
                      <button
                        className="crm-boton mt-3"
                        disabled={ocupado || !nota.trim()}
                      >
                        Añadir nota
                      </button>
                    </form>
                  )}
                  <div className="mt-6">
                    {datos.notas.length ? (
                      datos.notas.map((n) => (
                        <article className="crm-evento" key={n.id}>
                          {n.texto}
                          <small>
                            {n.autor} · {fecha(n.createdAt)}
                          </small>
                        </article>
                      ))
                    ) : (
                      <p className="crm-vacio">Todavía no hay notas.</p>
                    )}
                  </div>
                </>
              )}
              {tab === "Consentimiento" && (
                <>
                  {gestionar && (
                    <button
                      className="crm-boton mb-5"
                      onClick={() => abrir("consentimiento")}
                    >
                      <Plus size={16} /> Registrar consentimiento
                    </button>
                  )}
                  {datos.consentimientos.length ? (
                    datos.consentimientos.map((c) => (
                      <article key={c.id} className="crm-evento">
                        <p>
                          {c.tipo} · {c.canal}
                        </p>
                        <small>
                          Otorgado: {fecha(c.fecha)} ·{" "}
                          {c.revocadoEn
                            ? `Revocado: ${fecha(c.revocadoEn)}`
                            : "Vigente"}
                        </small>
                        {gestionar && !c.revocadoEn && (
                          <button
                            className="crm-boton mt-2"
                            disabled={ocupado}
                            onClick={() =>
                              operacion(
                                `/contactos/${id}/consentimientos/${c.id}`,
                                "DELETE",
                              )
                            }
                          >
                            Revocar consentimiento
                          </button>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="crm-vacio">
                      No hay consentimiento registrado. Crear un contacto no
                      autoriza envíos.
                    </p>
                  )}
                </>
              )}
              {tab === "Archivos" && (
                <>
                  {gestionar && (
                    <label className="crm-campo">
                      Adjuntar archivo (máximo 5 MB)
                      <input type="file" disabled={ocupado} onChange={subir} />
                    </label>
                  )}
                  {datos.archivos.length ? (
                    datos.archivos.map((a) => (
                      <div key={a.id} className="crm-acciones mt-4">
                        <span className="text-sm">
                          {a.nombre} · {Math.ceil(a.tamano / 1024)} KB
                        </span>
                        <button
                          className="crm-boton"
                          disabled={ocupado}
                          onClick={async () => {
                            setOcupado(true);
                            try {
                              descargarCrm(
                                await solicitarCrm(
                                  `/${recurso}/${id}/archivos/${a.id}`,
                                  token,
                                  { archivo: true },
                                ),
                                a.nombre,
                              );
                            } catch (e) {
                              setError(e.message);
                            } finally {
                              setOcupado(false);
                            }
                          }}
                        >
                          <Download size={16} /> Descargar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="crm-vacio">
                      Todavía no hay archivos adjuntos.
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      {modal && (
        <DialogoCrm
          titulo={
            abandonar
              ? "¿Descartar los cambios?"
              : modal === "crear"
                ? `Crear ${contactos ? "contacto" : "empresa"}`
                : modal === "editar"
                  ? "Editar ficha"
                  : modal === "importar"
                    ? "Revisar importación"
                    : modal === "eliminar"
                      ? (contactos ? "Eliminar registro" : "Archivar empresa")
                      : "Registrar consentimiento"
          }
          cerrar={cerrar}
          ocupado={ocupado}
        >
          {errorModal && (
            <p id="crm-error-formulario" className="crm-error" role="alert">
              {errorModal}
            </p>
          )}
          {abandonar ? (
            <>
              <p>Los cambios del formulario todavía no se han guardado.</p>
              <div className="crm-acciones mt-5">
                <button
                  className="crm-boton"
                  onClick={() => setAbandonar(false)}
                >
                  Seguir editando
                </button>
                <button
                  className="crm-boton crm-peligro"
                  onClick={() => {
                    setSucio(false);
                    setModal(null);
                  }}
                >
                  Descartar cambios
                </button>
              </div>
            </>
          ) : modal === "crear" || modal === "editar" ? (
            <form
              noValidate
              className="crm-formulario"
              onSubmit={guardar}
              onChange={(evento) => {
                evento.target.removeAttribute("aria-invalid");
                evento.target.removeAttribute("aria-describedby");
              }}
            >
              {(contactos ? camposContacto : camposCuenta).map(
                ([campo, etiqueta, tipo, required]) => (
                  <label className="crm-campo" key={campo}>
                    {etiqueta}
                    {Array.isArray(tipo) || opciones[tipo] ? (
                      <select
                        name={campo}
                        aria-label={etiqueta}
                        required={required}
                        value={borrador[campo] ?? ""}
                        onChange={(e) => cambiar(campo, e.target.value)}
                      >
                        <option value="">
                          {required ? "Selecciona" : "Sin asignar"}
                        </option>
                        {(Array.isArray(tipo) ? tipo : opciones[tipo]).map(
                          (o) => (
                            <option key={o.id || o} value={o.id || o}>
                              {o.nombre || o}
                            </option>
                          ),
                        )}
                      </select>
                    ) : [
                        "cuentas",
                        "campanas",
                        "responsables",
                        "clientes",
                      ].includes(tipo) ? (
                      <span>
                        Opciones no disponibles. Cierra y reintenta la consulta.
                      </span>
                    ) : (
                      <input
                        name={campo}
                        required={required}
                        type={tipo}
                        value={borrador[campo] ?? ""}
                        maxLength={
                          campo === "etiquetas"
                            ? 500
                            : campo === "telefono"
                              ? (contactos ? 30 : 20)
                              : campo === "correo"
                                ? (contactos ? 180 : 150)
                                : campo === "sitioWeb"
                                  ? 300
                                  : campo === "nombre"
                                    ? (contactos ? 160 : 150)
                                    : 120
                        }
                        onChange={(e) => cambiar(campo, e.target.value)}
                      />
                    )}
                  </label>
                ),
              )}
              <p className="crm-ayuda crm-ancho">
                {contactos
                  ? "Se evita duplicar correos y teléfonos. El consentimiento se registra por separado en la ficha."
                  : "La empresa queda disponible al crear campañas. Archivarla conserva campañas, contactos e historial."}
              </p>
              <div className="crm-acciones crm-ancho">
                <button
                  type="button"
                  className="crm-boton"
                  disabled={ocupado}
                  onClick={cerrar}
                >
                  Cancelar
                </button>
                <button
                  className="crm-boton crm-primario"
                  disabled={ocupado || !opciones.responsables}
                >
                  {ocupado ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          ) : modal === "eliminar" ? (
            <>
              <p>
                {contactos ? <>Se eliminarán {datos?.nombre}, sus notas, archivos, historial y consentimientos. Esta acción no se puede deshacer.</> : <>Se archivará {datos?.nombre}. Sus campañas, contactos, oportunidades e historial se conservan. Puedes reactivarla desde Editar ficha.</>}
              </p>
              <div className="crm-acciones mt-5">
                <button
                  className="crm-boton"
                  disabled={ocupado}
                  onClick={cerrar}
                >
                  Cancelar
                </button>
                <button
                  className="crm-boton crm-peligro"
                  disabled={ocupado}
                  onClick={async () => {
                    if (await operacion(`/${recurso}/${id}${contactos ? "" : "/archivar"}`, contactos ? "DELETE" : "POST"))
                      navegar(`/${rutaFicha}`, { replace: true });
                  }}
                >
                  {contactos ? "Eliminar definitivamente" : "Confirmar archivo"}
                </button>
              </div>
            </>
          ) : modal === "importar" ? (
            <>
              <p className="crm-ayuda">
                {importacion.length} filas. Los duplicados por correo o teléfono
                se omiten; cualquier otra fila inválida cancela el lote
                completo. No se importan consentimientos.
              </p>
              <div className="crm-scroll mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importacion.slice(0, 10).map((f, i) => (
                      <tr key={i}>
                        <td>{f.nombre}</td>
                        <td>{f.correo || f.telefono}</td>
                        <td>{f.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="crm-ayuda">
                Vista previa de las primeras 10 filas.
              </p>
              <div className="crm-acciones mt-5">
                <button
                  className="crm-boton"
                  disabled={ocupado}
                  onClick={cerrar}
                >
                  Cancelar
                </button>
                <button
                  className="crm-boton crm-primario"
                  disabled={ocupado}
                  onClick={importar}
                >
                  {ocupado ? "Importando…" : "Confirmar importación"}
                </button>
              </div>
            </>
          ) : (
            <form
              noValidate
              className="crm-formulario"
              onChange={() => setSucio(true)}
              onSubmit={(e) => {
                e.preventDefault();
                if (!validarFormulario(e.currentTarget)) return;
                const form = new FormData(e.currentTarget);
                operacion(`/contactos/${id}/consentimientos`, "POST", {
                  tipo: form.get("tipo"),
                  canal: form.get("canal"),
                  fecha: new Date(form.get("fecha")).toISOString(),
                });
              }}
            >
              <label className="crm-campo">
                Tipo
                <input
                  name="tipo"
                  required
                  maxLength={60}
                  placeholder="Ej. comunicaciones comerciales"
                />
              </label>
              <label className="crm-campo">
                Canal
                <input
                  name="canal"
                  required
                  maxLength={60}
                  placeholder="Ej. correo"
                />
              </label>
              <label className="crm-campo crm-ancho">
                Fecha y hora en tu zona local
                <input name="fecha" type="datetime-local" required />
              </label>
              <p className="crm-ayuda crm-ancho">
                Registra únicamente una autorización que el contacto haya
                otorgado.
              </p>
              <button
                disabled={ocupado}
                className="crm-boton crm-primario crm-ancho"
              >
                Guardar consentimiento
              </button>
            </form>
          )}
        </DialogoCrm>
      )}
      {!id && contactos && gestionar && (
        <button
          className="crm-boton mt-4"
          onClick={() =>
            descargarCrm(
              new Blob(
                [
                  "\uFEFFnombre,correo,telefono,estado,origen,etiquetas,cuentaId,campanaId,responsableId\r\nEjemplo,ejemplo@empresa.com,,NUEVO,WEB,,,,\r\n",
                ],
                { type: "text/csv" },
              ),
              "plantilla-contactos.csv",
            )
          }
        >
          <Download size={16} /> Plantilla CSV
        </button>
      )}
    </section>
  );
}
