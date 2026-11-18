import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Base PostgreSQL aislada: valida las migraciones, no reemplaza el inventario de Supabase.
test("migraciones CRM, FK, deduplicación, permisos y reserva idempotente", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create table public.rol(id_rol bigint primary key,nombre_rol text);
      create table public.usuario(id_usuario bigint primary key,id_rol bigint references rol,id_supabase uuid,estado text,nombres text);
      create table public.cliente(id_cliente bigint primary key,nombre text,estado text);
      create table public.campana(id_campana bigint primary key,nombre text);
      create table public.permiso(id_permiso bigint generated always as identity primary key,codigo text unique,descripcion text,modulo text);
      create table public.rol_permiso(id_rol bigint references rol,id_permiso bigint references permiso,primary key(id_rol,id_permiso));
      insert into rol values(1,'Administrador'),(2,'Líder'),(3,'Analista');
      insert into usuario values(1,1,'00000000-0000-0000-0000-000000000001','ACTIVO','Admin');
      insert into campana values(1,'Campaña de prueba');
    `);
    for (const nombre of ["crm-v1.sql", "crm-v2.sql"])
      await db.exec(
        await readFile(
          new URL(
            `../../backend_agencia/src/main/resources/sql/${nombre}`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
    await db.exec(`insert into crm_contacto(id,nombre,correo,estado,origen,etiquetas,responsable_id,campana_id) overriding system value values(100,'Anterior','anterior@example.test','NUEVO','WEB',' Premium ,premium,Antigua',1,1);
      insert into crm_oportunidad(id,nombre,contacto_id,etapa_id,responsable_id,valor,probabilidad,fecha_cierre) overriding system value values(100,'Anterior',100,1,1,100,0,current_date)`);
    await db.exec(
      await readFile(
        new URL(
          "../../backend_agencia/src/main/resources/sql/crm-v3.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    assert.equal(
      (await db.query("select etiquetas from crm_contacto where id=100"))
        .rows[0].etiquetas,
      " Premium ,premium,Antigua",
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from crm_contacto_etiqueta where contacto_id=100",
        )
      ).rows[0].n,
      2,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from crm_transicion where oportunidad_id=100 and linea_base",
        )
      ).rows[0].n,
      1,
    );
    await db.exec("update crm_contacto set etiquetas='nueva' where id=100");
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from crm_contacto_etiqueta where contacto_id=100",
        )
      ).rows[0].n,
      1,
    );
    await db.exec(await readFile(new URL('../../backend_agencia/src/main/resources/sql/crm-v4.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../../backend_agencia/src/main/resources/sql/crm-v5.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../../backend_agencia/src/main/resources/sql/crm-v6.sql',import.meta.url),'utf8'));
    const roles = await db.query(
      `select r.nombre_rol,p.codigo from rol_permiso rp join rol r using(id_rol) join permiso p using(id_permiso)`,
    );
    assert(
      roles.rows.some(
        (r) =>
          r.nombre_rol === "Analista" &&
          r.codigo === "CRM_ACTIVIDADES_GESTIONAR",
      ),
    );
    assert(
      !roles.rows.some(
        (r) =>
          r.nombre_rol === "Analista" && r.codigo === "CRM_PIPELINE_GESTIONAR",
      ),
    );
    assert(
      !roles.rows.some(
        (r) =>
          r.nombre_rol === "Líder" &&
          r.codigo === "CRM_INTEGRACIONES_GESTIONAR",
      ),
    );
    await db.exec(
      `insert into crm_contacto(nombre,correo,estado,origen,responsable_id,campana_id) values('Prueba','persona@example.test','NUEVO','WEB',1,1)`,
    );
    await assert.rejects(
      db.exec(
        `insert into crm_contacto(nombre,correo,estado,origen,responsable_id) values('Duplicado','PERSONA@example.test','NUEVO','WEB',1)`,
      ),
    );
    await db.exec(
      `insert into crm_oportunidad(nombre,contacto_id,etapa_id,responsable_id,valor,probabilidad,fecha_cierre) values('Venta',1,4,1,120,100,current_date)`,
    );
    await assert.rejects(
      db.exec(
        `insert into crm_actividad(nombre,tipo,estado,fecha,responsable_id) values('Sin relación','LLAMADA','PENDIENTE',now(),1)`,
      ),
    );
    await db.exec(`insert into crm_segmento(nombre,etiqueta) values('Segmento','premium');
      insert into crm_automatizacion(nombre,segmento_id,accion,asunto,activa,autor_id) values('Bienvenida',1,'CREAR_TAREA','Llamar',true,1);
      insert into crm_ejecucion(automatizacion_id,contacto_id,estado) values(1,1,'PENDIENTE') on conflict do nothing;
      insert into crm_ejecucion(automatizacion_id,contacto_id,estado) values(1,1,'PENDIENTE') on conflict do nothing;`);
    assert.equal(
      (await db.query("select count(*)::int cantidad from crm_ejecucion"))
        .rows[0].cantidad,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int cantidad from pg_class where relname like 'crm_%' and relkind='r' and relrowsecurity",
        )
      ).rows[0].cantidad,
      37,
    );
    await db.exec("delete from crm_contacto where id=1");
    assert.equal(
      (
        await db.query(
          "select count(*)::int cantidad from crm_oportunidad where contacto_id=1",
        )
      ).rows[0].cantidad,
      0,
    );
  } finally {
    await db.close();
  }
});
