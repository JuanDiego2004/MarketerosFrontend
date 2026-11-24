import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const verificarGlobo = process.env.PORTAL_WEBGL === "1";
const url = process.env.CRM_UI_URL || "http://127.0.0.1:5186";
// Solo fixtures de prueba. La aplicación consulta exclusivamente el RPC de Supabase.
const contratos = [
  {
    id: 1,
    nombre: "Plan integral Andina",
    servicio: "INTEGRAL",
    estado: "ACTIVO",
    moneda: "PEN",
    desde: "2026-01-01",
    hasta: "2026-12-31",
    honorarios: 500,
    produccion: 200,
    presupuesto: 1000,
  },
  {
    id: 2,
    nombre: "Análisis Andina",
    servicio: "ANALISIS",
    estado: "ACTIVO",
    moneda: "PEN",
    desde: "2026-01-01",
    hasta: "2026-12-31",
    honorarios: 300,
    produccion: 0,
    presupuesto: 0,
  },
];
const paises = ["PE", "CO", "MX", "ES", "US", "BR", "JP", "ZA", "AU"];
const campanas = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  nombre: `Campaña Andina ${String(i + 1).padStart(2, "0")}`,
  contratos: [1, 2],
}));
const dia = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const base = campanas.flatMap((c, i) =>
  Array.from({ length: 8 }, (_, d) => ({
    fecha: dia(d),
    pais: paises[i % paises.length],
    plataforma: i % 2 ? "GOOGLE" : "META",
    moneda: i % 2 ? "USD" : "PEN",
    campana_id: c.id,
    campana: c.nombre,
    contrato_id: 1,
    contrato: contratos[0].nombre,
    impresiones: 1000 + i * 100 + d * 80,
    clics: 30 + i * 3 + d,
    conversiones: 2 + (d % 4),
    inversion: 10 + i + d,
    ingresos_estimados: 20 + i + d * 3,
  })),
);

