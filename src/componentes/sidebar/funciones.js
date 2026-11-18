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

export const sidebarVariants = {
  cerrado: {
    width: 56,
  },
  abierto: {
    width: 260,
  },
};

export const textoVariants = {
  cerrado: {
    opacity: 0,
    width: 0,
    x: -8,
    transition: {
      duration: 0.15,
    },
  },
  abierto: {
    opacity: 1,
    width: 180,
    x: 0,
    transition: {
      duration: 0.25,
      delay: 0.05,
    },
  },
};
