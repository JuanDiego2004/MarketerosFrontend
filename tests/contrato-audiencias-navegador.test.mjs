import {test} from "node:test";
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const url=process.env.CRM_UI_URL||"http://127.0.0.1:5179";

for(const modo of ["opciones anteriores","error recuperable","catálogo vacío actualizado"]){
 test(`Audiencias: ${modo} recupera jóvenes de 14 a 22 sin perder el borrador`,async()=>{
  const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1280,height:950}});
   await ctx.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"ui",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Admin",rol:{nombreRol:"Administrador"}}})));
   const fecha=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Lima"}).format(new Date());
   let lecturas=0,version=1;
   let d={nombre:"Contrato conservado",empresa_id:"1",responsable_id:"1",objetivo:"Promocionar",servicio:"DIFUSION",modalidad:"PAGADA",piezas:[{clave:"pieza",titulo:"Material conservado",descripcion:"Texto conservado",formato:"TEXTO",fuente:"CLIENTE",pendiente:false,archivos:[],canales:[{plataforma:"FACEBOOK",objetivo:"Ventas",texto:"Mensaje conservado",programado_en:fecha+"T10:00:00-05:00",responsable_id:"1",modalidad:"PAGADA",presupuesto:100,audiencia_id:"",audiencia:"",cobertura:""}]}]};
   await ctx.route("**/api/**",async r=>{
    const p=new URL(r.request().url()).pathname;let datos=[];
    if(p.endsWith("/agencia/opciones"))datos={gestionar:true,empresas:[{id:1,nombre:"Andina"}],usuarios:[{id:1,nombre:"Ana"}],cotizaciones:[],contratos:[],cuentas:[],...(modo==="catálogo vacío actualizado"?{audiencias:[],audienciasPermitidas:true}:{})};
    else if(p==="/api/admin/audiencias"){
     lecturas++;
     if(modo==="error recuperable"&&lecturas===1){await r.fulfill({status:503,json:{mensaje:"Servicio temporalmente no disponible"}});return;}
     datos=[{idSegmento:1,nombre:"jovenes",edadMin:14,edadMax:22,estado:"ACTIVO",intereses:""},{idSegmento:2,nombre:"Archivada",estado:"INACTIVO"}];
    }else if(p.endsWith("/agencia/contratos"))datos={filas:[],total:0};
    else if(p.includes("/borradores/")){if(r.request().method()==="PUT"){const body=r.request().postDataJSON();d=body.datos;version++;}datos={id:"recuperar-audiencias",datos:d,version};}
    await r.fulfill({json:{exito:true,datos}});
   });
   const page=await ctx.newPage(),siguiente=()=>page.getByRole("button",{name:"Guardar y continuar",exact:true}).click();
   await page.goto(url+"/contratos/borradores/recuperar-audiencias");await siguiente();await siguiente();
   if(modo==="catálogo vacío actualizado"){assert.equal(lecturas,0);await page.getByRole("status").filter({hasText:"No hay audiencias activas en el catálogo consultado"}).waitFor();}
   if(modo==="error recuperable"){await page.getByRole("alert").filter({hasText:"No se pudieron cargar las audiencias"}).waitFor();assert.equal(await page.getByText("No hay audiencias activas",{exact:false}).count(),0);}
   if(modo!=="opciones anteriores")await page.getByRole("button",{name:"Actualizar audiencias",exact:true}).click();
   const selector=page.getByLabel("Audiencia FACEBOOK",{exact:true});await selector.locator('option[value="1"]').waitFor({state:"attached"});
   assert.equal(await selector.locator("option").filter({hasText:"Archivada"}).count(),0);
   await selector.selectOption("1");await page.getByText("14 – 22",{exact:true}).waitFor();
   assert.equal(await page.getByLabel("Título de pieza 1",{exact:true}).inputValue(),"Material conservado");assert.equal(await page.getByLabel("Texto propio FACEBOOK",{exact:true}).inputValue(),"Mensaje conservado");
   await page.getByLabel("Cobertura FACEBOOK",{exact:true}).fill("Lima");
   await page.getByRole("button",{name:"Actualizar audiencias",exact:true}).click();await selector.locator('option[value="1"]').waitFor({state:"attached"});
   assert.equal(await selector.inputValue(),"1");assert.equal(await page.getByLabel("Cobertura FACEBOOK",{exact:true}).inputValue(),"Lima");
   if(modo==="opciones anteriores"){await page.getByRole("region",{name:"Plan de FACEBOOK",exact:true}).screenshot({path:"docs/audiencia-jovenes-recuperada.png"});assert.ok(lecturas>=2);}
  }finally{await browser.close();}
 });
}

