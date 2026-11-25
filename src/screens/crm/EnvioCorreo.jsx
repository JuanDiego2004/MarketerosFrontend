import { useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";

const tipos = [
  ["CONTACTO", "Un contacto"],
  ["EMPRESA", "Contactos de una empresa"],
  ["SEGMENTO", "Un segmento de CRM"],
  ["GENERAL", "Todos con consentimiento de email"],
];

export default function EnvioCorreo({ gestionar, configurado }) {
  const { token } = useAuth();
  const [opciones, setOpciones] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [tipo, setTipo] = useState("CONTACTO");
  const [destino, setDestino] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      solicitarCrm("/operaciones/integraciones/destinatarios-email", token, { signal: c.signal }),
      solicitarCrm("/operaciones/integraciones/email/historial", token, { signal: c.signal }),
    ])
      .then(([d,h]) => { if (!c.signal.aborted) { setOpciones(d); setHistorial(h); } })
      .catch(e => { if (!c.signal.aborted) setError(e.message); });
    return () => c.abort();
  }, [token]);

  const lista = tipo === "CONTACTO" ? opciones?.contactos : tipo === "EMPRESA" ? opciones?.empresas : opciones?.segmentos;
  const nombreDestino = tipo === "GENERAL" ? "todos los contactos con consentimiento vigente" : lista?.find(x => String(x.id) === destino)?.nombre || "destinatario seleccionado";
  function cambiarTipo(valor) { setTipo(valor); setDestino(""); setError(""); setResultado(null); }
  async function enviar() {
    if (ocupado) return;
    setOcupado(true); setError(""); setResultado(null);
    try {
      const body = { tipoDestinatario: tipo, asunto, mensaje };
      if (tipo === "CONTACTO") body.contactoId = Number(destino);
      if (tipo === "EMPRESA") body.empresaId = Number(destino);
      if (tipo === "SEGMENTO") body.segmentoId = Number(destino);
      const resultadoEnvio = await solicitarCrm("/operaciones/integraciones/email/enviar", token, { method: "POST", body });
      setResultado(resultadoEnvio);
      solicitarCrm("/operaciones/integraciones/email/historial", token).then(setHistorial).catch(() => {});
      setConfirmar(false);
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  return <section className="crm-panel" aria-busy={ocupado}>
    <h2 className="crm-acciones"><Mail size={18}/> Enviar correo</h2>
    <p className="crm-ayuda">Elige a quién enviar desde el CRM. Las audiencias publicitarias se usan para anuncios; los segmentos de aquí agrupan contactos.</p>
    {!gestionar && <p>Tu rol permite consultar los canales, pero no enviar correos.</p>}
    {!configurado && <p className="crm-ayuda">Correo Brevo pendiente de configuración.</p>}
    {gestionar && <div className="crm-formulario">
      <label className="crm-campo">Destinatarios<select value={tipo} disabled={ocupado} onChange={e => cambiarTipo(e.target.value)}>{tipos.map(([id,nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
      {tipo !== "GENERAL" && <label className="crm-campo">{tipo === "CONTACTO" ? "Contacto" : tipo === "EMPRESA" ? "Empresa" : "Segmento"}<select value={destino} disabled={ocupado || !opciones} onChange={e => setDestino(e.target.value)}><option value="">Seleccionar…</option>{(lista || []).map(x => <option key={x.id} value={x.id}>{x.nombre}{tipo === "CONTACTO" && x.empresa ? ` · ${x.empresa}` : ""}</option>)}</select></label>}
      <label className="crm-campo crm-ancho">Asunto<input maxLength={160} value={asunto} disabled={ocupado} onChange={e => setAsunto(e.target.value)} /></label>
      <label className="crm-campo crm-ancho">Mensaje<textarea rows={6} maxLength={10000} value={mensaje} disabled={ocupado} onChange={e => setMensaje(e.target.value)} placeholder="Puedes personalizar el mensaje con {{nombre}}." /></label>
      <p className="crm-ayuda crm-ancho">Solo se entrega a contactos con consentimiento vigente para email y sin baja. El envío admite hasta 500 contactos por vez.</p>
      {error && <p className="crm-error crm-ancho" role="alert">{error}</p>}
      {resultado && <p className="crm-exito crm-ancho" role="status">Envío procesado: {resultado.enviados} enviados · {resultado.omitidos} omitidos por consentimiento o baja · {resultado.errores} errores.</p>}
      <div className="crm-acciones crm-ancho"><button type="button" className="crm-boton crm-primario" disabled={!configurado || !opciones || ocupado || !asunto.trim() || !mensaje.trim() || (tipo !== "GENERAL" && !destino)} onClick={() => setConfirmar(true)}><Send size={16}/>Enviar correo</button></div>
    </div>}
    {gestionar && <><h3>Historial de envíos</h3>{historial.length ? historial.map((h,i) => { const m=h.accion.match(/^ENVIO_EMAIL_(CONTACTO|EMPRESA|SEGMENTO|GENERAL)_OK(\d+)_OM(\d+)_ER(\d+)$/); return <article className="crm-tarjeta" key={`${h.created_at}-${i}`}><strong>{m ? tipos.find(([id])=>id===m[1])?.[1] : "Envío de correo"}</strong><p>{new Date(h.created_at).toLocaleString("es-PE",{timeZone:"America/Lima"})} · {h.responsable}</p><p>{m ? `${m[2]} enviados · ${m[3]} omitidos · ${m[4]} errores` : "Envío registrado"}</p></article>; }) : <p className="crm-ayuda">Aún no se han registrado envíos desde este módulo.</p>}</>}
    {confirmar && <DialogoCrm titulo="Confirmar envío de correo" cerrar={() => setConfirmar(false)} ocupado={ocupado}><p>Vas a enviar «{asunto}» a {nombreDestino}.</p><p>Solo recibirán el correo los contactos con consentimiento vigente. Esta acción no se puede deshacer.</p>{error && <p className="crm-error" role="alert">{error}</p>}<div className="crm-acciones"><button className="crm-boton" disabled={ocupado} onClick={() => setConfirmar(false)}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado} onClick={enviar}>{ocupado ? "Enviando…" : "Confirmar y enviar"}</button></div></DialogoCrm>}
  </section>;
}
