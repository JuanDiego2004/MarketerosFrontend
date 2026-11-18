import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  filtrarCampanas,
  obtenerPuntos,
  resumirMetricas,
} from "../src/componentes/dashboard/datosMarketing.js";
import { crearDemostracion } from "../src/componentes/dashboard/demostracionMarketing.js";

test("campañas en varias ciudades conservan sus totales y los KPIs se ponderan", () => {
  const datos = crearDemostracion("2026-11-01", "2026-11-03");
  const campanas = filtrarCampanas(datos.campanas, {
    busqueda: "Horizonte",
    cliente: "",
    canal: "",
    estado: "ACTIVA",
  });
  assert.equal(campanas.length, 1);
  const puntos = obtenerPuntos(
    datos.ubicaciones,
    campanas,
    datos.resultadosGeograficos,
    "RESULTADOS",
  );
  assert(puntos.length > 1);
  assert(puntos.every((p) => p.campanas.length === 1));
  const originales = datos.metricas.filter(
    (m) => m.idCampana === campanas[0].idCampana,
  );
  const totales = resumirMetricas(originales);
  const desgloses = datos.resultadosGeograficos.filter(
    (m) => m.idCampana === campanas[0].idCampana,
  );
  assert(
    Math.abs(resumirMetricas(desgloses).inversion - totales.inversion) < 0.001,
  );
  assert.equal(
    resumirMetricas([
      { clics: 1, impresiones: 10 },
      { clics: 10, impresiones: 1000 },
    ]).ctr,
    (11 / 1010) * 100,
  );
  assert.equal(resumirMetricas([]).roas, null);
  assert.equal(resumirMetricas([]).cpc, null);
  const compartido = obtenerPuntos(
    datos.ubicaciones,
    datos.campanas,
    [],
    "COBERTURA",
  ).find((p) => p.ciudad === "Lima");
  assert.equal(compartido.campanas.length, 3);
});

test("migración geográfica compatible, idempotente y con protección del total original", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create table cliente(id_cliente bigint primary key,nombre text);
      create table canal_difusion(id_canal bigint primary key,nombre_canal text);
      create table usuario(id_usuario bigint primary key,nombres text);
      create table campana(id_campana bigint primary key,nombre text default 'Prueba',estado text default 'ACTIVA',
        objetivo text,id_cliente bigint default 1,id_canal bigint default 1,presupuesto_asignado numeric,
        fecha_inicio date,fecha_fin date,id_usuario_creador bigint default 1,created_at timestamptz default now());
      create table metrica_operativa(id_metrica bigint primary key,id_campana bigint references campana,
        impresiones bigint,clics bigint,conversiones bigint,inversion numeric,ingresos numeric,
        fecha date default '2026-11-18',tipo_metrica text,interacciones bigint);
      insert into cliente values(1,'Cliente');
      insert into canal_difusion values(1,'Canal');
      insert into usuario values(1,'Creador');
      insert into campana(id_campana) values(1);
      insert into metrica_operativa values(1,1,100,10,2,50,100);`);
    const sql = await readFile(
      new URL(
        "../../MarketerosAgenciaBackend/src/main/resources/sql/dashboard-v1.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    await db.exec(`insert into marketing_ubicacion(pais,codigo_pais,ciudad,latitud,longitud) values('Perú','PE','lima',-12,-77);
      insert into marketing_cobertura values(1,1);
      insert into marketing_resultado_geografico values(1,1,80,8,1,40,80);`);
    const servicio = await readFile(
      new URL(
        "../../MarketerosAgenciaBackend/src/main/java/com/marketing/agencia/administrador/DashboardMarketingServicio.java",
        import.meta.url,
      ),
      "utf8",
    );
    const lectura = servicio.slice(
      0,
      servicio.indexOf("public Map<String,Object> cobertura"),
    );
    const consultas = [
      ...lectura.matchAll(/jdbc\.queryForList\("""\s*([\s\S]*?)"""/g),
    ];
    assert.equal(consultas.length, 4);
    const resultados = [];
    for (const [, consulta] of consultas) {
      let posicion = 0;
      const sqlConsulta = consulta.replace(/\?/g, () => `$${++posicion}`);
      resultados.push(
        await db.query(sqlConsulta, Array(posicion).fill("2026-11-18")),
      );
    }
    assert.equal(resultados[0].rows[0].canal, "Canal");
    assert.equal(resultados[1].rows.length, 1);
    assert.equal(resultados[2].rows.length, 2);
    assert.equal(Number(resultados[3].rows[0].impresiones), 80);
    await db.exec(`
      create table crm_contacto(id bigint primary key,campana_id bigint);
      create table crm_origen(id bigint primary key,contacto_id bigint,campana_id bigint,created_at timestamptz);
      create table crm_etapa(id bigint primary key,nombre text,tipo text,orden int);
      create table crm_oportunidad(id bigint primary key,contacto_id bigint,etapa_id bigint,created_at timestamptz);
      insert into crm_contacto values(1,1);
      insert into crm_origen values(1,1,2,'2026-11-01T12:00:00Z'),(2,1,1,'2026-11-02T12:00:00Z');
      insert into crm_etapa values(1,'Calificado','ABIERTA',1);
      insert into crm_oportunidad values(1,1,1,'2026-11-18T12:00:00Z');
    `);
    const servicioCrm = await readFile(
      new URL(
        "../../MarketerosAgenciaBackend/src/main/java/com/marketing/agencia/crm/CrmOperacionServicio.java",
        import.meta.url,
      ),
      "utf8",
    );
    const consultaEmbudo = servicioCrm.match(
      /var embudoCampanas=jdbc\.queryForList\("""\s*([\s\S]*?)"""/,
    )[1];
    let parametro = 0;
    const embudo = await db.query(
      consultaEmbudo.replace(/\?/g, () => `$${++parametro}`),
      ["2026-11-18", "2026-11-18"],
    );
    assert.equal(Number(embudo.rows[0].campana_id), 2);
    assert.equal(Number(embudo.rows[0].oportunidades), 1);
    await assert.rejects(
      db.exec("update metrica_operativa set impresiones=79 where id_metrica=1"),
      /desglose geográfico/,
    );
    await assert.rejects(
      db.exec(
        "insert into marketing_ubicacion(pais,codigo_pais,latitud,longitud) values('Inválido','XX',91,0)",
      ),
    );
    await assert.rejects(
      db.exec("insert into marketing_cobertura values(1,1)"),
    );
    await db.exec("delete from metrica_operativa where id_metrica=1");
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from marketing_resultado_geografico",
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (await db.query("select count(*)::int n from marketing_cobertura"))
        .rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});
