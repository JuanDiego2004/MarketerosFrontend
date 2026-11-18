# Cierre de implementación CRM — 17 de noviembre de 2026

La ampliación de recepción y estados de WhatsApp se documenta en [WHATSAPP_WEBHOOK.md](WHATSAPP_WEBHOOK.md).

Alcance: las fases 0–5 de `plan-mejoras-crm.md`, agencia de una organización, backend Java 25 / Spring Boot y frontend React con iconos Lucide. Se completó el desarrollo local y la verificación descrita abajo. La aceptación con cuentas externas sigue pendiente; no se declara producción validada ni entrega de mensajes reales.

## Estado por fase

| Fase | Entregado | Estado de verificación |
| --- | --- | --- |
| 0. Preparación | Permisos efectivos, rutas por rol, grupos del sidebar, componentes y estados compartidos | API y navegador de prueba |
| 1. Núcleo CRM | Contactos, cuentas, notas, historial, archivos, consentimiento, CSV, deduplicación, campos personalizados tipados | PostgreSQL real con rollback; UI de catálogo y valores |
| 2. Trabajo diario | Etapas configurables, oportunidades, lista y tablero, asignación, tareas, calendario semanal y vencimientos | Propiedad, concurrencia, movimientos, teclado y móvil |
| 3. Marketing | Formularios embebibles, webhook, múltiples orígenes/UTM, etiquetas, segmentos dinámicos, exportación y scoring | Captación, permisos, idempotencia y compatibilidad de datos |
| 4. Resultados | Atribución primero/último/lineal, gasto Meta + Google Ads, ingresos por moneda, CPL/ROI, embudo histórico, responsables y metas | Conservación de ingresos y consultas reales |
| 5. Automatización | Aprobaciones, editor visual con tareas/email/WhatsApp/SMS, condiciones y esperas, historial y auditoría, Meta Ads, Google Ads, GA4 y SMTP | Proveedores simulados; faltan credenciales y prueba externa autorizada |

## Dónde usar las novedades

- **Configuración → Campos personalizados**: administrador define campos de texto, número, fecha, sí/no u opciones. Archivar conserva sus valores. La clave y el tipo son estables; las opciones usadas no se eliminan.
- **Contacto → Resumen → Campos personalizados**: administrador/líder completan valores; analista consulta. Los cambios concurrentes devuelven conflicto en lugar de sobrescribir.
- **Marketing → Automatizaciones → Editor visual**: administrador/líder configuran hasta 20 pasos. Una entrada de segmento puede conectar tareas, email, WhatsApp, SMS, esperas de hasta 7 días y condiciones por estado/etiqueta. Todos los pasos deben estar conectados y sin ciclos.
- Cada contacto entra una sola vez por automatización. Las ejecuciones conservan una copia del flujo; editarlo no altera las que estaban esperando. Para una campaña nueva con los mismos contactos se crea otra automatización.
- Las esperas continúan con la siguiente ejecución manual o programada posterior al vencimiento. Activar la programación solo tras revisar segmentos/destinatarios.
- **Configuración → Integraciones**: vínculos Meta existentes y nuevos vínculos Google Ads/GA4, estados de configuración, período de hasta 90 días y sincronización manual.
- Google Ads importa gasto, clics e impresiones diarios. Repetir el período actualiza los mismos días en una transacción. El gasto entra en Atribución sin mezclar monedas.
- GA4 filtra por nombre exacto de campaña de sesión (`utm_campaign`), dentro de una propiedad. Muestra usuarios, sesiones y eventos clave por día; sumar usuarios diarios no produce usuarios únicos del período. No sustituye ingresos de ventas CRM por ingresos de Analytics.
- Los vínculos Google se archivan/reactivan sin borrar histórico ni cambiar su identidad. Una campaña externa no puede vincularse dos veces en la misma cuenta/fuente.

## Credenciales: solo en el backend

