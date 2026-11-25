import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url = process.env.CRM_UI_URL || "http://127.0.0.1:5188";
const navegador = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const personas = [
  { id: 1, nombre: "Camila Torres", correo: "camila@example.test", estado: "CALIFICADO", cuenta: "Andina Studio", responsable: "Diego Mendoza", origen: "Formulario web" },
  { id: 2, nombre: "Sebastián Rojas", correo: "sebastian@example.test", estado: "NUEVO", cuenta: "Nova Retail", responsable: "Lucía Pérez", origen: "Campaña de lanzamiento" },
  { id: 3, nombre: "Valentina López", correo: "valentina@example.test", estado: "CONTACTADO", cuenta: "Andina Studio", responsable: "Diego Mendoza", origen: "Referencia" },
  { id: 4, nombre: "Mateo García", correo: "mateo@example.test", estado: "CLIENTE", cuenta: "Horizonte Digital", responsable: "Lucía Pérez", origen: "Formulario web" },
];

async function preparar(browser, rol = "Administrador") {
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  await contexto.addInitScript((rol) => localStorage.setItem("sesionAgencia", JSON.stringify({ token: "prueba-ui", fechaExpiracion: new Date(Date.now() + 3600000).toISOString(), usuario: { nombres: "Diego Mendoza", rol: { nombreRol: rol } } })), rol);
  const consultas = [];
  // Registros de prueba interceptados únicamente en este navegador aislado.
  await contexto.route("**/api/**", async (ruta) => {
    const u = new URL(ruta.request().url()), p = u.pathname;
    let datos = [];
    if (p.endsWith("/capacidades")) datos = { contactosLeer: true, contactosGestionar: true, cuentasLeer: true, cuentasGestionar: true, actividadesLeer: true, actividadesGestionar: true };
    else if (p.endsWith("/notificaciones")) datos = [{id:7,nombre:"Revisar resultados de noviembre",fecha:"2026-11-23T15:00:00-05:00"}];
    else if (p === "/api/crm/contactos") {
      consultas.push(Object.fromEntries(u.searchParams));
      const filas = personas.filter((f) => (!u.searchParams.get("estado") || f.estado === u.searchParams.get("estado")) && f.nombre.toLowerCase().includes((u.searchParams.get("q") || "").toLowerCase()));
      datos = { filas, total: filas.length };
    } else if (p === "/api/crm/cuentas/1") datos = { id: 1, nombre: "Andina Studio", estado: "ACTIVO", sector: "Diseño y comunicación", correo: "hola@example.test", telefono: "+51 900 000 000", eventos: [], notas: [], archivos: [], contactos: [], campanas: [], oportunidades: [], actividades: [] };
    else if (p === "/api/crm/agencia/opciones") datos = { gestionar: true, empresas: [{ id: 1, nombre: "Andina Studio" }], usuarios: [{ id: 1, nombre: "Diego Mendoza" }], contratos: [], cotizaciones: [], anuncios: [] };
    else if (p === "/api/crm/contratacion/contratos/1") datos = { contrato: { id: 1, nombre: "Estrategia digital · Andina", servicio: "INTEGRAL", modalidad: "PAGADA", estado: "ACTIVO", empresa_id: 1, responsable_id: 1, desde: "2026-11-01", hasta: "2026-12-31", moneda: "PEN", honorarios: 1200, produccion: 600, presupuesto: 3000 }, configuracion: { objetivo: "Ampliar la presencia digital y acompañar el crecimiento de la marca.", piezas: [] }, prestaciones: [{ prestacion: "ANALISIS", cantidad: 1 }, { prestacion: "INFORMES", cantidad: 2 }], anuncios: [], contenidos: [], historial: [] };
    else if (p.endsWith("/opciones")) datos = { cuentas: [], campanas: [], responsables: [], etapas: [] };
    else if (p.endsWith("/actividades")) datos = { filas: [], total: 0 };
    await ruta.fulfill({ json: { exito: true, datos } });
  });
  return { contexto, consultas };
}

