import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resumir,
  agruparResultados,
  valoresPaises,
  crearCsvPortal,
  celdaCsv,
  serieDiaria,
} from "../src/utils/analiticaPortal.js";

const registros = [
  {
    fecha: "2026-11-01",
    pais: "PE",
    plataforma: "META",
    campana_id: 1,
    campana: "Andina",
    contrato_id: 1,
    contrato: "Integral",
    moneda: "PEN",
    impresiones: 1000,
    clics: 100,
    conversiones: 2,
    inversion: 20,
    ingresos_estimados: 100,
  },
  {
    fecha: "2026-11-02",
    pais: "PE",
    plataforma: "META",
    campana_id: 1,
    campana: "Andina",
    contrato_id: 1,
    contrato: "Integral",
    moneda: "PEN",
    impresiones: 9000,
    clics: 100,
    conversiones: 2,
    inversion: 30,
    ingresos_estimados: 100,
  },
  {
    fecha: "2026-11-01",
    pais: "CO",
    plataforma: "GOOGLE",
    campana_id: 2,
    campana: "=FORMULA()",
    contrato_id: 1,
    contrato: "Integral",
    moneda: "USD",
    impresiones: 500,
    clics: 10,
    conversiones: 1,
    inversion: 5,
    ingresos_estimados: 15,
  },
];
test("KPI ponderados, costos separados y retorno no inferido de ingresos estimados", () => {
  const r = resumir(registros);
  assert.equal(r.ctr, (210 / 10500) * 100);
  assert.equal(r.monedas.PEN.inversion, 50);
  assert.equal(r.monedas.USD.inversion, 5);
  assert.equal(r.monedas.PEN.cpc, 0.25);
  assert.equal(r.monedas.USD.cpc, 0.5);
  assert.equal(r.monedas.PEN.cpm, 5);
  assert.equal(r.alcance, null);
  assert.equal(r.roas, null);
  assert.equal(r.roi, null);
  assert.equal(resumir([]).ctr, null);
  assert.equal(
    resumir([{ ...registros[0], impresiones: 0, clics: 0 }]).monedas.PEN.cpc,
    null,
  );
  assert.equal(valoresPaises(registros, "inversion").size, 0);
  assert.equal(
    valoresPaises(
      registros.filter((r) => r.moneda === "PEN"),
      "inversion",
    ).get("PE"),
    50,
  );
  assert.equal(agruparResultados(registros).length, 2);
  assert.equal(serieDiaria(registros, "PEN")[0].inversion, 20);
});
test("CSV contiene filtros, procedencia, monedas y protección frente a fórmulas", () => {
  const datos = {
    empresa: { nombre: "Andina" },
    contratos: [{ id: 1, nombre: "Integral" }],
    campanas: [],
  };
  const csv = crearCsvPortal(
    datos,
    {
      desde: "2026-11-01",
      hasta: "2026-11-02",
      contrato: "1",
      pais: "PE",
      moneda: "",
      metrica: "impresiones",
    },
    agruparResultados(registros),
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /Datos simulados/);
  assert.match(csv, /MOCKAROO/);
  assert.match(csv, /Ingresos estimados/);
  assert.match(csv, /PEN/);
  assert.match(csv, /USD/);
  assert.match(csv, /'=FORMULA/);
  assert.equal(celdaCsv("  @SUM(1)"), '"\'  @SUM(1)"');
  assert.equal(celdaCsv('A"B'), '"A""B"');
});
