import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, RefreshCw, FileText, CalendarDays, Download, Link2, BarChart3 } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import { secciones, etiquetasEstado, siguientes } from "./configuracionAgencia";
import "../crm/Crm.css";
import { EvolucionPublicidad, MapaPublicidad } from "../crm/GraficosPublicidadDemo";
import AlcanceContrato from "./AlcanceContrato";
import BorradoresContratos from "./BorradoresContratos";
const fechaHoy = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
const n = v => v == null ? "—" : Number(v).toLocaleString("es-PE", { maximumFractionDigits: 2 });
const estadoTexto = e => etiquetasEstado[e] || e?.replaceAll("_", " ").toLowerCase();
const indicadoresInforme = { impresiones:"Impresiones", clics:"Clics", conversiones:"Conversiones de plataforma", ctr:"CTR (%)", cpc:"CPC", cpm:"CPM", cpa:"CPA" };

export default function PantallaAgencia({ recurso = "contratos", contratoContexto = "" }) {
 const navegar=useNavigate();
 const { token } = useAuth();
 const [params, setParams] = useSearchParams();
 const pagina = Math.max(0, Number(params.get("pagina")) || 0), contratoFiltro = contratoContexto || params.get("contrato") || "";
 const [datos, setDatos] = useState(null), [opciones, setOpciones] = useState(null), [revision, setRevision] = useState(0);
 const [error, setError] = useState(""), [mensaje, setMensaje] = useState(""), [ocupado, setOcupado] = useState(false), [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState(params.get("q") || ""), [form, setForm] = useState(null), [sucio, setSucio] = useState(false), [descartar, setDescartar] = useState(false);
 const [accion, setAccion] = useState(null), [detalle, setDetalle] = useState(null);
 const [desde, setDesde] = useState(fechaHoy()), [hasta, setHasta] = useState(fechaHoy());
 const configuracion = secciones[recurso], calendario = recurso === "calendario", ruta = calendario ? "anuncios" : recurso;
 const api = (s, o) => solicitarCrm(`/agencia${s}`, token, o);
 useEffect(() => {
  if(!contratoContexto)document.title = `${secciones[recurso].titulo} · MarketingSystem`;
  const c = new AbortController();
  Promise.all([solicitarCrm(`/agencia/${ruta}?pagina=${pagina}&q=${encodeURIComponent(params.get("q") || "")}&contrato=${contratoFiltro}&soloDifusion=${calendario}`, token, { signal: c.signal }), solicitarCrm("/agencia/opciones", token, { signal: c.signal })])
   .then(([d, o]) => { if (!c.signal.aborted) { setDatos(d); setOpciones(o); setError(""); } })
   .catch(e => { if (!c.signal.aborted) setError(e.message); }).finally(() => { if (!c.signal.aborted) setCargando(false); });
  return () => c.abort();
 }, [token, ruta, pagina, contratoFiltro, params, revision, recurso,contratoContexto,calendario]);
 useEffect(() => { if (!sucio) return; const aviso = e => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", aviso); return () => window.removeEventListener("beforeunload", aviso); }, [sucio]);
 const refrescar = () => { setCargando(true); setRevision(v => v + 1); };
 const cerrar = () => sucio ? setDescartar(true) : setForm(null);
 function abrir(fila) {
  if(recurso==="contratos"&&!fila){navegar("/contratos/nuevo");return;}
  const f = fila ? { ...fila } : Object.fromEntries(configuracion.campos.map(c => [c.key, c.type === "number" ? c.key === "cantidad" ? 1 : 0 : ""]));
  if (!fila) { f.moneda = "PEN"; f.servicio = "DIFUSION"; f.modalidad = "PAGADA"; f.desde = fechaHoy(); f.hasta = fechaHoy(); f.fecha = fechaHoy(); f.frecuencia = "Mensual"; f.contrato_id = contratoFiltro; if(["contratos","cotizaciones"].includes(recurso))f.prestaciones=["PRODUCCION","EDICION","PUBLICACION","ANALISIS","INFORMES"].map(prestacion=>({prestacion,cantidad:1})); }
  setForm(f); setSucio(false); setError("");
 }
 async function guardar(e) {
  e.preventDefault(); if (ocupado) return;
  if (!e.currentTarget.checkValidity()) { const invalido = e.currentTarget.querySelector(":invalid"); invalido?.setAttribute("aria-invalid", "true"); invalido?.setAttribute("aria-describedby", "agencia-error"); invalido?.focus(); setError("Completa los campos obligatorios y revisa los importes y fechas."); return; }
  setOcupado(true); setError("");
  try { await api(`/${recurso}${form.id ? `/${form.id}` : ""}`, { method: form.id ? "PUT" : "POST", body: form }); setForm(null); setSucio(false); setMensaje("Registro guardado."); refrescar(); }
  catch (e2) { setError(e2.message); } finally { setOcupado(false); }
 }
 async function ejecutar() {
  if (ocupado) return; setOcupado(true); setError("");
  try {
   const { tipo, fila } = accion;
   if (tipo === "escenarios") await api("/escenarios", { method: "POST" });
   if (tipo === "estado") await api(`/${recurso}/${fila.id}/estado`, { method: "POST", body: { estado: accion.estado, version: fila.version } });
   if (tipo === "vincular") await api(`/contratos/${fila.id}/campanas`, { method: "POST", body: { campana_id: accion.campana } });
   if (tipo === "renovar") await api(`/contratos/${fila.id}/estado`, { method: "POST", body: { estado: "RENOVADO", version: fila.version, renovacion_id: accion.renovacion } });
   if (tipo === "sincronizar") await api(`/anuncios/${fila.id}/sincronizar`, { method: "POST", body: { desde, hasta } });
   setAccion(null); setMensaje("Operación completada. El historial conserva la decisión."); refrescar();
  } catch (e) { setError(e.message); } finally { setOcupado(false); }
 }
 async function ver(fila, tipo, periodo) {
  setOcupado(true); setError("");
  try { setDetalle({ tipo, datos: await api(tipo === "informe" ? `/contratos/${fila.id}/informe` : `/anuncios/${fila.id}/metricas?desde=${periodo?.desde||desde}&hasta=${periodo?.hasta||hasta}`) }); }
  catch (e) { setError(e.message); } finally { setOcupado(false); }
 }
 const seleccionado = opciones?.contratos.find(c => String(c.id) === String(form?.contrato_id));
 async function prepararEstadisticas(){
  if(ocupado||!detalle)return;setOcupado(true);setError("");
  try{const r=await solicitarCrm(`/contratacion/contratos/${detalle.datos.anuncio.contrato_id}/estadisticas-iniciales`,token,{method:"POST"});if(r.estado==="ERROR")throw new Error(r.mensaje);await ver(detalle.datos.anuncio,"metricas");}catch(e){setError(e.message);}finally{setOcupado(false);}
 }
 function opcionesCampo(c) {
  if (Array.isArray(c.options)) return c.options.map(([id, nombre]) => ({ id, nombre }));
  let lista = opciones?.[c.options] || [];
  if (["cuentas", "campanas"].includes(c.options) && seleccionado) lista = lista.filter(x => x.empresa_id === seleccionado.empresa_id && (c.options !== "campanas" || String(x.contrato_id) === String(seleccionado.id)));
  if (c.options === "anuncios" && seleccionado) lista = lista.filter(x => String(x.contrato_id) === String(seleccionado.id));
  if (c.options === "contenidos") lista = lista.filter(x => String(x.campana_id) === String(form?.campana_id) && x.estado === "APROBADO");
  if (c.options === "cotizaciones" && form?.empresa_id) lista = lista.filter(x => String(x.empresa_id) === String(form.empresa_id));
  return lista;
 }
 const nombreContrato = id => opciones?.contratos.find(c => c.id === id)?.nombre || id;
 async function cambiarCatalogo(f) {setOcupado(true);try{await api(`/catalogo/${f.codigo}`,{method:"PUT",body:{activo:!f.activo}});setMensaje("Catálogo actualizado. Los contratos existentes se conservan.");refrescar();}catch(e){setError(e.message);}finally{setOcupado(false);}}
 const Contenedor=contratoContexto?"section":"main";
 return <Contenedor className="crm">
  <header className="crm-cabecera"><div><h1>{configuracion.titulo}</h1><p>Contratación, ejecución y seguimiento de servicios de la agencia.</p></div><div className="crm-acciones"><button className="crm-boton" onClick={refrescar} disabled={cargando}><RefreshCw size={16}/>Actualizar</button>{opciones?.gestionar && configuracion.campos.length > 0 && <button className="crm-boton crm-primario" onClick={() => abrir()}><Plus size={16}/>Nuevo {configuracion.singular}</button>}{!opciones?.gestionar && ["recomendaciones", "informes"].includes(recurso) && opciones && <button className="crm-boton crm-primario" onClick={() => abrir()}><Plus size={16}/>Nuevo {configuracion.singular}</button>}</div></header>
  <p className="crm-ayuda">Datos publicitarios simulados con Mockaroo · las publicaciones y ajustes se registran únicamente dentro del CRM.</p>
  {recurso === "contratos" && opciones?.catalogoGestionar && <button className="crm-boton" onClick={()=>{setError("");setAccion({tipo:"escenarios"});}}>Preparar tres escenarios de demostración</button>}
  {!contratoContexto&&<nav className="crm-recorrido" aria-label="Recorrido del servicio"><NavLink to="/contratos">Contratos</NavLink><NavLink to="/anuncios">Anuncios</NavLink><NavLink to="/calendario-editorial"><CalendarDays size={16}/>Calendario</NavLink><NavLink to="/informes-contrato">Informes</NavLink><NavLink to="/campanas">Campañas</NavLink><NavLink to="/contenido">Contenido y aprobaciones</NavLink></nav>}
  {!contratoContexto&&<div className="crm-acciones"><Link className="crm-boton" to={contratoFiltro?`/contratos/${contratoFiltro}`:"/contratos"}>Abrir contrato para gestionar materiales e informes</Link></div>}
  {recurso==="contratos"&&opciones?.gestionar&&<BorradoresContratos/>}
  {mensaje && <p role="status" className="crm-exito">{mensaje}</p>}{error && !form && !accion && <p role="alert" className="crm-error">{error} <button className="crm-boton" onClick={refrescar}>Reintentar</button></p>}
  {recurso !== "servicios" && <section className="crm-panel"><form className="crm-filtros" aria-label={`Filtros de ${configuracion.titulo}`} onSubmit={e => { e.preventDefault(); setCargando(true); setParams({ q: busqueda, ...(contratoFiltro ? { contrato: contratoFiltro } : {}) }); }}><label className="crm-campo">Buscar por nombre o ID<input value={busqueda} maxLength={160} onChange={e => setBusqueda(e.target.value)}/></label><button className="crm-boton">Buscar</button>{busqueda && <button type="button" className="crm-boton" onClick={() => { setBusqueda(""); setParams(contratoFiltro ? { contrato: contratoFiltro } : {}); }}>Limpiar</button>}{!contratoContexto && !["contratos", "cotizaciones", "cuentas-publicitarias"].includes(recurso) && <label className="crm-campo">Contrato<select value={contratoFiltro} onChange={e => { setCargando(true); setParams(e.target.value ? { contrato: e.target.value } : {}); }}><option value="">Todos</option>{opciones?.contratos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}</form>
   {["anuncios", "calendario"].includes(recurso) && <div className="crm-filtros-footer"><label className="crm-campo">Desde<input type="date" value={desde} onChange={e => setDesde(e.target.value)}/></label><label className="crm-campo">Hasta<input type="date" value={hasta} onChange={e => setHasta(e.target.value)}/></label><p className="crm-ayuda">Período de consulta y actualización: máximo 90 días.</p></div>}</section>}
  {recurso === "informes" && (contratoFiltro ? <ConsultaInformeContrato key={`${contratoFiltro}-${revision}`} id={contratoFiltro} token={token}/> : <p className="crm-panel">Selecciona un contrato para consultar y exportar sus resultados. Los informes redactados se muestran debajo.</p>)}
  {recurso === "informes" && <h2>Informes redactados</h2>}
  <section className="crm-panel" aria-busy={cargando}>{cargando ? <p role="status">Cargando registros…</p> : !datos?.filas.length ? <p>{recurso === "informes" ? "No hay informes redactados para esta selección. El resumen de resultados se consulta arriba; Nuevo informe permite añadir tus conclusiones." : <>No hay registros para esta búsqueda. {opciones?.gestionar ? "Utiliza Nuevo para registrar el primero." : "Solicita al líder la configuración del contrato."}</>}</p> : <div className="crm-scroll"><table><thead><tr>{[calendario ? "Fecha prevista" : "Código", "Nombre", "Servicio / contrato", "Estado", "Importes / alcance", "Acciones"].map(t => <th key={t} scope="col">{t}</th>)}</tr></thead><tbody>{[...datos.filas].sort((a,b) => calendario ? a.fecha.localeCompare(b.fecha) : 0).map(f => <tr key={f.id || f.codigo}><td>{calendario ? f.fecha : f.codigo || `${recurso === "contratos" ? "CTR" : "COT"}-${f.id}`}</td><td>{f.nombre}{f.empresa_id && <p className="crm-ayuda">{opciones?.empresas.find(e => e.id === f.empresa_id)?.nombre}</p>}</td><td>{f.servicio || nombreContrato(f.contrato_id) || f.plataforma || "—"}</td><td>{estadoTexto(f.estado) || (f.activo ? "Activo" : "Inactivo")}</td><td>{f.honorarios != null ? <><p>Honorarios: {n(f.honorarios)} {f.moneda}</p><p>Producción: {n(f.produccion)} {f.moneda}</p><p>Presupuesto: {n(f.presupuesto)} {f.moneda}</p></> : f.descripcion || (f.cantidad ? `${f.cantidad} unidades` : f.formato || f.moneda || "—")}</td><td><div className="crm-acciones">
   {recurso === "servicios" && opciones?.catalogoGestionar && <button className="crm-boton" disabled={ocupado} onClick={() => cambiarCatalogo(f)}>{f.activo ? "Deshabilitar nuevas contrataciones" : "Habilitar servicio"}</button>}
   {recurso==="contratos"&&<Link className="crm-boton" to={`/contratos/${f.id}`}>Abrir contrato</Link>}
   {recurso==="anuncios"&&<Link className="crm-boton" to={`/contratos/${f.contrato_id}`}>Abrir contrato</Link>}
   {opciones?.gestionar && ["BORRADOR", "PENDIENTE"].includes(f.estado) && !calendario && recurso !== "contratos" && !(recurso === "anuncios" && opciones.contratos.find(c => c.id === f.contrato_id)?.servicio === "ANALISIS") && <button className="crm-boton" onClick={() => abrir(f)}>Editar</button>}
   {opciones?.gestionar && !calendario && recurso !== "contratos" && !(recurso === "anuncios" && opciones.contratos.find(c => c.id === f.contrato_id)?.servicio === "ANALISIS") && siguientes(recurso, f.estado).map(s => <button className="crm-boton" key={s} onClick={() => { setError(""); setAccion({ tipo: "estado", fila: f, estado: s }); }}>{s === "PUBLICADO_SIMULADO" ? "Simular publicación" : estadoTexto(s)}</button>)}
   {recurso === "contratos" && <><button className="crm-boton" disabled={ocupado} onClick={() => ver(f, "informe")}><FileText size={16}/>Informe y avance</button>{opciones?.gestionar && ["APROBADO", "ACTIVO"].includes(f.estado) && <button className="crm-boton" onClick={() => { setError(""); setAccion({ tipo: "vincular", fila: f }); }}><Link2 size={16}/>Vincular campaña</button>}{opciones?.gestionar && f.estado === "FINALIZADO" && <button className="crm-boton" onClick={() => setAccion({ tipo: "renovar", fila: f })}>Registrar renovación</button>}<Link className="crm-boton" to={`/entregables?contrato=${f.id}`}>Entregables</Link></>}
   {ruta === "anuncios" && <><button className="crm-boton" disabled={ocupado} onClick={() => ver(f, "metricas")}><BarChart3 size={16}/>Ver estadísticas</button>{opciones?.gestionar && ["PUBLICADO_SIMULADO", "EXTERNO_SIMULADO", "FINALIZADO"].includes(f.estado) && <button className="crm-boton" onClick={() => { setError(""); setAccion({ tipo: "sincronizar", fila: f }); }}>Actualizar datos simulados</button>}</>}
  </div></td></tr>)}</tbody></table></div>}
  {recurso !== "servicios" && <div className="crm-acciones"><button className="crm-boton" disabled={!pagina || cargando} onClick={() => setParams(p => { p.set("pagina", pagina - 1); return p; })}>Anterior</button><span>Página {pagina + 1} · {datos?.total || 0} registros</span><button className="crm-boton" disabled={cargando || (pagina + 1) * 20 >= (datos?.total || 0)} onClick={() => setParams(p => { p.set("pagina", pagina + 1); return p; })}>Siguiente</button></div>}</section>
  {form && !descartar && <DialogoCrm formulario titulo={`${form.id ? "Editar" : "Nuevo"} ${configuracion.singular}`} cerrar={cerrar} ocupado={ocupado}><form className="crm-formulario" noValidate onSubmit={guardar} onChange={() => setSucio(true)}>
   {configuracion.campos.filter(c => (!contratoContexto||c.key!=="contrato_id") && !(seleccionado?.servicio === "ANALISIS" && c.key === "contenido_id")).map(c => <CampoAgencia key={c.key} campo={c} valor={form[c.key]} opciones={c.type === "select" ? opcionesCampo(c) : []} cambiar={valor => setForm(f => {
    if(c.key === "origen_id" && valor) {const cotizacion = opciones.cotizaciones.find(o => String(o.id) === valor); return {...f,...Object.fromEntries(configuracion.campos.filter(x=>x.key!=="origen_id").map(x=>[x.key,cotizacion[x.key] ?? ""])),origen_id:valor};}
    return {...f,[c.key]:valor,...(c.key === "contrato_id" ? {cuenta_id:"",campana_id:"",anuncio_id:"",contenido_id:""} : {}),...(c.key === "servicio" && valor === "ANALISIS" ? {prestaciones:(f.prestaciones || []).filter(x=>["ANALISIS","INFORMES"].includes(x.prestacion))} : {})};
   })}/>)}
   {["contratos","cotizaciones"].includes(recurso) && <AlcanceContrato servicio={form.servicio} valor={form.prestaciones} cambiar={prestaciones=>{setForm(f=>({...f,prestaciones}));setSucio(true);}}/>}
   {form.servicio && <p className="crm-ayuda crm-ancho">{form.servicio === "ANALISIS" ? "Solo análisis: se registran anuncios de referencia; no se habilitan edición de contenido ni publicaciones." : "El equipo preparará el contenido, gestionará su aprobación y registrará las publicaciones simuladas."} Alcance: {form.alcance || "completa los entregables acordados"}. Honorarios y producción son precios previstos de la agencia; presupuesto es autorización de pauta.</p>}
   {error && <p className="crm-error crm-ancho" id="agencia-error" role="alert">{error}</p>}<div className="crm-acciones crm-ancho"><button type="button" className="crm-boton" disabled={ocupado} onClick={cerrar}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado} aria-busy={ocupado}>Guardar</button></div></form></DialogoCrm>}
  {descartar && <DialogoCrm titulo="Descartar cambios" cerrar={() => setDescartar(false)}><p>Los cambios sin guardar se perderán.</p><div className="crm-acciones"><button className="crm-boton" onClick={() => setDescartar(false)}>Seguir editando</button><button className="crm-boton" onClick={() => { setDescartar(false); setForm(null); setSucio(false); }}>Descartar</button></div></DialogoCrm>}
  {accion && <DialogoCrm titulo="Confirmar operación" cerrar={() => setAccion(null)} ocupado={ocupado}><p>{accion.tipo === "escenarios" ? "Se crearán tres empresas de demostración con cotizaciones, contratos, campañas, cuentas, anuncios y entregables. No se descargarán estadísticas ni se publicará en redes. Repetir esta operación no duplica los escenarios existentes." : accion.tipo === "estado" ? `«${accion.fila.nombre}» pasará a ${estadoTexto(accion.estado)}. La decisión quedará en el historial.` : accion.tipo === "sincronizar" ? `Se solicitarán estadísticas de Mockaroo del ${desde} al ${hasta}. Se conservarán los días ya importados.` : accion.tipo === "renovar" ? "Selecciona el nuevo contrato aprobado que reemplaza al finalizado." : "Selecciona una campaña de la misma empresa. Cada campaña pertenece a un contrato."}</p>
   {accion.tipo === "vincular" && <label>Campaña<select aria-label="Campaña" value={accion.campana || ""} onChange={e => setAccion({ ...accion, campana: e.target.value })}><option value="">Seleccionar campaña</option>{opciones.campanas.filter(c => c.empresa_id === accion.fila.empresa_id && !c.contrato_id).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
   {accion.tipo === "renovar" && <label>Nuevo contrato<select value={accion.renovacion || ""} onChange={e => setAccion({ ...accion, renovacion: e.target.value })}><option value="">Seleccionar contrato</option>{opciones.contratos.filter(c => c.id !== accion.fila.id && c.empresa_id === accion.fila.empresa_id && ["APROBADO", "ACTIVO"].includes(c.estado)).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
   {error && <p className="crm-error" role="alert">{error}</p>}<div className="crm-acciones"><button className="crm-boton" disabled={ocupado} onClick={() => setAccion(null)}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado || accion.tipo === "vincular" && !accion.campana || accion.tipo === "renovar" && !accion.renovacion} onClick={ejecutar}>Confirmar</button></div></DialogoCrm>}
  {detalle && <DialogoCrm titulo={detalle.tipo === "informe" ? "Informe del servicio" : "Estadísticas del anuncio"} cerrar={() => setDetalle(null)} ocupado={ocupado}>{error&&<p role="alert" className="crm-error">{error}</p>}<Informe detalle={detalle} gestionar={opciones?.gestionar} ocupado={ocupado} generar={prepararEstadisticas} verPeriodo={()=>ver(detalle.datos.anuncio,"metricas",detalle.datos.periodoDisponible)}/></DialogoCrm>}
 </Contenedor>;
}

function ConsultaInformeContrato({ id, token }) {
 const [resultado,setResultado]=useState(null),[error,setError]=useState(""),[intento,setIntento]=useState(0);
 useEffect(()=>{
  const control=new AbortController();
  solicitarCrm(`/agencia/contratos/${id}/informe`,token,{signal:control.signal})
   .then(datos=>{if(!control.signal.aborted)setResultado(datos);})
   .catch(e=>{if(!control.signal.aborted)setError(e.message);});
  return ()=>control.abort();
 },[id,token,intento]);
 return <section className="crm-panel" aria-label="Resultados del contrato">
  <h2>Informe de resultados del contrato</h2>
  {error ? <p className="crm-error" role="alert">{error} <button className="crm-boton" onClick={()=>{setError("");setIntento(v=>v+1);}}>Reintentar informe</button></p> : resultado ? <Informe detalle={{tipo:"informe",datos:resultado}}/> : <p role="status">Cargando informe del contrato…</p>}
 </section>;
}

function CampoAgencia({campo:c,valor,opciones,cambiar}) {
 const propiedades={"aria-label":c.label,required:c.required,value:valor ?? "",onChange:e=>{e.target.removeAttribute("aria-invalid");cambiar(e.target.value);}};
 return <label className={`crm-campo ${c.type === "textarea" ? "crm-ancho" : ""}`}>{c.label}{c.required ? " *" : ""}{c.type === "select" ? <select {...propiedades}><option value="">Seleccionar</option>{opciones.map(o=><option key={o.id} value={o.id}>{o.codigo ? `${o.codigo} · ` : ""}{o.nombre}</option>)}</select> : c.type === "textarea" ? <textarea {...propiedades} maxLength={4000} rows={4}/> : <input {...propiedades} type={c.type} min={c.min ?? (c.type === "number" ? 0 : undefined)} max={c.max} step={c.type === "number" ? c.key === "cantidad" ? 1 : "0.01" : undefined} maxLength={c.key === "codigo" || c.key === "frecuencia" ? 80 : c.key === "plataformas" ? 300 : 160}/>}</label>;
}

function Informe({ detalle, gestionar, ocupado, generar, verPeriodo }) {
 const d = detalle.datos;
 const [pais, setPais] = useState("");
 const exportar = () => {
  if(detalle.tipo !== "informe") {descargarCrm(new Blob([JSON.stringify(d,null,2)],{type:"application/json"}),`metricas-${d.anuncio.codigo}.json`);return;}
  const c=d.contrato;
  const texto=[`INFORME DE SERVICIO · CTR-${c.id}`,d.empresa.nombre,`${c.servicio} · ${c.desde} a ${c.hasta}`,d.fuente,"",`ALCANCE: ${c.alcance}`,`Honorarios previstos: ${n(c.honorarios)} ${c.moneda}`,`Producción prevista: ${n(c.produccion)} ${c.moneda}`,`Presupuesto autorizado: ${n(c.presupuesto)} ${c.moneda}`,`Gasto simulado: ${n(d.gasto)} ${c.moneda}`,"","CAMPAÑAS",...d.campanas.map(x=>x.nombre),"","ANUNCIOS Y PUBLICACIONES",...d.anuncios.map(x=>`${x.codigo} · ${x.fecha} · ${estadoTexto(x.estado)} · ${n(x.gasto)} ${c.moneda}`),"","ENTREGABLES Y HALLAZGOS",...d.trabajos.map(x=>`${x.tipo} · ${x.nombre} · ${x.cantidad} unidades · ${estadoTexto(x.estado)}\n${x.descripcion}`),"","DECISIONES",...d.historial.map(x=>`${x.created_at} · ${x.autor} · ${x.accion}`)].join("\n");
  const metricas=d.resumen ? "\n\nRESULTADOS PUBLICITARIOS · todos los anuncios y países del contrato\n"+Object.entries(indicadoresInforme).map(([clave,etiqueta])=>`${etiqueta}: ${n(d.resumen[clave])}`).join("\n") : "";
  descargarCrm(new Blob(["\ufeff",texto,metricas],{type:"text/plain;charset=utf-8"}),`informe-contrato-${c.id}.txt`);
 };
 if(detalle.tipo==="metricas"&&!d.filas.length)return <><p>{d.anuncio.codigo} · {d.fuente} · {d.moneda}</p>{Number(d.periodoDisponible?.filas)>0?<><p role="status">Este anuncio tiene estadísticas del {d.periodoDisponible.desde} al {d.periodoDisponible.hasta}. El periodo consultado no contiene datos.</p><button className="crm-boton" disabled={ocupado} onClick={verPeriodo}>Ver periodo con estadísticas</button></>:d.estadisticasIniciales==="FECHA_FUTURA"?<p role="status">El contrato todavía no inicia. Consulta sus estadísticas dentro de su vigencia.</p>:<><p role="status">{d.estadisticasIniciales==="ERROR"?"El contrato está guardado, pero falló la carga inicial de Mockaroo. Puedes reintentar.":"Aún no se cargaron estadísticas de Mockaroo para este anuncio."}</p>{gestionar&&<button className="crm-boton crm-primario" disabled={ocupado} aria-busy={ocupado} onClick={generar}>{ocupado?"Cargando estadísticas…":d.estadisticasIniciales==="ERROR"?"Reintentar estadísticas":"Generar estadísticas"}</button>}</>}</>;
 if (detalle.tipo === "metricas") return <><p>{d.anuncio.codigo} · {d.fuente} · {d.moneda}</p><div className="crm-demo-kpis">{Object.entries(d.resumen).map(([k,v]) => <section className="crm-panel" key={k}>{k}<strong>{n(v)}</strong></section>)}</div><p className="crm-ayuda">Ingresos son estimaciones del escenario; no representan ventas ganadas del CRM. CTR = clics / impresiones. CPC = gasto / clics. Los indicadores corresponden al anuncio completo; el país filtra la tabla de detalle.</p>{d.dias?.length > 0 && <EvolucionPublicidad dias={d.dias} moneda={d.moneda}/ >}{d.paises?.length > 0 && <MapaPublicidad paises={d.paises} seleccionar={setPais}/ >}{pais && <button className="crm-boton" onClick={()=>setPais("")}>Mostrar todos los países</button>}<button className="crm-boton" onClick={exportar}><Download size={16}/>Exportar estadísticas</button><div className="crm-scroll"><table><thead><tr>{["Fecha", "País", "Impresiones", "Clics", "Conversiones", "Gasto"].map(k => <th key={k}>{k}</th>)}</tr></thead><tbody>{d.filas.filter(f=>!pais || f.pais === pais).map(f => <tr key={`${f.fecha}-${f.pais}`}><td>{f.fecha}</td><td>{f.pais}</td><td>{n(f.impresiones)}</td><td>{n(f.clics)}</td><td>{n(f.conversiones)}</td><td>{n(f.inversion)}</td></tr>)}</tbody></table></div></>;
 const c = d.contrato;
 return <><p>{d.empresa.nombre} · CTR-{c.id} · {c.servicio} · {c.desde} a {c.hasta}</p><p>{d.fuente}</p><p>Alcance: {c.alcance}</p><div className="crm-demo-kpis">{[["Honorarios", c.honorarios], ["Producción", c.produccion], ["Presupuesto autorizado", c.presupuesto], ["Gasto publicitario simulado", d.gasto]].map(([k,v]) => <section className="crm-panel" key={k}>{k}<strong>{n(v)} {c.moneda}</strong></section>)}</div>{d.alertaPresupuesto && <p className="crm-error">El gasto alcanzó al menos el 80 % del presupuesto autorizado.</p>}{d.renovacionProxima && <p className="crm-ayuda">Revisa el cierre o la renovación del servicio.</p>}
  <h3>Resultados publicitarios</h3><p className="crm-ayuda">Todos los anuncios y países del contrato · días importados · {c.moneda}. Los indicadores se calculan sobre los totales de los anuncios, sin sumar honorarios ni presupuesto al gasto.</p>
  {d.tieneMetricas === false && <p>Aún no hay estadísticas descargadas para los anuncios de este contrato. Actualízalas desde Anuncios para ver los resultados aquí.</p>}
  {d.resumen && <div className="crm-demo-kpis">{Object.entries(indicadoresInforme).map(([clave,etiqueta])=><section className="crm-panel" key={clave}>{etiqueta}<strong>{n(d.resumen[clave])}</strong></section>)}</div>}
  {d.dias?.length > 0 && <EvolucionPublicidad dias={d.dias} moneda={c.moneda}/>}
  <button className="crm-boton" onClick={exportar}><Download size={16}/>Exportar informe</button><h3>Campañas asociadas</h3>{d.campanas.map(x => <p key={x.id}>{x.nombre}</p>)}<h3>Publicaciones y anuncios</h3>{d.anuncios.map(x => <p key={x.id}>{x.fecha} · {x.codigo} · {estadoTexto(x.estado)} · {n(x.gasto)} {c.moneda}</p>)}<h3>Entregables, hallazgos y ajustes</h3>{d.trabajos.length ? d.trabajos.map(x => <section className="crm-panel" key={x.id}><strong>{x.tipo} · {x.nombre}</strong><p>{x.descripcion}</p><p>{x.fecha} · {x.cantidad} unidades · {estadoTexto(x.estado)}</p></section>) : <p>Aún no se registraron trabajos del servicio.</p>}<h3>Historial de decisiones</h3>{d.historial.map((x,i) => <p key={i}>{new Date(x.created_at).toLocaleString("es-PE", { timeZone: "America/Lima" })} · {x.autor} · {x.accion}</p>)}</>;
}
