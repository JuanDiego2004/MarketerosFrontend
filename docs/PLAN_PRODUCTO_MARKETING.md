# Plan de evolución del sistema de marketing

## Alcance y criterio de éxito

Producto para una agencia que gestiona campañas de varios clientes con tres perfiles internos: administrador, líder y analista. El primer objetivo es poder seguir una campaña real desde el brief hasta un reporte de resultados verificable. Las integraciones externas y la publicación automática quedan para después de estabilizar ese recorrido.

Una funcionalidad se considera terminada cuando tiene datos persistidos, autorización en el backend, interfaz usable, estados de carga/error/vacío y una verificación del flujo completo. No se mostrará en el sidebar una ruta que todavía no tenga ese flujo.

## Punto de partida comprobado en el código

- `src/utils/modulosPorRol.js` define un menú plano según el nombre del rol; `src/componentes/sidebar/Sidebar.jsx` lo representa como una lista de enlaces.
- `src/rutas/RutasAplicacion.jsx` expone dashboard, usuarios, roles, clientes/canales, campañas, audiencias, métricas, comparación y reportes.
- `src/screens/administrador/PantallaAdministracion.jsx` concentra campañas, audiencias, métricas, comparación y reporte CSV. Las pantallas de líder y analista reutilizan este flujo.
- El backend ofrece CRUD de cinco catálogos, KPIs, comparación y exportación CSV desde `AdministradorControlador`/`AdministradorServicio`. Las métricas se registran manualmente.
- El repositorio backend solo contiene una migración parcial de autenticación. Antes de diseñar tablas nuevas hay que inventariar el esquema real de Supabase y registrar su versión en migraciones reproducibles.

## Navegación objetivo

| Grupo del sidebar | Submódulos | Visibilidad inicial |
| --- | --- | --- |
| Inicio | Dashboard | Todos |
| Clientes | Fichas, contactos, briefs, canales y cuentas | Administrador y líder; analista solo si recibe permiso |
| Campañas | Campañas, planificación, tareas y calendario, contenido, audiencias | Según permiso de lectura/edición |
| Resultados | Métricas, análisis, reportes | Según permiso de lectura/registro/exportación |
| Configuración | Usuarios, roles y permisos, integraciones, auditoría | Administrador |

Primero se agrupan las rutas que ya funcionan. Los submódulos nuevos se agregan al menú cuando tengan una pantalla y API completas. La visibilidad debe depender de permisos efectivos y no solo de etiquetas de rol.

## Fases y entregables

### Fase 0 — Base de producto

1. Inventariar tablas, claves, restricciones y valores de estado actuales en Supabase; documentar la relación cliente → campaña → audiencia/métrica.
2. Crear migraciones versionadas para cambios futuros y una forma de preparar datos de desarrollo.
3. Definir un catálogo único de permisos para API, navegación y acciones. Verificar los permisos en el backend; usar el mismo catálogo para ocultar acciones no disponibles en el frontend.
4. Agrupar el sidebar con las rutas existentes y conservar la navegación por teclado y el estado activo de cada enlace.
5. Añadir filtros por cliente, estado y periodo, con paginación en listados que puedan crecer.

**Salida:** los tres perfiles acceden solo a sus capacidades, los listados siguen siendo utilizables con muchos registros y el esquema puede reproducirse sin pasos manuales ocultos.

### Fase 1 — Campaña de principio a fin (primer incremento funcional)

1. Crear ficha de campaña: cliente, brief, objetivo medible, indicador principal, meta, presupuesto, fechas, responsable y estado.
2. Añadir detalle de campaña con tareas, responsable, fecha límite y avance; mostrar hitos en un calendario.
3. Definir transiciones de estado (planificada → aprobada/activa → pausada/finalizada) y registrar autor y fecha de cada cambio.
4. Mostrar presupuesto previsto, gasto registrado y diferencia en la ficha.

**Salida:** un líder puede planificar y asignar una campaña; un analista puede registrar avance; el administrador puede consultar el historial. Ninguna campaña activa carece de cliente, meta y responsable.

### Fase 2 — Medición y decisiones

1. Definir métricas y fórmulas, unidades, moneda y periodo. Registrar fuente y fecha de importación de cada dato.
2. Importar CSV con vista previa, validación y detección de duplicados; conservar el registro manual existente.
3. Mostrar series por fecha, filtros por cliente/campaña/canal y comparación contra metas y presupuesto.
4. Mejorar el reporte con periodo, fuente, resumen de variaciones y conclusiones; mantener CSV como primera exportación.

**Salida:** cada cifra puede rastrearse a su origen y el reporte muestra si la campaña cumplió su meta, no solo totales agregados.

### Fase 3 — Contenido y aprobaciones

1. Asociar piezas y enlaces a una campaña, con tipo, canal, versión, responsable y fecha prevista.
2. Añadir comentarios y estados de revisión/aprobación para líder y administrador.
3. Mostrar entregables pendientes y próximos vencimientos en el dashboard.

**Salida:** el equipo puede saber qué pieza falta, cuál está aprobada y quién tomó la decisión.

### Fase 4 — Integraciones y automatización

Elegir las plataformas después de confirmar cuáles usan los clientes. Conectar cuentas de forma segura, sincronizar métricas por periodos, registrar fallos de sincronización y programar reportes o alertas. Evitar que una sincronización sobrescriba datos manuales sin trazabilidad.

**Salida:** al menos una fuente externa puede sincronizar datos de una campaña y se puede comparar su resultado con una importación manual.

## Primer lote de trabajo

| Orden | Trabajo | Repositorio principal | Dependencia |
| --- | --- | --- | --- |
| 1 | Inventario del esquema y migración base | backend_agencia | Acceso al esquema actual |
| 2 | Matriz de permisos por acción y rol | Ambos | Inventario de permisos |
| 3 | Agrupar sidebar con rutas actuales | MarketingSystem | Matriz de permisos |
| 4 | Modelo y API de ficha de campaña | backend_agencia | Migración base |
| 5 | Pantalla de detalle de campaña | MarketingSystem | API de campaña |
| 6 | Flujo de tareas e historial de estado | Ambos | Detalle de campaña |

El primer lote termina cuando se puede crear una campaña con brief, meta y responsable, abrir su detalle y ver el mismo dato después de recargar la página. Se revisa ese flujo antes de abrir la fase de medición.

**Avance:** el sidebar ya agrupa las rutas existentes por rol. Siguen pendientes el inventario del esquema, la matriz de permisos efectivos y la ficha completa de campaña.

## Decisiones de alcance

- Los clientes son entidades administradas por el equipo interno. Un portal de acceso para clientes requiere aislamiento de datos por cliente y se planificará como una fase aparte si se necesita.
- CRM de prospectos, facturación, publicación automática y pruebas A/B quedan fuera del primer incremento. Se priorizan después de validar planificación y medición con campañas reales.
- Se mantienen las rutas actuales mientras se reorganiza la navegación; las nuevas rutas tendrán nombres estables y una pantalla de detalle, no pantallas vacías.