test(
  "Portal: globo, filtros compartidos, CSV/PDF, permisos y móvil",
  { timeout: 360000 },
  async () => {
    const browser = await chromium.launch({
      executablePath:
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      headless: true,
      args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
    });
    try {
      const ctx = await browser.newContext({
        viewport: { width: 1600, height: 1050 },
        reducedMotion: "reduce",
      });
      await ctx.addInitScript(() =>
        localStorage.setItem(
          "sesionAgencia",
          JSON.stringify({
            token: "portal-test",
            fechaExpiracion: new Date(Date.now() + 3600000).toISOString(),
            usuario: { nombres: "Cliente", rol: { nombreRol: "Cliente" } },
          }),
        ),
      );
      if (!verificarGlobo)
        await ctx.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (tipo, ...args) {
            return tipo.includes("webgl")
              ? null
              : original.call(this, tipo, ...args);
          };
        });
      let acceso = true,
        llamadas = [],
        aprobaciones = 0;
      await ctx.route("**/rest/v1/rpc/crm_portal_estadisticas", async (r) => {
        const f = r.request().postDataJSON();
        llamadas.push(f);
        assert.equal(r.request().headers().authorization, "Bearer portal-test");
        if (!acceso) {
          await r.fulfill({
            status: 403,
            json: { code: "42501", message: "Acceso revocado" },
          });
          return;
        }
        const registros = base
          .filter(
            (x) =>
              x.fecha >= f.p_desde &&
              x.fecha <= f.p_hasta &&
              (!f.p_pais || x.pais === f.p_pais) &&
              (!f.p_moneda || x.moneda === f.p_moneda) &&
              (!f.p_plataforma || x.plataforma === f.p_plataforma) &&
              (!f.p_campana || x.campana_id === f.p_campana) &&
              (!f.p_busqueda ||
                x.campana.toLowerCase().includes(f.p_busqueda.toLowerCase())),
          )
          .map((x) => ({
            ...x,
            contrato_id: f.p_contrato || 1,
            contrato: contratos.find((c) => c.id === (f.p_contrato || 1))
              .nombre,
          }));
        await r.fulfill({
          json: {
            empresa: { id: 1, nombre: "Andina Digital" },
            contratos,
            campanas,
            plataformas: ["META", "GOOGLE"],
            monedas: ["PEN", "USD"],
            paises,
            registros,
            simulado: true,
            proveedor: "MOCKAROO",
          },
        });
      });
      await ctx.route("**/api/crm/entregas/**", async (r) => {
        const p = new URL(r.request().url()).pathname;
        let datos = { empresa: { id: 1, nombre: "Andina Digital" }, contratos };
        if (/contratos\/[12]$/.test(p))
          datos = {
            prestaciones: [
              { prestacion: "PUBLICACION", cantidad: 2 },
              { prestacion: "INFORMES", cantidad: 1 },
            ],
            anuncios: [],
            entregables: [
              {id:1,fecha:"2026-11-12",nombre:"Reporte de rendimiento",cantidad:1,estado:"COMPLETADO"},
              {id:2,fecha:"2026-11-26",nombre:"Revisión de estrategia",cantidad:1,estado:"PENDIENTE"},
            ],
            informes: [{id:1,numero:1,titulo:"Rendimiento de noviembre"}],
            revisiones: [
              {
                id: 1,
                media_id: 1,
                version: 0,
                nombre: "Video Andina",
                estado: "PENDIENTE",
              },
            ],
          };
        if (p.endsWith("revisiones/1")) {
          aprobaciones++;
          datos = null;
        }
        await r.fulfill({ json: { exito: true, datos } });
      });
      const page = await ctx.newPage(),
        errores = [];
      page.on("pageerror", (e) => errores.push(e.message));
      console.log("Abriendo portal");
      await page.goto(url + "/portal", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      const principal = page.getByRole("region", {
        name: "Resultados por país",
        exact: true,
      });
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      console.log("Datos consultados");
      if (verificarGlobo)
        await page
          .locator('.marketing-globo-canvas[data-listo="true"] canvas')
          .waitFor({ timeout: 120000 });
      else await page.locator(".portal-mapa-alternativo").waitFor();
      console.log("Mapa preparado");
      await page
        .getByRole("heading", { name: "Andina Digital", exact: true })
        .waitFor();
      assert.equal(
        await page.locator(".portal-tabla-scroll tbody tr").count(),
        10,
      );
      await page
        .getByRole("button", { name: "Siguiente", exact: true })
        .click();
      assert.equal(
        await page.locator(".portal-tabla-scroll tbody tr").count(),
        2,
      );
      // Selección real sobre el globo: localizar Perú mediante el tooltip geográfico.
      if (verificarGlobo) {
        await page.locator(".marketing-globo-canvas").scrollIntoViewIfNeeded();
        await page.waitForTimeout(1400);
        await page.screenshot({
          path: "docs/portal-analitica-globo-inicial.png",
          fullPage: true,
        });
        const mapa = await page
          .locator(".marketing-globo-canvas canvas")
          .boundingBox();
        let seleccionado = false;
        for (const dy of [0.1, 0.16, 0.22, 0.28]) {
          for (const dx of [-0.2, -0.13, -0.07, 0]) {
            await page.mouse.move(
              mapa.x + mapa.width * (0.5 + dx),
              mapa.y + mapa.height * (0.5 + dy),
            );
            await page.waitForTimeout(100);
            const tooltip = page.locator(".marketing-tooltip");
            if (
              (await tooltip.count()) &&
              (await tooltip.last().textContent()).startsWith("Perú ·")
            ) {
              await page.mouse.click(
                mapa.x + mapa.width * (0.5 + dx),
                mapa.y + mapa.height * (0.5 + dy),
              );
              seleccionado = true;
              break;
            }
          }
          if (seleccionado) break;
        }
        assert.equal(
          seleccionado,
          true,
          "El mapa permite seleccionar Perú por su polígono",
        );
      } else
        await page
          .getByRole("button", { name: "Filtrar por Perú", exact: true })
          .click();
      await page.waitForFunction(
        () => document.querySelector('[aria-label="País"]').value === "PE",
      );
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      assert.ok(
        (
          await page.locator(".portal-tabla-scroll tbody").textContent()
        ).includes("Perú"),
      );
      assert.equal(llamadas.at(-1).p_pais, "PE");
      await principal
        .getByRole("button", { name: "Todos los países", exact: true })
        .click();
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      await page.getByLabel("Moneda", { exact: true }).selectOption("PEN");
      await page
        .getByLabel("Métrica del mapa", { exact: true })
        .selectOption("inversion");
      await page.getByLabel("Campaña", { exact: true }).selectOption("1");
      await page.getByLabel("Plataforma", { exact: true }).selectOption("META");
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      const esperados = base.filter((r) => r.campana_id === 1),
        total = esperados.reduce((s, r) => s + r.impresiones, 0);
      assert.equal(
        await page.locator(".portal-kpi-principal strong").textContent(),
        total.toLocaleString("es-PE"),
      );
      assert.equal(
        await page.getByRole("img", { name: /Impresiones\./ }).count(),
        1,
      );
      console.log("Filtros verificados");
      const temporal = await mkdtemp(join(tmpdir(), "portal-export-"));
      const antes = llamadas.length;
      let descarga = page.waitForEvent("download");
      await page.getByRole("button", { name: "CSV", exact: true }).click();
      let archivo = await descarga;
      await archivo.saveAs(join(temporal, "resultados.csv"));
      const csv = await readFile(join(temporal, "resultados.csv"), "utf8");
      assert.match(csv, /Datos simulados/);
      assert.match(csv, /MOCKAROO/);
      assert.match(csv, /Campaña Andina 01/);
      assert.doesNotMatch(csv, /Campaña Andina 02/);
      assert.ok(llamadas.length > antes);
      descarga = page.waitForEvent("download");
      await page.getByRole("button", { name: "PDF", exact: true }).click();
      archivo = await descarga;
      await archivo.saveAs(join(temporal, "resultados.pdf"));
      const pdf = await readFile(join(temporal, "resultados.pdf"));
      assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
      assert.ok(pdf.toString("latin1").includes("Datos simulados"));
      console.log("Exportación verificada");
      await page
        .getByRole("button", { name: "Limpiar filtros", exact: true })
        .click();
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      const descargaCompleta = page.waitForEvent("download");
      await page.getByRole("button", { name: "CSV", exact: true }).click();
      const csvCompleto = await descargaCompleta;
      await csvCompleto.saveAs(join(temporal, "todos.csv"));
      const todos = await readFile(join(temporal, "todos.csv"), "utf8");
      assert.match(todos, /Campaña Andina 01/);
      assert.match(todos, /Campaña Andina 02/);
      assert.match(todos, /Campaña Andina 12/);
      await page.screenshot({path:"docs/cliente-resultados-estilo.png"});
      await page.screenshot({
        path: `docs/portal-analitica-${verificarGlobo ? "globo" : "alternativa"}-escritorio.png`,
        fullPage: true,
      });
      await page.getByLabel("Mi contrato", { exact: true }).selectOption("2");
      await page.getByRole("button", { name:"Mi contrato", exact:true }).click();
      assert.equal(await page.getByRole("button",{name:"Materiales",exact:true}).count(),0);
      await page
        .getByRole("heading", { name: "Mis entregables", exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Aprobar material", exact: true })
          .count(),
        0,
      );
      await page.getByLabel("Mi contrato", { exact: true }).selectOption("1");
      await page.getByRole("button", { name:"Materiales", exact:true }).click();
      await page
        .getByRole("button", { name: "Aprobar material", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Aprobar material", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Registrar decisión", exact: true })
        .click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
      assert.equal(aprobaciones, 1);
      await page.getByRole("button", { name:"Informes", exact:true }).click();
      await page.getByRole("heading", { name:"Mis informes y resultados", exact:true }).waitFor();
      await page.screenshot({path:"docs/cliente-informes-estilo.png"});
      await page.getByRole("button", { name:"Mi contrato", exact:true }).click();
      await page.getByRole("heading", { name:"Mis entregables", exact:true }).waitFor();
      await page.screenshot({path:"docs/cliente-contrato-estilo.png"});
      await page.getByRole("button", { name:"Campañas", exact:true }).click();
      await page.getByRole("heading", { name:"Resultados en detalle", exact:true }).waitFor();
      assert.equal(await page.getByRole("region", {name:"Resultados por país",exact:true}).isVisible(),false);
      await page.getByRole("button", { name:"Resultados", exact:true }).click();
      assert.equal(await page.getByLabel("Mi contrato",{exact:true}).inputValue(),"1");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button",{name:"Informes",exact:true}).click();
      await page.getByRole("heading",{name:"Mis informes y resultados",exact:true}).waitFor();
      await page.getByRole("button",{name:"Resultados",exact:true}).click();
      await page.getByRole("button", { name: "Filtros", exact: true }).click();
      await page.getByLabel("País", { exact: true }).selectOption("CO");
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: `docs/portal-analitica-${verificarGlobo ? "globo" : "alternativa"}-movil.png`,
        fullPage: true,
      });
      await page.screenshot({path:"docs/cliente-portal-estilo-movil.png"});
      await page
        .getByLabel("Buscar campaña, anuncio o contrato", { exact: true })
        .fill("Inexistente");
      await page
        .getByText("Sin resultados para estos filtros", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "CSV", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("button", { name: "Limpiar filtros", exact: true })
        .click();
      await page.locator('.portal-resultados[aria-busy="false"]').waitFor();
      acceso = false;
      let descargas = 0;
      page.on("download", () => descargas++);
      await page.getByRole("button", { name: "CSV", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Tu sesión no tiene acceso" })
        .waitFor();
      assert.equal(descargas, 0);
      assert.deepEqual(errores, []);
      console.log(`Exportaciones verificadas en ${temporal}`);
    } finally {
      await browser.close();
    }
  },
);
