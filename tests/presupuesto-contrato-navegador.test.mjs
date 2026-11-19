import {test} from "node:test";
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const url=process.env.CRM_UI_URL||"http://127.0.0.1:5179";

test("Pauta: 300 distribuidos con cero autorizado se corrige en precios sin confirmar ni cambiar importes automáticamente",async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  await ctx.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"ui",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Admin",rol:{nombreRol:"Administrador"}}})));
  const fecha=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Lima"}).format(new Date());
  let d={nombre:"Contrato prueba",empresa_id:"1",responsable_id:"1",objetivo:"Difundir",servicio:"DIFUSION",modalidad:"PAGADA",presupuesto:0,honorarios:500,produccion:200,alcance:"Difusión contratada",prestaciones:[{prestacion:"PUBLICACION",cantidad:1}],piezas:[{clave:"texto",titulo:"Anuncio",descripcion:"Texto",formato:"TEXTO",fuente:"CLIENTE",archivos:[],canales:[{plataforma:"FACEBOOK",objetivo:"Ventas",texto:"Anuncio",programado_en:fecha+"T10:00:00-05:00",responsable_id:"1",modalidad:"PAGADA",presupuesto:300,audiencia_id:"1",audiencia:"jóvenes",cobertura:"Lima"}]}]},version=1,confirmaciones=0,guardados=0;
  await ctx.route("**/api/**",async r=>{
   const p=new URL(r.request().url()).pathname;let datos=[];
   if(p.endsWith("/agencia/opciones"))datos={gestionar:true,audienciasPermitidas:true,audiencias:[{idSegmento:1,nombre:"jóvenes",estado:"ACTIVO"}],empresas:[{id:1,nombre:"Empresa"}],usuarios:[{id:1,nombre:"Admin"}],cotizaciones:[],contratos:[],cuentas:[]};
   else if(p.endsWith("/agencia/contratos"))datos={filas:[],total:0};
   else if(p.endsWith("/confirmar")){confirmaciones++;datos={id:8};}
   else if(p.endsWith("/contratos/8"))datos={contrato:{...d,id:8,estado:"BORRADOR"},configuracion:d,anuncios:[],contenidos:[],historial:[],prestaciones:d.prestaciones};
   else if(p.includes("/borradores/")){if(r.request().method()==="PUT"){const body=r.request().postDataJSON();d=body.datos;version++;guardados++;}datos={id:"presupuesto",version,datos:d};}
   await r.fulfill({json:{exito:true,datos}});
  });
  const page=await ctx.newPage(),errores=[],siguiente=()=>page.getByRole("button",{name:"Guardar y continuar",exact:true}).click();page.on("pageerror",e=>errores.push(e.message));
  await page.goto(url+"/contratos/borradores/presupuesto");await siguiente();await siguiente();
  const resumen=page.getByRole("region",{name:"Resumen de presupuesto de pauta",exact:true});
  await resumen.getByText("En el paso 4,",{exact:false}).waitFor();assert.equal(d.presupuesto,0);
  await siguiente();const limite=page.getByLabel("Presupuesto máximo autorizado de pauta",{exact:true});
  assert.equal(await limite.inputValue(),"0");assert.equal(d.honorarios,500);assert.equal(d.produccion,200);
  const antes=guardados;await siguiente();
  await page.getByRole("alert").filter({hasText:"Has distribuido"}).waitFor();
  await page.waitForFunction(()=>document.activeElement?.getAttribute("aria-label")==="Presupuesto máximo autorizado de pauta");assert.equal(confirmaciones,0);assert.equal(guardados,antes);
  await page.screenshot({path:"docs/presupuesto-pauta-validacion.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});await resumen.scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:"docs/presupuesto-pauta-movil.png"});
  await limite.fill("299");assert.equal(await page.getByRole("alert").count(),0);
  await siguiente();await page.getByRole("alert").filter({hasText:"Has distribuido"}).waitFor();
  await page.getByRole("button",{name:"Usar total distribuido como máximo autorizado",exact:false}).click();
  assert.equal(await limite.inputValue(),"300.00");assert.equal(await limite.getAttribute("aria-invalid"),null);
  await siguiente();await page.getByRole("heading",{name:"Contrato prueba · Gestión y difusión",exact:true}).waitFor();
  assert.equal(d.presupuesto,"300.00");assert.equal(d.honorarios,500);assert.equal(d.produccion,200);
  await page.getByRole("button",{name:"Crear contrato y abrir ficha",exact:true}).click();await page.waitForURL("**/contratos/8");assert.equal(confirmaciones,1);assert.deepEqual(errores,[]);
 }finally{await browser.close();}
});
