import { useEffect, useState } from "react";
import { Plus, Ban } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";

const numero = (n) => n == null ? "—" : Number(n).toLocaleString("es-PE", { maximumFractionDigits: 2 });
export default function ResultadosComerciales({ negocio, campana, hasta, gestionar, actualizar }) {
  const { token } = useAuth();
  const [form, setForm] = useState(null), [error, setError] = useState(""), [ocupado, setOcupado] = useState(false), [anular, setAnular] = useState(null), [descartar, setDescartar] = useState(false), [sucio, setSucio] = useState(false);
  const api = (ruta, opciones) => solicitarCrm(`/rendimiento/inversiones${ruta}`, token, opciones);
  useEffect(() => { if (!sucio) return; const avisar = (e) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", avisar); return () => window.removeEventListener("beforeunload", avisar); }, [sucio]);
  async function guardar(e) {
    e.preventDefault(); if (ocupado) return;
    const invalido = [...e.currentTarget.elements].find((c) => c.willValidate && !c.validity.valid);
    if (invalido) { setError("Completa concepto, fecha e importe positivo."); invalido.setAttribute("aria-invalid", "true"); invalido.setAttribute("aria-describedby", "gasto-error"); invalido.focus(); return; }
    setOcupado(true); setError("");
    try { await api("", { method: "POST", body: { ...form, campana_id: campana.campana_id, moneda: campana.moneda } }); setForm(null); setSucio(false); actualizar(); } catch (e) { setError(e.message); } finally { setOcupado(false); }
  }
  async function confirmarAnulacion() { if (ocupado) return; setOcupado(true); setError(""); try { await api(`/${anular.id}/anular`, { method: "PUT", body: { version: anular.version } }); setAnular(null); actualizar(); } catch (e) { setError(e.message); } finally { setOcupado(false); } }
  if (!negocio) return null;
  const indicadores = [["Leads registrados", negocio.leads, ""], ["Ventas ganadas atribuidas", negocio.ventas, ""], ["Ingresos de ventas ganadas", negocio.ingresos, negocio.moneda], ["Inversión de la campaña", negocio.inversion, negocio.moneda], ["CPL · costo por lead", negocio.cpl, negocio.moneda], ["ROAS sobre ventas ganadas", negocio.roas, "×"], ["ROI publicitario", negocio.roi, "%"]];
  return <section className="crm-panel" aria-label="Resultados comerciales"><header className="crm-cabecera"><div><h2>Inversión y ventas atribuidas</h2><p className="crm-ayuda">Campaña completa · todos los canales y países · {negocio.moneda} · atribución al primer origen.</p></div>{gestionar && <button className="crm-boton" disabled={ocupado} onClick={() => { setForm({ concepto: "", fecha: hasta, importe: "", idempotencia: crypto.randomUUID() }); setSucio(false); setError(""); }}><Plus size={16}/>Registrar inversión adicional</button>}</header>
    <div className="crm-demo-kpis">{indicadores.map(([nombre, valor, sufijo]) => <article className="crm-panel" key={nombre}><span>{nombre}</span><strong>{numero(valor)}{valor != null && sufijo ? ` ${sufijo}` : ""}</strong></article>)}</div>
    <p className="crm-ayuda">Los ingresos corresponden a oportunidades ganadas del CRM. ROAS = ingresos / inversión. ROI publicitario = (ingresos − inversión) / inversión × 100; no incluye costos de los productos ni acredita pagos cobrados. El filtro de país solo afecta a las estadísticas de anuncios.</p>
    <h3>Inversiones adicionales</h3><p className="crm-ayuda">Registra gastos de producción, pauta offline u otros conceptos adicionales. La pauta importada ya está incluida y no debe registrarse otra vez. Se muestran hasta 100 registros del período.</p>
    {negocio.inversiones?.length ? <div className="crm-scroll"><table><thead><tr>{["Fecha", "Concepto", "Importe", "Estado", "Acciones"].map((n) => <th key={n} scope="col">{n}</th>)}</tr></thead><tbody>{negocio.inversiones.map((f) => <tr key={f.id}><td>{String(f.fecha).slice(0, 10)}</td><td>{f.concepto}</td><td>{numero(f.importe)} {f.moneda}</td><td>{f.anulado ? "Anulado" : "Registrado"}</td><td>{gestionar && !f.anulado && <button className="crm-boton" disabled={ocupado} onClick={() => { setAnular(f); setError(""); }}><Ban size={15}/>Anular</button>}</td></tr>)}</tbody></table></div> : <p className="crm-vacio">No hay inversiones adicionales registradas para este período y moneda.</p>}
    {error && !form && !anular && <p className="crm-error" role="alert">{error}</p>}
    {form && !descartar && <DialogoCrm formulario titulo="Registrar inversión adicional" ocupado={ocupado} cerrar={() => sucio ? setDescartar(true) : setForm(null)}><form noValidate className="crm-formulario" onSubmit={guardar} onChange={() => setSucio(true)}>
      <p className="crm-ayuda crm-ancho">{campana.campana} · Moneda: {campana.moneda}. No dupliques la pauta importada.</p>
      <label className="crm-campo crm-ancho">Concepto<input required maxLength={200} value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })}/></label>
      <label className="crm-campo">Fecha<input type="date" required value={form.fecha} max={new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date())} onChange={(e) => setForm({ ...form, fecha: e.target.value })}/></label>
      <label className="crm-campo">Importe<input required type="number" min="0.01" max="999999999" step="0.01" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })}/></label>
      {error && <p className="crm-error crm-ancho" role="alert" id="gasto-error">{error}</p>}<div className="crm-acciones crm-ancho"><button className="crm-boton" type="button" disabled={ocupado} onClick={() => sucio ? setDescartar(true) : setForm(null)}>Cancelar</button><button className="crm-boton crm-primario" disabled={ocupado}>Guardar inversión</button></div>
    </form></DialogoCrm>}
    {descartar && <DialogoCrm titulo="Descartar cambios" cerrar={() => setDescartar(false)}><p>Se perderá la inversión que estás preparando.</p><div className="crm-acciones"><button className="crm-boton" onClick={() => setDescartar(false)}>Seguir editando</button><button className="crm-boton crm-peligro" onClick={() => { setDescartar(false); setForm(null); setSucio(false); }}>Descartar</button></div></DialogoCrm>}
    {anular && <DialogoCrm titulo="Anular inversión" ocupado={ocupado} cerrar={() => setAnular(null)}><p>Se excluirá «{anular.concepto}» por {numero(anular.importe)} {anular.moneda} de los indicadores. El registro se conserva en el historial.</p>{error && <p className="crm-error" role="alert">{error}</p>}<div className="crm-acciones"><button className="crm-boton" disabled={ocupado} onClick={() => setAnular(null)}>Cancelar</button><button className="crm-boton crm-peligro" disabled={ocupado} onClick={confirmarAnulacion}>Confirmar anulación</button></div></DialogoCrm>}
  </section>;
}