Los nombres completos están en `backend_agencia/.env.crm.example`. Se añaden a `.env` local o a Variables de Railway; nunca a variables `VITE_*`, al repositorio o al chat.

| Servicio | Variables / requisito |
| --- | --- |
| Meta Ads | `CRM_META_TOKEN`, versión configurable; permisos y acceso a campaña |
| Google OAuth | `CRM_GOOGLE_CLIENT_ID`, `CRM_GOOGLE_CLIENT_SECRET`, `CRM_GOOGLE_REFRESH_TOKEN`; scopes `https://www.googleapis.com/auth/adwords` y `https://www.googleapis.com/auth/analytics.readonly` |
| Google Ads | Acceso API aprobado en el proyecto Google Cloud; `CRM_GOOGLE_ADS_LOGIN_CUSTOMER_ID` si usa cuenta administradora; IDs sin guiones; versión inicial v26. `CRM_GOOGLE_ADS_DEVELOPER_TOKEN` es legado opcional y puede quedar vacío |
| GA4 | Google Analytics Data API habilitada y usuario OAuth con acceso a la propiedad |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `CRM_SMTP_FROM`; STARTTLS |
| WhatsApp Cloud | `CRM_WHATSAPP_TOKEN`, `CRM_WHATSAPP_PHONE_ID`; número registrado y plantilla de texto aprobada, con parámetros posicionales del cuerpo |
| Twilio SMS | `CRM_TWILIO_ACCOUNT_SID`, `CRM_TWILIO_AUTH_TOKEN`, `CRM_TWILIO_FROM` con prefijo internacional; número/cuenta habilitados para el destino |
| Bajas | `CRM_PUBLIC_URL`: dirección HTTPS pública del backend, sin `/api` al final |
| Programación | `CRM_AUTOMATIZACIONES_HABILITADAS=false` inicialmente |

Los estados «configurado» comprueban presencia/formato, no certifican validez de la cuenta. Se debe reiniciar el backend al cambiar sus variables.

## Mensajería y resultados

- Cada canal exige consentimiento vigente de tipo `MARKETING` y canal `EMAIL`, `WHATSAPP` o `SMS`, según corresponda. No se deduce de un CSV o de otro canal.
- WhatsApp/SMS usan el teléfono guardado con código de país: por ejemplo `51987654321`. No se añade automáticamente el prefijo de Perú a números locales.
- SMS admite `{{nombre}}`, añade enlace de baja y limita el texto final a 1600 caracteres. Twilio puede facturar varios segmentos. El editor requiere confirmación antes de ejecutar.
- La recepción y activación del webhook se explica en [WHATSAPP_WEBHOOK.md](WHATSAPP_WEBHOOK.md). Los mensajes sin contacto quedan en la bandeja administrativa; vincularlos no da consentimiento de marketing.
- WhatsApp admite plantillas de texto con parámetros del cuerpo, uno por línea y en el orden aprobado. Admite `{{nombre}}` y exige `{{baja}}` como parte de un parámetro aprobado. No incluye plantillas multimedia, cabeceras o botones.
- GET del enlace de baja solo muestra confirmación. POST revoca marketing de ese canal y registra supresión persistente; los otros canales permanecen independientes. Un consentimiento posterior no elimina la supresión. La ficha muestra los canales bloqueados.
- El historial registra pasos, esperas, omisiones, errores y referencias de aceptación WhatsApp/Twilio. Aceptado por el proveedor/SMTP no equivale a entregado, leído o abierto. WhatsApp añade confirmaciones firmadas de enviado/entregado/leído/fallido en el webhook y mensajes recibidos en la ficha. SMTP y Twilio siguen mostrando aceptación sin confirmar entrega; no se inventan aperturas.
- El paso se reserva antes de llamar al proveedor. Ante respuesta incierta se conserva `INCIERTO` sin reintento automático; revisar el proveedor manualmente antes de actuar. No hay botón de reenvío de resultados inciertos.
- Las credenciales, cuerpos originales de error y textos de mensajes no se registran en errores de integración. Las llamadas van a destinos oficiales fijos, sin redirecciones y con tiempo límite.

