# Módulos y permisos por rol

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
| CRM | Cuentas /cuentas | Gestiona | Gestiona | — |
| CRM | Pipeline /pipeline | Gestiona | Gestiona | — |
| CRM | Actividades /actividades | Gestiona | Gestiona | Solo propias |
| Clientes | Clientes y canales /clientes-canales | Sí | Sí | — |
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
| Configuración | Integraciones /integraciones | Gestiona | — | — |
| Configuración | Auditoría /auditoria | Lee | — | — |
| Configuración | Campos personalizados /campos-personalizados | Gestiona catálogo | — | — |

El catálogo de campos es exclusivo de administrador; los valores de la ficha son editables por administrador/líder y consultables por analista. El editor `/automatizaciones/:id/flujo` es para administrador/líder. Google/GA4, la bandeja WhatsApp y los estados de configuración de canales están dentro de Integraciones, sin añadir enlaces de sidebar. Los mensajes vinculados se leen desde la ficha con sus permisos existentes; la bandeja y la vinculación son administrativas.

Subrutas/pestañas: /contactos/:id y /cuentas/:id, /pipeline/etapas (solo administrador), /segmentos (todos), /scoring (administrador/líder). Captación dentro de Campañas es para administrador/líder; Segmentos dentro de Audiencias está disponible para los tres; Embudo e ingresos dentro de Métricas está disponible para los tres.

Los módulos anteriores conservan sus permisos actuales. Los CRM requieren usuario ACTIVO y códigos CRM_*_LEER/GESTIONAR de rol_permiso, además del límite por rol. Administrador conserva acceso global. El analista no puede asignarse permisos de líder aunque alguien le agregue un código fuera de su matriz.

Base de datos: crm-v1 a crm-v6 aplicadas. Las pruebas reales de proveedores requieren credenciales; consultar [CIERRE_FASES_CRM.md](CIERRE_FASES_CRM.md).
