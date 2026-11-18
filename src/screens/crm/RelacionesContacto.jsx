import { useEffect, useState } from "react";
import { Tag, Plus, Waypoints, MailX } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";

export default function RelacionesContacto({
  id,
  gestionar,
  revision,
  actualizado,
}) {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null),
    [catalogo, setCatalogo] = useState([]),
    [campanas, setCampanas] = useState([]);
  const [modal, setModal] = useState(null),
    [ids, setIds] = useState([]),
    [origen, setOrigen] = useState({});
  const [nombre, setNombre] = useState(""),
    [color, setColor] = useState("#1D4ED8");
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState(""),
    [mensaje, setMensaje] = useState("");
  const [sucio, setSucio] = useState(false),
    [descartar, setDescartar] = useState(false),
    [intento, setIntento] = useState(0);
  const api = (ruta, args) => solicitarCrm(`/operaciones${ruta}`, token, args);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      solicitarCrm(`/operaciones/contactos/${id}/relaciones`, token, {
        signal: c.signal,
      }),
      solicitarCrm("/operaciones/etiquetas", token, { signal: c.signal }),
      gestionar
        ? solicitarCrm("/contactos/opciones", token, { signal: c.signal })
        : Promise.resolve({ campanas: [] }),
    ])
      .then(([d, etiquetas, opts]) => {
        if (!c.signal.aborted) {
          setDatos(d);
          setCatalogo(etiquetas);
          setCampanas(opts.campanas);
          setError("");
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, token, revision, gestionar, intento]);
  useEffect(() => {
    if (!sucio) return;
    const aviso = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sucio]);
  function abrir(tipo) {
    setModal(tipo);
    setIds(datos.etiquetas.map((e) => Number(e.id)));
    setNombre("");
    setColor("#1D4ED8");
    setOrigen({
      idempotencia: crypto.randomUUID(),
      canal: "WEB",
      campana_id: "",
      fecha: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
    });
    setSucio(false);
    setError("");
    setMensaje("");
  }
  function cerrar() {
    if (sucio) setDescartar(true);
    else setModal(null);
  }
  async function guardar(e) {
    e.preventDefault();
    if (ocupado) return;
    for (const campo of e.currentTarget.elements) {
      campo.removeAttribute("aria-invalid");
      campo.removeAttribute("aria-describedby");
    }
    const invalido = [...e.currentTarget.elements].find(
      (el) => el.willValidate && !el.validity.valid,
    );
    if (invalido) {
      setError("Revisa los campos obligatorios y sus límites.");
      invalido.setAttribute("aria-invalid", "true");
      invalido.setAttribute("aria-describedby", "relaciones-error");
      invalido.focus();
      return;
    }
    setOcupado(true);
    setError("");
    try {
      if (modal === "etiquetas") {
        const seleccionadas = await seleccionarEtiquetaEscrita();
        await api(`/contactos/${id}/etiquetas`, { method: "PUT", body: seleccionadas });
      } else
        await api(`/contactos/${id}/origenes`, {
          method: "POST",
          body: {
            ...origen,
            campana_id: origen.campana_id ? Number(origen.campana_id) : null,
            fecha: origen.fecha
              ? new Date(origen.fecha + "-05:00").toISOString()
              : null,
          },
        });
      const actuales = await api(`/contactos/${id}/relaciones`);
      setDatos(actuales);
      setMensaje(
        modal === "etiquetas"
          ? "Etiquetas actualizadas"
          : "Interacción registrada",
      );
      setSucio(false);
      setModal(null);
      actualizado(actuales);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function seleccionarEtiquetaEscrita() {
    const escrito = nombre.trim();
    if (!escrito) return ids;
    if (escrito.includes(",")) throw new Error("Escribe una sola etiqueta, sin comas.");
    const existente = catalogo.find(
      (etiqueta) => etiqueta.nombre.trim().toLowerCase() === escrito.toLowerCase(),
    );
    const etiqueta = existente || await api("/etiquetas", {
      method: "POST",
      body: { nombre: escrito, color },
    });
    if (!existente) setCatalogo(await api("/etiquetas"));
    const seleccionadas = [...new Set([...ids, Number(etiqueta.id)])];
    setIds(seleccionadas);
    setNombre("");
    setSucio(true);
    return seleccionadas;
  }
  async function crearEtiqueta() {
    if (ocupado) return;
    if (!nombre.trim()) {
      setError("Escribe el nombre de la etiqueta.");
      return;
    }
    setOcupado(true);
    setError("");
    try {
      await seleccionarEtiquetaEscrita();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div>
      {error && !modal && (
        <p className="crm-error" role="alert">
          {error}
          <button
            className="crm-boton"
            onClick={() => setIntento((n) => n + 1)}
          >
            Reintentar
          </button>
        </p>
      )}
      {mensaje && (
        <p className="crm-exito" role="status">
          {mensaje}
        </p>
      )}
      {!datos && !error ? (
        <p role="status">Cargando etiquetas y orígenes…</p>
      ) : (
        datos && (
          <>
            {datos.emailSuprimido && (
              <p className="crm-error">
                <MailX size={16} /> Este contacto solicitó la baja. Los envíos
                de marketing por email están bloqueados.
              </p>
            )}
            {datos.canalesSuprimidos?.map(canal => <p className="crm-error" key={canal}><MailX size={16} />Este contacto solicitó la baja de marketing por {canal === "WHATSAPP" ? "WhatsApp" : "SMS"}. Los envíos de este canal están bloqueados.</p>)}
            <section className="crm-panel">
              <header className="crm-cabecera">
                <div className="crm-acciones">
                  <Tag size={18} />
                  <h2>Etiquetas del contacto</h2>
                </div>
                {gestionar && (
                  <button
                    className="crm-boton"
                    onClick={() => abrir("etiquetas")}
                  >
                    Gestionar etiquetas
                  </button>
                )}
              </header>
              <div className="crm-acciones">
                {datos.etiquetas.length ? (
                  datos.etiquetas.map((e) => (
                    <span className="crm-etiqueta" key={e.id}>
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: e.color }}
                      />
                      {e.nombre}
                    </span>
                  ))
                ) : (
                  <p className="crm-ayuda">Sin etiquetas asignadas.</p>
                )}
              </div>
            </section>
            <section className="crm-panel">
              <header className="crm-cabecera">
                <div>
                  <div className="crm-acciones">
                    <Waypoints size={18} />
                    <h2>Orígenes e interacciones</h2>
                  </div>
                  <p className="crm-ayuda">
                    Últimas 200 interacciones. Las posteriores al cierre no
                    participan en la atribución de esa venta.
                  </p>
                </div>
                {gestionar && (
                  <button className="crm-boton" onClick={() => abrir("origen")}>
                    <Plus size={16} />
                    Registrar interacción
                  </button>
                )}
              </header>
              {datos.origenes.length ? (
                <div className="crm-scroll">
                  <table>
                    <thead>
                      <tr>
                        {["Fecha (Lima)", "Campaña", "Canal", "UTM"].map(
                          (t) => (
                            <th key={t} scope="col">
                              {t}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {datos.origenes.map((o) => (
                        <tr key={o.id}>
                          <td>
                            {new Date(o.created_at).toLocaleString("es-PE", {
                              timeZone: "America/Lima",
                            })}
                          </td>
                          <td>{o.campana || "Sin campaña"}</td>
                          <td>{o.canal || "—"}</td>
                          <td>
                            {[o.utm_source, o.utm_medium, o.utm_campaign]
                              .filter(Boolean)
                              .join(" / ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="crm-vacio">
                  Aún no hay interacciones registradas.
                </p>
              )}
            </section>
          </>
        )
      )}
      {modal && !descartar && (
        <DialogoCrm
          titulo={
            modal === "etiquetas"
              ? "Gestionar etiquetas"
              : "Registrar interacción"
          }
          cerrar={cerrar}
          ocupado={ocupado}
        >
          <form noValidate onSubmit={guardar} onChange={() => setSucio(true)}>
            {modal === "etiquetas" ? (
              <>
                <fieldset disabled={ocupado}>
                  <legend>Seleccionar etiquetas</legend>
                  <div className="crm-selector-etiquetas">
                    {catalogo.map((e) => (
                      <label className="crm-etiqueta" key={e.id}>
                        <input
                          type="checkbox"
                          checked={ids.includes(Number(e.id))}
                          onChange={(ev) =>
                            setIds((prev) =>
                              ev.target.checked
                                ? [...prev, Number(e.id)]
                                : prev.filter((x) => x !== Number(e.id)),
                            )
                          }
                        />
                        {e.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset disabled={ocupado} className="crm-panel">
                  <legend>Crear etiqueta en el catálogo</legend>
                  <label className="crm-campo">
                    Nombre
                    <input
                      maxLength={120}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </label>
                  <label className="crm-campo">
                    Color
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="crm-boton"
                    onClick={crearEtiqueta}
                  >
                    <Plus size={16} />
                    Crear y seleccionar
                  </button>
                  <p className="crm-ayuda">
                    Guardar asigna al contacto las etiquetas seleccionadas y la
                    que escribas en Nombre. Crear y seleccionar permite añadir
                    varias antes de guardar.
                  </p>
                </fieldset>
              </>
            ) : (
              <div className="crm-formulario">
                <label className="crm-campo">
                  Campaña
                  <select
                    value={origen.campana_id}
                    onChange={(e) =>
                      setOrigen({ ...origen, campana_id: e.target.value })
                    }
                  >
                    <option value="">Sin campaña</option>
                    {campanas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="crm-campo">
                  Canal *
                  <input
                    maxLength={120}
                    required
                    value={origen.canal}
                    onChange={(e) =>
                      setOrigen({ ...origen, canal: e.target.value })
                    }
                  />
                </label>
                <label className="crm-campo">
                  Fecha y hora (Lima; vacío = ahora)
                  <input
                    type="datetime-local"
                    value={origen.fecha}
                    onChange={(e) =>
                      setOrigen({ ...origen, fecha: e.target.value })
                    }
                  />
                </label>
                {["utm_source", "utm_medium", "utm_campaign"].map((k) => (
                  <label key={k} className="crm-campo">
                    {k}
                    <input
                      maxLength={120}
                      value={origen[k]}
                      onChange={(e) =>
                        setOrigen({ ...origen, [k]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {error && (
              <p className="crm-error" id="relaciones-error" role="alert">
                {error}
              </p>
            )}
            <div className="crm-acciones">
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
          <p>Se perderán los cambios pendientes de esta ficha.</p>
          <div className="crm-acciones">
            <button className="crm-boton" onClick={() => setDescartar(false)}>
              Seguir editando
            </button>
            <button
              className="crm-boton crm-peligro"
              onClick={() => {
                setDescartar(false);
                setModal(null);
                setSucio(false);
              }}
            >
              Descartar cambios
            </button>
          </div>
        </DialogoCrm>
      )}
    </div>
  );
}
