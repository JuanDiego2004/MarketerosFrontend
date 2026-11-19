import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const url = process.env.CRM_UI_URL || "http://127.0.0.1:5179";
test("Servicios: contrato dinámico, recuperación, aprobación, anuncios de análisis y móvil", async () => {
 const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
 try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("sesionAgencia", JSON.stringify({ token: "agencia-ui", fechaExpiracion: new Date(Date.now() + 3600000).toISOString(), usuario: { nombres: "María Torres", rol: { nombreRol: "Administrador" } } })));
  let contratos = [{id:1,nombre:"Análisis mensual Andina",empresa_id:1,servicio:"ANALISIS",estado:"ACTIVO",moneda:"PEN",honorarios:250,produccion:0,presupuesto:0}], anuncios = [], falla = true, creaciones = 0;
  await context.route("**/api/**", async r => {
   const u = new URL(r.request().url()), p = u.pathname, method = r.request().method(); let d = [];
   if (p === "/api/crm/agencia/opciones") d = { gestionar: true, empresas: [{ id: 1, nombre: "Comercial Andina" }], usuarios: [{ id: 1, nombre: "María Torres" }], contratos, cotizaciones: [], cuentas: [{ id: 1, nombre: "Facebook Andina", codigo: "META-ACC-DEMO-1", empresa_id: 1 }], campanas: [{ id: 1, nombre: "Verano", empresa_id: 1, contrato_id: 1 }], anuncios, contenidos: [], servicios: [] };
   else if (p === "/api/crm/agencia/contratos") {
    if (method === "POST") { if(falla) { falla = false; await r.fulfill({ status: 503, json: { mensaje: "No se guardó. Reintenta." } }); return; } creaciones++; const f = r.request().postDataJSON(); contratos.push({ ...f, empresa_id: 1, id: 1, version: 0, estado: "BORRADOR" }); d = contratos[0]; }
    else d = { filas: contratos, total: contratos.length };
   } else if (/\/contratos\/1\/estado$/.test(p)) { const f = r.request().postDataJSON(); contratos[0] = { ...contratos[0], estado: f.estado, version: contratos[0].version + 1 }; d = null; }
   else if (p === "/api/crm/agencia/anuncios") {
    if(method === "POST") { anuncios.push({ ...r.request().postDataJSON(), id: 1, contrato_id: 1, estado: "EXTERNO_SIMULADO", version: 0 }); d = anuncios[0]; } else d = { filas: anuncios, total: anuncios.length };
   } else if (p === "/api/crm/agencia/contratos/1/informe") d = { contrato: contratos[0], empresa: { nombre: "Comercial Andina" }, campanas: [], anuncios, trabajos: [], historial: [], gasto: 0, fuente: "Datos simulados con Mockaroo" };
   await r.fulfill({ json: { exito: true, datos: d } });
  });
  const page = await context.newPage(), errores = []; page.on("pageerror", e => errores.push(e.message));
  await page.goto(url + "/contratos"); await page.getByRole("link",{name:"Abrir contrato",exact:true}).waitFor();
  await page.getByRole("button",{name:"Nuevo contrato",exact:true}).click(); await page.waitForURL("**/contratos/nuevo"); await page.getByLabel("Empresa",{exact:true}).waitFor();
  let dialog;
  await page.goto(url + "/anuncios"); await page.getByRole("button", { name: "Nuevo anuncio", exact: true }).click(); dialog = page.getByRole("dialog"); await dialog.getByLabel("Contrato", { exact: true }).selectOption("1"); assert.equal(await dialog.getByLabel("Contenido aprobado", { exact: true }).count(), 0);
  await dialog.getByLabel("Cuenta publicitaria", { exact: true }).selectOption("1"); await dialog.getByLabel("Campaña del contrato", { exact: true }).selectOption("1"); await dialog.getByLabel("Nombre", { exact: true }).fill("Anuncio existente"); await dialog.getByLabel("ID de anuncio ficticio", { exact: false }).fill("META-AD-DEMO-1"); await dialog.getByLabel("Formato", { exact: true }).selectOption("VIDEO"); await dialog.getByRole("button", { name: "Guardar", exact: true }).click(); await dialog.waitFor({ state: "detached" }); await page.getByRole("cell", { name: "META-AD-DEMO-1", exact: true }).waitFor(); assert.equal(await page.getByRole("button", { name: "Editar", exact: true }).count(), 0); assert.equal(await page.getByRole("button", { name: "Simular publicación", exact: true }).count(), 0);
  await page.setViewportSize({width:390,height:844});await page.goto(url+"/contratos/nuevo");await page.getByLabel("Nombre del contrato",{exact:true}).fill("Borrador");assert.equal(await page.getByLabel("Nombre del contrato",{exact:true}).inputValue(),"Borrador");assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errores,[]);
 } finally { await browser.close(); }
});
