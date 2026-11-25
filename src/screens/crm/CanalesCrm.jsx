import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import MensajesWhatsApp from "./MensajesWhatsApp";
import EnvioCorreo from "./EnvioCorreo";
import EnvioWhatsApp from "./EnvioWhatsApp";
import "./Crm.css";

export default function CanalesCrm() {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null), [error, setError] = useState(""), [revision, setRevision] = useState(0);
  useEffect(() => {
    document.title = "Canales de comunicación · MarketingSystem";
    const c = new AbortController();
    Promise.all([
      solicitarCrm("/operaciones/integraciones/estado", token, { signal: c.signal }),
      solicitarCrm("/operaciones/integraciones/opciones", token, { signal: c.signal }),
      solicitarCrm("/operaciones/capacidades", token, { signal: c.signal }),
    ]).then(([estado, opciones, permisos]) => { if (!c.signal.aborted) { setDatos({ estado, opciones, permisos }); setError(""); } }).catch((e) => { if (!c.signal.aborted) setError(e.message); });
    return () => c.abort();
  }, [token, revision]);
  return <section className="crm"><header className="crm-cabecera"><div><p className="crm-kicker">Configuración</p><h1>Canales de comunicación</h1><p className="crm-ayuda">Gestiona los canales de seguimiento de contactos y consulta la fuente de estadísticas.</p></div><button className="crm-boton" onClick={() => setRevision((n) => n + 1)}><RefreshCw size={16}/>Actualizar canales</button></header>
    <section className="crm-panel"><h2>Rendimiento publicitario</h2><p>Fuente de estadísticas: Mockaroo.</p><Link className="crm-boton" to="/metricas"><ChartNoAxesCombined size={16}/>Ver rendimiento publicitario</Link></section>
    {error && <p className="crm-error" role="alert">{error}<button className="crm-boton" onClick={() => setRevision((n) => n + 1)}>Reintentar canales</button></p>}
    {!datos && !error && <p role="status">Cargando canales…</p>}
    {datos && <><section className="crm-panel"><h2>Envíos y seguimiento</h2><p>WhatsApp Cloud: {datos.estado.whatsappConfigurado ? "configurado" : "pendiente de configurar"} · Correo Brevo: {datos.estado.emailConfigurado ? "configurado" : "pendiente de configurar"}.</p><p className="crm-ayuda">Puedes enviar directamente por correo o WhatsApp a un contacto, a los contactos de una empresa, a un segmento de CRM o a todos los contactos con consentimiento. Las automatizaciones siguen siendo para seguimientos secuenciales basados en segmentos. Ejecución automática: {datos.estado.automatizacionesProgramadas ? "habilitada" : "deshabilitada"}.</p></section><EnvioCorreo gestionar={datos.permisos.integracionesGestionar} configurado={datos.estado.emailConfigurado}/><EnvioWhatsApp gestionar={datos.permisos.integracionesGestionar} configurado={datos.estado.whatsappConfigurado}/><MensajesWhatsApp contactos={datos.opciones.contactos} gestionar={datos.permisos.integracionesGestionar}/></>}
  </section>;
}
