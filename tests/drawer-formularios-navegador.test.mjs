import {test} from "node:test";
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const url=process.env.CRM_UI_URL||"http://127.0.0.1:5179";
test("Contrato en drawer amplio y creación de empresa en drawer anidado",async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:"reduce"});
  await ctx.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"drawer-contrato",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Persona",rol:{nombreRol:"Administrador"}}})));
  const opciones={gestionar:true,empresas:[{id:1,nombre:"Empresa previa"}],usuarios:[{id:1,nombre:"Persona"}],contratos:[],cotizaciones:[],anuncios:[],cuentas:[]};
  await ctx.route("**/api/**",async r=>{const p=new URL(r.request().url()).pathname;let d=[];
   if(p==="/api/crm/agencia/opciones")d=opciones;
   else if(p==="/api/crm/agencia/contratos")d={filas:[],total:0};
   else if(p==="/api/crm/cuentas"){assert.equal(r.request().method(),"POST");d={id:2};}
   await r.fulfill({json:{exito:true,datos:d}});
  });
  const page=await ctx.newPage(),errores=[];page.on("pageerror",e=>errores.push(e.message));await page.goto(url+"/contratos/nuevo");
  const principal=page.getByRole("dialog",{name:"Nuevo contrato",exact:true});await principal.getByLabel("Empresa",{exact:true}).waitFor();
  assert.equal(Math.round((await principal.locator(".drawer-panel").boundingBox()).width),960);
  await principal.getByRole("button",{name:"Nueva empresa sin salir",exact:true}).click();
  const empresa=page.getByRole("dialog",{name:"Nueva empresa",exact:true});assert.equal(await empresa.evaluate(e=>e.classList.contains("drawer-fondo")),true);
  await empresa.getByLabel("Nombre de la empresa",{exact:true}).fill("Empresa en el contrato");
  await principal.getByLabel("Empresa",{exact:true}).evaluate(e=>e.focus());assert.equal(await empresa.evaluate(e=>e.contains(document.activeElement)),true);
  await empresa.getByRole("button",{name:"Crear y seleccionar empresa",exact:true}).click();await empresa.waitFor({state:"detached"});assert.equal(await principal.getByLabel("Empresa",{exact:true}).inputValue(),"2");
  await principal.screenshot({path:"docs/drawer-contrato-escritorio.png"});await page.setViewportSize({width:390,height:844});assert.equal(await principal.locator(".drawer-contenido").evaluate(e=>e.scrollWidth<=e.clientWidth),true);
  await page.keyboard.press("Escape");const confirmacion=page.getByRole("dialog",{name:"Confirmar cambio",exact:true});await confirmacion.getByRole("button",{name:"Mantener datos",exact:true}).click();assert.equal(await principal.getByLabel("Empresa",{exact:true}).inputValue(),"2");
  await principal.getByRole("button",{name:"Cerrar formulario",exact:true}).click();await confirmacion.getByRole("button",{name:"Confirmar cambio",exact:true}).click();await page.waitForURL("**/contratos");assert.deepEqual(errores,[]);
 }finally{await browser.close();}
});
test("Drawer compartido: foco, Escape, descarte, guardado en curso, reintento y móvil",async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 let liberar;
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:"reduce"});
  await ctx.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"drawer-ui",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Persona",rol:{nombreRol:"Administrador"}}})));
  const espera=new Promise(r=>liberar=r);let intentos=0,creado;
  await ctx.route("**/api/**",async r=>{
   const p=new URL(r.request().url()).pathname;let d={};
   if(p.endsWith("/capacidades"))d={cuentasLeer:true,cuentasGestionar:true};
   else if(p==="/api/crm/cuentas/opciones")d={cuentas:[],campanas:[],responsables:[],clientes:[]};
   else if(p==="/api/crm/cuentas"&&r.request().method()==="POST"){
    intentos++;if(intentos===1){await espera;await r.fulfill({status:503,json:{mensaje:"No se guardó. Puedes reintentar."}});return;}
    creado={...r.request().postDataJSON(),id:8,notas:[],eventos:[],archivos:[],contactos:[],campanas:[],oportunidades:[],actividades:[]};d={id:8};
   }else if(p==="/api/crm/cuentas")d={filas:creado?[creado]:[],total:creado?1:0};
   else if(p==="/api/crm/cuentas/8")d=creado;
   else if(p==="/api/crm/cuentas/8/notas"){creado.notas.push({id:1,texto:r.request().postDataJSON().texto,autor:"Persona",createdAt:new Date().toISOString()});d=null;}
   else if(p==="/api/crm/cuentas/8/archivos"){creado.archivos.push({id:1,nombre:"brief.txt",tamano:20});d=null;}
   else if(p.endsWith("/notificaciones"))d=[];
   await r.fulfill({json:{exito:true,datos:d}});
  });
  const page=await ctx.newPage(),errores=[];page.on("pageerror",e=>errores.push(e.message));
  await page.goto(url+"/empresas");const abrir=page.getByRole("button",{name:"Nueva empresa",exact:true});await abrir.click();
  let drawer=page.getByRole("dialog",{name:"Crear empresa",exact:true});
  assert.equal(await drawer.evaluate(e=>e.matches(":modal")&&e.classList.contains("drawer-fondo")),true);
  const panel=await drawer.locator(".drawer-panel").boundingBox();assert.equal(Math.round(panel.width),560);assert.equal(Math.round(panel.x+panel.width),1440);
  await page.keyboard.press("Shift+Tab");await page.keyboard.press("Tab");
  assert.equal(await drawer.evaluate(e=>e.contains(document.activeElement)),true);
  await abrir.evaluate(e=>e.focus());assert.equal(await drawer.evaluate(e=>e.contains(document.activeElement)),true);
  await page.keyboard.press("Escape");await drawer.waitFor({state:"detached"});assert.equal(await abrir.evaluate(e=>e===document.activeElement),true);
  await abrir.click();drawer=page.getByRole("dialog",{name:"Crear empresa",exact:true});await drawer.getByLabel("Nombre de la empresa",{exact:true}).fill("Empresa Drawer");
  await drawer.getByRole("button",{name:"Cerrar formulario",exact:true}).click();await page.getByRole("dialog",{name:"¿Descartar los cambios?",exact:true}).getByRole("button",{name:"Seguir editando",exact:true}).click();
  drawer=page.getByRole("dialog",{name:"Crear empresa",exact:true});assert.equal(await drawer.getByLabel("Nombre de la empresa",{exact:true}).inputValue(),"Empresa Drawer");
  await drawer.getByRole("button",{name:"Guardar",exact:true}).click();await drawer.getByRole("button",{name:"Cerrar formulario",exact:true}).isDisabled();
  assert.equal(await drawer.getByRole("button",{name:"Cerrar formulario",exact:true}).isDisabled(),true);
  await page.keyboard.press("Escape");assert.equal(await drawer.isVisible(),true);liberar();
  await drawer.getByRole("alert").filter({hasText:"No se guardó"}).waitFor();assert.equal(await drawer.getByLabel("Nombre de la empresa",{exact:true}).inputValue(),"Empresa Drawer");
  await page.setViewportSize({width:390,height:844});const movil=await drawer.locator(".drawer-panel").boundingBox();assert.equal(Math.round(movil.width),390);assert.equal(await drawer.locator(".drawer-contenido").evaluate(e=>e.scrollWidth<=e.clientWidth),true);await drawer.screenshot({path:"docs/drawer-registro-movil.png"});
  await drawer.getByRole("button",{name:"Guardar",exact:true}).click();await drawer.waitFor({state:"detached"});await page.getByRole("link",{name:"Ver ficha de Empresa Drawer",exact:true}).click();await page.waitForURL("**/empresas/8");await page.getByRole("heading",{name:"Empresa Drawer",exact:true}).waitFor();assert.equal(intentos,2);assert.deepEqual(errores,[]);
  await page.getByRole("tab",{name:"Notas",exact:true}).click();await page.getByRole("button",{name:"Nueva nota",exact:true}).click();drawer=page.getByRole("dialog",{name:"Nueva nota",exact:true});await drawer.getByLabel("Nueva nota",{exact:true}).fill("Seguimiento de la empresa");await drawer.getByRole("button",{name:"Añadir nota",exact:true}).click();await drawer.waitFor({state:"detached"});await page.getByText("Seguimiento de la empresa",{exact:false}).waitFor();
  await page.getByRole("tab",{name:"Archivos",exact:true}).click();await page.getByRole("button",{name:"Adjuntar archivo",exact:true}).click();drawer=page.getByRole("dialog",{name:"Adjuntar archivo",exact:true});await drawer.getByLabel("Adjuntar archivo (máximo 5 MB)",{exact:true}).setInputFiles({name:"brief.txt",mimeType:"text/plain",buffer:Buffer.from("Brief de la empresa")});await drawer.waitFor({state:"detached"});await page.getByText("brief.txt",{exact:false}).waitFor();assert.deepEqual(errores,[]);
 }finally{liberar?.();await browser.close();}
});
