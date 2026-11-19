import {test} from "node:test";
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const url=process.env.CRM_UI_URL||"http://127.0.0.1:5179";

for(const modo of ["carga y reintento","periodo con datos"]){
 test(`Estadísticas iniciales: ${modo}, vista rápida y móvil`,async()=>{
  const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
   await ctx.addInitScript(()=>localStorage.setItem("sesionAgencia",JSON.stringify({token:"ui",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Admin",rol:{nombreRol:"Administrador"}}})));
   const hoy=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Lima"}).format(new Date()),anuncio={id:5,contrato_id:5,codigo:"CTR-5-AD-1",nombre:"Video Facebook",fecha:hoy,estado:"BORRADOR",formato:"VIDEO",cuenta_id:1};
   let intentos=0,listo=false,lecturas=0;
   await ctx.route("**/api/**",async r=>{
    const u=new URL(r.request().url()),p=u.pathname;let datos=[];
    if(p.endsWith("/agencia/opciones"))datos={gestionar:true,empresas:[],usuarios:[],contratos:[{id:5,nombre:"Servicio",empresa_id:1,servicio:"DIFUSION"}],cotizaciones:[],campanas:[],cuentas:[],anuncios:[],contenidos:[]};
    else if(p.endsWith("/agencia/anuncios"))datos={filas:[anuncio],total:1};
    else if(p.endsWith("/estadisticas-iniciales")){
     intentos++;if(intentos===1)datos={estado:"ERROR",mensaje:"No se pudieron cargar los datos de Mockaroo. Reintenta."};else{listo=true;datos={estado:"LISTO",filasNuevas:9};}
    }else if(p.endsWith("/metricas")){
     lecturas++;const completo=modo==="periodo con datos"?lecturas>1:listo;
     datos={anuncio,fuente:"Datos simulados con Mockaroo",moneda:"PEN",estadisticasIniciales:"ERROR",periodoDisponible:modo==="periodo con datos"?{filas:9,desde:"2026-01-01",hasta:"2026-01-01"}:{filas:completo?9:0},
      filas:completo?[{fecha:hoy,pais:"PE",impresiones:2000,clics:60,conversiones:3,inversion:30,ingresos:60}]:[],
      resumen:{impresiones:completo?2000:0,clics:completo?60:0,conversiones:completo?3:0,inversion:completo?30:0,ingresos:completo?60:0,ctr:completo?3:null,cpc:completo?.5:null,cpm:completo?15:null},
      dias:completo?[{fecha:hoy,impresiones:2000,clics:60,conversiones:3,inversion:30,ingresos:60}]:[],
      paises:completo?[{codigo:"PE",nombre:"Perú",latitud:-9.19,longitud:-75.02,impresiones:2000,clics:60,conversiones:3,inversion:30,ingresos:60}]:[]};
     if(modo==="periodo con datos"&&completo)assert.equal(u.searchParams.get("desde"),"2026-01-01");
    }
    await r.fulfill({json:{exito:true,datos}});
   });
   const page=await ctx.newPage(),errores=[];page.on("pageerror",e=>errores.push(e.message));
   await page.goto(url+"/anuncios");await page.getByRole("button",{name:"Ver estadísticas",exact:true}).click();
   const dialogo=page.getByRole("dialog",{name:"Estadísticas del anuncio",exact:true});
   assert.equal(await dialogo.locator(".crm-demo-kpis").count(),0);
   if(modo==="periodo con datos"){await dialogo.getByRole("button",{name:"Ver periodo con estadísticas",exact:true}).click();assert.equal(intentos,0);}
   else{
    await dialogo.getByText("El contrato está guardado, pero falló",{exact:false}).waitFor();
    await dialogo.getByRole("button",{name:"Reintentar estadísticas",exact:true}).click();await dialogo.getByRole("alert").waitFor();
    await dialogo.getByRole("button",{name:"Reintentar estadísticas",exact:true}).click();assert.equal(intentos,2);
   }
   await dialogo.getByRole("button",{name:"Exportar estadísticas",exact:true}).waitFor();assert.equal(await dialogo.locator(".crm-demo-kpis").count(),1);
   await dialogo.getByText("2,000",{exact:true}).first().waitFor();await dialogo.getByRole("cell",{name:"PE",exact:true}).waitFor();
   await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(modo==="carga y reintento")await page.screenshot({path:"docs/estadisticas-iniciales-movil.png"});
   assert.deepEqual(errores,[]);
  }finally{await browser.close();}
 });
}
