import { test } from "node:test";
import assert from "node:assert/strict";
import { presupuestoContrato, centavosContrato, importePauta } from "./presupuestoContrato.js";

test("Pauta: suma todas las piezas y detecta 300 asignados con cero autorizado", () => {
  const r = presupuestoContrato({ presupuesto: 0, piezas: [{ titulo: "Video", canales: [{ plataforma: "FACEBOOK", presupuesto: 200 }] }, { canales: [{ plataforma: "TIKTOK", presupuesto: "100.00" }, { plataforma: "INSTAGRAM", presupuesto: 0 }] }] });
  assert.equal(r.distribuido, 30000n); assert.equal(r.exceso, 30000n); assert.equal(r.filas.length, 3);
});
test("Pauta: 0.10 + 0.20 cabe exactamente en 0.30 y el sobrante se conserva", () => {
  const form = { presupuesto: "0.30", piezas: [{ canales: [{ presupuesto: "0.10" }, { presupuesto: "0.20" }] }] };
  assert.equal(presupuestoContrato(form).exceso, 0n);
  assert.equal(presupuestoContrato({ ...form, presupuesto: "0.29" }).exceso, 1n);
  assert.equal(importePauta(presupuestoContrato(form).distribuido), "0.30");
});
test("Pauta: importes incompletos o inválidos no se presentan como un total válido", () => {
  assert.equal(centavosContrato("0.001"), null); assert.equal(centavosContrato("-3"), null);
  assert.equal(presupuestoContrato({ presupuesto: 300, piezas: [{ canales: [{ presupuesto: "abc" }] }] }).valido, false);
});
