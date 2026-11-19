import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('Restaurar roles: cuatro perfiles, permisos reales e idempotencia sin acceso interno del cliente',async()=>{
 const db=new PGlite();try{
  await db.exec(`create table rol(id_rol bigint generated always as identity primary key,nombre_rol text unique,descripcion text);
   create table permiso(id_permiso bigint generated always as identity primary key,codigo text unique,descripcion text,modulo text);
   create table rol_permiso(id_rol bigint references rol,id_permiso bigint references permiso,primary key(id_rol,id_permiso));`);
  const sql=await readFile(new URL('../../backend_agencia/scripts/restaurar-roles-permisos.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query('select count(*)::int n from rol')).rows[0].n,4);
  assert.equal((await db.query('select count(*)::int n from permiso')).rows[0].n,44);
  const permisos=async rol=>(await db.query('select p.codigo from permiso p join rol_permiso rp using(id_permiso) join rol r using(id_rol) where r.nombre_rol=$1',[rol])).rows.map(r=>r.codigo);
  assert.equal((await permisos('ADMINISTRADOR')).length,44);
  assert.equal((await permisos('PROJECT MANAGER')).length,35);
  assert.equal((await permisos('ANALISTA')).length,16);
  assert.equal((await permisos('Cliente')).length,0);
  assert.equal((await permisos('PROJECT MANAGER')).some(c=>/^CRM_(ETAPAS|INTEGRACIONES|AUDITORIA|CAMPOS)_/.test(c)),false);
  assert.equal((await permisos('ANALISTA')).includes('CRM_CUENTAS_GESTIONAR'),false);
 }finally{await db.close();}
});
