export default function CampoContrato({label,valor,cambiar,tipo="text",opciones=[],requerido=true,deshabilitado=false,ayuda,min,maxLength=160}){
 const props={disabled:deshabilitado,"aria-label":label,value:valor??"",required:requerido,onChange:e=>{e.currentTarget.removeAttribute("aria-invalid");e.currentTarget.removeAttribute("aria-describedby");cambiar(e.target.value);}};
 return <label className={`crm-campo ${tipo==="textarea"?"crm-ancho":""}`}>
  {label}{requerido?" *":""}
  {tipo==="select"?<select {...props}><option value="">Seleccionar</option>{opciones?.map(o=><option key={o.id} value={o.id}>{o.nombre}</option>)}</select>
   :tipo==="textarea"?<textarea {...props} rows={4} maxLength={4000}/>
   :<input {...props} type={tipo} min={min??(tipo==="number"?0:undefined)} step={tipo==="number"?"0.01":undefined} maxLength={tipo==="text"?maxLength:undefined}/>}
  {ayuda&&<span className="crm-ayuda">{ayuda}</span>}
 </label>;
}