test("Plan por canal reutiliza audiencias, cobertura y objetivos; guarda IDs y conserva el borrador",async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  await ctx.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"ui",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Admin",rol:{nombreRol:"Administrador"}}})));
  const audiencias=[
   {idSegmento:21,nombre:"Jóvenes de Lima",estado:"ACTIVO",edadMin:18,edadMax:25,ubicacionGeografica:"Lima, Perú",intereses:"Tecnología, videojuegos",criterios:"Estudiantes"},
   {idSegmento:22,nombre:"Adultos del Cusco",estado:"ACTIVO",edadMin:30,edadMax:50,ubicacionGeografica:"Cusco, Perú",intereses:"Turismo"},
   {idSegmento:23,nombre:"Audiencia archivada",estado:"INACTIVO"}
  ],borradores=new Map();let ultimo;
  await ctx.route("**/api/**",async r=>{
   const p=new URL(r.request().url()).pathname;let datos=[];
   if(p.endsWith("/agencia/opciones"))datos={gestionar:true,audienciasPermitidas:true,audiencias,objetivos:["Visibilidad de marca local"],empresas:[{id:1,nombre:"Andina"}],usuarios:[{id:1,nombre:"Ana"}],cotizaciones:[],contratos:[],cuentas:[]};
   else if(p.endsWith("/agencia/contratos"))datos={filas:[],total:0};
   else if(p.includes("/borradores/")){
    const id=p.split("/").at(-1);
    if(r.request().method()==="PUT"){const body=r.request().postDataJSON(),previo=borradores.get(id);assert.equal(body.version,previo?.version||0);borradores.set(id,{id,version:body.version+1,datos:body.datos});ultimo=id;}
    datos=borradores.get(id);
   }
   await r.fulfill({json:{exito:true,datos}});
  });
  const page=await ctx.newPage(),errores=[];page.on("pageerror",e=>errores.push(e.message));
  const siguiente=()=>page.getByRole("button",{name:"Guardar y continuar",exact:true}).click();
  await page.goto(url+"/contratos/nuevo");
  await page.getByLabel("Empresa",{exact:true}).selectOption("1");await page.getByLabel("Nombre del contrato",{exact:true}).fill("Difusión de campaña");
  await page.getByLabel("Objetivo del servicio",{exact:true}).fill("Promocionar servicios");await page.getByLabel("Responsable",{exact:true}).selectOption("1");
  await siguiente();await siguiente();
  await page.getByLabel("Título de pieza 1",{exact:true}).fill("Anuncio");await page.getByLabel("Descripción de pieza 1",{exact:true}).fill("Texto del anuncio");await page.getByLabel("Formato de pieza 1",{exact:true}).selectOption("TEXTO");
  await page.getByLabel("Modalidad de difusión",{exact:true}).selectOption("PAGADA");await page.getByRole("dialog").last().getByRole("button",{name:"Confirmar cambio",exact:true}).click();
  await page.getByRole("checkbox",{name:"FACEBOOK",exact:true}).check();
  const plan=page.getByRole("region",{name:"Plan de FACEBOOK",exact:true}),objetivo=page.getByLabel("Objetivo FACEBOOK",{exact:true});
  await objetivo.focus();await page.keyboard.press("ArrowDown");await page.keyboard.press("Enter");
  await objetivo.selectOption("Visibilidad de marca local");assert.equal(await page.getByLabel("Objetivo personalizado FACEBOOK",{exact:true}).count(),0);
  await page.getByLabel("Presupuesto FACEBOOK",{exact:true}).fill("300");
  await page.getByLabel("Filtrar audiencias FACEBOOK",{exact:true}).fill("TECNOLOGIA");
  const selector=page.getByLabel("Audiencia FACEBOOK",{exact:true});
  assert.deepEqual(await selector.locator("option").evaluateAll(os=>os.filter(o=>o.value).map(o=>o.textContent)),["Jóvenes de Lima"]);
  await selector.selectOption("21");assert.equal(await page.getByLabel("Cobertura FACEBOOK",{exact:true}).inputValue(),"Lima, Perú");
  await plan.getByText("Tecnología, videojuegos",{exact:true}).waitFor();
  await page.getByLabel("Cobertura FACEBOOK",{exact:true}).fill("Miraflores, Lima");
  await objetivo.selectOption("__PROPIO__");await page.getByLabel("Objetivo personalizado FACEBOOK",{exact:true}).fill("Promocionar el nuevo local");
  await plan.screenshot({path:"docs/contrato-canal-organizado.png"});
  await page.getByRole("button",{name:"Guardar borrador",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Borrador guardado"}).waitFor();
  const canal=borradores.get(ultimo).datos.piezas[0].canales[0];
  assert.equal(canal.audiencia_id,"21");assert.equal(canal.audiencia,"Jóvenes de Lima");assert.equal(canal.cobertura,"Miraflores, Lima");assert.equal(canal.objetivo,"Promocionar el nuevo local");
  await page.goto(url+"/contratos/borradores/"+ultimo);await siguiente();await siguiente();
  assert.equal(await page.getByLabel("Audiencia FACEBOOK",{exact:true}).inputValue(),"21");assert.equal(await page.getByLabel("Cobertura FACEBOOK",{exact:true}).inputValue(),"Miraflores, Lima");
  assert.equal(await page.getByLabel("Objetivo personalizado FACEBOOK",{exact:true}).inputValue(),"Promocionar el nuevo local");
  await page.getByLabel("Audiencia FACEBOOK",{exact:true}).selectOption("");await siguiente();
  await page.getByRole("alert").filter({hasText:"Completa los campos obligatorios"}).waitFor();
  assert.equal(await selector.evaluate(e=>document.activeElement===e),true);
  await page.getByLabel("Filtrar audiencias FACEBOOK",{exact:true}).fill("sin resultados");await page.getByRole("status").filter({hasText:"No hay audiencias que coincidan"}).waitFor();
  await page.getByLabel("Filtrar audiencias FACEBOOK",{exact:true}).fill("Cusco");await selector.selectOption("22");
  assert.equal(await page.getByLabel("Cobertura FACEBOOK",{exact:true}).inputValue(),"Cusco, Perú");
  await page.setViewportSize({width:390,height:844});await selector.scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:"docs/contrato-canal-movil.png"});
  await siguiente();await page.getByLabel("Honorarios de la agencia",{exact:true}).waitFor();assert.deepEqual(errores,[]);
 }finally{await browser.close();}
});
