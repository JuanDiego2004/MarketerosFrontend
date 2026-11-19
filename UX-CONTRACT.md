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
| Empresas unificadas | `src/screens/crm/PantallaCrm.jsx` | API `/api/crm/cuentas`, identidad `cliente` + perfil CRM | Lista y ficha `/empresas`, rutas anteriores redirigidas | Perfil automático, relaciones, archivo reversible y permisos |
| CRM Form | `src/screens/crm/PantallaCrm.jsx` | API `/api/crm` | Crear y editar | Validación y foco al primer campo inválido |
| Registro y edición | `src/componentes/DrawerFormulario.jsx` | Drawer modal compartido; `DialogoCrm formulario` adapta la API de las pantallas CRM | Normal (560 px), asistente amplio (960 px), ancho completo en móvil | Guardado, error/reintento, Escape, fondo inerte, foco confinado/restaurado y descarte |
| CRM Dialog | `src/componentes/crm/DialogoCrm.jsx` | `<dialog>.showModal()` | Confirmación, consulta y vista previa; los registros delegan al drawer | Escape, foco confinado y restauración |
| Login | `src/screens/login/LoginForm.jsx`, `src/servicios/servicioAuth.js` | `/auth/login` | Acceso interno y portal de cliente | Espera máxima de 60 s, reintento con campos conservados y persistencia de sesión; decoración externa aislada por `DecoracionLogin` |
| Contract Stepper | `src/screens/agencia/AsistenteContrato.jsx` | `/api/crm/contratacion/borradores` | Drawer amplio de difusión, análisis e integral; ampliación del mismo contrato | Primer material visible en difusión/integral; validación de archivo cargado y canales en el paso 3; recuperación, archivos previos, registro de empresa en drawer anidado, error/reintento y confirmación idempotente |
| Plan de difusión por canal | `src/screens/agencia/PlanCanalContrato.jsx`, `CampoContrato.jsx` | Catálogo de Audiencias: opciones de agencia o consulta administrativa existente según el rol | Cuatro bloques dentro del drawer; select nativo y objetivo elegido o personalizado | Filtro local, ID activo, cobertura editable, compatibilidad con opciones anteriores, recarga sin perder el borrador, error/reintento, permisos y móvil |
| Contract Detail | `src/screens/agencia/FichaContrato.jsx` | `/api/crm/contratacion/contratos/:id` | Pestañas por servicio y alcance | Anuncios vinculados, calendario, informes y permisos del servidor |
| Presupuesto en alta de contrato | `src/screens/agencia/ResumenPresupuestoContrato.jsx`, `src/utils/presupuestoContrato.js` | Importes del mismo borrador; validación final en backend | Resumen en pasos 3–5 de difusión/integral con pauta; corrección explícita en precios | Suma de todos los materiales/canales con centavos enteros, foco y bloqueo ante exceso en paso 4, borrador parcial y móvil |
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

- Contactos: administrador y líder gestionan, analista consulta. Clientes / Empresas: administrador y líder. La API exige usuario activo y los permisos `CRM_CONTACTOS_LEER/GESTIONAR` o `CRM_CUENTAS_LEER/GESTIONAR`; administrador conserva su acceso global.
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

Rendimiento publicitario es la vista predeterminada de Métricas (`crm=rendimiento`); `crm=demo` sigue siendo compatible. Muestra «Fuente: Mockaroo» y, desde la propuesta de servicios v10, «Datos simulados con Mockaroo». Lectura exige Atribución; gestionar Integraciones permite vincular, sincronizar y registrar/anular inversiones adicionales. Cliente, campaña, fechas y país se conservan en URL. Monedas separadas. El país filtra únicamente publicidad; el resumen comercial cubre la campaña completa en la moneda y período seleccionados.

ResultadosComerciales es dueño del resumen de inversión y ventas y de los formularios de gastos adicionales. La inversión incluye pauta y gastos adicionales vigentes; las oportunidades ganadas del CRM aportan los ingresos con atribución al primer origen anterior al cierre. El ingreso generado por Mockaroo no se usa como venta. Formularios con validación, descarte confirmado, UUID idempotente y anulación versionada con auditoría. El histórico de pauta anterior solo se utiliza donde no hay importación de la misma campaña/moneda/fecha. Ver docs/MODELO_PRODUCTO_MARKETING.md.

El navegador usa `/api/crm/rendimiento` para reducir falsos positivos de bloqueadores. Se conservan `/api/crm/demostracion` y `/api/crm/publicidad-demo` como alias con idéntica autorización. Un fallo de red muestra diagnóstico y reintento; las cancelaciones se conservan. CanalesCrm administra la vista de WhatsApp, SMS y correo, sin controles de conectores publicitarios retirados.

El proveedor recibe únicamente el esquema numérico, nunca nombres, correos ni datos de empresas. Un máximo de 90 días × 9 países produce 810 filas; se importan solo días faltantes y las filas existentes no se reemplazan. Una respuesta incompleta o inválida no guarda parciales. Los errores conservan los resultados previos y se puede reintentar. KPIs se calculan a partir de totales, con «—» cuando un divisor es cero. Mapa con geometría local Natural Earth de dominio público: puntos representativos por país y botones nativos equivalentes. El gráfico y la tabla tienen scroll interno en pantallas estrechas.

Selectores y calendarios mantienen controles nativos. La página usa es-PE y America/Lima en resultados de fecha/hora. La preferencia persistente del sidebar y un menú móvil específico siguen pendientes; el rail funciona en viewport estrecho.

