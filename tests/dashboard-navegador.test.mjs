import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright-core";
import { crearDemostracion } from "../src/componentes/dashboard/demostracionMarketing.js";
import {
  dinero,
  resumirMetricas,
} from "../src/componentes/dashboard/datosMarketing.js";

const base = process.env.DASHBOARD_UI_URL || "http://127.0.0.1:5174";
const verificarGlobo = process.env.DASHBOARD_WEBGL === "1";

async function esperarGlobo(pagina) {
  await pagina.waitForFunction(
    () =>
      document.querySelector('.marketing-globo-canvas[data-listo="true"]') ||
      document
        .querySelector(".marketing-globo-error")
        ?.textContent.includes("requiere WebGL"),
    null,
    { timeout: 120000 },
  );
  assert(
    (await pagina
      .locator('.marketing-globo-canvas[data-listo="true"]')
      .count()) > 0,
    "El entorno de navegador no pudo inicializar el renderizador WebGL",
  );
}

test(
  "Dashboard, selección, filtros, edición, móvil y alternativa sin WebGL",
  { timeout: 600000 },
  async () => {
    const browser = await chromium.launch({
      executablePath:
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      headless: true,
      args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
    });
    try {
      const contexto = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      await contexto.addInitScript(() =>
        localStorage.setItem(
          "sesionAgencia",
          JSON.stringify({
            token: "token-local-de-prueba",
            fechaExpiracion: new Date(Date.now() + 3600000).toISOString(),
            usuario: {
              nombres: "Prueba Dashboard",
              rol: { nombreRol: "Administrador" },
            },
          }),
        ),
      );
      if (!verificarGlobo) {
        await contexto.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (tipo, ...args) {
            return tipo.includes("webgl")
              ? null
              : original.call(this, tipo, ...args);
          };
        });
      }
      let fixture, coberturaGuardada, resultadoGuardado;
      await contexto.route("**/api/**", async (route) => {
        const url = new URL(route.request().url());
        let datos = {};
        if (url.pathname.endsWith("/dashboard/marketing")) {
          fixture = crearDemostracion(
            url.searchParams.get("desde"),
            url.searchParams.get("hasta"),
          );
          fixture.fuente = "Datos aislados de prueba";
          datos = fixture;
        } else if (url.pathname.endsWith("/operaciones/atribucion")) {
          datos = {
            campanas: [],
            ingresos: [],
            gastos: [],
            embudoCampanas: [],
          };
        } else if (/\/campanas\/1\/geografia$/.test(url.pathname)) {
          datos = {
            metricas: fixture.metricas.filter((m) => m.idCampana === 1),
            resultadosGeograficos: fixture.resultadosGeograficos.filter(
              (m) => m.idCampana === 1,
            ),
          };
        } else if (/\/metricas\/\d+\/ubicaciones\/1$/.test(url.pathname)) {
          resultadoGuardado = route.request().postDataJSON();
          datos = null;
        } else if (
          /\/campanas\/1\/ubicaciones$/.test(url.pathname) &&
          route.request().method() === "POST"
        ) {
          coberturaGuardada = route.request().postDataJSON();
          datos = { idUbicacion: 100 };
        }
        await route.fulfill({ json: { exito: true, datos } });
      });
      const pagina = await contexto.newPage();
      const errores = [];
      pagina.on("pageerror", (error) => {
        errores.push(error.message);
        console.log(error.message);
      });
      if (verificarGlobo)
        pagina.on("console", (mensaje) => {
          if (mensaje.type() === "error") console.log(mensaje.text());
        });
      await pagina.goto(`${base}/dashboard`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      await pagina
        .locator(".marketing-campana")
        .first()
        .waitFor({ timeout: 120000 });
      assert.equal(await pagina.locator(".marketing-campana").count(), 6);
      const mapaInicial = await pagina
        .locator(".marketing-mapa")
        .elementHandle();
      if (verificarGlobo) {
        await esperarGlobo(pagina);
      } else {
        await pagina
          .getByText("El globo requiere WebGL", { exact: false })
          .waitFor({ timeout: 120000 });
      }
      await pagina
        .locator(".marketing-campana")
        .filter({ hasText: "Horizonte de verano" })
        .click();
      await pagina
        .getByRole("region", { name: "Detalle de campaña" })
        .waitFor();
      assert.match(
        await pagina.locator(".marketing-contexto").textContent(),
        /Horizonte de verano/,
      );
      const total = resumirMetricas(
        fixture.metricas.filter((m) => m.idCampana === 1),
      );
      assert.equal(
        await pagina.locator(".marketing-kpi-principal strong").textContent(),
        dinero(total.inversion),
      );
      await pagina.getByLabel("Resultados por ubicación").selectOption("1");
      const local = resumirMetricas(
        fixture.resultadosGeograficos.filter(
          (m) => m.idCampana === 1 && m.idUbicacion === 1,
        ),
      );
      assert.equal(
        await pagina.locator(".marketing-kpi-principal strong").textContent(),
        dinero(local.inversion),
      );
      await pagina.getByRole("button", { name: "Gestionar geografía" }).click();
      await pagina
        .getByRole("dialog")
        .getByRole("button", { name: "Resultados", exact: true })
        .click();
      await pagina
        .getByLabel("Métrica del período")
        .selectOption(
          String(fixture.metricas.find((m) => m.idCampana === 1).idMetrica),
        );
      await pagina
        .getByRole("dialog")
        .getByLabel("Ubicación")
        .selectOption("1");
      await pagina
        .getByRole("dialog")
        .getByRole("button", { name: "Guardar", exact: true })
        .click();
      await pagina.getByRole("dialog", {name:"Geografía de campaña",exact:true}).waitFor({ state: "detached" });
      assert(resultadoGuardado.impresiones > 0);
      await pagina.getByRole("button", { name: "Gestionar geografía" }).click();
      await pagina.getByLabel("País", { exact: true }).fill("Ecuador");
      await pagina.getByLabel("Código ISO", { exact: false }).fill("EC");
      await pagina.getByLabel("Ciudad (opcional)").fill("Quito");
      await pagina.getByLabel("Latitud", { exact: true }).fill("-0.1807");
      await pagina.getByLabel("Longitud", { exact: true }).fill("-78.4678");
      await pagina
        .getByRole("button", { name: "Guardar", exact: true })
        .click();
      await pagina.getByRole("dialog", {name:"Geografía de campaña",exact:true}).waitFor({ state: "detached" });
      assert.equal(coberturaGuardada.ciudad, "Quito");
      assert.equal(coberturaGuardada.latitud, -0.1807);
      assert(
        await mapaInicial.evaluate((elemento) => elemento.isConnected),
        "El mapa debe conservarse al actualizar los datos",
      );
      await pagina
        .getByRole("button", { name: "Ver todas las campañas" })
        .click();
      await pagina
        .getByRole("textbox", { name: "Buscar campaña o cliente" })
        .fill("Lumina");
      assert.equal(await pagina.locator(".marketing-campana").count(), 2);
      await pagina
        .getByRole("textbox", { name: "Buscar campaña o cliente" })
        .fill("");
      if (verificarGlobo) await esperarGlobo(pagina);
      await pagina.locator(".marketing-cabecera").scrollIntoViewIfNeeded();
      await pagina.screenshot({
        path: path.join(
          process.env.TEMP,
          verificarGlobo
            ? "dashboard-marketing-escritorio.png"
            : "dashboard-marketing-funcional.png",
        ),
        animations: "disabled",
        timeout: 120000,
      });
      await pagina
        .getByRole("button", { name: "Explorar demostración" })
        .click();
      await pagina.getByText("Modo demostración", { exact: false }).waitFor();
      assert.equal(await pagina.locator(".marketing-campana").count(), 6);
      await pagina.setViewportSize({ width: 390, height: 844 });
      await pagina.screenshot({
        path: path.join(process.env.TEMP, "dashboard-marketing-movil.png"),
        animations: "disabled",
        timeout: 120000,
      });
      await pagina.locator(".marketing-dashboard").evaluate((elemento) => {
        if (elemento.scrollWidth > elemento.clientWidth + 1) {
          const borde = elemento.getBoundingClientRect();
          const excedidos = [...elemento.querySelectorAll("*")]
            .filter(
              (nodo) => nodo.getBoundingClientRect().right > borde.right + 1,
            )
            .slice(0, 12)
            .map((nodo) => nodo.className);
          throw new Error(
            `Desbordamiento horizontal en móvil. ${elemento.scrollWidth}/${elemento.clientWidth}. ${JSON.stringify(excedidos)}`,
          );
        }
      });
      await pagina.screenshot({
        path: path.join(process.env.TEMP, "dashboard-marketing-movil.png"),
        animations: "disabled",
        timeout: 120000,
      });
      assert.deepEqual(errores, []);
      await contexto.close();
      if (!verificarGlobo) return;

      const sinWebgl = await browser.newContext();
      await sinWebgl.addInitScript(() => {
        localStorage.setItem(
          "sesionAgencia",
          JSON.stringify({
            token: "prueba",
            fechaExpiracion: new Date(Date.now() + 3600000).toISOString(),
            usuario: { nombres: "Prueba", rol: { nombreRol: "Administrador" } },
          }),
        );
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (tipo, ...args) {
          return tipo.includes("webgl")
            ? null
            : original.call(this, tipo, ...args);
        };
      });
      await sinWebgl.route("**/api/**", (route) =>
        route.fulfill({ json: { exito: true, datos: fixture } }),
      );
      const alternativa = await sinWebgl.newPage();
      await alternativa.goto(`${base}/dashboard`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      await alternativa
        .getByText("El globo requiere WebGL", { exact: false })
        .waitFor({ timeout: 90000 });
      assert.equal(await alternativa.locator(".marketing-campana").count(), 6);
      await sinWebgl.close();
    } finally {
      await browser.close();
    }
  },
);
