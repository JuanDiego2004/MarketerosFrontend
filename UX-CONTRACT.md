# Contrato de navegación

## Contexto

MarketingSystem es un panel en español para administrador, líder y analista. Este contrato cubre el sidebar compartido; las demás operaciones se documentarán al implementar cada flujo. La identidad visual está en `DESIGN.md`.

## Fuentes del comportamiento

| Tema | Fuente actual |
| --- | --- |
| Alcance y orden de trabajo | `docs/PLAN_PRODUCTO_MARKETING.md` |
| Rutas autorizadas por rol | `src/rutas/RutasAplicacion.jsx`, `src/utils/roles.js` |
| Navegación visible | `src/utils/modulosPorRol.js` |
| Autorización de operaciones | Backend `config/SeguridadConfig.java` y `administrador/AdministradorServicio.java` |

La API autoriza operaciones; ocultar un enlace en el cliente solo organiza la navegación. La sesión contiene permisos. El nuevo CRM consulta `/api/crm/capacidades` para obtener permisos efectivos desde el backend antes de mostrar acciones de edición. La visibilidad de rutas principales conserva la matriz por rol; las operaciones requieren además permisos CRM.

## Navegación

- El sidebar muestra Dashboard y grupos de Clientes, Campañas, Resultados y Configuración según el rol.
- Una ruta existente conserva su URL al cambiar de grupo; recargarla o usar un enlace directo mantiene el grupo correspondiente abierto.
- Los grupos son botones con `aria-expanded`; sus subrutas son enlaces. Enter y Espacio abren los grupos, Tab recorre los enlaces y el foco abre el rail.
- La ruta activa usa el mismo resaltado azul en cualquier rol. El área de enlaces desplaza verticalmente cuando no cabe.
- Cerrar sesión permanece fuera del área desplazable.
- Las rutas sin permiso muestran la pantalla Sin acceso definida por `RutaPorRol`; los grupos irrelevantes al rol no se renderizan.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Navigation | `src/componentes/sidebar/Sidebar.jsx` | `src/utils/modulosPorRol.js` | Rail y grupos | Rutas, teclado, foco y scroll |
| Select/Listbox | `<select>` nativo existente | `premium-ui.json` | Native | Teclado y selección |
| Date | `<input type="date">` nativo existente | `premium-ui.json` | Native | Teclado y calendario |
| CRM Form | `src/screens/crm/PantallaCrm.jsx` | API `/api/crm` | Crear y editar | Validación y foco al primer campo inválido |
| CRM Dialog | `src/componentes/crm/DialogoCrm.jsx` | `<dialog>.showModal()` | Formulario, confirmación e importación | Escape, foco confinado y restauración |
| Campos personalizados | `src/screens/crm/CamposPersonalizados.jsx`, `ValoresPersonalizados.jsx` | API `/api/crm/campos` | Catálogo admin, valores por contacto | Tipos, versión, archivo sin pérdida y permisos |
| Editor de flujos | `src/screens/crm/EditorFlujos.jsx` | API `/operaciones/automatizaciones/:id/flujo` | Tarjetas y conexiones con select nativo | Esperas, snapshot, consentimiento y confirmación |
| Recepción WhatsApp | `src/screens/crm/MensajesWhatsApp.jsx` | `/api/crm/contactos/:id/whatsapp` y `/operaciones/whatsapp` | Ficha de contacto y bandeja admin | Firma en backend, texto seguro, paginación, vínculo confirmado y conflicto |
| Rendimiento publicitario | `src/screens/crm/PublicidadDemo.jsx`, `GraficosPublicidadDemo.jsx` | `/api/crm/rendimiento`, proveedor Mockaroo | Pestaña dentro de Métricas, países agregados y CSV | Importación completa, caché, permisos, procedencia y atribución de ventas del CRM |

## Propiedad de componentes

| Capacidad | Dueño | Verificación |
| --- | --- | --- |
| Navegación, grupos y rail | `src/componentes/sidebar/Sidebar.jsx` | Rutas, teclado, foco, scroll y viewport estrecho |
| Configuración visible por rol | `src/utils/modulosPorRol.js` y `src/componentes/sidebar/funciones.js` | Comparar con `src/rutas/RutasAplicacion.jsx` |
| Protección de ruta | `src/componentes/autorizacion/RutaPorRol.jsx` | Acceso directo a ruta no permitida |
| Tokens visuales existentes | `src/App.css` y clases Tailwind del componente | Comparación visual con pantallas actuales |
| Select/Listbox | `<select>` nativo actual | Teclado y selección del sistema operativo |
| Date | `<input type="date">` nativo actual | Teclado y calendario del sistema operativo |

## Pendiente del producto

## Flujos CRM

- Contactos: administrador y líder gestionan, analista consulta. Cuentas: administrador y líder. La API exige usuario activo y los permisos `CRM_CONTACTOS_LEER/GESTIONAR` o `CRM_CUENTAS_LEER/GESTIONAR`; administrador conserva su acceso global.
- Búsqueda explícita por Enter/botón con cancelación de lecturas anteriores. El buscador tiene botón de limpiar. El texto buscado se mantiene en memoria para no dejar correos/teléfonos en el historial del navegador; estado y página se guardan en URL.
- Listas paginadas en servidor de 20 filas. Las mutaciones son pesimistas, con bloqueo de envíos duplicados, mensajes de resultado y conservación del formulario ante error.
- Crear devuelve a la lista; editar conserva la ficha y actualiza sus datos. La eliminación requiere confirmación explícita y vuelve a la lista. No se usa confirmación nativa del navegador dentro del producto.
- Cambios no guardados en la ficha abren una confirmación al cerrar el diálogo; al abandonar la página se usa `beforeunload`.
- Los adjuntos se descargan como archivos, nunca se ejecutan ni se renderizan como HTML. El límite es 5 MB. Importaciones CSV: 500 filas/1 MB; exportación: hasta 10000 filas filtradas. Los consentimientos no se infieren de una importación.
- Un error de migración pendiente se muestra en texto con instrucciones de habilitación. No se sustituyen datos de la API por datos ficticios.

