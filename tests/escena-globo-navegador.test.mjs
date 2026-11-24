import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { crearDemostracion } from "../src/componentes/dashboard/demostracionMarketing.js";

const servidor = process.env.CRM_UI_URL || "http://127.0.0.1:5187";
const fecha = new Date().toISOString().slice(0, 10);
const contrato = {
  id: 1,
  nombre: "Plan integral Andina",
  servicio: "INTEGRAL",
  estado: "ACTIVO",
  moneda: "PEN",
  desde: fecha,
  hasta: fecha,
  honorarios: 500,
  produccion: 200,
  presupuesto: 1000,
};
const registros = [
  {
    fecha,
    pais: "PE",
    plataforma: "META",
    moneda: "PEN",
    campana_id: 1,
    campana: "Campaña Perú",
    contrato_id: 1,
    contrato: contrato.nombre,
    impresiones: 24000,
    clics: 1200,
    conversiones: 75,
    inversion: 400,
    ingresos_estimados: 700,
  },
  {
    fecha,
    pais: "US",
    plataforma: "GOOGLE",
    moneda: "USD",
    campana_id: 2,
    campana: "Campaña Estados Unidos",
    contrato_id: 1,
    contrato: contrato.nombre,
    impresiones: 16000,
    clics: 600,
    conversiones: 40,
    inversion: 120,
    ingresos_estimados: 220,
  },
  {
    fecha,
    pais: "ES",
    plataforma: "META",
    moneda: "PEN",
    campana_id: 1,
    campana: "Campaña Perú",
    contrato_id: 1,
    contrato: contrato.nombre,
    impresiones: 6000,
    clics: 300,
    conversiones: 20,
    inversion: 160,
    ingresos_estimados: 300,
  },
  {
    fecha,
    pais: "BR",
    plataforma: "META",
    moneda: "PEN",
    campana_id: 1,
    campana: "Campaña Perú",
    contrato_id: 1,
    contrato: contrato.nombre,
    impresiones: 9000,
    clics: 400,
    conversiones: 30,
    inversion: 180,
    ingresos_estimados: 340,
  },
];

