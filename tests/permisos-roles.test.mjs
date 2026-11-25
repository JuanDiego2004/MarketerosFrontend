import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparPermisos, alternarPermisos, filtrarRoles, mismosPermisos, normalizarIdsPermisos, usuariosPorRol } from "../src/utils/permisosRoles.js";

test("Agrupa el catálogo real por módulo y separa las capacidades del CRM", () => {
  const permisos = [{idPermiso:1,codigo:"CAMPANA_CONSULTAR",modulo:"Campañas"},{idPermiso:2,codigo:"CRM_CONTACTOS_LEER",modulo:"CRM"},{idPermiso:3,codigo:"CRM_CONTACTOS_GESTIONAR",modulo:"CRM"},{idPermiso:4,codigo:"CRM_CUENTAS_LEER",modulo:"CRM"}];
  const antes = structuredClone(permisos), grupos = agruparPermisos(permisos);
  assert.deepEqual(grupos.map((g) => g.nombre), ["Campañas","Contactos / Leads","Empresas del CRM"]);
  assert.deepEqual(grupos[1].permisos.map((p) => p.etiqueta),["Consultar","Gestionar"]);
  assert.deepEqual(permisos,antes);
});
test("Busca por rol, nombre o correo de cualquiera de sus trabajadores", () => {
  const roles = [{idRol:1,nombreRol:"Administrador"},{idRol:2,nombreRol:"Analista"}];
  const equipos = usuariosPorRol([{rol:{idRol:1},nombres:"José Campos",correo:"jose@example.test"},{rol:{idRol:2},nombres:"Ana",correo:"ana@example.test"},{rol:{idRol:2},nombres:"Lucía",correo:"lucia@example.test"}]);
  assert.deepEqual(filtrarRoles(roles,equipos,"jose").map((r) => r.idRol),[1]);
  assert.deepEqual(filtrarRoles(roles,equipos,"lucia@example").map((r) => r.idRol),[2]);
  assert.equal(filtrarRoles(roles,equipos,"Analista").length,1);
  assert.equal(filtrarRoles(roles,equipos,"noexiste").length,0);
});
test("Las selecciones masivas conservan otros módulos e IDs no visibles", () => {
  assert.deepEqual(normalizarIdsPermisos([2,"1",{idPermiso:2},null,0,-4,"abc"]),[1,2]);
  const actuales = [1,2,99];
  assert.deepEqual(alternarPermisos(actuales,[1,2],false),[99]);
  assert.deepEqual(alternarPermisos(actuales,[3,4],true),[1,2,3,4,99]);
  assert.deepEqual(actuales,[1,2,99]);
  assert.equal(mismosPermisos([3,1,1],[1,3]),true);
  assert.equal(mismosPermisos([1],[1,2]),false);
});