test("Navegación curva, filtros reales, pestañas con teclado y menú móvil accesible", { timeout: 120000 }, async () => {
  const browser = await chromium.launch({ executablePath: navegador, headless: true });
  try {
    const { contexto, consultas } = await preparar(browser);
    const pagina = await contexto.newPage();
    const errores = [];
    pagina.on("pageerror", (e) => errores.push(e.message));
    await pagina.goto(url + "/contactos");
    await pagina.getByRole("cell", { name: "Andina Studio", exact: true }).first().waitFor();
    const menu = pagina.getByRole("navigation", { name: "Navegación principal" });
    assert.equal(await menu.getByRole("link", { name: "Contactos / Leads", exact: true }).getAttribute("aria-current"), "page");
    const lateral = await pagina.locator(".sidebar").boundingBox();
    const cabecera = await pagina.locator(".app-header").boundingBox();
    assert.equal(lateral.x,0);
    assert.equal(lateral.y,0);
    assert.equal(lateral.height,960);
    assert.equal(cabecera.x + cabecera.width,1440);
    const notch = pagina.locator(".app-notch");
    const notificaciones = pagina.getByRole("button",{name:"Notificaciones: 1 tareas vencidas",exact:true});
    await notificaciones.waitFor();
    const compacto = await notch.boundingBox();
    await notch.hover();
    await pagina.locator('.app-notch[data-expandido="true"]').waitFor();
    await pagina.getByRole("link",{name:/Revisar resultados de noviembre/}).waitFor();
    await pagina.waitForFunction(() => document.querySelector(".app-notch").getBoundingClientRect().width > 320);
    const expandido = await notch.boundingBox();
    assert.ok(expandido.width > compacto.width && expandido.height > compacto.height);
    await pagina.screenshot({path:"docs/header-notch-expandido.png",animations:"disabled"});
    await pagina.getByRole("heading",{name:"Contactos",exact:true}).hover();
    await pagina.locator('.app-notch[data-expandido="false"]').waitFor();
    await pagina.getByRole("button",{name:"Mi cuenta",exact:true}).focus();
    await pagina.locator('.app-notch[data-expandido="true"]').waitFor();
    await pagina.keyboard.press("Escape");
    await pagina.locator('.app-notch[data-expandido="false"]').waitFor();
    assert.equal(await pagina.getByRole("button",{name:"Mi cuenta",exact:true}).evaluate((e)=>e===document.activeElement),true);
    await notificaciones.click();
    await pagina.getByRole("button",{name:"Cerrar panel de cuenta",exact:true}).click();
    await pagina.locator('.app-notch[data-expandido="false"]').waitFor();
    await pagina.getByPlaceholder("Nombre, correo o teléfono").focus();
    await pagina.screenshot({path:"docs/header-sidebar-completo.png",animations:"disabled"});
    await pagina.screenshot({ path: "docs/sistema-sidebar-contactos.png" });

    await pagina.getByRole("button", { name: "Contraer menú", exact: true }).click();
    await pagina.locator('.sidebar[data-compacto="true"]').waitFor();
    await pagina.getByRole("button", { name: "Expandir menú", exact: true }).click();
    await pagina.locator('.sidebar[data-compacto="false"]').waitFor();
    await pagina.getByLabel("Estado", { exact: true }).selectOption("CALIFICADO");
    await pagina.waitForFunction(() => document.querySelectorAll("tbody tr").length === 1);
    assert.equal(consultas.at(-1).estado, "CALIFICADO");
    await pagina.getByLabel("Estado", { exact: true }).selectOption("");
    await pagina.getByPlaceholder("Nombre, correo o teléfono").fill("Camila");
    await pagina.getByRole("button", { name: "Buscar", exact: true }).click();
    await pagina.waitForFunction(() => document.querySelectorAll("tbody tr").length === 1);
    assert.equal(consultas.at(-1).q, "Camila");

    await pagina.goto(url + "/empresas/1");
    const pestanas = pagina.getByRole("tablist", { name: "Secciones de la ficha" });
    await pestanas.getByRole("tab", { name: "Resumen", exact: true }).focus();
    await pagina.keyboard.press("ArrowRight");
    assert.equal(await pestanas.getByRole("tab", { name: "Campañas", exact: true }).getAttribute("aria-selected"), "true");
    await pagina.keyboard.press("End");
    assert.equal(await pestanas.getByRole("tab", { name: "Archivos", exact: true }).getAttribute("aria-selected"), "true");
    await pagina.keyboard.press("Home");
    assert.equal(await pestanas.getByRole("tab", { name: "Resumen", exact: true }).getAttribute("aria-selected"), "true");
    await pagina.goto(url + "/contratos/1");
    await pagina.getByRole("heading", { name: "Resumen del servicio", exact: true }).waitFor();
    await pagina.screenshot({ path: "docs/sistema-pestanas-contrato.png" });
    await pagina.getByRole("button", { name: "Historial", exact: true }).click();
    await pagina.getByRole("heading", { name: "Historial del contrato", exact: true }).waitFor();
    assert.match(pagina.url(), /vista=historial/);

    await pagina.setViewportSize({ width: 390, height: 844 });
    await pagina.goto(url + "/contactos");
    await pagina.getByRole("cell", { name: "Andina Studio", exact: true }).first().waitFor();
    assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await pagina.locator(".sidebar").getAttribute("inert"), "");
    await pagina.getByRole("button",{name:"Notificaciones: 1 tareas vencidas",exact:true}).click();
    await pagina.locator('.app-notch[data-expandido="true"]').waitFor();
    await pagina.getByRole("link",{name:/Revisar resultados de noviembre/}).waitFor();
    assert.ok((await notch.boundingBox()).width <= 366);
    await pagina.screenshot({path:"docs/header-notch-movil.png",animations:"disabled"});
    await pagina.getByRole("button",{name:"Cerrar panel de cuenta",exact:true}).click();
    await pagina.getByRole("button", { name: "Abrir menú", exact: true }).click();
    await pagina.locator('.sidebar[data-movil-abierto="true"]').waitFor();
    assert.equal(await pagina.locator(".app-espacio").getAttribute("inert"), "");
    await pagina.getByRole("button", { name: "Cerrar menú", exact: true }).focus();
    await pagina.keyboard.press("Shift+Tab");
    assert.equal(await pagina.getByRole("button", { name: "Cerrar sesión", exact: true }).evaluate((e) => e === document.activeElement), true);
    await pagina.keyboard.press("Tab");
    assert.equal(await pagina.getByRole("button", { name: "Cerrar menú", exact: true }).evaluate((e) => e === document.activeElement), true);
    await pagina.screenshot({ path: "docs/sistema-sidebar-movil.png" });
    await pagina.keyboard.press("Escape");
    assert.equal(await pagina.getByRole("button", { name: "Abrir menú", exact: true }).evaluate((e) => e === document.activeElement), true);
    await pagina.emulateMedia({ reducedMotion: "reduce" });
    await pagina.getByRole("button", { name: "Abrir menú", exact: true }).click();
    await menu.getByRole("link", { name: "Contactos / Leads", exact: true }).click();
    await pagina.locator('.sidebar[data-movil-abierto="false"]').waitFor();
    assert.equal(await pagina.locator(".sidebar").evaluate((e) => getComputedStyle(e).transitionDuration), "0s");
    await pagina.screenshot({ path: "docs/sistema-contactos-movil.png" });
    assert.deepEqual(errores, []);
    await contexto.close();

    const analista = await preparar(browser, "Analista");
    const p = await analista.contexto.newPage();
    await p.goto(url + "/contactos");
    await p.getByRole("heading", { name: "Contactos", exact: true }).waitFor();
    assert.equal(await p.getByRole("button", { name: "Configuración", exact: true }).count(), 0);
    await analista.contexto.close();
  } finally { await browser.close(); }
});
