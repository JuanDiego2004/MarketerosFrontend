# Ejecución del plan CRM

Actualizado el 17 de noviembre de 2026. Alcance: agencia de una organización, Java 25, React y Lucide React. Proveedores acordados: Meta Ads, SMTP, Meta WhatsApp Cloud y Twilio SMS; también se implementaron Google Ads y GA4. El detalle vigente está en [CIERRE_FASES_CRM.md](CIERRE_FASES_CRM.md).

## Estado de entrega

| Fase | Implementación | Verificación / dependencia |
| --- | --- | --- |
| 0 — Preparación | Modelo, permisos efectivos, grupos del sidebar, diálogos y estados compartidos | Esquema base inventariado en PostgreSQL real |
| 1 — Núcleo CRM | Contactos, cuentas, notas, consentimiento, historial, adjuntos, CSV, deduplicación y campos personalizados | crm-v1 ya estaba aplicado; consultas verificadas con rollback |
| 2 — Trabajo diario | Oportunidades, etapas, lista/tablero con arrastre y alternativa por select, valor/moneda/probabilidad/cierre/pérdida, asignación, actividades y calendario semanal, Mis tareas y notificaciones | Pruebas de propiedad, concurrencia y persistencia |
| 3 — Marketing | Formularios/webhook, múltiples interacciones y campañas, etiquetas relacionales, segmentos y scoring | Migración compatible y APIs comprobadas por rol |
| 4 — Resultados | Primer/último origen y lineal, ingresos, gasto, CPL/ROI, embudo actual e histórico, responsables, metas y CSV dentro de Reportes | Conservación de ingresos y transiciones probadas |
| 5 — Automatización | Contenido con revisión/aprobación, editor visual con tareas/email/WhatsApp/SMS, condiciones y esperas, historial, Meta Ads, Google Ads, GA4, SMTP y auditoría | APIs y UI probadas; falta aceptación con cuentas externas |

La implementación de las fases 0–5 está completada y tiene pruebas locales. La aceptación externa de fase 5 requiere sincronización publicitaria real y comunicaciones autorizadas; no se ha declarado cumplida sin credenciales. El usuario se encarga de Railway.

## Base de datos

Se consultó el esquema remoto configurado sin exponer credenciales. crm-v1.sql ya existía; crm-v2.sql, crm-v3.sql, crm-v4.sql, crm-v5.sql y crm-v6.sql se aplicaron correctamente, en transacción, en la base configurada. No volver a ejecutar manualmente esos scripts sobre tablas existentes.

Migraciones: backend_agencia/src/main/resources/sql/crm-v1.sql a crm-v6.sql. Añaden 37 tablas CRM en total, RLS y permisos CRM por rol. No eliminan las tablas previas.

El auxiliar backend_agencia/scripts/PrepararCrm.java inventaría por defecto. --aplicar omite un grupo de tablas completo y detiene la ejecución si detecta uno parcial; no sustituye un gestor de migraciones con checksums. La reversión operativa consiste en detener el backend nuevo; no borrar tablas con información real.

## Cómo usarlo

- CRM: Contactos, Cuentas, Pipeline y Actividades.
- Campañas → Captación de leads: crear formulario y obtener iframe y secreto del webhook. El secreto se muestra una vez; se guarda solo su hash.
- Audiencias → Segmentos dinámicos: condiciones combinadas con Y, miembros en vivo y CSV.
- Ficha de contacto → Resumen: puntuación del lead. Administrador/líder pueden abrir Configurar reglas.
- Métricas → Embudo e ingresos, o Atribución: resultados por campaña y moneda; CSV.
- Metas: objetivos de leads e ingresos, con alerta cuando el resultado está por debajo del avance lineal del período.
- Contenido: BORRADOR → EN_REVISION → APROBADO/RECHAZADO. El analista edita únicamente borradores propios y los envía a revisión.
- Automatizaciones: configurar segmento y abrir Editor visual para tareas/email/WhatsApp/SMS, condiciones, esperas y conexiones. Ejecutar requiere confirmación; el historial muestra aceptación, omisiones y resultados inciertos, sin afirmar entrega al destinatario.
- Integraciones (administrador): vincular campaña interna con Meta, Google Ads o nombre de campaña de sesión GA4 y sincronizar hasta 90 días. Configuración → Campos personalizados define datos adicionales para contactos.
- Auditoría (administrador): acciones, ID del registro, autor y fecha.

WhatsApp: mensajes recibidos en la ficha y bandeja administrativa dentro de Integraciones; confirmaciones de entrega/lectura/fallo verificadas por firma. Configuración en [WHATSAPP_WEBHOOK.md](WHATSAPP_WEBHOOK.md).

## Arranque

Desde backend_agencia: .\\scripts\\IniciarBackend.ps1. Carga .env y usa JDK 25. Swagger: http://localhost:8080/swagger-ui/index.html.

Desde MarketingSystem: pnpm dev. La API se toma de VITE_API_URL. La compilación sigue siendo pnpm build.

## Configuración Meta Ads y SMTP

Copiar los nombres de backend_agencia/.env.crm.example al .env local, manteniendo las variables DB actuales. Añadir CRM_META_TOKEN con ads_read y acceso a la campaña elegida; configurar SMTP_HOST, SMTP_PORT (587/STARTTLS), SMTP_USERNAME, SMTP_PASSWORD y CRM_SMTP_FROM.

El sincronizador usa el endpoint oficial Insights de Meta: https://developers.facebook.com/docs/marketing-api/insights/. La versión es configurable con CRM_META_VERSION. Solicita gasto, clics e impresiones diarios y hace upsert para no duplicar días. Si Meta pagina, pide reducir el período. Los errores no muestran tokens ni respuestas del proveedor.

