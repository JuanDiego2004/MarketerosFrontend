import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";

test("Restauración mínima de contratación: idempotencia y conservación del catálogo configurado",async()=>{
 const db=new PGlite();try{
  await db.exec(`create table crm_servicio(codigo text primary key,nombre text,descripcion text,activo boolean);
   create table canal_difusion(id_canal bigint generated always as identity primary key,nombre_canal text unique,tipo_canal text,estado text);
   create table cliente(id bigint primary key,nombre text);`);
  const sql=await readFile(new URL("../../backend_agencia/scripts/restaurar-catalogos-contratacion.sql",import.meta.url),"utf8");
  await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query("select count(*)::int n from crm_servicio")).rows[0].n,3);
  assert.equal((await db.query("select count(*)::int n from canal_difusion")).rows[0].n,1);
  assert.equal((await db.query("select count(*)::int n from cliente")).rows[0].n,0);
  await db.exec("update crm_servicio set nombre='Mi servicio',activo=false where codigo='DIFUSION';delete from canal_difusion;insert into canal_difusion(nombre_canal,tipo_canal,estado) values('Canal configurado','VIDEO','ACTIVO');");
  await db.exec(sql);
  assert.deepEqual((await db.query("select nombre,activo from crm_servicio where codigo='DIFUSION'")).rows,[{nombre:"Mi servicio",activo:false}]);
  assert.deepEqual((await db.query("select nombre_canal from canal_difusion")).rows,[{nombre_canal:"Canal configurado"}]);
 }finally{await db.close();}
});
