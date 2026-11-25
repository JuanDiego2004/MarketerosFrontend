import { normalizarTexto } from "./roles.js";

export function normalizarIdsPermisos(permisos = []) {
  return [...new Set(permisos.map((p) => Number(typeof p === "object" ? p?.idPermiso : p)).filter((id) => Number.isInteger(id) && id > 0))].sort((a,b) => a-b);
}

export function mismosPermisos(a, b) {
  const uno = normalizarIdsPermisos(a), dos = normalizarIdsPermisos(b);
  return uno.length === dos.length && uno.every((id,i) => id === dos[i]);
}

const CRM = {
  CONTACTOS:["Contactos / Leads","Seguimiento de personas y contactos comerciales."],
  CUENTAS:["Empresas del CRM","Consulta y gestión de las fichas de empresa."],
  PIPELINE:["Pipeline","Seguimiento de oportunidades y cierres."],
  ETAPAS:["Etapas del pipeline","Configuración del recorrido comercial."],
  ACTIVIDADES:["Actividades","Tareas, calendario y seguimiento del equipo."],
  SEGMENTOS:["Segmentos dinámicos","Organización de contactos por criterios."],
  SCORING:["Puntuación de leads","Reglas para priorizar los contactos."],
  ATRIBUCION:["Atribución","Consulta del embudo y resultados comerciales."],
  METAS:["Metas y alertas","Seguimiento de objetivos y avisos."],
  CONTENIDO:["Contenido","Piezas y revisiones de contenido."],
  AUTOMATIZACIONES:["Automatizaciones","Configuración y ejecución de flujos."],
  INTEGRACIONES:["Canales de comunicación","Configuración de los canales del CRM."],
  AUDITORIA:["Auditoría","Consulta del historial de operaciones."],
  CAMPOS:["Campos personalizados","Definición de datos adicionales del CRM."],
};
const DESCRIPCIONES = {
  campanas:"Creación y seguimiento de campañas.", audiencias:"Organización y vinculación de audiencias.",
  canales:"Administración de los canales de difusión.", clientes:"Gestión de empresas y clientes.",
  dashboard:"Consulta del rendimiento de marketing.", metricas:"Registro y consulta de resultados.",
  resultados:"Análisis y comparación de campañas.", reportes:"Generación y exportación de informes.",
  indicadores:"Cálculo de indicadores de campañas.",
};
const ACCIONES = { CONSULTAR:"Consultar", LEER:"Consultar", REGISTRAR:"Registrar", MODIFICAR:"Modificar", GESTIONAR:"Gestionar", VINCULAR:"Vincular", VER:"Consultar", GENERAR:"Generar", RECALCULAR:"Recalcular" };

export function agruparPermisos(permisos = []) {
  const grupos = new Map();
  for (const permiso of permisos) {
    const codigo = String(permiso.codigo || "");
    const crm = codigo.match(/^CRM_(.+)_(LEER|GESTIONAR)$/);
    const clave = crm ? `crm:${crm[1]}` : `modulo:${permiso.modulo || "Otros"}`;
    const nombre = crm ? CRM[crm[1]]?.[0] || crm[1].replaceAll("_"," ") : permiso.modulo || "Otros";
    if (!grupos.has(clave)) grupos.set(clave, {
      clave, nombre, recurso:crm?.[1],
      descripcion:crm ? CRM[crm[1]]?.[1] || "Capacidades de este módulo del CRM." : DESCRIPCIONES[normalizarTexto(nombre)] || "Capacidades disponibles para este módulo.",
      permisos:[],
    });
    grupos.get(clave).permisos.push({ ...permiso, etiqueta:ACCIONES[codigo.split("_").at(-1)] || permiso.descripcion || codigo });
  }
  return [...grupos.values()];
}

export function usuariosPorRol(usuarios = []) {
  const mapa = new Map();
  for (const usuario of usuarios) {
    const id = String(usuario.rol?.idRol ?? usuario.idRol ?? "");
    if (!mapa.has(id)) mapa.set(id,[]);
    mapa.get(id).push(usuario);
  }
  return mapa;
}

export function filtrarRoles(roles, equipos, busqueda) {
  const q = normalizarTexto(busqueda);
  if (!q) return roles;
  return roles.filter((r) => normalizarTexto(`${r.nombreRol} ${r.descripcion || ""}`).includes(q) || (equipos.get(String(r.idRol)) || []).some((u) => normalizarTexto(`${u.nombres} ${u.correo || ""}`).includes(q)));
}

export function alternarPermisos(actuales, ids, activar) {
  const seleccion = new Set(actuales);
  ids.forEach((id) => activar ? seleccion.add(id) : seleccion.delete(id));
  return normalizarIdsPermisos([...seleccion]);
}

export const inicialesPersona = (nombre = "") => nombre.trim().split(/\s+/).slice(0,2).map((p) => p[0] || "").join("").toUpperCase() || "U";
export const nombreRolVisible = (nombre = "") => nombre.toLowerCase().replace(/(^|\s)\S/g,(letra) => letra.toUpperCase());