## Empresas unificadas y canales

## Contratación de servicios

### Entregas v11

`CentroEntregas` posee las pestañas Materiales, Comparación e Informes PDF en `/entregas`. Contrato y pestaña se conservan en URL. Cambiar contrato desmonta las lecturas anteriores. Se reutilizan Crm.css, DialogoCrm, selects/fechas/archivos nativos. `AlcanceContrato` permite elegir prestaciones y cantidades en borradores; el servidor limita anuncios y entregables. Los contratos antiguos reciben capacidades amplias compatibles, sin reinterpretar su texto de alcance ni reducir compromisos en una migración.

Materiales crea versiones, valida contenido en el servidor, conserva el archivo seleccionado ante fallo y muestra estado de procesamiento. La previsualización carga mediante JWT y URL de objeto temporal revocada al cerrar; no hay rutas públicas de archivos. Los archivos programados/publicados no se reemplazan. Una nueva carga invalida las revisiones anteriores. VistaMaterial es el dueño compartido entre agencia y portal.

PDF: generación idempotente, versiones inmutables de estadísticas y conclusiones; repetir tras un fallo usa la misma clave. Publicar al cliente requiere confirmación y permiso de gestión. Comparación usa totales por anuncio/plataforma y periodo anterior de igual duración, sin combinar monedas; sin base anterior se muestra «—».

`PortalCliente` vive fuera del layout de agencia, requiere sesión y rol Cliente, y consulta únicamente la empresa asignada en servidor. La asignación/revocación administrativa usa AccesosPortal y confirmación, con control de versión. No se cambia silenciosamente el rol de usuarios existentes. Cliente no se añade a GRUPOS_PERMITIDOS.TODOS; no tiene acceso a rutas internas. Materiales y PDF verifican la pertenencia por cada ID. Aprobaciones conservan la versión del material y la decisión del cliente; un rechazo exige observación. El portal muestra resultados agregados, entregables y solo informes publicados. Referencia de reglas: docs/FASES_FINALES_CRM.md.

Informes por contrato distingue la consulta de resultados y los informes redactados. La selección consulta automáticamente el mismo informe usado desde Contratos, con totales propios del contrato, gráfico y exportación; no crea registros ni descarga estadísticas. La lectura es cancelable y presenta carga, error/reintento y ausencia de métricas. Los informes manuales permanecen en su propia lista. El dueño de la consulta es ConsultaInformeContrato dentro de PantallaAgencia; Informe comparte la presentación y exportación entre ambas entradas.

La contratación contextual de `docs/CONTRATACION_CONTEXTUAL.md` gobierna Empresa → asistente de contrato → ficha del servicio. `AsistenteContrato` posee el alta, sus borradores y archivos; `FichaContrato` reúne contenido, publicaciones, métricas, comparación e informes según el servicio. `PantallaAgencia` conserva las listas transversales y herramientas embebidas; `configuracionAgencia` define sus campos. Las API `/api/crm/contratacion` y `/api/crm/agencia` aplican permisos y alcance. `/entregas` redirige a la ficha y deja de ser un paso necesario. Los cambios de tipo advierten y conservan configuraciones anteriores; la confirmación es idempotente y las ampliaciones preservan contrato, campaña e historial.

Las listas tienen 20 registros por página; búsqueda por nombre/código y contrato conservan estado en URL. Cancelar un borrador sucio requiere descarte confirmado, el error conserva el formulario y las escrituras usan versión. El calendario es una agenda editorial ordenada por fecha de la página filtrada. Publicar dice «Simular publicación» y requiere contenido aprobado, contrato operativo y fecha alcanzada. Solo análisis registra referencias externas simuladas y no habilita edición/publicación ni gestión de gastos. Informes y recomendaciones son redactables por usuarios con permiso de Contenido; aprobar requiere gestión de Cuentas. El catálogo habilita/deshabilita nuevas contrataciones exclusivamente con permiso administrativo de Campos.

La propuesta nueva reemplaza la decisión anterior de omitir etiquetas de simulación: las superficies de anuncios y contratos muestran «Datos simulados con Mockaroo». Las métricas por anuncio no se suman otra vez a la fuente agregada de campañas. El informe muestra el gasto de sus anuncios por separado. Honorarios previstos no acreditan cobros. Se ofrece exportación legible del informe y JSON de estadísticas. Los escenarios se crean por confirmación administrativa, sin llamadas a proveedores; la operación es idempotente y conserva las relaciones. Portal externo del cliente permanece opcional y no se crea una ruta pública con acceso a contratos.

Una empresa se registra una sola vez desde `/empresas`. `PantallaCrm` reutiliza el contrato y la API de cuentas para conservar IDs, notas y adjuntos, sin mostrar el selector de cliente. Crear la empresa genera automáticamente el registro usado por campañas y su perfil CRM. Datos generales, campañas, contactos, oportunidades, actividades, notas y archivos se consultan en una ficha. Las campañas de origen asignan la empresa a contactos sin empresa; el formulario rechaza relaciones cruzadas.

Archivar cambia estado a INACTIVO y conserva el historial; filtrar por ese estado permite editar y reactivar. Las rutas `/cuentas`, `/cuentas/:id` y `/clientes-canales` conservan entrada mediante redirección. Difusión tiene un catálogo independiente en Marketing (`/canales-difusion`); WhatsApp, correo y SMS permanecen en Configuración, bajo Canales de comunicación. No se amplían permisos al analista. La migración v9 y sus respaldos se documentan en docs/EMPRESAS_UNIFICADAS.md.
