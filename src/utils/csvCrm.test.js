import { test } from "node:test";
import assert from "node:assert/strict";
import { leerCsvCrm } from "./csvCrm.js";

test("CSV con BOM, comillas, comas y saltos dentro de una celda", () => {
  const filas = leerCsvCrm(
    '\uFEFFnombre,correo,etiquetas\r\n"Ana, Sol",ana@example.com,"evento\nweb"\r\n',
  );
  assert.equal(filas[0].nombre, "Ana, Sol");
  assert.equal(filas[0].etiquetas, "evento\nweb");
  assert.equal(filas[0].estado, "NUEVO");
});
test("rechaza CSV truncado y columnas desconocidas", () => {
  assert.throws(
    () => leerCsvCrm('nombre,correo\n"Ana,ana@example.com'),
    /comillas/,
  );
  assert.throws(
    () => leerCsvCrm("nombre,desconocida\nAna,valor"),
    /encabezados/,
  );
  assert.throws(() => leerCsvCrm("nombre,correo\nAna,,extra"), /columnas/);
});
test("rechaza filas sin contacto o IDs inválidos", () => {
  assert.throws(() => leerCsvCrm("nombre,correo\nAna,"), /correo o teléfono/);
  assert.throws(
    () => leerCsvCrm("nombre,correo,cuentaId\nAna,a@b.com,no"),
    /ID numérico/,
  );
});
test("mantiene comillas escapadas y limita el lote", () => {
  assert.equal(
    leerCsvCrm('nombre,correo\n"Ana ""Sol""",a@b.com')[0].nombre,
    'Ana "Sol"',
  );
  assert.throws(
    () => leerCsvCrm("nombre,correo\n" + "Ana,a@b.com\n".repeat(501)),
    /500/,
  );
});
