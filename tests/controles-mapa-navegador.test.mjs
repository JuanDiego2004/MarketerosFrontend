import {test} from "node:test";
import assert from "node:assert/strict";
import {chromium} from "playwright-core";

test("Controles flotantes: foco, Escape, selección persistente, clic exterior y pantalla completa nativa",{timeout:90000},async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto((process.env.CRM_UI_URL||"http://127.0.0.1:5188")+"/tests/apoyos/controles-mapa.html",{waitUntil:"domcontentloaded"});
  const filtro=page.getByRole("button",{name:"Filtros",exact:true});
  await filtro.focus();await page.keyboard.press("Enter");
  await page.getByLabel("Desde",{exact:true}).fill("2026-11-05");
  await page.keyboard.press("Escape");
  assert.equal(await filtro.getAttribute("aria-expanded"),"false");
  assert.equal(await filtro.evaluate((e)=>e===document.activeElement),true);
  await filtro.click();
  assert.equal(await page.getByLabel("Desde",{exact:true}).inputValue(),"2026-11-05");
  await page.getByRole("button",{name:"Fuera del filtro",exact:true}).click();
  assert.equal(await filtro.getAttribute("aria-expanded"),"false");
  await page.getByRole("button",{name:"Ampliar mapa a pantalla completa",exact:true}).click();
  await page.waitForFunction(()=>Boolean(document.fullscreenElement));
  assert.equal(await page.evaluate(()=>document.fullscreenElement.classList.contains("mapa-pantalla-completa")),true);
  await page.getByRole("button",{name:"Salir de pantalla completa",exact:true}).click();
  await page.waitForFunction(()=>!document.fullscreenElement);
  await page.setViewportSize({width:390,height:844});
  await filtro.click();
  const caja=await page.getByRole("region",{name:"Filtros del mapa",exact:true}).boundingBox();
  assert.ok(caja.x>=0 && caja.y>=0 && caja.x+caja.width<=390 && caja.y+caja.height<=844);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 } finally {await browser.close();}
});
