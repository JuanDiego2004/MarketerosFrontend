# Roles y permisos

La ruta administrativa `/roles-permisos` utiliza el catálogo y las asignaciones existentes. El buscador encuentra roles por su nombre o descripción y por el nombre o correo de cualquiera de sus usuarios. El desplegable muestra sus personas asignadas y el detalle presenta nombre, correo y estado de cada cuenta, sin designar responsables que no estén registrados.

Se reutilizan `GET /api/admin/roles`, `GET /api/admin/permisos`, `GET /usuarios` y `PUT /api/admin/roles/{id}/permisos`. La asignación de un usuario a un rol continúa en Gestión de usuarios. No se agregan tablas, dependencias ni endpoints, ni se cambian las validaciones de acceso del backend. El catálogo actual no proporciona fechas de creación/modificación ni CRUD de roles: no se muestran datos o acciones ficticios.

Los permisos se agrupan por módulo. Las capacidades `CRM_{RECURSO}_{LEER|GESTIONAR}` se presentan en tarjetas separadas por recurso. El interruptor desactiva todos los permisos del módulo si alguno está habilitado, o los activa todos cuando no hay ninguno. La selección global afecta los módulos visibles y conserva las asignaciones ajenas a esos módulos, incluidos IDs existentes fuera del catálogo visible.

Las modificaciones se mantienen localmente hasta confirmar el guardado. Cambiar de rol con ajustes pendientes solicita confirmación; Restablecer recupera los permisos de la última consulta confirmada. Tras guardar, se consulta el catálogo de roles y se comparan los IDs devueltos con los solicitados antes de mostrar éxito. Si falla la escritura o la verificación, se conservan los ajustes para reintentar. El administrador mantiene su acceso administrativo según las reglas existentes del servidor.

Los fallos del directorio tienen un aviso y reintento independientes; no se presentan como un equipo vacío. La interfaz incluye selector accesible por teclado, selección parcial, estados de carga, catálogos vacíos y distribución móvil sin desbordamiento.

## Validación local

Con Vite disponible en `http://127.0.0.1:5188`:

```sh
node --test tests/permisos-roles.test.mjs tests/roles-permisos-navegador.test.mjs
pnpm exec eslint src/screens/administrador/RolesPermisosAdministrador.jsx src/componentes/roles/SelectorRol.jsx src/utils/permisosRoles.js
pnpm run build
```

Las pruebas del navegador interceptan las APIs con registros de prueba aislados; no modifican permisos de usuarios reales. Las capturas `roles-permisos-escritorio.png`, `roles-permisos-equipo.png` y `roles-permisos-movil.png` corresponden a esos registros de prueba.
