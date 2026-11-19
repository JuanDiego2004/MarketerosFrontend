import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const url=process.env.CRM_UI_URL || "http://127.0.0.1:5179";
test("Informes: selección consulta métricas sin registros manuales, error, cambio y exportación",async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:"reduce"});
  await context.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"informes-ui",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"María",rol:{nombreRol:"Administrador"}}})));
  const contratos=[{id:1,nombre:"Café Mantaro",servicio:"INTEGRAL"},{id:2,nombre:"Contrato sin métricas",servicio:"ANALISIS"}];let fallo=true,escrituras=0;
  await context.route("**/api/**",async r=>{
   const p=new URL(r.request().url()).pathname;let datos=[];
   if(r.request().method()!=="GET")escrituras++;
   if(p==="/api/crm/agencia/opciones")datos={gestionar:true,contratos,empresas:[],usuarios:[],anuncios:[]};
   else if(p==="/api/crm/agencia/informes")datos={filas:[],total:0};
   else if(/\/contratos\/[12]\/informe$/.test(p)){
    const id=Number(p.split("/").at(-2));if(id===1 && fallo){fallo=false;await r.fulfill({status:503,json:{mensaje:"No se pudo consultar el informe"}});return;}
    const conDatos=id===1;
    datos={contrato:{...contratos[id-1],moneda:"PEN",honorarios:500,produccion:200,presupuesto:1000,desde:"2026-11-01",hasta:"2026-11-30",alcance:"Informe mensual"},empresa:{nombre:contratos[id-1].nombre},campanas:[],anuncios:[],trabajos:[],historial:[],gasto:conDatos?90:0,tieneMetricas:conDatos,resumen:{impresiones:conDatos?9000:0,clics:conDatos?900:0,conversiones:conDatos?45:0,ctr:conDatos?10:null,cpc:conDatos?0.1:null,cpm:conDatos?10:null,cpa:conDatos?2:null},dias:conDatos?[{fecha:"2026-11-18",impresiones:9000,clics:900,conversiones:45,inversion:90}]:[],fuente:"Datos simulados con Mockaroo"};
   }
   await r.fulfill({json:{exito:true,datos}});
  });
  const page=await context.newPage(),errores=[];page.on("pageerror",e=>errores.push(e.message));await page.goto(url+"/informes-contrato");
  await page.getByText("Selecciona un contrato para consultar y exportar sus resultados.",{exact:false}).waitFor();
  await page.getByRole("combobox").first().selectOption("1");await page.getByRole("button",{name:"Reintentar informe"}).waitFor();await page.getByRole("button",{name:"Reintentar informe"}).click();
  const panel=page.getByRole("region",{name:"Resultados del contrato"});await panel.getByText("9,000",{exact:true}).first().waitFor();
  await page.getByText("No hay informes redactados para esta selección.",{exact:false}).waitFor();
  const descarga=page.waitForEvent("download");await panel.getByRole("button",{name:"Exportar informe",exact:true}).click();assert.equal((await descarga).suggestedFilename(),"informe-contrato-1.txt");
  await page.screenshot({path:"docs/informes-resultados-contrato.png",fullPage:true});
  await page.getByRole("combobox").first().selectOption("2");await panel.getByText("Aún no hay estadísticas descargadas",{exact:false}).waitFor();assert.equal(await panel.getByText("9,000",{exact:true}).count(),0);
  await page.setViewportSize({width:390,height:844});await page.getByRole("combobox").first().selectOption("1");await panel.getByText("9,000",{exact:true}).first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole("combobox").first().selectOption("");await page.getByText("Selecciona un contrato para consultar y exportar sus resultados.",{exact:false}).waitFor();assert.equal(await page.getByRole("region",{name:"Resultados del contrato"}).count(),0);assert.equal(escrituras,0);assert.deepEqual(errores,[]);
 }finally{await browser.close();}
});
