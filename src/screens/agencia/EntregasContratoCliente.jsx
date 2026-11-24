import { useEffect, useState } from "react";
import { CalendarDays, Check, Clapperboard, Download, Eye, FileChartColumn, FileText, PackageCheck } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { solicitarCrm, descargarCrm } from "../../servicios/servicioCrm";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import { VistaMaterial } from "./CentroEntregas";
import "../crm/Crm.css";

export default function EntregasContratoCliente({ contrato: c, vista = "todo", alCargar }) {
  const { token } = useAuth(),
    [datos, setDatos] = useState(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [ocupado, setOcupado] = useState(false),
    [decision, setDecision] = useState(null),
    [observacion, setObservacion] = useState(""),
    [previa, setPrevia] = useState(null);
  useEffect(() => {
    const control = new AbortController();
    solicitarCrm(`/entregas/portal/contratos/${c.id}`, token, {
      signal: control.signal,
    })
      .then((d) => {
        if (!control.signal.aborted) { setDatos(d); alCargar?.(c.id, d); }
      })
      .catch((e) => {
        if (!control.signal.aborted) setError(e.message);
      });
    return () => control.abort();
  }, [token, c.id, revision, alCargar]);
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa.url);
    },
    [previa],
  );
  async function descargar(f) {
    setOcupado(true);
    try {
      descargarCrm(
        await solicitarCrm(`/entregas/portal/versiones/${f.id}/pdf`, token, {
          archivo: true,
        }),
        `informe-v${f.numero}.pdf`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function mostrar(r) {
    setOcupado(true);
    try {
      const blob = await solicitarCrm(
        `/entregas/portal/medios/${r.media_id}`,
        token,
        { archivo: true },
      );
      setPrevia({
        url: URL.createObjectURL(blob),
        mime: blob.type,
        nombre: r.nombre,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  async function responder() {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      await solicitarCrm(
        `/entregas/portal/revisiones/${decision.fila.id}`,
        token,
        {
          method: "POST",
          body: {
            estado: decision.estado,
            version: decision.fila.version,
            observacion,
          },
        },
      );
      setDecision(null);
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }
  const general = vista === "contrato" || vista === "todo";
  const materiales = vista === "materiales" || vista === "todo";
  const informes = vista === "informes" || vista === "todo";
  const publicacion = c.servicio !== "ANALISIS" && datos?.prestaciones.some((p) => p.prestacion === "PUBLICACION" && Number(p.cantidad) > 0);
  return (
    <>
      {general && <section className="cliente-resumen-contrato">
        <div className="cliente-seccion-titulo"><span className="cliente-icono-lima"><FileText size={20} /></span><div><small>MI CONTRATO</small><h2>{c.nombre}</h2><p>{c.servicio} · {c.estado} · {c.desde} a {c.hasta}</p></div></div>
        {c.alcance && <p className="cliente-alcance">{c.alcance}</p>}
        <div className="cliente-importes">{[["Honorarios previstos",c.honorarios],...(c.servicio === "ANALISIS" ? [] : [["Producción",c.produccion],["Presupuesto autorizado",c.presupuesto]])].map(([nombre,valor])=><div key={nombre}><span>{nombre}</span><strong>{Number(valor).toLocaleString("es-PE")} <small>{c.moneda}</small></strong></div>)}</div>
      </section>}
      {error && <p role="alert" className="crm-error">{error}<button className="crm-boton" onClick={()=>{setError("");setRevision((v)=>v+1);}}>Reintentar</button></p>}
      {!datos ? <p role="status" className="cliente-cargando">Cargando entregas…</p> : <>
        {general && <>
          <section className="cliente-recorrido">
            <div className="cliente-seccion-titulo"><span className="cliente-icono-lima"><PackageCheck size={20} /></span><div><small>RECORRIDO DEL SERVICIO</small><h2>Mis entregables</h2></div></div>
            {datos.entregables.length ? <div className="cliente-timeline">{[...datos.entregables].sort((a,b)=>String(a.fecha||"").localeCompare(String(b.fecha||""))).map((t,i)=><article key={t.id || i} className="cliente-evento"><span className="cliente-evento-nodo"><CalendarDays size={17}/></span><time dateTime={t.fecha}>{t.fecha}</time><div className="cliente-evento-tarjeta"><span className="cliente-estado">{t.estado}</span><h3>{t.nombre}</h3><p>{t.cantidad} unidades</p>{t.descripcion && <p>{t.descripcion}</p>}</div></article>)}</div> : <div className="cliente-vacio"><PackageCheck size={25}/><p>Aún no hay entregables registrados.</p></div>}
            <h3 className="cliente-subtitulo">Prestaciones contratadas</h3><div className="cliente-prestaciones">{datos.prestaciones.map((p)=><span key={p.prestacion}><Check size={14}/>{p.prestacion.replaceAll("_"," ").toLowerCase()}<strong>{p.cantidad}</strong></span>)}</div>
          </section>
          <section className="cliente-publicaciones"><div className="cliente-seccion-titulo"><span className="cliente-icono-suave"><Clapperboard size={20}/></span><div><small>ACTIVIDAD DEL CONTRATO</small><h2>{c.servicio === "ANALISIS" ? "Anuncios analizados" : "Mis publicaciones"}</h2></div></div>{datos.anuncios.length ? <div className="cliente-tarjetas">{datos.anuncios.map((a)=><article className="cliente-tarjeta" key={a.id}><small>{a.fecha} · {a.codigo}</small><h3>{a.nombre}</h3><span className="cliente-estado">{a.estado}</span></article>)}</div> : <p className="cliente-vacio">Aún no hay anuncios asociados a este contrato.</p>}</section>
        </>}
        {materiales && publicacion && <section className="cliente-materiales"><div className="cliente-seccion-titulo"><span className="cliente-icono-lima"><Clapperboard size={20}/></span><div><small>REVISIÓN CREATIVA</small><h2>Materiales y aprobaciones</h2><p>Consulta las piezas que la agencia compartió contigo.</p></div></div>{!datos.revisiones.length ? <div className="cliente-vacio"><Clapperboard size={26}/><p>No hay materiales enviados para tu revisión.</p></div> : <div className="cliente-tarjetas">{datos.revisiones.map((r)=><article className="cliente-tarjeta" key={r.id}><span className="cliente-tarjeta-icono"><Clapperboard size={26} strokeWidth={1.3}/></span><small>{r.codigo}</small><h3>{r.nombre}</h3><span className="cliente-estado">{r.estado}</span>{r.observacion && <p>{r.observacion}</p>}<div className="crm-acciones"><button className="crm-boton" disabled={ocupado} onClick={()=>mostrar(r)}><Eye size={16}/>Ver material</button>{r.estado === "PENDIENTE" && ["APROBADO","RECHAZADO"].map((estado)=><button key={estado} className={estado === "APROBADO" ? "crm-boton crm-primario" : "crm-boton"} disabled={ocupado} onClick={()=>{setDecision({fila:r,estado});setObservacion("");}}>{estado === "APROBADO" ? "Aprobar material" : "Solicitar cambios"}</button>)}</div></article>)}</div>}</section>}
        {informes && <section className="cliente-informes"><div className="cliente-seccion-titulo"><span className="cliente-icono-lima"><FileChartColumn size={20}/></span><div><small>BIBLIOTECA DE RESULTADOS</small><h2>Mis informes y resultados</h2><p>Resultados y recomendaciones publicados por la agencia para tu empresa.</p></div></div>{datos.informes.length ? <div className="cliente-tarjetas">{datos.informes.map((f)=><article className="cliente-tarjeta" key={f.id}><span className="cliente-tarjeta-icono"><FileChartColumn size={28} strokeWidth={1.3}/></span><small>Informe · Versión {f.numero}</small><h3>{f.titulo}</h3><button className="crm-boton crm-primario" disabled={ocupado} onClick={()=>descargar(f)}><Download size={16}/>Descargar PDF</button></article>)}</div> : <div className="cliente-vacio"><FileChartColumn size={26}/><p>Aún no se publicaron informes.</p></div>}</section>}
      </>}
      {previa && (
        <VistaMaterial previa={previa} cerrar={() => setPrevia(null)} />
      )}
      {decision && (
        <DialogoCrm
          titulo="Confirmar decisión del material"
          ocupado={ocupado}
          cerrar={() => setDecision(null)}
        >
          <p>
            {decision.estado === "APROBADO"
              ? "La agencia podrá continuar con la publicación simulada de este material."
              : "Describe los cambios que solicitas a la agencia."}
          </p>
          <label className="crm-campo">
            Observación
            <textarea
              rows={4}
              maxLength={2000}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </label>
          {error && (
            <p className="crm-error" role="alert">
              {error}
            </p>
          )}
          <div className="crm-acciones">
            <button
              className="crm-boton"
              disabled={ocupado}
              onClick={() => setDecision(null)}
            >
              Cancelar
            </button>
            <button
              className="crm-boton crm-primario"
              disabled={
                ocupado ||
                (decision.estado === "RECHAZADO" && !observacion.trim())
              }
              onClick={responder}
            >
              Registrar decisión
            </button>
          </div>
        </DialogoCrm>
      )}
    </>
  );
}
