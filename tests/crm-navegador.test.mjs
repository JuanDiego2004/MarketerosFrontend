import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const url = process.env.CRM_UI_URL || "http://127.0.0.1:5178";
const navegador =
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const opciones = {
  etapas: [
    { id: 1, nombre: "Nuevo", tipo: "ABIERTA", orden: 0 },
    { id: 2, nombre: "Ganado", tipo: "GANADA", orden: 1 },
  ],
  contactos: [{ id: 1, nombre: "Contacto de prueba" }],
  responsables: [{ id: 1, nombre: "Admin de prueba" }],
  campanas: [{ id: 1, nombre: "Campaña de prueba" }],
  segmentos: [{id:1,nombre:"Segmento de prueba"}],
  cuentas: [],
  oportunidades: [],
  usuarioId: 1,
};
const recursos = [
  "contactos",
  "cuentas",
  "pipeline",
  "etapas",
  "actividades",
  "segmentos",
  "scoring",
  "atribucion",
  "metas",
  "contenido",
  "automatizaciones",
  "integraciones",
  "auditoria",
  "campos",
];
// API simulada SOLO en el contexto del navegador de prueba; nunca se usa en producción.
test("pantallas, CRUD, conflicto, teclado, móvil y restricciones de navegación", async () => {
  const browser = await chromium.launch({
    executablePath: navegador,
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() =>
      localStorage.setItem(
        "sesionAgencia",
        JSON.stringify({
          token: "token-de-prueba-ui",
          fechaExpiracion: new Date(Date.now() + 3600000).toISOString(),
          usuario: {
            nombres: "Admin de prueba",
            rol: { nombreRol: "Administrador" },
          },
        }),
      ),
    );
    let filas = [],
      fallar = false;
    let etiquetas = [],
      asignadas = [],
      origenes = [];
    let fallarAsignacionEtiquetas = false;
    let campos = [], valores = {}, revisionCampos = 0, conectores = [];
    let flujo = {nombre:"Flujo de prueba",segmentoId:1,activa:false,version:0,visual:true,definicion:{inicio:"inicio",nodos:[{id:"inicio",tipo:"SEGMENTO",nombre:"Entrada",parametros:{},siguiente:"tarea",si:null,no:null},{id:"tarea",tipo:"TAREA",nombre:"Llamar",parametros:{asunto:"Seguimiento",mensaje:"Llamar al contacto"},siguiente:null,si:null,no:null}]}};
    let ejecucionesManuales = 0;
    let mensajesWhatsApp=[{id:1,remitente:"51900000001",telefono:"51900000001",tipo:"text",texto:"<img src=x onerror=alert(1)> Quiero información",truncado:false,fecha:new Date().toISOString(),contacto_id:null,contacto:null,version:0}],falloVinculoWhatsApp=true,falloLecturaWhatsApp=false;
    await context.route("**/api/**", async (route) => {
      const u = new URL(route.request().url()),
        path = u.pathname;
      let d = {};
      if (path.endsWith("/capacidades"))
        d = Object.fromEntries(
          recursos.flatMap((r) => [
            [r + "Leer", true],
            [r + "Gestionar", !["atribucion", "auditoria"].includes(r)],
          ]),
        );
      else if (path === "/api/crm/campos/contactos/1") {
        if(route.request().method()==="PUT"){valores=route.request().postDataJSON().valores;revisionCampos++;}
        d={definiciones:campos.filter(c=>c.activo),valores,version:revisionCampos};
      }
      else if (path === "/api/crm/campos") {
        if(route.request().method()==="POST"){const c={...route.request().postDataJSON(),id:campos.length+1,version:0};campos.push(c);d=c;}else d={filas:campos,total:campos.length};
      }
      else if (path === "/api/crm/operaciones/automatizaciones/7/flujo") {
        if(route.request().method()==="PUT")flujo={...route.request().postDataJSON(),version:flujo.version+1};d=flujo;
      }
      else if (path === "/api/crm/operaciones/automatizaciones/7/ejecuciones") d=ejecucionesManuales?[{id:51,contacto_id:1,estado:"COMPLETADO"}]:[];
      else if(path === "/api/crm/operaciones/automatizaciones/7/flujo/ejecuciones/51")d=[{nombre:"WhatsApp anterior",estado:"COMPLETADO",fecha:new Date().toISOString(),detalle:"Aceptado por proveedor",proveedor_id:"wamid.solo-prueba",estado_proveedor:"ACEPTADO",entrega:"READ",fecha_entrega:new Date().toISOString()}];
      else if (path === "/api/crm/operaciones/automatizaciones/7/ejecutar") {ejecucionesManuales++;d={pasosProcesados:1};}
      else if(path === "/api/crm/operaciones/whatsapp/estado")d={configurado:false,url:"https://crm.example.test/api/webhooks/whatsapp",ultimoEvento:new Date().toISOString(),entregas:[{estado:"READ",cantidad:1}]};
      else if(path === "/api/crm/operaciones/whatsapp/mensajes"){
        if(falloLecturaWhatsApp){await route.fulfill({status:503,json:{mensaje:"Fallo de lectura WhatsApp de prueba"}});return;}
        const m=mensajesWhatsApp.filter(m=>u.searchParams.get("pendientes")==="true"?!m.contacto_id:true);d={filas:m,total:m.length};
      }
      else if(path === "/api/crm/operaciones/whatsapp/mensajes/1/contacto"){
        if(falloVinculoWhatsApp){falloVinculoWhatsApp=false;await route.fulfill({status:409,json:{mensaje:"El mensaje cambió. Recarga antes de vincularlo."}});return;}
        mensajesWhatsApp=mensajesWhatsApp.map(m=>({...m,contacto_id:route.request().postDataJSON().contactoId,contacto:"Contacto de prueba",version:m.version+1}));d=null;
      }
      else if(path === "/api/crm/contactos/1/whatsapp")d={filas:mensajesWhatsApp.filter(m=>m.contacto_id===1),total:mensajesWhatsApp.filter(m=>m.contacto_id===1).length};
      else if (path === "/api/crm/operaciones/conectores/estado") d={googleAdsConfigurado:false,analyticsConfigurado:false};
      else if (path === "/api/crm/operaciones/conectores") {
        if(route.request().method()==="POST"){const f={...route.request().postDataJSON(),id:conectores.length+1,campana:"Campaña de prueba",activo:true,version:0};conectores.push(f);d=f;}else d={filas:conectores,total:conectores.length};
      }
      else if (path.match(/\/conectores\/\d+\/sincronizar$/)) d={diasSincronizados:1};
      else if (path.match(/\/conectores\/\d+\/metricas$/)) d=[{fecha:"2026-11-01",usuarios:5,sesiones:6,eventos_clave:2}];
      else if (path.endsWith("/opciones")) d = opciones;
      else if (path === "/api/crm/contactos/1")
        d = {
          id: 1,
          nombre: "Contacto de prueba",
          correo: "prueba@example.test",
          estado: "NUEVO",
          origen: "WEB",
          etiquetas: asignadas.map((e) => e.nombre).join(","),
          eventos: [],
          notas: [],
          archivos: [],
          consentimientos: [],
        };
      else if (path.endsWith("/score/1")) d = { puntaje: 10, reglas: [] };
      else if (path.endsWith("/contactos/1/relaciones"))
        d = { etiquetas: asignadas, origenes, emailSuprimido: false };
      else if (path.endsWith("/contactos/1/etiquetas")) {
        if (fallarAsignacionEtiquetas) {
          fallarAsignacionEtiquetas = false;
          await route.fulfill({status:503,json:{mensaje:"No se pudieron asignar las etiquetas de prueba"}});
          return;
        }
        asignadas = etiquetas.filter((e) =>
          route.request().postDataJSON().includes(e.id),
        );
        d = null;
      } else if (path.endsWith("/contactos/1/origenes")) {
        origenes = [
          {
            ...route.request().postDataJSON(),
            id: 1,
            campana: "Campaña de prueba",
            created_at: new Date().toISOString(),
          },
        ];
        d = null;
      } else if (path.endsWith("/etiquetas")) {
        if (route.request().method() === "POST") {
          const e = {
            id: etiquetas.length + 1,
            ...route.request().postDataJSON(),
          };
          etiquetas.push(e);
          d = e;
        } else d = etiquetas;
      } else if (
        path.endsWith("/notificaciones") ||
        path.endsWith("/alertas") ||
        path.endsWith("/actividades/calendario")
      )
        d = [];
      else if (path.endsWith("/integraciones/estado"))
        d = {
          metaConfigurada: false,
          smtpConfigurado: false,
          automatizacionesProgramadas: false,
        };
      else if (path.endsWith("/atribucion"))
        d = {
          campanas: [],
          ingresos: [],
          gastos: [],
          embudo: [],
          responsables: [],
          modelo: `Ingresos: ${u.searchParams.get("modelo") || "PRIMERO"}; leads: primer origen`,
          conversiones: {
            cohorte: 2,
            sinHistorialCompleto: 1,
            criterio: "Historial de prueba",
            etapas: [{ etapa_id: 1, etapa_nombre: "Nuevo", alcanzaron: 2 }],
            transiciones: [
              { origen_id: 1, origen: "Nuevo", destino: "Ganado", base: 2, convirtieron: 1 },
            ],
          },
        };
      else if (
        route.request().method() === "POST" &&
        path.endsWith("/pipeline")
      ) {
        if (fallar) {
          await route.fulfill({
            status: 409,
            json: { mensaje: "Conflicto de prueba: el registro cambió" },
          });
          return;
        }
        filas = [{ ...route.request().postDataJSON(), id: 1, version: 0 }];
        d = { id: 1 };
      } else
        d = {
          filas: path.endsWith("/pipeline") ? filas : [],
          total: path.endsWith("/pipeline") ? filas.length : 0,
        };
      await route.fulfill({ json: { exito: true, datos: d } });
    });
    const page = await context.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(url + "/pipeline");
    await page
      .getByRole("heading", { name: "Pipeline de oportunidades" })
      .waitFor({ timeout: 10000 })
      .catch(async (e) => {
        console.error({
          url: page.url(),
          errores,
          body: await page.locator("body").innerText(),
        });
        throw e;
      });
    await page.getByRole("button", { name: "Crear registro" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(
      await page
        .locator("#op-nombre")
        .evaluate((el) => document.activeElement === el),
      true,
    );
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await dialog.getByRole("alert").waitFor();
    await page.locator("#op-nombre").fill("Oportunidad UI prueba");
    await page.locator("#op-contacto_id").selectOption("1");
    await page.locator("#op-etapa_id").selectOption("1");
    await page.locator("#op-responsable_id").selectOption("1");
    await page.locator("#op-valor").fill("100");
    await page.locator("#op-probabilidad").fill("50");
    await page.locator("#op-fecha_cierre").fill("2026-12-20");
    fallar = true;
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await dialog.getByText("Conflicto de prueba: el registro cambió").waitFor();
    assert.equal(
      await page.locator("#op-nombre").inputValue(),
      "Oportunidad UI prueba",
    );
    fallar = false;
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    await page
      .getByRole("cell", { name: "Oportunidad UI prueba", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Tablero", exact: true }).click();
    await page.locator(".crm-tarjeta").first().waitFor();
    await page
      .locator(".crm-tarjeta")
      .first()
      .dragTo(page.locator(".crm-columna").nth(1));
    await page.getByRole("dialog").waitFor();
    assert.equal(await page.locator("#op-etapa_id").inputValue(), "2");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancelar", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.screenshot({
      path: "docs/crm-pipeline-escritorio.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "docs/crm-pipeline-movil.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [ruta, titulo] of [
      ["/actividades", "Actividades y tareas"],
      ["/contenido", "Contenido y aprobaciones"],
      ["/automatizaciones", "Automatizaciones"],
      ["/integraciones", "Integraciones y canales"],
      ["/atribucion", "Atribución y embudo"],
      ["/auditoria", "Auditoría de cambios"],
      ["/metas", "Metas por campaña"],
      ["/segmentos", "Segmentos dinámicos"],
    ]) {
      await page.goto(url + ruta);
      await page.getByRole("heading", { name: titulo, exact: true }).waitFor();
      if (ruta === "/actividades") {
        await page.getByRole("button", { name: "Calendario semanal" }).click();
        await page.locator(".crm-calendario").waitFor();
        assert.equal(
          await page.locator(".crm-calendario .crm-columna").count(),
          7,
        );
      }
    }
    await page.goto(url + "/campanas?crm=nuevo");
    await page
      .getByRole("heading", { name: "Formularios y webhooks" })
      .waitFor();
    await page.goto(url+"/campos-personalizados");
    await page.getByRole("button",{name:"Crear campo",exact:true}).click();
    await page.getByRole("dialog").getByLabel("Nombre",{exact:true}).fill("Industria");
    await page.getByLabel("Clave estable",{exact:true}).fill("industria");
    await page.getByRole("dialog").getByRole("button",{name:"Guardar",exact:true}).click();
    await page.getByRole("dialog").waitFor({state:"detached"});
    assert.equal(campos.length,1);
    await page.goto(url + "/contactos/1");
    await page.getByRole("button",{name:"Editar datos adicionales"}).click();
    await page.getByRole("dialog").getByLabel("Industria",{exact:true}).fill("Educación");
    await page.getByRole("dialog").getByRole("button",{name:"Guardar",exact:true}).click();
    await page.getByRole("dialog").waitFor({state:"detached"});
    assert.equal(valores.industria,"Educación");
    await page
      .getByRole("heading", { name: "Etiquetas del contacto" })
      .waitFor();
    await page
      .getByRole("button", { name: "Gestionar etiquetas", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Nombre", { exact: true })
      .fill("Interesado");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Guardar", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(asignadas.length, 1);
    assert.equal(asignadas[0].nombre, "Interesado");
    await page.reload();
    const panelEtiquetas = page.locator("section.crm-panel").filter({ has: page.getByRole("heading", { name: "Etiquetas del contacto", exact: true }) });
    await panelEtiquetas.getByText("Interesado", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Gestionar etiquetas", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Nombre", { exact: true }).fill(" interesado ");
    await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(etiquetas.length, 1, "Reutiliza una etiqueta existente sin duplicarla");
    assert.equal(asignadas.length, 1);
    await page.getByRole("button", { name: "Gestionar etiquetas", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Nombre", { exact: true }).fill("Seguimiento");
    await page.getByRole("button", { name: "Crear y seleccionar" }).click();
    await page.getByRole("checkbox", { name: "Seguimiento", exact: true }).waitFor();
    assert.equal(asignadas.length, 1, "Crear y seleccionar conserva la asignación como borrador");
    await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(asignadas.length, 2);
    await page.getByRole("button", { name: "Gestionar etiquetas", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Nombre", { exact: true }).fill("prueba_whatsapp");
    fallarAsignacionEtiquetas = true;
    await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("dialog").getByRole("alert").filter({hasText:"No se pudieron asignar"}).waitFor();
    assert.equal(asignadas.length, 2, "Un fallo de asignación no anuncia éxito");
    assert.equal(await page.getByRole("checkbox", { name: "prueba_whatsapp", exact: true }).isChecked(), true);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth), true);
    await page.getByRole("dialog").screenshot({path:"docs/crm-etiquetas-error-movil.png"});
    await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(etiquetas.length, 3, "Reintentar no duplica la etiqueta creada");
    assert.equal(asignadas.length, 3);
    await page.reload();
    await panelEtiquetas.getByText("prueba_whatsapp", { exact: true }).waitFor();
    await page.setViewportSize({width:1440,height:900});
    await page
      .getByRole("button", { name: "Registrar interacción", exact: true })
      .click();
    await page.getByRole("dialog").getByRole("combobox").selectOption("1");
    await page
      .getByRole("dialog")
      .getByLabel("utm_source", { exact: true })
      .fill("newsletter");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Guardar", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(origenes.length, 1);
    await page.goto(url+"/automatizaciones/7/flujo");
    await page.getByRole("heading",{name:"Editor visual de flujos"}).waitFor();
    await page.getByLabel("Añadir paso").selectOption("ESPERA");
    await page.getByRole("button",{name:"Añadir",exact:true}).click();
    await page.getByLabel("Esperar (minutos; máximo 7 días)").fill("1");
    await page.getByLabel("Añadir paso").selectOption("SMS");
    await page.getByRole("button",{name:"Añadir",exact:true}).click();
    await page.getByLabel("Mensaje SMS (admite {{nombre}})").fill("Hola {{nombre}}");
    await page.getByLabel("Estado").selectOption("activo");
    await page.getByRole("button",{name:"Guardar flujo",exact:true}).first().click();
    await page.getByText("Flujo guardado.",{exact:false}).waitFor();
    assert.equal(flujo.definicion.nodos.at(-1).tipo,"SMS");
    await page.getByRole("button",{name:"Ejecutar",exact:true}).click();
    await page.getByRole("dialog").getByRole("button",{name:"Ejecutar",exact:true}).click();
    await page.getByRole("dialog").waitFor({state:"detached"});
    assert.equal(ejecucionesManuales,1);
    await page.getByRole("button",{name:"Ver pasos",exact:true}).click();
    await page.getByRole("dialog").getByText("Entrega verificada: Leído",{exact:false}).waitFor();
    await page.keyboard.press("Escape");
    await page.screenshot({path:"docs/crm-editor-flujos.png",fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await page.setViewportSize({width:1440,height:900});
    await page.goto(url+"/integraciones");
    await page.getByRole("button",{name:"Vincular Google",exact:true}).click();
    await page.getByRole("dialog").getByLabel("Campaña interna").selectOption("1");
    await page.getByRole("dialog").getByLabel("ID de cliente Google Ads (sin guiones)").fill("123");
    await page.getByRole("dialog").getByLabel("ID de campaña Google Ads").fill("456");
    await page.getByRole("button",{name:"Guardar vínculo",exact:true}).click();
    await page.getByRole("dialog").waitFor({state:"detached"});
    await page.getByRole("button",{name:"Sincronizar Google Ads",exact:true}).click();
    await page.getByText("1 día sincronizado de Google Ads.",{exact:true}).waitFor();
    assert.equal(conectores.length,1);
    const whatsapp=page.getByRole("region",{name:"Recepción de WhatsApp",exact:true});
    await whatsapp.getByText("<img src=x onerror=alert(1)> Quiero información",{exact:true}).waitFor();
    assert.equal(await whatsapp.locator("img").count(),0);
    await whatsapp.getByRole("button",{name:"Vincular contacto",exact:true}).click();
    await page.getByRole("dialog").getByLabel("Contacto del mensaje").selectOption("1");
    await page.getByRole("dialog").getByRole("button",{name:"Confirmar vínculo",exact:true}).click();
    await page.getByRole("dialog").getByText("El mensaje cambió.",{exact:false}).waitFor();
    assert.equal(await page.getByRole("dialog").getByLabel("Contacto del mensaje").inputValue(),"1");
    await page.getByRole("dialog").getByRole("button",{name:"Cancelar",exact:true}).click();
    await whatsapp.getByRole("button",{name:"Actualizar WhatsApp",exact:true}).click();
    await whatsapp.getByRole("button",{name:"Vincular contacto",exact:true}).click();
    await page.getByRole("dialog").getByLabel("Contacto del mensaje").selectOption("1");
    await page.getByRole("dialog").getByRole("button",{name:"Confirmar vínculo",exact:true}).click();
    await page.getByRole("dialog").waitFor({state:"detached"});
    await whatsapp.getByText("No hay mensajes pendientes de vincular.",{exact:true}).waitFor();
    await whatsapp.getByLabel("Solo mensajes sin contacto").uncheck();
    await whatsapp.getByRole("link",{name:"Ver contacto",exact:true}).waitFor();
    await whatsapp.screenshot({path:"docs/crm-whatsapp-escritorio.png"});
    falloLecturaWhatsApp=true;
    await whatsapp.getByRole("button",{name:"Actualizar WhatsApp",exact:true}).click();
    await whatsapp.getByRole("alert").getByText("Fallo de lectura WhatsApp de prueba",{exact:false}).waitFor();
    falloLecturaWhatsApp=false;
    await whatsapp.getByRole("button",{name:"Reintentar WhatsApp",exact:true}).click();
    await whatsapp.getByRole("alert").waitFor({state:"detached"});
    await page.setViewportSize({width:390,height:844});
    await whatsapp.getByRole("button",{name:"Actualizar WhatsApp",exact:true}).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await whatsapp.getByText("Cargando mensajes…",{exact:true}).waitFor({state:"detached"});
    await whatsapp.getByRole("article").first().scrollIntoViewIfNeeded();
    await page.screenshot({path:"docs/crm-whatsapp-movil.png"});
    await page.setViewportSize({width:1440,height:900});
    await page.goto(url+"/contactos/1");
    await page.getByRole("region",{name:"WhatsApp del contacto",exact:true}).getByText("<img src=x onerror=alert(1)> Quiero información",{exact:true}).waitFor();
    await page.goto(url+"/integraciones");
    await page.screenshot({path:"docs/crm-integraciones.png",fullPage:true});
    await page.goto(url + "/atribucion");
    await page
      .getByRole("heading", { name: "Conversiones históricas observadas" })
      .waitFor();
    await page.getByLabel("Modelo de ingresos").selectOption("LINEAL");
    await page.getByText("Una venta se reparte", { exact: false }).waitFor();
    await page.screenshot({
      path: "docs/crm-conversiones.png",
      fullPage: true,
    });
    await page.goto(url + "/reportes?crm=nuevo");
    await page.getByRole("heading", { name: "Atribución y embudo" }).waitFor();
    await page.getByLabel("Modelo de ingresos").selectOption("ULTIMO");
    await page
      .getByRole("heading", { name: "Conversiones históricas observadas" })
      .waitFor();
    assert.equal(new URL(page.url()).searchParams.get("crm"), "nuevo");
    assert.deepEqual(errores, []);
    const analyst = await browser.newContext();
    await analyst.addInitScript(() =>
      localStorage.setItem(
        "sesionAgencia",
        JSON.stringify({
          token: "token-prueba-analista",
          fechaExpiracion: new Date(Date.now() + 3600000).toISOString(),
          usuario: { rol: { nombreRol: "Analista" } },
        }),
      ),
    );
    await analyst.route("**/api/**", (r) =>
      r.fulfill({ json: { exito: true, datos: [] } }),
    );
    const a = await analyst.newPage();
    await a.goto(url + "/pipeline");
    await a.waitForURL("**/sin-acceso");
  } finally {
    await browser.close();
  }
});
