import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, RefreshCw, Link2 } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import { estadoWhatsApp, tipoWhatsApp } from "../../utils/estadosWhatsApp";
import DialogoCrm from "../../componentes/crm/DialogoCrm";

const fecha = v => v ? new Date(v).toLocaleString("es-PE", { timeZone: "America/Lima" }) : "Sin eventos";

export default function MensajesWhatsApp({ id, contactos = [], gestionar = false }) {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null), [estado, setEstado] = useState(null), [pagina, setPagina] = useState(0), [pendientes, setPendientes] = useState(true), [revision, setRevision] = useState(0);
  const [error, setError] = useState(""), [mensaje, setMensaje] = useState(""), [cargando, setCargando] = useState(true), [ocupado, setOcupado] = useState(false), [vinculo, setVinculo] = useState(null), [contacto, setContacto] = useState("");
  const ruta = id ? `/contactos/${id}/whatsapp?pagina=${pagina}` : `/operaciones/whatsapp/mensajes?pagina=${pagina}&pendientes=${pendientes}`;
  useEffect(() => {
    const c = new AbortController();
    Promise.all([solicitarCrm(ruta, token, { signal: c.signal }), id ? Promise.resolve(null) : solicitarCrm("/operaciones/whatsapp/estado", token, { signal: c.signal })])
      .then(([d, e]) => { if (!c.signal.aborted) { setDatos(d); setEstado(e); setError(""); } })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setCargando(false); });
    return () => c.abort();
  }, [ruta, token, id, revision]);
  async function vincular(e) {
    e.preventDefault(); if (ocupado) return; setOcupado(true); setError("");
    try {
      await solicitarCrm(`/operaciones/whatsapp/mensajes/${vinculo.id}/contacto`, token, { method: "PUT", body: { contactoId: contacto ? Number(contacto) : null, version: vinculo.version } });
      setVinculo(null); setMensaje("Vínculo actualizado. No se modificó el consentimiento de marketing."); setCargando(true); setRevision(n => n + 1);
    } catch (e) { setError(e.message); } finally { setOcupado(false); }
  }
  function actualizar() { setCargando(true); setRevision(n => n + 1); }
  return <section className="crm-panel" aria-label={id ? "WhatsApp del contacto" : "Recepción de WhatsApp"} aria-busy={cargando}>
    <header className="crm-cabecera"><div><h2 className="crm-acciones"><MessageCircle size={18} />{id ? "Mensajes recibidos por WhatsApp" : "Recepción y entrega de WhatsApp"}</h2><p className="crm-ayuda">Las respuestas se asocian por teléfono internacional cuando el contacto existe. Recibir un mensaje no autoriza campañas de marketing.</p></div><button className="crm-boton" disabled={cargando || ocupado} onClick={actualizar}><RefreshCw size={16} />Actualizar WhatsApp</button></header>
    {!id && estado && <><p>Webhook: <strong>{estado.configurado ? "Credenciales configuradas" : "Pendiente de configurar"}</strong> · Último evento: {fecha(estado.ultimoEvento)}</p><p className="crm-ayuda">Configura CRM_WHATSAPP_APP_SECRET y CRM_WHATSAPP_VERIFY_TOKEN en el backend y suscribe el campo messages en Meta. El estado de configuración no confirma una suscripción activa.</p>{estado.url && <label className="crm-campo">URL de devolución del webhook<input readOnly value={estado.url} onFocus={e => e.target.select()} /></label>}<h3>Estado actual de envíos de los últimos 30 días</h3>{estado.entregas.length ? <div className="crm-acciones">{estado.entregas.map(e => <p className="crm-tarjeta" key={e.estado}>{estadoWhatsApp(e.estado)}: <strong>{e.cantidad}</strong></p>)}</div> : <p className="crm-ayuda">Todavía no hay envíos de WhatsApp registrados en este período.</p>}<p className="crm-ayuda">Cada envío cuenta una vez según su confirmación más avanzada. Sin confirmación no significa entregado ni fallido. Los envíos anteriores al registro del número remitente pueden quedar sin seguimiento.</p><label className="crm-check"><input type="checkbox" checked={pendientes} disabled={ocupado} onChange={e => { setPendientes(e.target.checked); setPagina(0); setCargando(true); }} />Solo mensajes sin contacto</label></>}
    {error && !vinculo && <p className="crm-error" role="alert">{error}<button className="crm-boton" disabled={cargando} onClick={actualizar}>Reintentar WhatsApp</button></p>}{mensaje && <p className="crm-exito" role="status">{mensaje}</p>}{cargando && <p role="status">Cargando mensajes…</p>}
    {datos?.filas.map(m => <article className="crm-tarjeta" key={m.id}><header className="crm-cabecera"><div><strong>{m.contacto || "Sin contacto vinculado"}</strong><p className="crm-ayuda">{m.telefono || m.remitente} · {fecha(m.fecha)} · Tipo: {tipoWhatsApp(m.tipo)}</p></div><div className="crm-acciones">{!id && m.contacto_id && <Link className="crm-link" to={`/contactos/${m.contacto_id}`}>Ver contacto</Link>}{!id && gestionar && <button className="crm-boton" disabled={ocupado || cargando} onClick={() => { setVinculo(m); setContacto(m.contacto_id ? String(m.contacto_id) : ""); setError(""); }}><Link2 size={15} />Vincular contacto</button>}</div></header>{m.texto ? <p className="crm-mensaje-texto">{m.texto}</p> : <p className="crm-ayuda">Se recibió un mensaje de tipo {tipoWhatsApp(m.tipo)}. Su contenido no se descarga en este CRM.</p>}{m.truncado && <p className="crm-ayuda">Vista de texto limitada a 10000 caracteres.</p>}</article>)}
    {!cargando && datos && !datos.filas.length && <p className="crm-vacio">{id ? "Este contacto aún no tiene mensajes recibidos por WhatsApp." : pendientes ? "No hay mensajes pendientes de vincular." : "Todavía no se recibieron mensajes de WhatsApp."}</p>}
    <div className="crm-paginacion"><span>{datos?.total || 0} {datos?.total === 1 ? "mensaje" : "mensajes"} · página {pagina + 1}</span><div className="crm-acciones"><button className="crm-boton" disabled={cargando || ocupado || !pagina} onClick={() => { setPagina(n => n - 1); setCargando(true); }}>Anteriores WhatsApp</button><button className="crm-boton" disabled={cargando || ocupado || !datos || (pagina + 1) * 20 >= datos.total} onClick={() => { setPagina(n => n + 1); setCargando(true); }}>Siguientes WhatsApp</button></div></div>
    {vinculo && <DialogoCrm titulo="Vincular mensaje a un contacto" ocupado={ocupado} cerrar={() => setVinculo(null)}><form className="crm-formulario" onSubmit={vincular}><p className="crm-ayuda crm-ancho">Confirma la identidad del remitente antes de guardar. Este vínculo afecta solo a este mensaje y aparecerá en la ficha elegida. No cambia su consentimiento.</p><label className="crm-campo crm-ancho">Contacto del mensaje<select value={contacto} onChange={e => setContacto(e.target.value)}><option value="">Sin contacto vinculado</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>{error && <p className="crm-error crm-ancho" role="alert">{error}</p>}<div className="crm-acciones crm-ancho"><button className="crm-boton" type="button" disabled={ocupado} onClick={() => setVinculo(null)}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado} aria-busy={ocupado}>Confirmar vínculo</button></div></form></DialogoCrm>}
  </section>;
}
