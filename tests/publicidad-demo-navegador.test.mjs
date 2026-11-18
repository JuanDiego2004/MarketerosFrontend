import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = process.env.CRM_UI_URL || "http://127.0.0.1:5179";
const paises = [
  ["PE", "Perú", -9.19, -75.02], ["CO", "Colombia", 4.57, -74.3], ["MX", "México", 23.63, -102.55], ["ES", "España", 40.46, -3.75],
  ["US", "Estados Unidos", 37.09, -95.71], ["BR", "Brasil", -14.24, -51.93], ["JP", "Japón", 36.2, 138.25], ["ZA", "Sudáfrica", -30.56, 22.94], ["AU", "Australia", -25.27, 133.78],
].map(([codigo, nombre, latitud, longitud]) => ({ codigo, nombre, latitud, longitud }));

test("Mockaroo: vincular, error recuperable, sincronizar, filtros, CSV, mapa, móvil y lectura", async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
  try {
    let vinculos = [], cargado = false, fallar = false, bloqueadas = 0, bloquearEstado = true, inversiones = [];
    const resumen = (n) => ({ impresiones: 4000 * n, clics: 120 * n, conversiones: 6 * n, inversion: 60 * n, ingresos: 120 * n, ctr: 3, cpc: 0.5, cpm: 15, cpa: 10, roas: 2 });
    async function contexto(rol) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
      await c.addInitScript((rol) => localStorage.setItem("sesionAgencia", JSON.stringify({ token: "ui-demo-" + rol, fechaExpiracion: new Date(Date.now() + 3600000).toISOString(), usuario: { nombres: "María Torres", rol: { nombreRol: rol } } })), rol);
      await c.route("**/api/**", async (r) => {
        const u = new URL(r.request().url()), p = u.pathname;
        // Reproduce un filtro de anuncios: ninguna petición funcional debe usar el alias anterior.
        if (p.includes("/publicidad-demo")) { bloqueadas++; await r.abort("blockedbyclient"); return; }
        if (p === "/api/crm/rendimiento/estado" && bloquearEstado) { await r.abort("blockedbyclient"); return; }
        let d = {};
        if (p === "/api/crm/rendimiento/estado") d = { habilitado: true, configurado: true, esquemaListo: true, gestionar: rol === "Administrador", paises, campanas: rol === "Administrador" ? [{ id: 1, nombre: "Campaña de verano", id_cliente: 1, cliente: "Empresa Aurora" }] : [] };
        else if (p === "/api/crm/rendimiento") {
          if (r.request().method() === "POST") {
            if (rol !== "Administrador") { await r.fulfill({ status: 403, json: { mensaje: "Sin permiso" } }); return; }
            const f = r.request().postDataJSON();
            vinculos = [{ ...f, id: 1, codigo: f.plataforma + "-1", campana: "Campaña de verano", cliente: "Empresa Aurora", id_cliente: 1 }]; d = vinculos[0];
          } else d = vinculos;
        } else if (p === "/api/crm/rendimiento/inversiones") {
          const f = r.request().postDataJSON(); const anterior = inversiones.find((i) => i.idempotencia === f.idempotencia);
          if (!anterior) inversiones.push({ ...f, id: inversiones.length + 1, anulado: false, version: 0 });
          d = anterior || inversiones.at(-1);
        } else if (p.endsWith("/inversiones/1/anular")) { inversiones = inversiones.map((i) => ({ ...i, anulado: true, version: 1 })); d = null;
        } else if (p.endsWith("/rendimiento/1/sincronizar")) {
          if (fallar) { fallar = false; await r.fulfill({ status: 503, json: { mensaje: "Mockaroo no disponible de prueba; se conservan los datos" } }); return; }
          d = { filasNuevas: cargado ? 0 : 18, diasNuevos: cargado ? 0 : 2, reutilizado: cargado }; cargado = true;
        } else if (p.endsWith("/rendimiento/1/metricas")) {
          const seleccion = paises.filter((p) => !u.searchParams.get("pais") || p.codigo === u.searchParams.get("pais"));
          const fecha = u.searchParams.get("desde"), siguiente = new Date(fecha + "T12:00:00Z"); siguiente.setUTCDate(siguiente.getUTCDate() + 1);
          d = { simulado: true, proveedor: "MOCKAROO", campana: vinculos[0], resumen: resumen(cargado ? seleccion.length : 0), dias: cargado ? [fecha, siguiente.toISOString().slice(0, 10)].map((fecha) => ({ ...resumen(seleccion.length / 2), fecha })) : [], paises: cargado ? seleccion.map((p) => ({ ...p, ...resumen(1) })) : [] };
          const gasto = (cargado ? 540 : 0) + inversiones.filter((i) => !i.anulado).reduce((s, i) => s + Number(i.importe), 0);
          d.negocio = { ingresos: 1200, ventas: 2, leads: 12, inversion: gasto, moneda: "PEN", modelo: "PRIMERO", cpl: gasto / 12, roas: gasto ? 1200 / gasto : null, roi: gasto ? (1200 - gasto) / gasto * 100 : null, inversiones };
        } else if (p.endsWith("/notificaciones")) d = [];
        else d = { filas: [], total: 0 };
        await r.fulfill({ json: { exito: true, datos: d } });
      });
      return c;
    }
    const context = await contexto("Administrador"), page = await context.newPage();
    const errores = []; page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(url + "/metricas?crm=rendimiento");
    await page.getByRole("heading", { name: "Rendimiento publicitario", exact: true }).waitFor();
    await page.getByRole("alert").filter({ hasText: "No se pudo conectar con el backend" }).waitFor();
    bloquearEstado = false;
    await page.getByRole("button", { name: "Reintentar conexión", exact: true }).click();
    await page.getByText("Todavía no hay campañas vinculadas.", { exact: false }).waitFor();
    await page.getByRole("button", { name: "Vincular campaña", exact: true }).click();
    const dialogo = page.getByRole("dialog");
    await dialogo.getByRole("button", { name: "Guardar campaña", exact: true }).click();
    assert.equal(await page.getByLabel("Campaña del cliente").evaluate((e) => document.activeElement === e), true);
    await page.getByLabel("Campaña del cliente").selectOption("1");
    await dialogo.getByRole("button", { name: "Guardar campaña", exact: true }).click();
    await dialogo.waitFor({ state: "detached" });
    await page.getByText("No hay datos guardados para estos filtros.", { exact: false }).waitFor();
    await page.getByRole("button", { name: "Sincronizar estadísticas", exact: true }).click();
    await page.getByText("18 registros incorporados de 2 días.", { exact: true }).waitFor();
    await page.getByRole("heading", { name: "Detalle diario", exact: true }).waitFor();
    const comercial = page.getByRole("region", { name: "Resultados comerciales", exact: true });
    await comercial.getByText("Ingresos de ventas ganadas", { exact: true }).waitFor();
    await comercial.getByRole("button", { name: "Registrar inversión adicional", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Concepto", { exact: true }).fill("Producción audiovisual");
    await page.getByRole("dialog").getByLabel("Importe", { exact: true }).fill("50.00");
    await page.getByRole("dialog").getByRole("button", { name: "Guardar inversión", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await comercial.getByText("Producción audiovisual", { exact: true }).waitFor();
    assert.equal(inversiones.length, 1);
    await comercial.getByRole("button", { name: "Anular", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirmar anulación", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await comercial.getByText("Anulado", { exact: true }).waitFor();
    assert.equal(inversiones[0].anulado, true);
    assert.doesNotMatch(await page.getByRole("region", { name: "Rendimiento publicitario", exact: true }).innerText(), /simulad|demostraci[oó]n|de prueba/i);
    assert.equal(await page.getByRole("button", { name: /^Filtrar .*impresiones$/ }).count(), 9);
    await page.getByLabel("Métrica del gráfico").selectOption("clics");
    await page.getByRole("img", { name: "Clics por día", exact: true }).waitFor();
    await page.screenshot({ path: "docs/publicidad-demo-escritorio.png", fullPage: true });
    fallar = true;
    await page.getByRole("button", { name: "Sincronizar estadísticas", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Mockaroo no disponible" }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Detalle diario", exact: true }).isVisible(), true);
    await page.getByRole("button", { name: "Sincronizar estadísticas", exact: true }).click();
    await page.getByText("El período ya estaba guardado.", { exact: false }).waitFor();
    await page.getByRole("button", { name: /^Filtrar Perú:/ }).click();
    await page.getByLabel("País del resultado").selectOption("PE");
    await page.getByRole("button", { name: /^Filtrar Perú:/ }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("pais"), "PE");
    const descargar = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV", exact: true }).click();
    const descarga = await descargar, csv = await readFile(await descarga.path(), "utf8");
    assert.match(csv, /MOCKAROO,META-1,PEN,PE/);
    await page.reload(); await page.getByRole("heading", { name: "Detalle diario", exact: true }).waitFor();
    assert.equal(await page.getByLabel("País del resultado").inputValue(), "PE");
    await page.getByLabel("País del resultado").selectOption("");
    await page.getByRole("button", { name: /^Filtrar Australia:/ }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("heading", { name: "Distribución por países", exact: true }).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: "docs/publicidad-demo-movil.png", fullPage: true });
    await comercial.getByRole("heading", { name: "Inversión y ventas atribuidas", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: "docs/rendimiento-inversion-movil.png", fullPage: true });
    await comercial.getByRole("button", { name: "Registrar inversión adicional", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Guardar inversión", exact: true }).click();
    assert.equal(await page.getByRole("dialog").getByLabel("Concepto", { exact: true }).evaluate((e) => document.activeElement === e), true);
    assert.equal(await page.getByRole("dialog").evaluate((e) => e.getBoundingClientRect().right <= window.innerWidth), true);
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
    assert.deepEqual(errores, []);
    assert.equal(bloqueadas, 0, "La integración usa una ruta neutra aun con el filtro de anuncios simulado");
    const lector = await contexto("Analista"), lectura = await lector.newPage();
    await lectura.goto(url + "/metricas?crm=rendimiento&campanaVista=1");
    await lectura.getByRole("heading", { name: "Detalle diario", exact: true }).waitFor();
    assert.equal(await lectura.getByRole("button", { name: "Sincronizar estadísticas", exact: true }).count(), 0);
    assert.equal(await lectura.getByRole("button", { name: "Vincular campaña", exact: true }).count(), 0);
    assert.equal(await lectura.getByRole("button", { name: "Registrar inversión adicional", exact: true }).count(), 0);
  } finally { await browser.close(); }
});
