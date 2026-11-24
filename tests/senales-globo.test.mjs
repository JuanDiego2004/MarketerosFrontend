import { test } from "node:test";
import assert from "node:assert/strict";
import { distribuirSenales } from "../src/componentes/dashboard/senalesGlobo.js";

test("las señales priorizan la selección y agrupan cercanía incluso en el antimeridiano", () => {
  const puntos = [
    { clave: "alta", lat: 0, lng: 179, valor: 1000 },
    { clave: "seleccionada", lat: 0, lng: -179, valor: 1, seleccionada: true },
    { clave: "distante", lat: 45, lng: 0, valor: 100 },
    { clave: "invalida", lat: NaN, lng: 0, valor: 2000 },
  ];
  const copia = structuredClone(puntos);
  assert.deepEqual(
    distribuirSenales(puntos, 2).map((p) => p.clave),
    ["seleccionada", "distante"],
  );
  assert.deepEqual(puntos, copia);
  assert.equal(distribuirSenales(puntos, 1).length, 1);
});
