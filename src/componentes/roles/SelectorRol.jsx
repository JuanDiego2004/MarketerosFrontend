import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserRound, UsersRound } from "lucide-react";
import { filtrarRoles, nombreRolVisible } from "../../utils/permisosRoles";

function resumenEquipo(personas) {
  if (!personas.length) return "Sin personas asignadas";
  const nombres = personas.slice(0,2).map((p) => p.nombres).join(", ");
  return nombres + (personas.length > 2 ? ` y ${personas.length - 2} más` : "");
}

export default function SelectorRol({ roles, equipos, valor, alCambiar, disabled, equipoDisponible = true }) {
  const [abierto,setAbierto] = useState(false);
  const [busqueda,setBusqueda] = useState("");
  const [activo,setActivo] = useState(0);
  const contenedor = useRef(null);
  const input = useRef(null);
  const listaId = useId();
  const elegido = roles.find((r) => String(r.idRol) === valor);
  const opciones = filtrarRoles(roles,equipos,busqueda);
  const indice = Math.min(activo,Math.max(0,opciones.length-1));

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (!contenedor.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener("pointerdown",fuera);
    return () => document.removeEventListener("pointerdown",fuera);
  },[abierto]);

  function elegir(rol) {
    setAbierto(false);
    setBusqueda("");
    alCambiar(String(rol.idRol));
    input.current?.focus();
  }
  function teclado(e) {
    if (e.key === "Escape") { e.preventDefault(); setAbierto(false); setBusqueda(""); return; }
    if (e.key === "Tab") { setAbierto(false); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => abierto ? (a + (e.key === "ArrowDown" ? 1 : -1) + opciones.length) % Math.max(1,opciones.length) : 0);
    }
    if (e.key === "Enter") { e.preventDefault(); if (abierto && opciones[indice]) elegir(opciones[indice]); else setAbierto(true); }
  }

  return <div ref={contenedor} className="rol-selector" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false); }}>
    <label htmlFor={`buscar-${listaId}`}>Seleccionar rol</label>
    <div className="rol-selector-campo"><UserRound size={19} aria-hidden="true"/><input ref={input} id={`buscar-${listaId}`} role="combobox" aria-expanded={abierto} aria-controls={abierto ? listaId : undefined} aria-autocomplete="list" aria-activedescendant={abierto && opciones[indice] ? `${listaId}-${opciones[indice].idRol}` : undefined} disabled={disabled} placeholder="Buscar rol o trabajador…" value={abierto ? busqueda : nombreRolVisible(elegido?.nombreRol || "")} onClick={() => {if (!abierto) {setAbierto(true);setBusqueda("");setActivo(0);}}} onChange={(e)=>{setBusqueda(e.target.value);setAbierto(true);setActivo(0);}} onKeyDown={teclado}/><button type="button" disabled={disabled} aria-label={abierto ? "Cerrar selector de rol" : "Abrir selector de rol"} tabIndex={-1} onClick={()=>{setAbierto((v)=>!v);setBusqueda("");input.current?.focus();}}><ChevronDown size={18}/></button></div>
    {abierto && <div className="rol-selector-desplegable"><p><Search size={13}/> Busca un rol, nombre o correo</p><div id={listaId} role="listbox" aria-label="Roles disponibles">{opciones.length ? opciones.map((r,i)=><button type="button" role="option" tabIndex={-1} id={`${listaId}-${r.idRol}`} key={r.idRol} aria-selected={String(r.idRol)===valor} data-activo={i===indice} onPointerMove={()=>setActivo(i)} onMouseDown={(e)=>e.preventDefault()} onClick={()=>elegir(r)}><span className="rol-opcion-icono"><UserRound size={17}/></span><span><strong>{nombreRolVisible(r.nombreRol)}</strong><small><UsersRound size={12}/>{equipoDisponible ? resumenEquipo(equipos.get(String(r.idRol)) || []) : "Equipo pendiente de consulta"}</small></span>{String(r.idRol)===valor && <Check size={16} className="rol-opcion-check"/>}</button>) : <div className="rol-selector-vacio">No hay roles o personas que coincidan.</div>}</div></div>}
  </div>;
}