## Datos y reversión

Las migraciones v1–v6 están aplicadas en la base configurada: 37 tablas CRM con RLS. v6 añade recepción WhatsApp, historial de estados y trazabilidad del número remitente. v4 añade campos y flujos; v5 añade conectores/métricas/supresiones por canal/trazas de envío. Los tokens de baja anteriores siguen siendo EMAIL por defecto. No se borran datos anteriores.

`scripts/PrepararCrm.java` inventaría por defecto y `--aplicar` omite grupos completos. Detiene esquemas parcialmente presentes; no es un gestor de checksums. No repetir scripts manualmente sobre tablas ya creadas.

Para revertir la aplicación: desactivar programación y bloquear también envíos manuales antes de volver a un backend anterior; mantener las tablas. Un backend antiguo no entiende los nuevos pasos, esperas ni bajas por canal. No debe ejecutar comunicaciones de estos flujos.

## Evidencia

- Java 25: 25 pruebas CRM aprobadas antes de la ampliación WhatsApp (11 acceso, 6 operaciones, 1 integración base, 7 evolución). La ampliación completó 10 pruebas de evolución, incluyendo 3 nuevas del webhook. PostgreSQL real con rollback; JWT, SMTP y HTTP de proveedores simulados solo en las pruebas.
- Se probaron importaciones Google repetidas, conversión exacta de micros a moneda, conservación del histórico ante error, GA4 diario, permisos y conflicto al archivar.
- Se probaron SMS y WhatsApp aceptados, baja independiente por canal y respuesta incierta sin reenvío.
- Frontend: compilación Vite; lint de los archivos CRM; 5 pruebas CSV/migraciones; una prueba de navegador Edge que recorre CRUD, conflictos, etiquetas/orígenes, reportes, catálogo/valores, editor con espera/SMS, confirmación de ejecución, vínculos Google y restricciones de ruta. API simulada únicamente dentro del navegador de prueba.
- Capturas: `crm-editor-flujos.png`, `crm-integraciones.png`, `crm-pipeline-escritorio.png`, `crm-pipeline-movil.png`, `crm-conversiones.png`.
- JAR reconstruido con `mvnw clean package` y arrancado con Java 25: Swagger 200, salud 200/UP y conectores sin token 401. Las APIs de campos, conectores y flujos aparecen en OpenAPI. Frontend local en 5173 responde 200.
- La reconstrucción limpia eliminó clases antiguas con rutas `Auth`/`auth` que hacían fallar el JAR aunque el arranque desde clases funcionaba en Windows. Si se reutiliza una salida antigua, ejecutar `clean package` con JDK 25.
- El build advierte sobre bundles grandes de dependencias existentes. La auditoría estática adicional de UI quedó sin resultado por bloqueo de procesamiento; no se declara aprobada.

## Aceptación externa pendiente

1. Configurar las cuentas/credenciales y un dominio público de bajas; realizar sincronizaciones de campañas reales.
2. Probar SMTP, WhatsApp y SMS con un destinatario autorizado y comprobar bajas desde fuera de localhost.
3. Validar login real de los tres roles con Supabase Auth. Las pruebas automatizadas anteriores verifican políticas con JWT de prueba.
4. Publicación en Railway a cargo del usuario. `Dockerfile`, endpoint de salud y `backend_agencia/RAILWAY.md` preparados; la imagen Docker y el despliegue no se ejecutaron aquí.

## Referencias de proveedores

[Autenticación de Google Ads](https://developers.google.com/google-ads/api/rest/auth), [versiones de Google Ads](https://developers.google.com/google-ads/api/docs/release-notes), [GA4 runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport), [WhatsApp Message API](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api), [Twilio Messages](https://www.twilio.com/docs/messaging/api/message-resource), [baja one-click y DKIM](https://www.rfc-editor.org/rfc/rfc8058.html).
