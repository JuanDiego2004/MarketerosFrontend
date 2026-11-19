import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Database, RefreshCw, Plus, Download, MousePointerClick, Eye, Coins, ChartNoAxesCombined } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import { EvolucionPublicidad, MapaPublicidad } from "./GraficosPublicidadDemo";
import "./Crm.css";
import ResultadosComerciales from "./ResultadosComerciales";

const hoy = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
const inicio = () => { const d = new Date(`${hoy()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 29); return d.toISOString().slice(0, 10); };
const plataformas = { META: "Meta", TIKTOK: "TikTok", YOUTUBE: "YouTube" };
const referencia = (f) => f.codigo?.replace("-DEMO-", "-") || "";
const numero = (n, decimales = 2) => n == null ? "—" : Number(n).toLocaleString("es-PE", { maximumFractionDigits: decimales });

export default function PublicidadDemo() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const id = params.get("campanaVista") || "", desde = params.get("desde") || inicio(), hasta = params.get("hasta") || hoy(), pais = params.get("pais") || "", cliente = params.get("clienteVista") || "";
  const [estado, setEstado] = useState(null), [lista, setLista] = useState(null), [datos, setDatos] = useState(null);
  const [revision, setRevision] = useState(0), [error, setError] = useState(""), [mensaje, setMensaje] = useState(""), [ocupado, setOcupado] = useState(false), [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(null), [sucio, setSucio] = useState(false), [descartar, setDescartar] = useState(false);
  const api = (ruta, opciones) => solicitarCrm(`/rendimiento${ruta}`, token, opciones);
  useEffect(() => {
    document.title = "Rendimiento publicitario · MarketingSystem";
    const c = new AbortController();
    solicitarCrm("/rendimiento/estado", token, { signal: c.signal }).then(async (e) => {
      const vinculos = e.esquemaListo ? await solicitarCrm("/rendimiento", token, { signal: c.signal }) : [];
      if (c.signal.aborted) return;
      setEstado(e); setLista(vinculos);
    }).catch((e) => { if (!c.signal.aborted) setError(e.message); });
    return () => c.abort();
  }, [token, revision]);
  useEffect(() => {
    if (!id) return;
    const c = new AbortController();
    solicitarCrm(`/rendimiento/${encodeURIComponent(id)}/metricas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&pais=${encodeURIComponent(pais)}`, token, { signal: c.signal })
      .then((d) => { if (!c.signal.aborted) { setDatos(d); setError(""); } })
      .catch((e) => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setCargando(false); });
    return () => c.abort();
  }, [id, desde, hasta, pais, token, revision]);
  useEffect(() => { if (!sucio) return; const avisar = (e) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", avisar); return () => window.removeEventListener("beforeunload", avisar); }, [sucio]);
  function filtrar(cambio) {
    setDatos(null); setCargando(true); setError(""); setMensaje("");
    setParams((prev) => { const p = new URLSearchParams(prev); Object.entries({ desde, hasta, ...cambio }).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k)); return p; });
  }
  async function crear(e) {
    e.preventDefault(); if (ocupado) return;
    const invalido = [...e.currentTarget.elements].find((c) => c.willValidate && !c.validity.valid);
    if (invalido) { setError("Selecciona campaña, plataforma y moneda."); invalido.setAttribute("aria-invalid", "true"); invalido.setAttribute("aria-describedby", "demo-error"); invalido.focus(); return; }
    setOcupado(true); setError("");
    try {
      const r = await api("", { method: "POST", body: { ...form, campana_id: Number(form.campana_id) } });
      filtrar({ campanaVista: String(r.id), clienteVista: "", pais: "" }); setForm(null); setSucio(false); setMensaje(`Campaña ${r.codigo} vinculada. Sincroniza el período para cargar sus estadísticas.`); setRevision((n) => n + 1);
    } catch (e) { setError(e.message); } finally { setOcupado(false); }
  }
  async function sincronizar() {
    if (ocupado || !id) return; setOcupado(true); setError(""); setMensaje("");
    try { const r = await api(`/${id}/sincronizar?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`, { method: "POST" }); setMensaje(r.reutilizado ? "El período ya estaba guardado. Se reutilizaron los mismos datos, sin otra descarga." : `${r.filasNuevas} registros incorporados de ${r.diasNuevos} días.`); setDatos(null); setCargando(true); setRevision((n) => n + 1); } catch (e) { setError(e.message); } finally { setOcupado(false); }
  }
  function exportar() {
    const columnas = ["fecha", "impresiones", "clics", "conversiones", "inversion", "ctr", "cpc", "cpm", "cpa"];
    const csv = ["fuente,codigo,moneda,pais," + columnas.join(","), ...datos.dias.map((d) => ["MOCKAROO", referencia(datos.campana), datos.campana.moneda, pais || "TODOS", ...columnas.map((k) => d[k] ?? "")].join(","))].join("\r\n");
    descargarCrm(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), `rendimiento-${referencia(datos.campana)}.csv`);
  }
  const clientes = [...new Map((lista || []).map((v) => [String(v.id_cliente), v.cliente])).entries()];
  const visibles = (lista || []).filter((v) => !cliente || String(v.id_cliente) === cliente);
  const resumen = datos?.resumen, moneda = datos?.campana.moneda || "PEN";
  const tarjetas = resumen ? [
    ["Impresiones", resumen.impresiones, Eye, ""], ["Clics", resumen.clics, MousePointerClick, ""], ["Inversión", resumen.inversion, Coins, moneda], ["CTR · tasa de clics", resumen.ctr, ChartNoAxesCombined, "%"],
    ["CPC · costo por clic", resumen.cpc, Coins, moneda], ["CPM · costo por mil", resumen.cpm, Coins, moneda], ["Conversiones de plataforma", resumen.conversiones, MousePointerClick, ""], ["CPA · costo por conversión", resumen.cpa, Coins, moneda]
  ] : [];
  return <section className="crm" aria-label="Rendimiento publicitario" aria-busy={ocupado}>
    <header className="crm-cabecera"><div><p className="crm-kicker">Resultados · Publicidad</p><h1>Rendimiento publicitario</h1><p className="crm-ayuda">Consulta inversión, rendimiento y ventas atribuidas a tus campañas.</p></div><span className="crm-etiqueta"><Database size={16}/>Fuente: Mockaroo</span></header>
    {!estado && !error && <p role="status">Comprobando configuración…</p>}
    {estado && <section className="crm-panel"><div className="crm-cabecera"><div><h2>Fuente de estadísticas</h2><p>{estado.configurado ? "Clave configurada; sincroniza para comprobar la conexión." : "Falta configurar Mockaroo en el backend."}</p></div><div className="crm-acciones"><button className="crm-boton" disabled={ocupado} onClick={() => { setError(""); setRevision((n) => n + 1); }}><RefreshCw size={16}/>Actualizar conexión</button>{estado.gestionar && <button className="crm-boton crm-primario" disabled={ocupado || !estado.esquemaListo || !estado.campanas.length} onClick={() => { setForm({ campana_id: "", plataforma: "META", moneda: "PEN" }); setSucio(false); setError(""); }}><Plus size={16}/>Vincular campaña</button>}</div></div>
      {!estado.esquemaListo && <p className="crm-error" role="alert">Falta actualizar la base de datos del backend para habilitar el rendimiento publicitario.</p>}
      {!estado.configurado && estado.gestionar && <p className="crm-ayuda">Completa CRM_MOCKAROO_API_KEY y CRM_MOCKAROO_HABILITADO=true en el entorno privado del backend y reinícialo. Nunca pegues la clave aquí.</p>}
      {estado.gestionar && !estado.campanas.length && <p className="crm-ayuda">Primero registra una empresa en Clientes / Empresas y una campaña en Marketing → Campañas.</p>}
      <p className="crm-ayuda">Sincronizar incorpora los días pendientes del período seleccionado. Puedes consultar hasta 90 días por campaña.</p>
    </section>}
    {error && !form && <p className="crm-error" role="alert">{error}<button className="crm-boton" disabled={ocupado} onClick={() => { setError(""); setRevision((n) => n + 1); }}>Reintentar conexión</button></p>}
    {mensaje && <p className="crm-exito" role="status">{mensaje}</p>}
    {lista && !lista.length && estado?.esquemaListo && <p className="crm-vacio">Todavía no hay campañas vinculadas. Un administrador puede vincular una campaña del cliente.</p>}
    {!!lista?.length && <section className="crm-panel"><div className="crm-filtros">
      <label className="crm-campo">Empresa cliente<select disabled={ocupado} value={cliente} onChange={(e) => filtrar({ clienteVista: e.target.value, campanaVista: "", pais: "" })}><option value="">Todas las empresas</option>{clientes.map(([id, nombre]) => <option value={id} key={id}>{nombre}</option>)}</select></label>
      <label className="crm-campo">Campaña publicitaria<select disabled={ocupado} value={id} onChange={(e) => filtrar({ campanaVista: e.target.value, pais: "" })}><option value="">Selecciona una campaña</option>{visibles.map((v) => <option value={v.id} key={v.id}>{referencia(v)} · {v.cliente} · {v.campana} ({plataformas[v.plataforma]})</option>)}</select></label>
      <label className="crm-campo">Desde<input type="date" value={desde} max={hasta} disabled={ocupado} onChange={(e) => filtrar({ desde: e.target.value })}/></label>
      <label className="crm-campo">Hasta<input type="date" value={hasta} min={desde} max={hoy()} disabled={ocupado} onChange={(e) => filtrar({ hasta: e.target.value })}/></label>
      <label className="crm-campo">País del resultado<select disabled={ocupado || !id} value={pais} onChange={(e) => filtrar({ pais: e.target.value })}><option value="">Todos los países</option>{estado?.paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select></label>
    </div><div className="crm-acciones">{estado?.gestionar && <button className="crm-boton crm-primario" disabled={ocupado || !id || !estado.configurado} onClick={sincronizar}><RefreshCw size={16}/>Sincronizar estadísticas</button>}<button className="crm-boton" disabled={ocupado || !datos?.dias.length} onClick={exportar}><Download size={16}/>Exportar CSV</button></div><p className="crm-ayuda">La sincronización incluye todos los países; el filtro País cambia la vista y el CSV. Los datos guardados no cambian al recargar.</p></section>}
    {id && cargando && !error && <p role="status">Consultando métricas…</p>}
    {datos && !cargando && <><p className="crm-ayuda">{datos.campana.cliente} · {datos.campana.campana} · {referencia(datos.campana)} · Moneda: {moneda}. Datos simulados con Mockaroo.</p>
      <p className="crm-ayuda">Última importación: {datos.campana.sincronizado_en ? new Date(datos.campana.sincronizado_en).toLocaleString("es-PE", { timeZone: "America/Lima" }) : "sin sincronizar"}.</p>
      {datos.campana.ultimo_error && <p className="crm-error" role="status">{datos.campana.ultimo_error}</p>}
      <ResultadosComerciales negocio={datos.negocio} campana={datos.campana} hasta={hasta} gestionar={estado?.gestionar} actualizar={() => { setDatos(null); setCargando(true); setRevision((n) => n + 1); }}/>
      {!datos.dias.length ? <p className="crm-vacio">No hay datos guardados para estos filtros. Sincroniza el período o selecciona otro país.</p> : <>
        <div className="crm-demo-kpis">{tarjetas.map(([etiqueta, valor, Icono, sufijo]) => <article className="crm-panel" key={etiqueta}><span className="crm-acciones"><Icono size={17}/>{etiqueta}</span><strong>{numero(valor)}{valor != null && sufijo ? ` ${sufijo}` : ""}</strong></article>)}</div>
        <p className="crm-ayuda">CTR = clics / impresiones. CPC = inversión / clics. CPM = inversión / impresiones × 1000. Los indicadores se calculan sobre totales; «—» indica que no hay base para calcularlos.</p>
        <EvolucionPublicidad dias={datos.dias} moneda={moneda}/><MapaPublicidad paises={datos.paises} ocupado={ocupado} seleccionar={(p) => filtrar({ pais: p })}/>
        <section className="crm-panel"><h2>Detalle diario</h2><div className="crm-scroll"><table><thead><tr>{["Fecha", "Impresiones", "Clics", "Inversión", "CTR", "CPM", "Conversiones"].map((n) => <th key={n} scope="col">{n}</th>)}</tr></thead><tbody>{datos.dias.map((d) => <tr key={d.fecha}><td>{d.fecha}</td><td>{numero(d.impresiones, 0)}</td><td>{numero(d.clics, 0)}</td><td>{numero(d.inversion)} {moneda}</td><td>{numero(d.ctr)} %</td><td>{numero(d.cpm)} {moneda}</td><td>{numero(d.conversiones, 0)}</td></tr>)}</tbody></table></div></section>
      </>}
    </>}
    {form && !descartar && <DialogoCrm titulo="Vincular campaña" ocupado={ocupado} cerrar={() => sucio ? setDescartar(true) : setForm(null)}><form noValidate className="crm-formulario" onSubmit={crear} onChange={() => setSucio(true)}>
      <label className="crm-campo crm-ancho">Campaña del cliente<select required value={form.campana_id} onChange={(e) => setForm({ ...form, campana_id: e.target.value })}><option value="">Seleccionar campaña</option>{estado.campanas.map((c) => <option key={c.id} value={c.id}>{c.cliente} · {c.nombre}</option>)}</select></label>
      <label className="crm-campo">Plataforma<select required value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })}>{Object.entries(plataformas).map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
      <label className="crm-campo">Moneda<select required value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}><option value="PEN">PEN · Soles</option><option value="USD">USD · Dólares</option></select></label>
      <p className="crm-ayuda crm-ancho">Referencia: {form.campana_id ? `${form.plataforma}-${form.campana_id}` : "selecciona una campaña"}. La referencia se asigna automáticamente a la campaña seleccionada.</p>
      {error && <p className="crm-error crm-ancho" id="demo-error" role="alert">{error}</p>}
      <div className="crm-acciones crm-ancho"><button className="crm-boton" type="button" disabled={ocupado} onClick={() => sucio ? setDescartar(true) : setForm(null)}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado} aria-busy={ocupado}>Guardar campaña</button></div>
    </form></DialogoCrm>}
    {descartar && <DialogoCrm titulo="Descartar cambios" cerrar={() => setDescartar(false)}><p>Se perderá la campaña que estás preparando.</p><div className="crm-acciones"><button className="crm-boton" onClick={() => setDescartar(false)}>Seguir editando</button><button className="crm-boton crm-peligro" onClick={() => { setDescartar(false); setForm(null); setSucio(false); }}>Descartar</button></div></DialogoCrm>}
  </section>;
}
