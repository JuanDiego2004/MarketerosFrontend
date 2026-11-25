import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url = process.env.CRM_UI_URL || "http://127.0.0.1:5188";
const permisos = [
  {idPermiso:1,codigo:"CAMPANA_CONSULTAR",descripcion:"Consultar campañas",modulo:"Campañas"},
  {idPermiso:2,codigo:"CAMPANA_REGISTRAR",descripcion:"Registrar campañas",modulo:"Campañas"},
  {idPermiso:3,codigo:"CAMPANA_MODIFICAR",descripcion:"Modificar campañas",modulo:"Campañas"},
  {idPermiso:4,codigo:"AUDIENCIA_CONSULTAR",descripcion:"Consultar audiencias",modulo:"Audiencias"},
  {idPermiso:5,codigo:"AUDIENCIA_GESTIONAR",descripcion:"Gestionar audiencias",modulo:"Audiencias"},
  {idPermiso:6,codigo:"CANAL_CONSULTAR",descripcion:"Consultar canales",modulo:"Canales"},
  {idPermiso:7,codigo:"CANAL_GESTIONAR",descripcion:"Gestionar canales",modulo:"Canales"},
  {idPermiso:8,codigo:"CLIENTE_CONSULTAR",descripcion:"Consultar empresas",modulo:"Clientes"},
  {idPermiso:9,codigo:"CLIENTE_GESTIONAR",descripcion:"Gestionar empresas",modulo:"Clientes"},
  {idPermiso:10,codigo:"CRM_CONTACTOS_LEER",descripcion:"Consultar contactos",modulo:"CRM"},
  {idPermiso:11,codigo:"CRM_CONTACTOS_GESTIONAR",descripcion:"Gestionar contactos",modulo:"CRM"},
];
async function preparar(browser, opciones = {}) {
  const contexto = await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:"reduce"});
  await contexto.addInitScript(() => localStorage.setItem("sesionAgencia",JSON.stringify({token:"test-roles",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Administrador",rol:{nombreRol:"Administrador"}}})));
  const estado = {roles:opciones.vacio ? [] : [{idRol:1,nombreRol:"ADMINISTRADOR",descripcion:"Administración completa del sistema y sus accesos",permisos:permisos.map((p) => p.idPermiso)},{idRol:2,nombreRol:"ANALISTA",descripcion:"Seguimiento y análisis de marketing",permisos:[1,4,6,8,10]},{idRol:3,nombreRol:"Cliente",descripcion:"Portal privado de la empresa asignada",permisos:[]}],puts:[],fallarUsuarios:!!opciones.fallarUsuarios,fallarGuardar:false,noConfirmar:false,liberar:null};
  await contexto.route("**/*",async (ruta) => {
    const p = new URL(ruta.request().url()).pathname;
    const esApi = p.includes("/api/") || p.endsWith("/usuarios");
    if (!esApi || ruta.request().isNavigationRequest()) return ruta.continue();
    let datos = [];
    if (p.endsWith("/admin/roles")) datos = estado.roles;
    else if (p.endsWith("/admin/permisos")) datos = opciones.sinPermisos ? [] : permisos;
    else if (/\/admin\/roles\/\d+\/permisos$/.test(p)) {
      estado.puts.push(ruta.request().postDataJSON());
      if (estado.fallarGuardar) return ruta.fulfill({status:503,json:{mensaje:"No se pudieron guardar los permisos"}});
      if (opciones.esperarGuardar) await new Promise((resolve) => {estado.liberar=resolve;});
      if (!estado.noConfirmar) estado.roles.find((r) => r.idRol === Number(p.split("/").at(-2))).permisos = estado.puts.at(-1).idPermisos;
      datos = null;
    } else if (p.endsWith("/usuarios")) {
      if (estado.fallarUsuarios) return ruta.fulfill({status:503,json:{mensaje:"Directorio no disponible"}});
      datos = [{idUsuario:1,nombres:"Diego Mendoza",correo:"diego@example.test",estado:"ACTIVO",rol:{idRol:1}},{idUsuario:2,nombres:"Camila Torres",correo:"camila@example.test",estado:"ACTIVO",rol:{idRol:2}},{idUsuario:3,nombres:"Lucía Pérez",correo:"lucia@example.test",estado:"INACTIVO",rol:{idRol:2}}];
    }
    await ruta.fulfill({json:{exito:true,datos}});
  });
  const page = await contexto.newPage(), errores=[];
  page.on("pageerror",(e) => errores.push(e.message));
  await page.goto(url+"/roles-permisos");
  await page.getByRole("heading",{name:"Roles y permisos",exact:true}).waitFor();
  await page.locator('.roles-permisos[aria-busy="false"]').waitFor();
  return {contexto,page,estado,errores};
}
async function elegir(page,consulta) {
  const selector=page.getByRole("combobox",{name:"Seleccionar rol"});
  await selector.fill(consulta);
  await selector.press("ArrowDown");
  await selector.press("Enter");
}

test("Roles: equipo real, búsqueda, selección por módulo, confirmación y guardado verificado",{timeout:90000},async () => {
  const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
  try {
    const {page,estado,errores}=await preparar(browser,{esperarGuardar:true});
    await page.getByRole("heading",{name:"Diego Mendoza",exact:true}).waitFor();
    await page.screenshot({path:"docs/roles-permisos-escritorio.png",animations:"disabled",fullPage:true});
    await elegir(page,"lucia@example");
    await page.getByRole("heading",{name:"Lucía Pérez",exact:true}).waitFor();
    assert.equal(await page.getByRole("heading",{name:"Camila Torres",exact:true}).count(),1);
    assert.equal(await page.getByRole("heading",{name:"Diego Mendoza",exact:true}).count(),0);
    await page.getByRole("combobox").fill("Camila");
    assert.equal(await page.getByRole("option").count(),1);
    await page.keyboard.press("Escape");
    await page.screenshot({path:"docs/roles-permisos-equipo.png",animations:"disabled",fullPage:true});
    await page.getByRole("checkbox",{name:"Campañas: Registrar",exact:true}).check();
    await elegir(page,"Administrador");
    const descartar=page.getByRole("dialog",{name:"¿Cambiar de rol?"});
    await descartar.getByRole("button",{name:"Seguir editando",exact:true}).click();
    assert.equal(await page.getByRole("checkbox",{name:"Campañas: Registrar",exact:true}).isChecked(),true);
    await elegir(page,"Administrador");
    await descartar.getByRole("button",{name:"Descartar y cambiar",exact:true}).click();
    await elegir(page,"Analista");
    assert.equal(await page.getByRole("checkbox",{name:"Campañas: Registrar",exact:true}).isChecked(),false);
    await page.getByRole("switch",{name:"Habilitar módulo Campañas",exact:true}).click();
    assert.equal(await page.getByRole("checkbox",{name:"Campañas: Consultar",exact:true}).isChecked(),false);
    await page.getByRole("switch",{name:"Habilitar módulo Campañas",exact:true}).click();
    assert.equal(await page.getByRole("checkbox",{name:"Campañas: Modificar",exact:true}).isChecked(),true);
    await page.getByRole("button",{name:"Restablecer",exact:true}).click();
    await page.getByRole("textbox",{name:"Buscar módulo o permiso"}).fill("Canales");
    await page.getByRole("checkbox",{name:"Seleccionar visibles",exact:true}).check();
    await page.getByRole("textbox",{name:"Buscar módulo o permiso"}).fill("");
    assert.equal(await page.getByRole("checkbox",{name:"Canales: Gestionar",exact:true}).isChecked(),true);
    assert.equal(await page.getByRole("checkbox",{name:"Campañas: Registrar",exact:true}).isChecked(),false);
    await page.getByRole("button",{name:"Guardar permisos",exact:true}).click();
    const confirmar=page.getByRole("dialog",{name:"Confirmar permisos del rol"});
    await confirmar.getByRole("button",{name:"Confirmar cambios",exact:true}).click();
    await page.waitForFunction(() => document.querySelector("dialog")?.getAttribute("aria-busy") === "true");
    assert.equal(await confirmar.getByRole("button",{name:"Cancelar",exact:true}).isDisabled(),true);
    await page.keyboard.press("Escape");
    assert.equal(await confirmar.count(),1);
    while (!estado.liberar) await new Promise((r) => setTimeout(r,20));
    estado.liberar();
    await page.getByRole("status").filter({hasText:"Permisos guardados y verificados"}).waitFor();
    assert.deepEqual(estado.puts,[{idPermisos:[1,4,6,7,8,10]}]);
    assert.equal(await page.getByRole("button",{name:"Guardar permisos",exact:true}).isDisabled(),true);
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:"docs/roles-permisos-movil.png",animations:"disabled",fullPage:true});
    assert.equal(await page.locator("main.roles-permisos").evaluate((e) => e.scrollWidth <= e.clientWidth),true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    assert.deepEqual(errores,[]);
  } finally { await browser.close(); }
});

test("Roles: reintentos de equipo y guardado, lectura confirmada y estados vacíos",{timeout:90000},async () => {
  const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
  try {
    const {page,estado}=await preparar(browser,{fallarUsuarios:true});
    await page.getByText(/No se pudo consultar el equipo/).waitFor();
    estado.fallarUsuarios=false;
    await page.getByRole("button",{name:"Reintentar consulta"}).click();
    await page.getByRole("heading",{name:"Diego Mendoza",exact:true}).waitFor();
    await elegir(page,"Analista");
    await page.getByRole("checkbox",{name:"Campañas: Registrar",exact:true}).check();
    estado.fallarGuardar=true;
    async function confirmar() {
      await page.getByRole("button",{name:"Guardar permisos",exact:true}).click();
      await page.getByRole("dialog").getByRole("button",{name:"Confirmar cambios",exact:true}).click();
    }
    await confirmar();
    await page.getByRole("alert").filter({hasText:"No se pudieron guardar"}).waitFor();
    assert.equal(await page.getByRole("checkbox",{name:"Campañas: Registrar",exact:true}).isChecked(),true);
    estado.fallarGuardar=false; estado.noConfirmar=true;
    await confirmar();
    await page.getByRole("alert").filter({hasText:"El servidor no confirmó"}).waitFor();
    estado.noConfirmar=false;
    await confirmar();
    await page.getByRole("status").filter({hasText:"Permisos guardados y verificados"}).waitFor();
    await elegir(page,"Cliente");
    await page.getByText(/Todavía no hay personas asignadas/).waitFor();
    const vacio=await preparar(browser,{vacio:true});
    await vacio.page.getByRole("heading",{name:"No hay roles disponibles"}).waitFor();
    const sinPermisos=await preparar(browser,{sinPermisos:true});
    await sinPermisos.page.getByRole("heading",{name:"El catálogo de permisos está vacío"}).waitFor();
  } finally { await browser.close(); }
});
