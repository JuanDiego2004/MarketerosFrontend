import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, CircleCheck, Info, LoaderCircle, Megaphone, Radio, RotateCcw, Save, Search, ShieldCheck, SlidersHorizontal, UsersRound, Building2, ChartNoAxesCombined, Layers3 } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth";
import { actualizarPermisosRol, listarPermisosAdministrador, listarRolesAdministrador } from "../../servicios/servicioAdministrador";
import { listarUsuarios } from "../../servicios/servicioUsuarios";
import DialogoCrm from "../../componentes/crm/DialogoCrm";
import SelectorRol from "../../componentes/roles/SelectorRol";
import { agruparPermisos, alternarPermisos, inicialesPersona, mismosPermisos, nombreRolVisible, normalizarIdsPermisos, usuariosPorRol } from "../../utils/permisosRoles";
import { normalizarTexto, obtenerGrupoRol } from "../../utils/roles";
import "./RolesPermisosAdministrador.css";

function Casilla({ parcial, ...props }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = Boolean(parcial); }, [parcial]);
  return <input ref={ref} type="checkbox" {...props} />;
}
function iconoModulo(grupo) {
  const nombre = normalizarTexto(grupo.nombre);
  if (nombre.includes("campana") || nombre.includes("contenido")) return Megaphone;
  if (nombre.includes("canal")) return Radio;
  if (nombre.includes("cliente") || nombre.includes("empresa")) return Building2;
  if (nombre.includes("audiencia") || nombre.includes("contacto") || nombre.includes("segmento")) return UsersRound;
  if (/metric|indicador|reporte|dashboard|atribucion|meta/.test(nombre)) return ChartNoAxesCombined;
  return Layers3;
}

