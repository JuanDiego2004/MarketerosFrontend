import {
  GRUPOS_ROL,
  obtenerGrupoRol,
} from "../../utils/roles.js";
import { modulosPorRol } from "../../utils/modulosPorRol.js";

export function obtenerModulos(nombreRol) {
  const grupo = obtenerGrupoRol(nombreRol);

  if (grupo === GRUPOS_ROL.ADMINISTRADOR) return modulosPorRol.administrador;
  if (grupo === GRUPOS_ROL.LIDER) return modulosPorRol.projectManager;
  if (grupo === GRUPOS_ROL.ANALISTA) return modulosPorRol.analista;

  return [];
}
