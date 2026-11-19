# Módulos y permisos por rol

Actualización v12–v13: Entregas y análisis se retira del sidebar. Materiales, comparación y PDF se abren desde `/contratos/:id`. El alta de contratos corresponde a administrador/líder; el analista conserva consulta y herramientas autorizadas. El menú tiene 31 enlaces para administrador, 24 para líder y 16 para analista. Véanse [CONTRATACION_CONTEXTUAL.md](CONTRATACION_CONTEXTUAL.md) y [SIDEBAR_MODULOS_Y_FUNCIONES.md](SIDEBAR_MODULOS_Y_FUNCIONES.md). Las actualizaciones anteriores se conservan como historial.

Actualización v11: los tres roles internos ven Marketing → Entregas y análisis (multimedia privada, comparaciones, PDF). Administrador/líder gestionan materiales y publican versiones; el analista consulta materiales/comparaciones y genera PDF con Contenido. Configuración → Accesos al portal es administrativa. El nuevo rol **Cliente** no entra en los grupos internos: inicia en `/portal`, con datos exclusivos de la empresa asignada por el administrador. Las API verifican el acceso activo en cada petición; solo descarga versiones PDF publicadas y revisa los materiales que le fueron enviados. Ver [FASES_FINALES_CRM.md](FASES_FINALES_CRM.md).

Actualización de servicios (v10): Administrador y líder incorporan Cotizaciones, Contratos, Cuentas publicitarias, Anuncios, Calendario editorial, Entregables, Recomendaciones, Ajustes e Informes por contrato. El administrador gestiona el catálogo de servicios; el líder lo consulta mediante ruta. El analista consulta Contratos, Anuncios, Calendario y Entregables, y redacta Recomendaciones/Informes con permiso de Contenido. No crea contratos, edita anuncios ni aprueba ajustes. Las cifras de enlaces siguientes corresponden a v9 y no incluyen estas nuevas entradas. Detalle vigente de la ampliación en [CONTRATOS_Y_SERVICIOS.md](CONTRATOS_Y_SERVICIOS.md).

Fuente: src/utils/modulosPorRol.js, src/rutas/RutasAplicacion.jsx y backend CrmAcceso/CrmOperacionServicio.

| Rol | Grupos | Enlaces visibles |
| --- | ---: | ---: |
| Administrador | 6 | 20 |
| Líder / Project Manager | 5 | 15 |
| Analista | 4 | 10 |

El número cuenta enlaces del sidebar, no pestañas ni fichas. Los permisos efectivos CRM se consultan en el backend; tener una ruta visible no concede escritura.

| Grupo | Módulo / ruta | Administrador | Líder | Analista |
| --- | --- | --- | --- | --- |
| Dashboard | Dashboard /dashboard | Sí | Sí | Sí |
| CRM | Contactos /contactos | Gestiona | Gestiona | Lee |
| CRM | Pipeline /pipeline | Gestiona | Gestiona | — |
| CRM | Actividades /actividades | Gestiona | Gestiona | Solo propias |
| Clientes | Clientes / Empresas /empresas | Gestiona | Gestiona | — |
| Marketing | Canales de difusión /canales-difusion | Gestiona | Gestiona | — |
| Marketing | Campañas /campanas | Sí | Sí | Sí |
| Marketing | Audiencias /audiencias | Sí | Sí | Sí |
| Marketing | Contenido /contenido | Gestiona/aprueba | Gestiona/aprueba | Borradores propios y envío a revisión |
| Marketing | Automatizaciones /automatizaciones | Gestiona | Gestiona | — |
| Resultados | Métricas /metricas | Sí | Sí | Sí |
| Resultados | Comparación /analisis-comparativo | Sí | Sí | Sí |
| Resultados | Reportes /reportes | Sí | Sí | Sí |
| Resultados | Atribución /atribucion | Lee/exporta | Lee/exporta | Lee/exporta |
| Resultados | Metas /metas | Gestiona | Gestiona | — |
| Configuración | Usuarios /usuarios | Sí | — | — |
| Configuración | Roles /roles-permisos | Sí | — | — |
| Configuración | Canales de comunicación /integraciones | Gestiona | — | — |
| Configuración | Auditoría /auditoria | Lee | — | — |
| Configuración | Campos personalizados /campos-personalizados | Gestiona catálogo | — | — |

El catálogo de campos es exclusivo de administrador; los valores de la ficha son editables por administrador/líder y consultables por analista. El editor `/automatizaciones/:id/flujo` es para administrador/líder. La bandeja WhatsApp y los estados de correo/SMS están en Canales de comunicación; los conectores publicitarios reales se retiraron. Mockaroo se consulta desde Métricas y no modifica esta matriz. Los estados de comunicación están dentro de /integraciones, sin añadir enlaces de sidebar. Los mensajes vinculados se leen desde la ficha con sus permisos existentes; la bandeja y la vinculación son administrativas.

Subrutas/pestañas: /contactos/:id y /empresas/:id (alias /cuentas/:id), /pipeline/etapas (solo administrador), /segmentos (todos), /scoring (administrador/líder). Captación dentro de Campañas es para administrador/líder; Segmentos dentro de Audiencias está disponible para los tres; Embudo e ingresos dentro de Métricas está disponible para los tres.

Los módulos anteriores conservan sus permisos actuales. Los CRM requieren usuario ACTIVO y códigos CRM_*_LEER/GESTIONAR de rol_permiso, además del límite por rol. Administrador conserva acceso global. El analista no puede asignarse permisos de líder aunque alguien le agregue un código fuera de su matriz.

Base de datos: crm-v1 a crm-v9 aplicadas en la base configurada. Las pruebas reales de proveedores requieren credenciales; consultar [CIERRE_FASES_CRM.md](CIERRE_FASES_CRM.md).

Clientes y Cuentas ya no se crean en pantallas distintas: la ficha unificada genera ambos registros de almacenamiento de forma automática. Las API e IDs anteriores se conservan por compatibilidad. Ver [EMPRESAS_UNIFICADAS.md](EMPRESAS_UNIFICADAS.md).
