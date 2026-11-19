export const GRUPOS_ROL = {
  ADMINISTRADOR: "administrador",
  LIDER: "lider",
  ANALISTA: "analista",
  CLIENTE: "cliente",
};

export const GRUPOS_PERMITIDOS = {
  TODOS: [GRUPOS_ROL.ADMINISTRADOR, GRUPOS_ROL.LIDER, GRUPOS_ROL.ANALISTA],
  ADMINISTRADOR: [GRUPOS_ROL.ADMINISTRADOR],
  ADMINISTRADOR_LIDER: [GRUPOS_ROL.ADMINISTRADOR, GRUPOS_ROL.LIDER],
};

export function normalizarTexto(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function obtenerGrupoRol(nombreRol = "") {
  const rol = normalizarTexto(nombreRol);
  if (rol === "cliente") return GRUPOS_ROL.CLIENTE;

  if (rol.includes("admin")) return GRUPOS_ROL.ADMINISTRADOR;
  if (
    rol.includes("manager") ||
    rol.includes("lider") ||
    rol.includes("lead")
  ) {
    return GRUPOS_ROL.LIDER;
  }
  if (rol.includes("analista") || rol.includes("operador")) {
    return GRUPOS_ROL.ANALISTA;
  }

  return null;
}
