import {test} from "node:test";
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const url=process.env.CRM_UI_URL||"http://127.0.0.1:5179";

test("Login: solicitud detenida, reintento, credenciales incorrectas y sesión del cliente",async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 let liberar;
 try{
  const contexto=await browser.newContext({reducedMotion:"reduce"});let intentos=0;
  const pendiente=new Promise(r=>liberar=r);
  await contexto.route("**/auth/login",async r=>{
   intentos++;
   if(intentos===1){await pendiente;await r.fulfill({status:503,json:{exito:false,mensaje:"Respuesta tardía"}}).catch(()=>{});return;}
   if(intentos===2){await r.fulfill({status:401,json:{exito:false,mensaje:"Correo o contraseña incorrectos"}});return;}
   assert.deepEqual(r.request().postDataJSON(),{correo:"cliente@example.invalid",contrasena:"contraseña de prueba"});
   await r.fulfill({json:{exito:true,datos:{token:"token-del-navegador",fechaExpiracion:new Date(Date.now()+3600000).toISOString(),usuario:{nombres:"Cliente de prueba",rol:{nombreRol:"Cliente"}},permisos:[]}}});
  });
  await contexto.route("**/api/crm/entregas/portal",r=>r.fulfill({json:{exito:true,datos:{empresa:{nombre:"Empresa de prueba"},contratos:[]}}}));
  // El modelo 3D es ajeno a la autenticación y no es necesario para la prueba.
  await contexto.route("https://prod.spline.design/**",r=>r.abort());
  const page=await contexto.newPage();await page.goto(url+"/login");
  await page.getByPlaceholder("Ingrese su correo...").fill("cliente@example.invalid");
  await page.getByPlaceholder("***************").fill("contraseña de prueba");
  await page.clock.install();
  await page.getByRole("button",{name:"INGRESAR",exact:true}).click();
  await page.getByRole("button",{name:"Iniciando sesión...",exact:true}).waitFor();
  await page.clock.fastForward(61000);
  await page.getByRole("alert").filter({hasText:"El servidor tardó demasiado"}).waitFor();
  assert.equal(await page.getByRole("button",{name:"INGRESAR",exact:true}).isEnabled(),true);
  assert.equal(await page.getByPlaceholder("Ingrese su correo...").inputValue(),"cliente@example.invalid");
  assert.equal(await page.evaluate(()=>localStorage.getItem("sesionAgencia")),null);
  liberar();
  await page.getByRole("button",{name:"INGRESAR",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"Correo o contraseña incorrectos"}).waitFor();
  await page.getByRole("button",{name:"INGRESAR",exact:true}).click();
  await page.waitForURL("**/portal");await page.getByRole("heading",{name:"Portal de mi empresa",exact:true}).waitFor();
  assert.equal(intentos,3);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("sesionAgencia")).usuario.rol.nombreRol),"Cliente");
  await page.reload();await page.getByRole("heading",{name:"Portal de mi empresa",exact:true}).waitFor();
 }finally{liberar?.();await browser.close();}
});