export default function RolesPermisosAdministrador() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]), [permisos, setPermisos] = useState([]), [usuarios, setUsuarios] = useState([]);
  const [seleccionado, setSeleccionado] = useState(""), [marcados, setMarcados] = useState([]);
  const [cargando, setCargando] = useState(true), [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(""), [mensaje, setMensaje] = useState("");
  const [errorUsuarios, setErrorUsuarios] = useState(""), [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [recarga, setRecarga] = useState(0), [recargaUsuarios, setRecargaUsuarios] = useState(0);
  const [busqueda, setBusqueda] = useState(""), [todosUsuarios, setTodosUsuarios] = useState(false), [dialogo, setDialogo] = useState(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([listarRolesAdministrador(token), listarPermisosAdministrador(token)]).then(([rs, ps]) => {
      if (!vigente) return;
      setRoles(rs); setPermisos(ps); setSeleccionado(String(rs[0]?.idRol ?? "")); setMarcados(normalizarIdsPermisos(rs[0]?.permisos));
    }).catch((e) => { if (vigente) setError(e.message); }).finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [token, recarga]);
  useEffect(() => {
    let vigente = true;
    listarUsuarios(token).then((us) => { if (vigente) setUsuarios(us); }).catch((e) => { if (vigente) setErrorUsuarios(e.message); }).finally(() => { if (vigente) setCargandoUsuarios(false); });
    return () => { vigente = false; };
  }, [token, recargaUsuarios]);

  const equipos = useMemo(() => usuariosPorRol(usuarios), [usuarios]);
  const grupos = useMemo(() => agruparPermisos(permisos), [permisos]);
  const rol = roles.find((r) => String(r.idRol) === seleccionado);
  const originales = normalizarIdsPermisos(rol?.permisos);
  const equipo = equipos.get(seleccionado) || [];
  const pendientes = !mismosPermisos(marcados, originales);
  const idsCatalogo = normalizarIdsPermisos(permisos);
  const activos = idsCatalogo.filter((id) => marcados.includes(id)).length;
  const visibles = grupos.filter((g) => normalizarTexto(`${g.nombre} ${g.descripcion} ${g.permisos.map((p) => `${p.codigo} ${p.descripcion}`).join(" ")}`).includes(normalizarTexto(busqueda)));
  const idsVisibles = normalizarIdsPermisos(visibles.flatMap((g) => g.permisos));
  const seleccionadosVisibles = idsVisibles.filter((id) => marcados.includes(id)).length;
  const cambiar = (id) => {
    setSeleccionado(id); setMarcados(normalizarIdsPermisos(roles.find((r) => String(r.idRol) === id)?.permisos));
    setMensaje(""); setError(""); setTodosUsuarios(false); setDialogo(null);
  };
  function editar(ids, activar) { setMarcados((actual) => alternarPermisos(actual, ids, activar)); setMensaje(""); }
  function reintentarCatalogo() { setCargando(true); setError(""); setRecarga((n) => n + 1); }
  function reintentarEquipo() { setCargandoUsuarios(true); setErrorUsuarios(""); setRecargaUsuarios((n) => n + 1); }
  async function guardar() {
    const deseados = normalizarIdsPermisos(marcados);
    setGuardando(true); setError(""); setMensaje("");
    try {
      await actualizarPermisosRol(Number(seleccionado), deseados, token);
      const actualizados = await listarRolesAdministrador(token);
      const actualizado = actualizados.find((r) => String(r.idRol) === seleccionado);
      if (!actualizado || !mismosPermisos(actualizado.permisos, deseados)) throw new Error("El servidor no confirmó todos los cambios. Revisa los permisos y vuelve a guardar.");
      setRoles(actualizados); setMarcados(normalizarIdsPermisos(actualizado.permisos)); setDialogo(null);
      setMensaje("Permisos guardados y verificados con el servidor.");
    } catch (e) { setError(e.message); setDialogo(null); }
    finally { setGuardando(false); }
  }

  return <main className="crm roles-permisos" aria-busy={cargando}>
    <header className="roles-cabecera"><span className="roles-titulo-icono"><ShieldCheck size={29} strokeWidth={1.6}/></span><div><span className="roles-antetitulo">CONFIGURACIÓN · ACCESO AL SISTEMA</span><h1>Roles y permisos</h1><p>Define las capacidades de cada rol y conoce al equipo que lo tiene asignado.</p></div><div className="roles-decoracion" aria-hidden="true"><UsersRound size={52} strokeWidth={1.2}/><ShieldCheck size={31}/></div></header>
    {cargando ? <div className="roles-cargando" role="status"><LoaderCircle className="roles-girando" size={22}/> Cargando roles y permisos…</div> : !rol ? <section className="roles-vacio">{error ? <><p role="alert">{error}</p><button className="crm-boton" onClick={reintentarCatalogo}>Reintentar</button></> : <><ShieldCheck size={32}/><h2>No hay roles disponibles</h2><p>Los roles aparecerán cuando estén registrados en el sistema.</p></>}</section> : <>
      <section className="roles-barra" aria-label="Selección y acciones del rol"><SelectorRol roles={roles} equipos={equipos} equipoDisponible={!cargandoUsuarios && !errorUsuarios} valor={seleccionado} disabled={guardando} alCambiar={(id) => { if (id !== seleccionado) pendientes ? setDialogo({ tipo:"cambiar", id }) : cambiar(id); }}/><div className="roles-barra-acciones"><Link className="crm-boton" to="/usuarios"><UsersRound size={17}/> Gestionar usuarios<ArrowUpRight size={14}/></Link><button className="crm-boton" disabled={!pendientes || guardando} onClick={() => { setMarcados(originales); setMensaje(""); setError(""); }}><RotateCcw size={16}/> Restablecer</button><button className="crm-boton primario" disabled={!pendientes || guardando} onClick={() => setDialogo({tipo:"guardar"})}><Save size={17}/> Guardar permisos</button></div></section>
      {error && <p role="alert" className="roles-alerta error">{error}</p>}{mensaje && <p role="status" className="roles-alerta exito"><Check size={18}/>{mensaje}</p>}
      <section className="roles-resumen" aria-label="Detalle del rol"><div className="roles-identidad"><span className="roles-avatar-grande"><ShieldCheck size={32} strokeWidth={1.5}/></span><div><span className="roles-antetitulo">ROL SELECCIONADO</span><h2>{nombreRolVisible(rol.nombreRol)}</h2><p>{rol.descripcion || "Capacidades de acceso asignadas a este perfil."}</p></div></div><dl className="roles-estadisticas"><div><dt><UsersRound size={16}/> Personas asignadas</dt><dd>{cargandoUsuarios || errorUsuarios ? "—" : equipo.length}</dd></div><div><dt><ShieldCheck size={16}/> Permisos seleccionados</dt><dd>{activos}<small> / {idsCatalogo.length}</small></dd></div><div><dt><Layers3 size={16}/> Módulos habilitados</dt><dd>{grupos.filter((g) => g.permisos.some((p) => marcados.includes(Number(p.idPermiso)))).length}<small> / {grupos.length}</small></dd></div></dl></section>
      <section className="roles-equipo" aria-labelledby="roles-equipo-titulo"><div className="roles-seccion-titulo"><div><h2 id="roles-equipo-titulo"><UsersRound size={18}/> Personas con este rol</h2><p>Usuarios registrados con el perfil {nombreRolVisible(rol.nombreRol)}.</p></div>{!errorUsuarios && !cargandoUsuarios && <span className="roles-contador">{equipo.length} {equipo.length === 1 ? "persona" : "personas"}</span>}</div>{cargandoUsuarios ? <p role="status" className="roles-mensaje">Cargando personas asignadas…</p> : errorUsuarios ? <div role="alert" className="roles-mensaje roles-error">No se pudo consultar el equipo. {errorUsuarios} <button onClick={reintentarEquipo}>Reintentar consulta</button></div> : !equipo.length ? <p className="roles-mensaje">Todavía no hay personas asignadas a este rol. Puedes asignarlas desde Gestión de usuarios.</p> : <><div className="roles-personas">{(todosUsuarios ? equipo : equipo.slice(0,6)).map((u) => <article key={u.idUsuario} className="roles-persona"><span className="roles-iniciales" aria-hidden="true">{inicialesPersona(u.nombres)}</span><div><h3>{u.nombres}</h3><p title={u.correo}>{u.correo}</p></div><span className={`roles-estado ${u.estado === "ACTIVO" ? "activo" : ""}`}>{u.estado === "ACTIVO" ? "Activo" : u.estado === "INACTIVO" ? "Inactivo" : u.estado || "Sin estado"}</span></article>)}</div>{equipo.length > 6 && <button className="roles-ver-equipo" onClick={() => setTodosUsuarios((v) => !v)}>{todosUsuarios ? "Ver menos personas" : `Ver las ${equipo.length} personas`}</button>}</>}</section>
      {obtenerGrupoRol(rol.nombreRol) === "administrador" && <p className="roles-nota"><Info size={16}/> El perfil Administrador conserva las capacidades administrativas del sistema.</p>}
      <section className="roles-catalogo" aria-labelledby="roles-permisos-titulo"><div className="roles-seccion-titulo roles-permisos-titulo"><div><h2 id="roles-permisos-titulo"><ShieldCheck size={21}/> Permisos por módulo</h2><p>Activa un módulo completo o ajusta cada capacidad por separado.</p></div><label className="roles-seleccionar"><Casilla checked={idsVisibles.length > 0 && seleccionadosVisibles === idsVisibles.length} parcial={seleccionadosVisibles > 0 && seleccionadosVisibles < idsVisibles.length} disabled={guardando || !idsVisibles.length} onChange={(e) => editar(idsVisibles,e.target.checked)}/>{busqueda ? "Seleccionar visibles" : "Seleccionar todos"}</label></div><label className="roles-busqueda"><Search size={17}/><input aria-label="Buscar módulo o permiso" placeholder="Buscar módulo o permiso…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}/><span>{visibles.length} módulos</span></label>
      {!permisos.length ? <div className="roles-vacio"><SlidersHorizontal size={28}/><h3>El catálogo de permisos está vacío</h3><p>No hay capacidades configuradas para asignar.</p></div> : !visibles.length ? <div className="roles-vacio"><Search size={25}/><p>No encontramos módulos para «{busqueda}».</p><button className="crm-boton" onClick={() => setBusqueda("")}>Limpiar búsqueda</button></div> : <div className="roles-modulos">{visibles.map((g) => {
        const ids = normalizarIdsPermisos(g.permisos), cantidad = ids.filter((id) => marcados.includes(id)).length, Icono = iconoModulo(g);
        return <section className={`rol-modulo ${cantidad ? "habilitado" : ""}`} key={g.clave} aria-label={`Permisos de ${g.nombre}`}><div className="rol-modulo-cabecera"><span className="rol-modulo-icono"><Icono size={23} strokeWidth={1.7}/></span><div><h3>{g.nombre}</h3><p>{g.descripcion}</p></div><button type="button" className="rol-switch" role="switch" aria-checked={cantidad > 0} aria-label={`Habilitar módulo ${g.nombre}`} title={cantidad > 0 && cantidad < ids.length ? "Permisos parcialmente habilitados" : undefined} disabled={guardando} onClick={() => editar(ids,cantidad === 0)}><span/></button></div><div className="rol-modulo-permisos">{g.permisos.map((p) => <label key={p.idPermiso} title={`${p.descripcion || p.codigo} · ${p.codigo}`}><input type="checkbox" aria-label={`${g.nombre}: ${p.etiqueta}`} checked={marcados.includes(Number(p.idPermiso))} disabled={guardando} onChange={(e) => editar([Number(p.idPermiso)],e.target.checked)}/><span>{p.etiqueta}</span></label>)}</div><span className="rol-modulo-conteo">{cantidad} de {ids.length} permisos</span></section>;
      })}</div>}</section>
      <footer className={`roles-guardado ${pendientes ? "pendiente" : ""}`}><span>{pendientes ? <Info size={19}/> : <CircleCheck size={19}/>}<span><strong>{pendientes ? "Tienes cambios sin guardar" : "Permisos sincronizados"}</strong><small>{pendientes ? "Guarda los ajustes para actualizar este rol." : "Los cambios se aplican al rol seleccionado."}</small></span></span><button className="crm-boton primario" disabled={!pendientes || guardando} onClick={() => setDialogo({tipo:"guardar"})}><Save size={17}/>{guardando ? "Guardando…" : "Guardar cambios"}</button></footer>

    </>}
    {dialogo && <DialogoCrm titulo={dialogo.tipo === "cambiar" ? "¿Cambiar de rol?" : "Confirmar permisos del rol"} cerrar={() => setDialogo(null)} ocupado={guardando} ilustracion="seguridad" aviso={dialogo.tipo === "cambiar" ? "Los cambios pendientes de este rol se descartarán." : "Revisa las capacidades antes de confirmar el cambio."}><p>{dialogo.tipo === "cambiar" ? "Tienes ajustes sin guardar. Puedes seguir editándolos o seleccionar el otro rol." : <>Actualizarás los permisos de <strong>{nombreRolVisible(rol?.nombreRol)}</strong>.</>}</p>{dialogo.tipo === "guardar" && <p>Se añadirán {marcados.filter((id) => !originales.includes(id)).length} y se retirarán {originales.filter((id) => !marcados.includes(id)).length} permisos.</p>}<div className="crm-acciones"><button onClick={() => setDialogo(null)}>{dialogo.tipo === "cambiar" ? "Seguir editando" : "Cancelar"}</button><button onClick={() => dialogo.tipo === "cambiar" ? cambiar(dialogo.id) : guardar()}>{dialogo.tipo === "cambiar" ? "Descartar y cambiar" : "Confirmar cambios"}</button></div></DialogoCrm>}
  </main>;
}
