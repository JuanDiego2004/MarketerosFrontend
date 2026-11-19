const nombres={PRODUCCION:"Producción de piezas",EDICION:"Edición de materiales",PUBLICACION:"Anuncios y publicaciones",ANALISIS:"Anuncios para analizar",INFORMES:"Informes"};
export default function AlcanceContrato({servicio,valor,cambiar}){
 const filas=valor || [];
 return <fieldset className="crm-panel crm-ancho"><legend>Prestaciones y cantidades incluidas</legend><p className="crm-ayuda">Estas cantidades limitan los anuncios y entregables del servicio. Las condiciones descriptivas se conservan en Alcance.</p>{Object.entries(nombres).filter(([k])=>servicio!=="ANALISIS" || ["ANALISIS","INFORMES"].includes(k)).map(([k,n])=>{
  const item=filas.find(f=>f.prestacion===k);
  return <div className="crm-acciones" key={k}><label><input type="checkbox" checked={!!item} onChange={e=>cambiar(e.target.checked?[...filas,{prestacion:k,cantidad:1}]:filas.filter(f=>f.prestacion!==k))}/>{n}</label>{item && <label>Cantidad de {n.toLowerCase()}<input aria-label={`Cantidad de ${n.toLowerCase()}`} type="number" min="1" max="10000" required value={item.cantidad} onChange={e=>cambiar(filas.map(f=>f.prestacion===k?{...f,cantidad:e.target.value}:f))}/></label>}</div>;
 })}</fieldset>;
}
