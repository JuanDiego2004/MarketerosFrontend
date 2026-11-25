import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";

const tipos = [
  ["CONTACTO", "Un contacto"],
  ["EMPRESA", "Contactos de una empresa"],
  ["SEGMENTO", "Un segmento de CRM"],
  ["GENERAL", "Todos con consentimiento de WhatsApp"],
];

export default function EnvioWhatsApp({ gestionar, configurado }) {
  const { token } = useAuth();
  const [opciones, setOpciones] = useState(null), [historial, setHistorial] = useState([]);
  const [tipo, setTipo] = useState("CONTACTO"), [destino, setDestino] = useState("");
  const [plantilla, setPlantilla] = useState(""), [idioma, setIdioma] = useState("es_PE"), [parametros, setParametros] = useState("{{nombre}}\n{{baja}}");
  const [error, setError] = useState(""), [resultado, setResultado] = useState(null), [confirmar, setConfirmar] = useState(false), [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      solicitarCrm("/operaciones/integraciones/destinatarios-whatsapp", token, { signal: c.signal }),
      solicitarCrm("/operaciones/integraciones/whatsapp/historial", token, { signal: c.signal }),
    ]).then(([d,h]) => { if (!c.signal.aborted) { setOpciones(d); setHistorial(h); } })
      .catch(e => { if (!c.signal.aborted) setError(e.message); });
    return () => c.abort();
  }, [token]);

  const lista = tipo === "CONTACTO" ? opciones?.contactos : tipo === "EMPRESA" ? opciones?.empresas : opciones?.segmentos;
  const plantillaPrueba = plantilla.trim() === "hello_world";
  const nombreDestino = tipo === "GENERAL" ? "todos los contactos con consentimiento de WhatsApp vigente" : lista?.find(x => String(x.id) === destino)?.nombre || "destinatario seleccionado";
  function cambiarTipo(valor) { setTipo(valor); setDestino(""); setError(""); setResultado(null); }
  function cambiarPlantilla(valor) { const veniaDePrueba=plantilla.trim()==="hello_world"; setPlantilla(valor); setError(""); if (valor.trim() === "hello_world") { setIdioma("en_US"); setParametros(""); } else if (veniaDePrueba) { setIdioma("es_PE"); setParametros("{{nombre}}\n{{baja}}"); } }
  function usarPrueba() { cambiarPlantilla("hello_world"); }
  async function enviar() {
    if (ocupado) return;
    setOcupado(true); setError(""); setResultado(null);
    try {
      const body = { tipoDestinatario: tipo, plantilla, idioma, parametros };
      if (tipo === "CONTACTO") body.contactoId = Number(destino);
      if (tipo === "EMPRESA") body.empresaId = Number(destino);
      if (tipo === "SEGMENTO") body.segmentoId = Number(destino);
      const result = await solicitarCrm("/operaciones/integraciones/whatsapp/enviar", token, { method: "POST", body });
      setResultado(result);
      solicitarCrm("/operaciones/integraciones/whatsapp/historial", token).then(setHistorial).catch(() => {});
      setConfirmar(false);
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  return <section className="crm-panel" aria-busy={ocupado}>
    <h2 className="crm-acciones"><MessageCircle size={18}/> Enviar WhatsApp</h2>
    <p className="crm-ayuda">Elige contactos del CRM y usa el nombre e idioma exactos de una plantilla aprobada por Meta. Solo se envía a contactos con número y consentimiento vigente de WhatsApp.</p>
    {!gestionar && <p>Tu rol puede consultar los canales, pero no enviar mensajes.</p>}
    {!configurado && <p className="crm-ayuda">WhatsApp Cloud o la URL pública HTTPS están pendientes de configuración.</p>}
    {gestionar && <div className="crm-formulario">
      <label className="crm-campo">Destinatarios<select value={tipo} disabled={ocupado} onChange={e => cambiarTipo(e.target.value)}>{tipos.map(([id,nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
      {tipo !== "GENERAL" && <label className="crm-campo">{tipo === "CONTACTO" ? "Contacto" : tipo === "EMPRESA" ? "Empresa" : "Segmento"}<select value={destino} disabled={ocupado || !opciones} onChange={e => setDestino(e.target.value)}><option value="">Seleccionar…</option>{(lista || []).map(x => <option key={x.id} value={x.id}>{x.nombre}{tipo === "CONTACTO" && x.empresa ? ` · ${x.empresa}` : ""}</option>)}</select></label>}
      <label className="crm-campo">Plantilla aprobada de Meta<input value={plantilla} maxLength={100} disabled={ocupado} onChange={e => cambiarPlantilla(e.target.value)} placeholder="ej. novedad_clientes" /></label>
      <label className="crm-campo">Idioma exacto de la plantilla<input value={plantillaPrueba ? "en_US" : idioma} maxLength={20} disabled={ocupado || plantillaPrueba} onChange={e => setIdioma(e.target.value)} placeholder="es_PE" /></label>
      {plantillaPrueba ? <p className="crm-ayuda crm-ancho" role="status">hello_world se envía en inglés (en_US) y no admite parámetros de cuerpo.</p> : <label className="crm-campo crm-ancho">Parámetros del cuerpo, uno por línea<textarea rows={4} maxLength={4000} value={parametros} disabled={ocupado} onChange={e => setParametros(e.target.value)} placeholder="{{nombre}}&#10;{{baja}}" /></label>}
      <button type="button" className="crm-boton crm-ancho" disabled={ocupado} onClick={usarPrueba}>Usar plantilla de prueba hello_world</button>
      <p className="crm-ayuda crm-ancho">Las líneas deben coincidir en orden con los marcadores posicionales <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code>. Usa <code>{"{{nombre}}"}</code> para el nombre y reserva una variable para <code>{"{{baja}}"}</code>. Este envío admite plantillas de texto; la cabecera con imagen se configura en Meta y todavía no se envía desde el CRM.</p>
      {error && <p className="crm-error crm-ancho" role="alert">{error}</p>}
      {resultado && <div className={resultado.errores ? "crm-error crm-ancho" : "crm-exito crm-ancho"} role="status"><p>Meta aceptó {resultado.aceptadosMeta} mensajes · {resultado.omitidos} omitidos por consentimiento/baja · {resultado.errores} errores. La aceptación de Meta no confirma entrega ni lectura.</p>{resultado.detallesError?.map((fallo, i) => <p key={`${i}-${fallo.mensaje}`}>{fallo.cantidad > 1 ? `${fallo.cantidad} contactos: ` : ""}{fallo.mensaje}</p>)}</div>}
      <div className="crm-acciones crm-ancho"><button type="button" className="crm-boton crm-primario" disabled={!configurado || !opciones || ocupado || !plantilla.trim() || !idioma.trim() || (tipo !== "GENERAL" && !destino)} onClick={() => setConfirmar(true)}><Send size={16}/>Enviar WhatsApp</button></div>
    </div>}
    {gestionar && <><h3>Historial de envíos</h3>{historial.length ? historial.map((h,i) => { const m=h.accion.match(/^ENVIO_WHATSAPP_(CONTACTO|EMPRESA|SEGMENTO|GENERAL)_OK(\d+)_OM(\d+)_ER(\d+)$/); return <article className="crm-tarjeta" key={`${h.created_at}-${i}`}><strong>{m ? tipos.find(([id])=>id===m[1])?.[1] : "Envío WhatsApp"}</strong><p>{new Date(h.created_at).toLocaleString("es-PE",{timeZone:"America/Lima"})} · {h.responsable}</p><p>{m ? `${m[2]} aceptados por Meta · ${m[3]} omitidos · ${m[4]} errores` : "Envío registrado"}</p></article>; }) : <p className="crm-ayuda">Aún no se han registrado envíos desde este módulo.</p>}</>}
    {confirmar && <DialogoCrm titulo="Confirmar envío WhatsApp" cerrar={() => setConfirmar(false)} ocupado={ocupado}><p>Enviarás la plantilla «{plantilla}» ({idioma}) a {nombreDestino}.</p><p>Solo recibirán el mensaje contactos con consentimiento vigente y sin baja. Meta puede aceptar un mensaje sin confirmar que haya llegado o se haya leído.</p>{error && <p className="crm-error" role="alert">{error}</p>}<div className="crm-acciones"><button className="crm-boton" disabled={ocupado} onClick={() => setConfirmar(false)}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado} onClick={enviar}>{ocupado ? "Enviando…" : "Confirmar y enviar"}</button></div></DialogoCrm>}
  </section>;
}
