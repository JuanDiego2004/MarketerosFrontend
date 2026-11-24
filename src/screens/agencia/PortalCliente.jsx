import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, FileChartColumn, FileText, FolderCheck, Megaphone, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import AnaliticaCliente from "../../componentes/portal/AnaliticaCliente";
import Pestanas from "../../componentes/ui/Pestanas";
import EntregasContratoCliente from "./EntregasContratoCliente";
import "../crm/Crm.css";
import "../../componentes/portal/PortalAnalitica.css";

const servicios = { ANALISIS: "Análisis", DIFUSION: "Difusión", INTEGRAL: "Integral" };
const fecha = (valor) => valor ? new Intl.DateTimeFormat("es-PE", { day:"numeric", month:"short", year:"numeric", timeZone:"America/Lima" }).format(new Date(`${valor.slice(0,10)}T12:00:00-05:00`)) : "—";

export default function PortalCliente() {
  const { token, usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const [datos, setDatos] = useState(null);
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [vista, setVista] = useState("resultados");
  const [detalle, setDetalle] = useState(null);
  const recibirDetalle = useCallback((contratoId, contenido) => setDetalle({ id:String(contratoId), contenido }), []);

  useEffect(() => {
    document.title = "Resultados · Portal de clientes";
    const control = new AbortController();
    solicitarCrm("/entregas/portal", token, { signal:control.signal })
      .then((d) => { if (!control.signal.aborted) { setDatos(d); setError(""); } })
      .catch((e) => { if (!control.signal.aborted) setError(e.message); });
    return () => control.abort();
  }, [token, revision]);

  const contrato = datos?.contratos.find((c) => String(c.id) === id);
  const permiteMateriales = contrato && contrato.servicio !== "ANALISIS" && detalle?.id === id && detalle.contenido.prestaciones.some((p) => p.prestacion === "PUBLICACION" && Number(p.cantidad) > 0);
  const actual = vista === "materiales" && !permiteMateriales ? "contrato" : vista;
  const analitica = ["resultados", "campanas"].includes(actual);
  const empresa = datos?.empresa?.nombre || "Mi empresa";
  const iniciales = empresa.split(/\s+/).slice(0,2).map((p) => p[0]).join("").toUpperCase();
  const opciones = [
    { valor:"resultados", etiqueta:"Resultados", icono:BarChart3 },
    { valor:"campanas", etiqueta:"Campañas", icono:Megaphone },
    { valor:"contrato", etiqueta:"Mi contrato", icono:FileText },
    ...(permiteMateriales ? [{ valor:"materiales", etiqueta:"Materiales", icono:FolderCheck }] : []),
    { valor:"informes", etiqueta:"Informes", icono:FileChartColumn },
  ];

  function elegirContrato(valor) {
    setId(valor);
    if (vista === "materiales") setVista("contrato");
  }

  return <div className="cliente-portal">
    <main className="crm portal-analitica dashboard-inmersivo cliente-experiencia">
      <header className="cliente-marco-cabecera">
        <div className="cliente-titulo">
          <button type="button" className="cliente-salir" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => { cerrarSesion(); navegar("/login", { replace:true }); }}><X size={20} /></button>
          <div><span className="cliente-eyebrow">PORTAL DEL CLIENTE</span><h1>{empresa}</h1></div>
        </div>
        <Pestanas etiqueta="Secciones del portal" className="cliente-navegacion" opciones={opciones} valor={actual} alCambiar={setVista} />
      </header>

      <div className="cliente-superficie">
        <section className="cliente-contexto" aria-label="Contexto de mi empresa">
          <div className="cliente-perfil">
            <span className="cliente-monograma" aria-hidden="true">{iniciales}</span>
            <div><small>Tu espacio de marketing</small><strong>{usuario?.nombres || empresa}</strong><span><ShieldCheck size={13} aria-hidden="true" /> Acceso privado</span></div>
          </div>
          <div className="cliente-contrato-control"><label htmlFor="cliente-contrato">Contrato</label><select id="cliente-contrato" aria-label="Mi contrato" value={id} onChange={(e) => elegirContrato(e.target.value)}><option value="">Todos mis contratos</option>{datos?.contratos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <dl className="cliente-contexto-datos">
            <div><dt>Servicio</dt><dd>{contrato ? servicios[contrato.servicio] || contrato.servicio : "Vista general"}</dd></div>
            <div><dt>{contrato ? "Estado" : "Contratos"}</dt><dd>{contrato ? contrato.estado?.replaceAll("_"," ").toLowerCase() : datos ? datos.contratos.length : "—"}</dd></div>
            <div><dt>{contrato ? "Vigencia" : "Empresa"}</dt><dd>{contrato ? `${fecha(contrato.desde)} — ${fecha(contrato.hasta)}` : empresa}</dd></div>
          </dl>
        </section>

        <div className="cliente-marca-demo"><span><Sparkles size={14} aria-hidden="true" /> Datos simulados · Mockaroo</span><p>{analitica ? "El rendimiento de tus campañas, en perspectiva." : "Cada entrega, material e informe, en un mismo lugar."}</p></div>

        <div hidden={!analitica}>
          <AnaliticaCliente token={token} portal={datos} contrato={id} seleccionarContrato={elegirContrato} alCargarContexto={setDatos} revision={revision} actualizar={() => setRevision((v) => v+1)} contratoEnCabecera vista={actual} />
        </div>

        <section className="portal-entregas cliente-servicios" aria-label="Servicios y entregas de mi contrato" hidden={analitica}>
          {error && !datos && <p className="crm-error" role="alert">{error}<button className="crm-boton" onClick={() => setRevision((v) => v+1)}>Reintentar</button></p>}
          {contrato ? <EntregasContratoCliente key={`${id}-${revision}`} contrato={contrato} vista={actual} alCargar={recibirDetalle} /> : <div className="cliente-sin-contrato"><FileText size={28} strokeWidth={1.4} /><h2>Selecciona uno de tus contratos</h2><p>Usa el selector superior para consultar sus entregas e informes. Solo aparecerán las funciones incluidas en el servicio.</p></div>}
        </section>

        <footer className="cliente-periodo"><span className="cliente-periodo-icono"><CalendarDays size={18} aria-hidden="true" /></span><div><small>{contrato ? "Vigencia del contrato" : "Tu espacio de trabajo"}</small><strong>{contrato ? `${fecha(contrato.desde)} — ${fecha(contrato.hasta)}` : "Resultados · Campañas · Servicios"}</strong></div><span className="cliente-periodo-privado"><ShieldCheck size={15} /> Solo tu empresa</span></footer>
      </div>
    </main>
  </div>;
}
