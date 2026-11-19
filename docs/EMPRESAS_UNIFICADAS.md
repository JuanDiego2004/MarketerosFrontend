# Clientes y empresas: una sola ficha

18 de noviembre de 2026. Decisión del producto: una empresa cliente de la agencia se registra una vez. La ficha reúne los datos comerciales y el seguimiento CRM.

## Navegación y uso

- **Clientes → Clientes / Empresas** (`/empresas`): nombre, correo, teléfono, sector, sitio web y estado. No existe un selector para relacionar la ficha con otro cliente.
- Cada ficha muestra Resumen, Campañas, Contactos, Oportunidades, Actividades, Línea de tiempo, Notas y Archivos. Las actividades muestran hasta 100 registros recientes e incluyen tareas de empresa, contacto y oportunidad.
- **Marketing → Canales de difusión** (`/canales-difusion`): catálogo de medios publicitarios utilizados al configurar campañas, como Facebook, TikTok o YouTube. No registra empresas.
- **Configuración → Canales de comunicación** (`/integraciones`): WhatsApp, correo y SMS. La bandeja WhatsApp y sus permisos se conservan.

Crear la empresa la deja disponible en el selector de clientes de Campañas. Seleccionar una campaña de origen al crear un contacto asigna automáticamente la empresa de esa campaña cuando no se indicó otra. El formulario rechaza una empresa y una campaña de origen que no se correspondan. La captura pública también resuelve la empresa mediante el backend/base.

El archivo utiliza `POST /api/crm/cuentas/:id/archivar`; la pantalla no envía una eliminación física a un backend anterior. Archivar una empresa cambia su estado a INACTIVO y conserva campañas, contactos, oportunidades, notas y archivos. Se encuentra filtrando por INACTIVO y puede reactivarse desde Editar ficha. No se aplicó la eliminación física de cuentas del flujo anterior.

Administrador y líder mantienen sus permisos CRM_CUENTAS_LEER/GESTIONAR; el analista no recibe acceso adicional a empresas. Los permisos de difusión permanecen en las API administrativas/de líder. Mantener un enlace oculto no sustituye la autorización del servidor.

## Modelo y compatibilidad

La tabla `cliente` conserva su ID y las relaciones de campañas. `crm_cuenta` pasa a ser el perfil CRM de esa misma empresa, vinculado automáticamente; es un detalle de almacenamiento, no un segundo registro que deba crear el usuario. La API `/api/crm/cuentas` se conserva para no cambiar IDs, permisos, adjuntos ni contratos anteriores.

Las rutas `/cuentas`, `/cuentas/:id` y `/clientes-canales` redirigen a la vista unificada. Las API anteriores de clientes siguen disponibles: crear un cliente genera su perfil y editar su nombre actualiza la ficha. El correo, teléfono y estado se leen de `cliente`. Las escrituras de una cuenta anterior conservan la sincronización del nombre.

La migración v9:

1. Guarda los registros anteriores de cliente/cuenta y las referencias trasladadas en `crm_empresa_migracion`, con RLS y sin acceso desde la interfaz.
2. Crea los perfiles faltantes de clientes existentes y crea la identidad comercial de las cuentas que no tenían cliente.
3. Cuando varias cuentas estaban explícitamente vinculadas al mismo cliente, conserva una ficha principal y los otros IDs como alias. Traslada contactos, notas, eventos, archivos y actividades a la principal, sin borrar filas ni contenido.
4. Mantiene un perfil principal por cliente y evita nuevos duplicados vinculados. Los IDs anteriores resuelven la ficha principal al leer, editar, añadir notas o descargar archivos.
5. Vincula los contactos sin empresa a la empresa de su campaña. Conserva la referencia anterior en el respaldo.

No se fusionan empresas por parecido de nombre, ni se inventan correos/teléfonos. Los registros que no tenían vínculo explícito se conservan como empresas independientes; sus datos pueden completarse en la ficha.

La base configurada en este workspace tenía **12 clientes y ninguna cuenta separada** antes de la migración. v9 ya se aplicó y preparó sus perfiles. No se borró ni se cambió el ID de ninguna campaña o cliente.

## Despliegue y reversión

Aplicar las migraciones pendientes hasta `backend_agencia/src/main/resources/sql/crm-v9.sql` antes de desplegar el backend nuevo. `scripts/PrepararCrm.java --aplicar` omite grupos completos y v9 se aplica dentro de una transacción. Docker no ejecuta migraciones automáticamente. Si Render usa la misma base configurada, v9 ya está aplicada; si usa otra, aplicar allí los pendientes.

Actualizar backend Java 25 y frontend. El `.env` local no configura Render. No se desplegaron estos cambios desde esta sesión.

Una reversión rutinaria conserva tablas, perfiles, alias y respaldos. Las rutas y API anteriores siguen disponibles, aunque una interfaz antigua volverá a mostrar los dos módulos. No borrar perfiles ni restaurar referencias históricas sobre cambios posteriores sin inventariar esos cambios; `crm_empresa_migracion` conserva el estado previo necesario para una recuperación dirigida.

## Verificación

La prueba de migración aislada cubre perfiles faltantes, varias cuentas del mismo cliente, contactos y notas trasladados, bytes de archivos conservados, alias, respaldo de nombres anteriores, sincronización de escrituras antiguas y rechazo de duplicados. Incluye v9 y 41 tablas CRM con RLS.

Las pruebas PostgreSQL/MockMvc verifican la creación desde la ficha y desde el servicio anterior, lectura compartida, archivo/reactivación, permisos, campañas/contactos vinculados y rechazo de cruces de empresa. Todos los datos de prueba se revierten con rollback; los proveedores externos están controlados.

El recorrido Edge `tests/empresas-navegador.test.mjs` cubre validación/foco, error y reintento, ausencia del selector duplicado, pestañas de relaciones, archivo/reactivación, rutas antiguas, catálogo separado y formulario móvil. Las otras pruebas de navegador mantienen los recorridos de CRM, WhatsApp y rendimiento publicitario.


Resultado de la base después de la migración y las pruebas: 12 clientes, 12 perfiles CRM, cero perfiles sin vínculo y cero clientes con perfiles duplicados. Las dos tablas expresan una sola ficha de producto; no son dos altas que deba realizar el usuario.

Verificación ejecutada: 31 pruebas backend seleccionadas entre CrmAccesoTests, CrmEvolucionPostgresTests, CrmPostgresTests y CrmPublicidadDemoPostgresTests, con repetición de las afectadas tras los ajustes; cinco pruebas de CSV/migraciones y tres recorridos Edge. Se comprueban rechazo de correo de empresa duplicado, archivo auditado y reactivación. ESLint de los seis archivos frontend modificados y compilación Vite aprobados. JAR Java 25 generado.

La auditoría premium estricta no terminó dentro de 20 segundos y no se declara aprobada (auditoria-ui-empresas.json). El lint de DESIGN.md tiene cero errores y cuatro advertencias anteriores sobre referencias de tokens. El lint global del proyecto mantiene seis errores previamente identificados en tablaGlass/funciones.jsx y ContextoAuth.jsx, fuera de estos cambios; no se afirma que todo el repositorio esté libre de advertencias. Vite conserva avisos sobre tamaño de chunks. No se hizo commit, push ni despliegue.