La ejecución periódica está desactivada por defecto. Después de revisar flujos y destinatarios, CRM_AUTOMATIZACIONES_HABILITADAS=true habilita evaluación cada minuto. También existe ejecución manual confirmada. Una combinación flujo/contacto se procesa una sola vez. Un flujo modificado no vuelve a enviar a contactos ya procesados: crear un flujo nuevo para una campaña nueva.

Email exige correo y consentimiento vigente con tipo MARKETING y canal EMAIL. No se infiere consentimiento de CSV. La revocación impide nuevas entregas. SMTP aceptado significa entrega al servidor, no apertura, clic ni llegada garantizada al buzón; el historial no inventa esas estadísticas. No se reintentan automáticamente resultados inciertos para evitar correos duplicados. Cada email incorpora un enlace público de baja. GET muestra confirmación sin cambiar datos; POST revoca los consentimientos de marketing/email y registra una supresión que prevalece sobre consentimientos antiguos o añadidos después. Los tokens se almacenan como hash. Configurar CRM_PUBLIC_URL con la dirección HTTPS pública del backend; los envíos están bloqueados si falta.

## Reglas y límites

- Correo normalizado y teléfono 7–15 dígitos. Restricciones únicas también protegen concurrencia.
- Cada contacto conserva una campaña principal compatible con la versión anterior. La ficha permite registrar varias interacciones, campañas y UTM. El webhook autenticado añade interacciones a contactos existentes por correo; el formulario público duplicado no actualiza ni revela fichas existentes. No se fusionan identidades por teléfono.
- Consentimiento explícito, hash para claves de webhook, honeypot y límite de 100 captaciones por campaña/hora. Antes de exposición pública masiva conviene añadir un servicio antiabuso/CAPTCHA.
- UTM puede pasarse en la URL del iframe; no se lee automáticamente la URL de la página contenedora.
- Segmentos: igualdad de estado/origen, etiqueta, etapa, ausencia de actividad directa del contacto; todas las condiciones se combinan con Y. No hay editor arbitrario de expresiones.
- Scoring suma una vez cada regla coincidente. Las etiquetas son relacionales y compartidas, con nombre y color. Un trigger mantiene la relación desde el campo de texto anterior; la migración conserva exactamente los valores antiguos. Segmentos y scoring consultan la relación.
- Ingresos admiten PRIMERO, ULTIMO y LINEAL entre interacciones anteriores al cierre. LINEAL reparte una venta entre sus interacciones y produce ventas equivalentes fraccionarias, sin multiplicar ingresos. Leads/CPL siguen primer origen y fecha de creación. No se mezclan PEN/USD/EUR. Gasto faltante se muestra como desconocido. Las ventas sin campaña se muestran aparte.
- La distribución actual del embudo se conserva y se añade un reporte histórico de etapas alcanzadas/conversiones observadas por cohorte. Se guarda cada cambio real de etapa, incluido autor y una instantánea de la etapa. Las oportunidades previas a crm-v3 tienen línea base y se excluyen del cálculo de historia completa; no se inventan movimientos anteriores. Costo por venta usa ventas atribuidas equivalentes, no clientes únicos.
- Tablero/lista paginados de 25 registros; cada columna indica que cuenta esta página. Calendario semanal consulta el período completo, máximo 500 actividades.
- Segmentos/exportación hasta 10000 contactos, automatizaciones hasta 500, catálogos de selección hasta 1000. Auditoría y ejecuciones paginadas/limitadas según pantalla.
- Ediciones con versión evitan sobrescribir cambios concurrentes; los tipos de etapas usadas no pueden cambiar.
- RLS bloquea el acceso directo anónimo. JDBC requiere propietario/usuario autorizado. El frontend no decide permisos del servidor.
- No se enviaron comunicaciones reales ni se contactaron APIs de proveedores durante las pruebas: faltan credenciales. Los conectores se verificaron con respuestas simuladas.

## Evidencia

- Compilación Java 25 y pruebas de permisos/propiedad/validación.
- Pruebas Spring Boot/MockMvc contra PostgreSQL configurado, con rollback: contactos, oportunidades, versión, segmentos, scoring, metas, atribución, actividades, webhook, flujo de tareas y autorizaciones de los tres roles. JWT y SMTP se simulan solo dentro de las pruebas; no se crean usuarios en Supabase Auth.
- Prueba PostgreSQL embebido: las seis migraciones, conservación de etiquetas anteriores, FK, deduplicación, permisos, RLS y reserva idempotente.
- Vite build y ESLint de los archivos CRM/navegación/header.
- Edge con API simulada solo dentro de pruebas: formularios, etiquetas, interacciones, arrastre del pipeline, filtros dentro de Reportes, error/conflicto, valores preservados, foco, navegación, 390px y 1440px. No sustituye la aceptación autenticada contra el backend real.
- Capturas de prueba: crm-pipeline-escritorio.png y crm-pipeline-movil.png.
- La auditoría estática adicional de la skill quedó sin resultado por bloqueo de procesamiento y se interrumpió; no se declara aprobada.
- Advertencias conocidas: bundle grande por dependencias existentes y MapStruct idCliente sin mapear, ajeno a estos módulos.

## Continuación y configuración de bajas

Ver CONTINUACION_CRM.md para evidencia, compatibilidad, reversión y pendientes de aceptación. CRM_SMTP_ONE_CLICK se mantiene false por defecto. Activarlo requiere que el proveedor SMTP firme con DKIM las cabeceras List-Unsubscribe y List-Unsubscribe-Post; añadir cabeceras no demuestra por sí solo compatibilidad de extremo a extremo. Referencia: https://www.rfc-editor.org/rfc/rfc8058.html.
