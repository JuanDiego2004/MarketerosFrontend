import { useState } from "react";
import { Target, CalendarClock, Banknote, Users, MapPin, RefreshCw } from "lucide-react";
import Campo from "./CampoContrato";

const objetivosHabituales=["Reconocimiento de marca","Tráfico al sitio web","Interacción","Generación de clientes potenciales","Ventas","Reproducciones de video","Mensajes y consultas"];
const normalizar=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");

export default function PlanCanalContrato({canal:c,cambiar,usuarios,modalidad,moneda,audiencias=[],audienciasPermitidas=true,audienciasCargando=false,audienciasError="",actualizarAudiencias,objetivos=[]}){
 const [filtro,setFiltro]=useState("");
 const [objetivoPropio,setObjetivoPropio]=useState(false);
 const sugerencias=[...new Set([...objetivosHabituales,...objetivos.filter(v=>typeof v==="string"&&v.trim())])];
 const seleccionObjetivo=objetivoPropio||c.objetivo&&!sugerencias.includes(c.objetivo)?"__PROPIO__":c.objetivo;
 const activas=audiencias.filter(a=>a.estado==="ACTIVO");
 const seleccionada=activas.find(a=>String(a.idSegmento)===String(c.audiencia_id));
 const visibles=activas.filter(a=>String(a.idSegmento)===String(c.audiencia_id)||normalizar([a.nombre,a.descripcion,a.criterios,a.ubicacionGeografica,a.intereses].join(" ")).includes(normalizar(filtro)));
 const pagada=c.modalidad==="PAGADA";
 function elegirAudiencia(id){const a=activas.find(a=>String(a.idSegmento)===id);cambiar({audiencia_id:id,audiencia:a?.nombre||"",cobertura:a?.ubicacionGeografica||""});}
 return <section className="crm-plan-canal" aria-label={`Plan de ${c.plataforma}`}>
  <header className="crm-plan-canal-cabecera"><h4>{c.plataforma}</h4><span className="crm-etiqueta">{pagada?"Difusión pagada":"Difusión orgánica"}</span></header>
  <section className="crm-plan-bloque" aria-label={`Objetivo y mensaje ${c.plataforma}`}>
   <h5><Target size={18} aria-hidden="true"/>Objetivo y mensaje</h5>
   <div className="crm-formulario">
    <Campo label={`Objetivo ${c.plataforma}`} tipo="select" valor={seleccionObjetivo} opciones={[...sugerencias.map(id=>({id,nombre:id})),{id:"__PROPIO__",nombre:"Escribir otro objetivo"}]} cambiar={v=>{setObjetivoPropio(v==="__PROPIO__");cambiar({objetivo:v==="__PROPIO__"?"":v});}}/>
    {seleccionObjetivo==="__PROPIO__"&&<Campo label={`Objetivo personalizado ${c.plataforma}`} valor={c.objetivo} maxLength={300} cambiar={v=>cambiar({objetivo:v})}/>}
    <Campo label={`Texto propio ${c.plataforma}`} tipo="textarea" requerido={false} valor={c.texto} cambiar={v=>cambiar({texto:v})}/>
   </div>
  </section>
  <section className="crm-plan-bloque" aria-label={`Programación ${c.plataforma}`}>
   <h5><CalendarClock size={18} aria-hidden="true"/>Programación y responsable</h5>
   <div className="crm-formulario">
    <Campo label={`Fecha y hora ${c.plataforma} (Lima)`} tipo="datetime-local" valor={c.programado_en.slice(0,16)} cambiar={v=>cambiar({programado_en:`${v}:00-05:00`})}/>
    <Campo label={`Responsable ${c.plataforma}`} tipo="select" valor={c.responsable_id} opciones={usuarios} cambiar={v=>cambiar({responsable_id:v})}/>
   </div>
  </section>
  <section className="crm-plan-bloque" aria-label={`Inversión ${c.plataforma}`}>
   <h5><Banknote size={18} aria-hidden="true"/>Modalidad e inversión</h5>
   <div className="crm-formulario">
    <Campo label={`Modalidad ${c.plataforma}`} tipo="select" valor={c.modalidad} opciones={(modalidad==="MIXTA"?["ORGANICA","PAGADA"]:[modalidad]).map(id=>({id,nombre:id==="PAGADA"?"Pagada":"Orgánica"}))} cambiar={v=>cambiar({modalidad:v,presupuesto:0})}/>
    {pagada?<Campo label={`Presupuesto ${c.plataforma}`} ayuda={`Importe en ${moneda}. Forma parte del presupuesto autorizado del contrato.`} tipo="number" min="0.01" valor={c.presupuesto} cambiar={v=>cambiar({presupuesto:v})}/>:<p className="crm-ayuda">La difusión orgánica no requiere presupuesto de pauta.</p>}
   </div>
  </section>
  {pagada&&<section className="crm-plan-bloque" aria-label={`Público ${c.plataforma}`}>
   <div className="crm-cabecera"><h5><Users size={18} aria-hidden="true"/>Audiencia registrada</h5><button type="button" className="crm-boton" onClick={actualizarAudiencias} disabled={audienciasCargando} aria-busy={audienciasCargando}><RefreshCw size={16} aria-hidden="true"/>{audienciasCargando?"Actualizando audiencias…":"Actualizar audiencias"}</button></div>
   <p className="crm-ayuda">Selecciona una audiencia del módulo Audiencias. Su ubicación completa la cobertura y puedes ajustarla para este canal.</p>
   {audienciasError?<p role="alert" className="crm-error">No se pudieron cargar las audiencias: {audienciasError} Pulsa «Actualizar audiencias» para reintentar.</p>:!audienciasPermitidas?<p role="status">Tu cuenta necesita permiso para consultar Audiencias.</p>:audienciasCargando?<p role="status">Cargando audiencias registradas…</p>:!activas.length?<p role="status">No hay audiencias activas en el catálogo consultado. Si acabas de registrar una, pulsa «Actualizar audiencias».</p>:null}
   <div className="crm-formulario">
    <Campo label={`Filtrar audiencias ${c.plataforma}`} requerido={false} deshabilitado={!audienciasPermitidas||!activas.length} valor={filtro} ayuda="Busca por nombre, ubicación, criterios o intereses." cambiar={setFiltro}/>
    <Campo label={`Audiencia ${c.plataforma}`} tipo="select" valor={c.audiencia_id||""} opciones={visibles.map(a=>({id:a.idSegmento,nombre:a.nombre}))} cambiar={elegirAudiencia}/>
   </div>
   {activas.length>0&&visibles.length===0&&<p role="status">No hay audiencias que coincidan con el filtro.</p>}
   {c.audiencia&&!c.audiencia_id&&<p className="crm-ayuda">Audiencia del borrador anterior: {c.audiencia}. Selecciona el registro para vincularlo.</p>}
   {c.audiencia_id&&!activas.some(a=>String(a.idSegmento)===String(c.audiencia_id))&&<p role="status" className="crm-error">La audiencia seleccionada ya no está disponible. Elige una audiencia activa.</p>}
   {seleccionada&&<dl className="crm-plan-audiencia">
    <div><dt>Edades</dt><dd>{seleccionada.edadMin??"Sin mínimo"} – {seleccionada.edadMax??"Sin máximo"}</dd></div>
    <div><dt>Ubicación</dt><dd>{seleccionada.ubicacionGeografica||"Sin ubicación registrada"}</dd></div>
    <div><dt>Intereses</dt><dd>{seleccionada.intereses||"Sin intereses registrados"}</dd></div>
    {seleccionada.criterios&&<div><dt>Criterios</dt><dd>{seleccionada.criterios}</dd></div>}
   </dl>}
   <div className="crm-plan-cobertura"><MapPin size={18} aria-hidden="true"/><Campo label={`Cobertura ${c.plataforma}`} valor={c.cobertura} maxLength={1000} ayuda="Zona donde se planifica la difusión. No modifica la audiencia original." cambiar={v=>cambiar({cobertura:v})}/></div>
  </section>}
 </section>;
}