for (const rol of ["Cliente", "Administrador"])
  test(
    `Escena ${rol}: ancho completo, giro, flechas, zoom y paneles móviles`,
    { timeout: 300000 },
    async () => {
      const browser = await chromium.launch({
        executablePath:
          "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        headless: true,
        args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
      });
      let pagina;
      try {
        const contexto = await browser.newContext({
          viewport: { width: 1366, height: 1000 },
          reducedMotion: "no-preference",
        });
        await contexto.addInitScript(
          (rol) =>
            localStorage.setItem(
              "sesionAgencia",
              JSON.stringify({
                token: "escena-test",
                fechaExpiracion: new Date(Date.now() + 3600000).toISOString(),
                usuario: { nombres: "Prueba", rol: { nombreRol: rol } },
              }),
            ),
          rol,
        );
        let filtroPais = "";
        await contexto.route(
          "**/rest/v1/rpc/crm_portal_estadisticas",
          async (r) => {
            const f = r.request().postDataJSON();
            filtroPais = f.p_pais || "";
            await r.fulfill({
              json: {
                empresa: { id: 1, nombre: "Andina Digital" },
                contratos: [contrato],
                campanas: [
                  { id: 1, nombre: "Campaña Perú", contratos: [1] },
                  { id: 2, nombre: "Campaña Estados Unidos", contratos: [1] },
                ],
                plataformas: ["META", "GOOGLE"],
                monedas: ["PEN", "USD"],
                paises: ["PE", "US", "ES", "BR"],
                simulado: true,
                proveedor: "MOCKAROO",
                registros: registros.filter(
                  (x) => !f.p_pais || x.pais === f.p_pais,
                ),
              },
            });
          },
        );
        await contexto.route("**/api/**", async (r) => {
          const u = new URL(r.request().url());
          let datos = [];
          if (u.pathname.endsWith("/dashboard/marketing")) {
            datos = crearDemostracion(
              u.searchParams.get("desde"),
              u.searchParams.get("hasta"),
            );
            datos.fuente = "Datos aislados de prueba";
          } else if (u.pathname.endsWith("/operaciones/atribucion"))
            datos = {
              campanas: [],
              ingresos: [],
              gastos: [],
              embudoCampanas: [],
            };
          else if (u.pathname.endsWith("/entregas/portal"))
            datos = {
              empresa: { id: 1, nombre: "Andina Digital" },
              contratos: [contrato],
            };
          await r.fulfill({ json: { exito: true, datos } });
        });
        const page = await contexto.newPage(),
          errores = [];
        pagina = page;
        pagina = page;
        page.setDefaultTimeout(60000);
        page.on("pageerror", (e) => {
          errores.push(e.message);
          console.log(rol + " ERROR " + e.message);
        });
        await page.goto(
          servidor + (rol === "Cliente" ? "/portal" : "/dashboard"),
          { waitUntil: "domcontentloaded", timeout: 90000 },
        );
        const escena = page.locator(".escena-globo"),
          globo = page.locator('.marketing-globo-canvas[data-listo="true"]');
        await globo.locator("canvas").waitFor({ timeout: 120000 });
        assert.equal(await globo.getAttribute("data-girando"), "true");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(
          () =>
            document.querySelector(".marketing-globo-canvas").dataset
              .girando === "false",
        );
        await escena.evaluate((e) =>
          e.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        await page.waitForFunction(
          () =>
            document.querySelector(".marketing-globo-canvas")?.dataset.altitud,
        );
        console.log(`${rol}: globo listo`);
        const contenedor = await escena.boundingBox(),
          canvas = await globo.locator("canvas").boundingBox();
        assert.ok(
          Math.abs(contenedor.width - canvas.width) < 4,
          "El canvas incluye el espacio detrás de ambas columnas",
        );
        for (const panel of await escena.locator(".globo-panel").all()) {
          const caja = await panel.boundingBox();
          assert.ok(
            caja.x >= canvas.x &&
              caja.x + caja.width <= canvas.x + canvas.width + 1,
          );
          assert.equal(
            await panel.evaluate((e) => getComputedStyle(e).position),
            "absolute",
          );
        }
        await page.waitForTimeout(1500);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const longitud = await globo.getAttribute("data-longitud");
        await page
          .getByRole("button", { name: "Reanudar rotación", exact: true })
          .click();
        await page.waitForFunction(
          (anterior) =>
            document.querySelector(".marketing-globo-canvas").dataset
              .longitud !== anterior,
          longitud,
          { timeout: 15000 },
        );
        await page
          .getByRole("button", { name: "Pausar rotación", exact: true })
          .click();
        await page.waitForTimeout(1400);
        console.log(`${rol}: giro comprobado`);
        const antes = Number(await globo.getAttribute("data-altitud"));
        const cajaPanel = await escena
          .locator(".globo-panel")
          .first()
          .boundingBox();
        await page
          .getByRole("button", { name: "Acercar globo", exact: true })
          .click();
        await page.waitForFunction(
          (a) =>
            Number(
              document.querySelector(".marketing-globo-canvas").dataset.altitud,
            ) <
            a * 0.9,
          antes,
        );
        const despues = await escena
          .locator(".globo-panel")
          .first()
          .boundingBox();
        assert.ok(
          Math.abs(cajaPanel.x - despues.x) < 1 &&
            Math.abs(cajaPanel.width - despues.width) < 1,
          "El zoom no desplaza ni escala las tarjetas",
        );
        await page
          .getByRole("button", { name: "Alejar globo", exact: true })
          .click();
        await page.waitForTimeout(600);
        console.log(`${rol}: zoom comprobado`);
        await page
          .getByRole("button", {
            name: "Restablecer vista del globo",
            exact: true,
          })
          .click();
        assert.equal(await globo.getAttribute("data-girando"), "false");
        await page.waitForFunction(
          () =>
            Math.abs(
              Number(
                document.querySelector(".marketing-globo-canvas").dataset
                  .longitud,
              ) + 55,
            ) < 6,
        );
        await page.waitForTimeout(1400);
        const senal = page
          .locator('.globo-senal[data-visible="true"] button')
          .first();
        await senal.waitFor();
        assert.ok(
          (await page.locator(".globo-senal-linea path").count()) > 0,
          "Se dibujan líneas y puntas de flecha",
        );
        const pais = await senal.evaluate((e) => e.parentElement.dataset.pais);
        await senal.click();
        if (rol === "Cliente") {
          await page.waitForFunction(
            (p) => document.querySelector('[aria-label="País"]').value === p,
            pais,
          );
          await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
          assert.equal(filtroPais, pais);
        } else await page.locator(".marketing-grupo").waitFor();
        assert.equal(await globo.getAttribute("data-girando"), "false");
        await page
          .getByRole("button", {
            name: "Restablecer vista del globo",
            exact: true,
          })
          .click();
        assert.equal(await globo.getAttribute("data-girando"), "false");
        await page.waitForTimeout(1400);
        const nombre = rol === "Cliente" ? "cliente" : "admin";
        await escena.screenshot({
          path: `docs/dashboard-${nombre}-inmersivo.png`,
        });
        if (rol === "Cliente") await page.locator(".cliente-experiencia").screenshot({path:"docs/cliente-globo-estilo.png"});
        console.log(`${rol}: selección comprobada`);
        await page.setViewportSize({ width: 390, height: 844 });
        await escena.evaluate((e) =>
          e.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        const indicadores = escena.getByRole("button", {
          name: "Indicadores",
          exact: true,
        });
        assert.equal(await indicadores.getAttribute("aria-expanded"), "false");
        await indicadores.click();
        assert.equal(await indicadores.getAttribute("aria-expanded"), "true");
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await indicadores.click();
        const actividad = escena.getByRole("button", {
          name: rol === "Cliente" ? "Tendencias" : "Campañas",
          exact: true,
        });
        await actividad.click();
        assert.equal(await actividad.getAttribute("aria-expanded"), "true");
        await actividad.click();
        await page.waitForTimeout(1300);
        await escena.screenshot({
          path: `docs/dashboard-${nombre}-inmersivo-movil.png`,
        });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(
          () =>
            document.querySelector(".marketing-globo-canvas").dataset
              .girando === "false",
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: "Rotación pausada por movimiento reducido",
              exact: true,
            })
            .isDisabled(),
          true,
        );
        assert.deepEqual(errores, []);
      } catch (e) {
        console.log(e.stack);
        if (pagina)
          await pagina
            .screenshot({
              path: join(tmpdir(),`diagnostico-globo-${rol}.png`),
              fullPage: true,
            })
            .catch(() => {});
        throw e;
      } finally {
        await browser.close();
      }
    },
  );
