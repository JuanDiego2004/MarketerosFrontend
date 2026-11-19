import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url = process.env.CRM_UI_URL || "http://127.0.0.1:5179";
test("Empresas: ficha única, creación, recuperación, relaciones, archivo, rutas y móvil", async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
    await context.addInitScript(() => localStorage.setItem("sesionAgencia", JSON.stringify({ token: "empresa-ui", fechaExpiracion: new Date(Date.now() + 3600000).toISOString(), usuario: { nombres: "María Torres", rol: { nombreRol: "Administrador" } } })));
    const relaciones = { contactos: [{ id: 1, nombre: "Ana Pérez", estado: "CALIFICADO" }], campanas: [{ id: 1, nombre: "Campaña de verano", estado: "ACTIVA" }], oportunidades: [{ id: 1, nombre: "Plan comercial", estado: "GANADA", etapa: "Ganado", valor: 1200, moneda: "PEN" }], actividades: [{ id: 1, nombre: "Seguimiento comercial", estado: "PENDIENTE", fecha: "2026-11-18T10:00:00-05:00" }], notas: [], eventos: [], archivos: [] };
    let filas = [{ ...relaciones, id: 7, clienteId: 12, nombre: "Empresa registrada", correo: "contacto@empresa.example", telefono: "51912345678", sector: "Salud", sitioWeb: "https://example.test", estado: "ACTIVO" }];
    let fallar = true, nuevas = 0;
    await context.route("**/api/**", async (r) => {
      const u = new URL(r.request().url()), p = u.pathname, metodo = r.request().method();
      let d = {};
      if (p.endsWith("/capacidades")) d = { cuentasLeer: true, cuentasGestionar: true };
      else if (p === "/api/crm/cuentas/opciones") d = { cuentas: filas, campanas: [], responsables: [], clientes: [] };
      else if (p === "/api/crm/cuentas") {
        if (metodo === "POST") {
          if (fallar) { fallar = false; await r.fulfill({ status: 503, json: { mensaje: "No se pudo guardar. Reintenta." } }); return; }
          const f = r.request().postDataJSON(); assert.equal(f.clienteId, null);
          filas.push({ ...relaciones, ...f, id: 8, clienteId: 13 }); nuevas++; d = { id: 8 };
        } else { const estado = u.searchParams.get("estado"); const seleccion = filas.filter((f) => !estado || f.estado === estado); d = { filas: seleccion, total: seleccion.length }; }
      } else if (/\/api\/crm\/cuentas\/\d+\/archivar$/.test(p)) {
        const id=Number(p.split("/").at(-2)); assert.equal(metodo,"POST"); filas=filas.map((f)=>f.id===id?{...f,estado:"INACTIVO"}:f); d=null;
      } else if (/\/api\/crm\/cuentas\/\d+$/.test(p)) {
        const id = Number(p.split("/").at(-1));
        if (metodo === "PUT") { filas = filas.map((f) => f.id === id ? { ...f, ...r.request().postDataJSON() } : f); d = { id }; }
        else if (metodo === "DELETE") { filas = filas.map((f) => f.id === id ? { ...f, estado: "INACTIVO" } : f); await r.fulfill({ status: 204 }); return; }
        else d = filas.find((f) => f.id === id);
      } else if (p.endsWith("/canales")) d = [{ idCanal: 1, nombreCanal: "Facebook Ads", tipoCanal: "REDES_SOCIALES", estado: "ACTIVO" }];
      else if (p.endsWith("/notificaciones")) d = [];
      await r.fulfill({ json: { exito: true, datos: d } });
    });
    const page = await context.newPage(), errores = []; page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(url + "/clientes-canales");
    await page.waitForURL("**/empresas");
    await page.getByRole("heading", { name: "Clientes / Empresas", exact: true }).waitFor();
    assert.equal(await page.locator("a[href='/cuentas']").count(), 0);
    await page.getByRole("button", { name: "Nueva empresa", exact: true }).click();
    let dialogo = page.getByRole("dialog");
    assert.equal(await dialogo.getByLabel("Cliente de la agencia (opcional)").count(), 0);
    await dialogo.getByRole("button", { name: "Guardar", exact: true }).click();
    assert.equal(await dialogo.getByLabel("Nombre de la empresa", { exact: true }).evaluate((e) => document.activeElement === e), true);
    await dialogo.getByLabel("Nombre de la empresa", { exact: true }).fill("Empresa Aurora");
    await dialogo.getByLabel("Correo de la empresa", { exact: true }).fill("contacto@aurora.example");
    await dialogo.getByLabel("Teléfono de la empresa", { exact: true }).fill("51912345679");
    await dialogo.getByRole("button", { name: "Guardar", exact: true }).click();
    await dialogo.getByText("No se pudo guardar. Reintenta.", { exact: true }).waitFor();
    assert.equal(await dialogo.getByLabel("Nombre de la empresa", { exact: true }).inputValue(), "Empresa Aurora");
    await dialogo.getByRole("button", { name: "Guardar", exact: true }).click();
    await dialogo.waitFor({ state: "detached" }); assert.equal(nuevas, 1);
    await page.getByRole("link", { name: "Ver ficha de Empresa registrada", exact: true }).click();
    await page.getByRole("tab", { name: "Campañas", exact: true }).click();
    await page.getByRole("cell", { name: "Campaña de verano", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Contactos", exact: true }).click();
    await page.getByRole("link", { name: "Ana Pérez", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Oportunidades", exact: true }).click();
    await page.getByRole("cell", { name: "Plan comercial", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Actividades", exact: true }).click();
    await page.getByRole("cell", { name: "Seguimiento comercial", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Resumen", exact: true }).click();
    await page.screenshot({ path: "docs/empresas-ficha-escritorio.png", fullPage: true });
    await page.getByRole("button", { name: "Archivar empresa", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirmar archivo", exact: true }).click();
    await page.waitForURL("**/empresas"); assert.equal(filas[0].estado, "INACTIVO");
    await page.getByLabel("Estado", { exact: true }).selectOption("INACTIVO");
    await page.getByRole("link", { name: "Ver ficha de Empresa registrada", exact: true }).click();
    await page.getByRole("button", { name: "Editar ficha", exact: true }).click();
    dialogo = page.getByRole("dialog");
    await dialogo.getByLabel("Estado de la empresa", { exact: true }).selectOption("ACTIVO");
    await dialogo.getByLabel("Sector", { exact: true }).fill("Servicios");
    await dialogo.getByRole("button", { name: "Guardar", exact: true }).click();
    await dialogo.waitFor({ state: "detached" }); assert.equal(filas[0].estado, "ACTIVO");
    await page.goto(url + "/cuentas/7"); await page.waitForURL("**/empresas/7");
    await page.getByRole("heading", { name: "Empresa registrada", exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Editar ficha", exact: true }).click();
    assert.equal(await page.getByRole("dialog").evaluate((e) => e.getBoundingClientRect().right <= window.innerWidth), true);
    await page.screenshot({ path: "docs/empresas-formulario-movil.png", fullPage: true });
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.goto(url + "/canales-difusion");
    await page.getByRole("heading", { level: 1, name: "Canales de difusión", exact: true }).waitFor();
    await page.getByRole("cell", { name: "Facebook Ads", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Nuevo cliente", exact: true }).count(), 0);
    await page.getByRole("button", { name: /Nuevo canal de difusión/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Registrar", exact: true }).click();
    await page.getByRole("dialog").getByRole("alert").filter({ hasText: "Completa el nombre y el tipo de canal" }).waitFor();
    assert.equal(await page.getByRole("dialog").getByLabel("Nombre del canal", { exact: true }).evaluate((e) => document.activeElement === e), true);
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
    assert.deepEqual(errores, []);
  } finally { await browser.close(); }
});