## Operaciones CRM

La ficha tiene un dueño específico para etiquetas/orígenes: RelacionesContacto. Guardar actualiza sus datos y la copia de etiquetas del formulario principal sin desmontar la ficha; el puntaje se recalcula. Los formularios usan DialogoCrm, controles nativos y confirmación de descarte. Guardar etiquetas crea o reutiliza también el nombre escrito y lo asigna junto con las casillas seleccionadas. Crear y seleccionar añade al catálogo y al borrador para preparar varias; asignarlas al contacto requiere Guardar. Ante un fallo de asignación, el diálogo mantiene las seleccionadas para reintentar sin duplicar la etiqueta. Al descartar y reabrir no se conserva el nombre descartado. La baja pública por GET solo muestra confirmación y por POST registra la supresión, sin exponer datos personales.

La atribución permite primer origen, último origen y reparto lineal. Los filtros conservan el parámetro de la pestaña padre en Métricas/Reportes. Los CSV incluyen modelo y período. El historial distingue líneas base de movimientos realmente observados, y no presenta tasas históricas para oportunidades sin historia completa.

La matriz de negocio está en docs/MODULOS_POR_ROL.md y la implementación en CrmAcceso/CrmOperacionServicio. PantallaOperaciones comparte formularios, tabla, búsqueda, paginación y confirmaciones mediante configuracionOperaciones. DialogoCrm conserva la propiedad de foco. El calendario semanal es independiente de la página de lista; el tablero opera sobre la página mostrada y tiene alternativa al arrastre mediante selector.

Los cambios de etapa abren el formulario para confirmar probabilidad, cierre y motivo de pérdida. Las ediciones versionadas rechazan conflictos con 409 y conservan los datos escritos; hay que cerrar y reabrir para recuperar la última versión. Las tareas propias se filtran en servidor y las notificaciones consultan vencimientos del usuario cada minuto.

Contenido exige revisión antes de aprobación/rechazo; analistas no modifican piezas en revisión o aprobadas. Ejecutar flujos requiere confirmación porque puede crear tareas o enviar emails. Las credenciales de WhatsApp, Twilio, SMTP y Mockaroo permanecen en variables de entorno del backend. Los conectores de publicidad Meta, Google Ads y GA4 se retiraron; se conservan sus históricos. Formularios públicos y webhooks solo capturan datos y nunca devuelven fichas de contactos existentes. Las decisiones y límites de atribución/envíos se documentan en docs/EJECUCION_PLAN_CRM.md.

El paso WhatsApp del editor ofrece «Usar plantilla hello_world»: establece `hello_world`, idioma `en_US` y parámetros vacíos. En ese caso no se muestra el campo de parámetros y el backend omite `components`. Es una excepción para esa plantilla de prueba; las demás mantienen parámetros con `{{baja}}`. Se conservan consentimiento MARKETING / WHATSAPP, supresiones, confirmación y reserva para evitar reenvíos. Una aceptación del proveedor no se presenta como entrega confirmada.

Rendimiento publicitario es la vista predeterminada de Métricas (`crm=rendimiento`); `crm=demo` sigue siendo compatible. Usa lenguaje de negocio y «Fuente: Mockaroo», sin etiquetas de demostración en la interfaz. Lectura exige Atribución; gestionar Integraciones permite vincular, sincronizar y registrar/anular inversiones adicionales. Cliente, campaña, fechas y país se conservan en URL. Monedas separadas. El país filtra únicamente publicidad; el resumen comercial cubre la campaña completa en la moneda y período seleccionados.

ResultadosComerciales es dueño del resumen de inversión y ventas y de los formularios de gastos adicionales. La inversión incluye pauta y gastos adicionales vigentes; las oportunidades ganadas del CRM aportan los ingresos con atribución al primer origen anterior al cierre. El ingreso generado por Mockaroo no se usa como venta. Formularios con validación, descarte confirmado, UUID idempotente y anulación versionada con auditoría. El histórico de pauta anterior solo se utiliza donde no hay importación de la misma campaña/moneda/fecha. Ver docs/MODELO_PRODUCTO_MARKETING.md.

El navegador usa `/api/crm/rendimiento` para reducir falsos positivos de bloqueadores. Se conservan `/api/crm/demostracion` y `/api/crm/publicidad-demo` como alias con idéntica autorización. Un fallo de red muestra diagnóstico y reintento; las cancelaciones se conservan. CanalesCrm administra la vista de WhatsApp, SMS y correo, sin controles de conectores publicitarios retirados.

El proveedor recibe únicamente el esquema numérico, nunca nombres, correos ni datos de empresas. Un máximo de 90 días × 9 países produce 810 filas; se importan solo días faltantes y las filas existentes no se reemplazan. Una respuesta incompleta o inválida no guarda parciales. Los errores conservan los resultados previos y se puede reintentar. KPIs se calculan a partir de totales, con «—» cuando un divisor es cero. Mapa con geometría local Natural Earth de dominio público: puntos representativos por país y botones nativos equivalentes. El gráfico y la tabla tienen scroll interno en pantallas estrechas.

Selectores y calendarios mantienen controles nativos. La página usa es-PE y America/Lima en resultados de fecha/hora. La preferencia persistente del sidebar y un menú móvil específico siguen pendientes; el rail funciona en viewport estrecho.
