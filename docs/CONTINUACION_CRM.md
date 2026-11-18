# Continuación CRM — 17 de noviembre de 2026

El estado final de esta continuación está en [CIERRE_FASES_CRM.md](CIERRE_FASES_CRM.md), con configuración y pruebas de todas las fases. La recepción y estados verificados de WhatsApp están en [WHATSAPP_WEBHOOK.md](WHATSAPP_WEBHOOK.md).

## Entregado

- Catálogo relacional de etiquetas, colores y asignación desde la ficha. Los contactos y CSV anteriores siguen funcionando.
- Varias interacciones por contacto: campaña, canal, fecha y UTM. POST con UUID de idempotencia impide duplicados al reintentar.
- Webhooks autenticados registran una nueva interacción de un contacto existente sin cambiar nombre, teléfono, responsable ni consentimiento. Formularios públicos duplicados no modifican fichas.
- Atribución de ingresos por primer origen, último origen o reparto lineal. Solo cuentan interacciones anteriores al cierre. Los ingresos se conservan entre campañas y monedas; LINEAL usa ventas equivalentes fraccionarias.
- Historial de movimientos del pipeline con autor, fecha e instantánea de la etapa. La edición sin cambio de etapa no duplica movimientos.
- Cohortes históricas con porcentaje de etapas alcanzadas y conversión entre pasos observados. Las oportunidades anteriores a la migración se identifican como línea base y quedan fuera de las tasas de historia completa.
- Reportes incorpora la pestaña de ingresos; modelo y fechas se mantienen al filtrar y se incluyen en el CSV.
- Enlace de baja en cada email. GET no revoca; POST revoca consentimientos de marketing/email y guarda una supresión persistente. No requiere login y no expone el correo ni la ficha. La confirmación responde de forma genérica para tokens desconocidos.
- La supresión prevalece incluso si alguien agrega un consentimiento después. Reactivar suscripciones dadas de baja no se implementa automáticamente.

## Migración y compatibilidad

Las migraciones hasta crm-v6.sql se aplicaron en la base configurada (37 tablas CRM). La migración crm-v3.sql es aditiva: agrega cinco tablas y funciones/triggers. No elimina etiquetas de texto, columnas ni tablas anteriores. No volver a ejecutar manualmente sobre la misma base.

La secuencia fue expandir, migrar los valores existentes, verificar conservación y utilizar las relaciones nuevas. La columna crm_contacto.etiquetas se conserva como contrato de escritura compatible: tanto un cliente anterior como el nuevo disparan la sincronización transaccional. La API de asignación actualiza ese contrato. La eliminación de contactos elimina también sus relaciones, orígenes, tokens y supresiones mediante FK/cascada.

El backfill del pipeline registra solo su estado conocido en el momento de migrar, marcado linea_base=true. No reconstruye ni inventa fechas/transiciones previas. Los movimientos posteriores se guardan automáticamente, incluso desde un escritor anterior; si el escritor no informa actor, queda desconocido.

En contactos antiguos sin orígenes se recuperó la campaña principal anterior con canal MIGRACION y la fecha de creación del contacto. Es un dato inferido del registro anterior, no evidencia de una visita o clic ocurrido en esa fecha. No se reconstruye seguimiento web retroactivo.

Reversión operativa: desactivar CRM_AUTOMATIZACIONES_HABILITADAS y bloquear también ejecuciones manuales/envíos antes de volver a un backend antiguo. Mantener las tablas y el trigger de etiquetas permite lecturas/escrituras antiguas sin pérdida. Un sender anterior no conoce las supresiones nuevas: no se debe volver a habilitar correo con él. No se proporciona un DROP destructivo; retirar columnas o historial requiere una migración posterior autorizada.

## Correo y proveedores

Para la aceptación externa, la fase 5 necesita las variables Meta/Google/SMTP/WhatsApp/Twilio y CRM_PUBLIC_URL documentadas en .env.crm.example. Se comprobó que esas variables no estaban añadidas al .env local en esta continuación. No se contactó Meta ni se enviaron correos reales.

CRM_PUBLIC_URL debe ser la dirección HTTPS pública del backend; localhost no sirve para que un destinatario externo pueda darse de baja. Los enlaces contienen un token aleatorio de 256 bits, cuyo hash se guarda en la base; no se registra el token en mensajes de error. La respuesta impide caché y envío de Referer.

La baja por enlace funciona con confirmación. CRM_SMTP_ONE_CLICK=false es el valor inicial. Habilitarlo solo cuando el proveedor firme con DKIM List-Unsubscribe y List-Unsubscribe-Post. El endpoint admite POST sin cookies/autenticación y devuelve 200 sin redirección. La referencia de protocolo es [RFC 8058](https://www.rfc-editor.org/rfc/rfc8058.html). La comprobación con el proveedor sigue pendiente.

## Verificación

- Java 25: 25 pruebas CRM aprobadas, incluyendo MockMvc con administrador/líder/analista sobre PostgreSQL real, tareas propias, aprobación, atribución entre dos campañas aisladas, idempotencia, transiciones, supresión de emails y exportaciones CSV con saltos de línea seguros.
- Las pruebas de API usan JWT decodificados de prueba y SMTP simulado. Los usuarios, roles, campañas y contactos temporales se crean dentro de transacciones con rollback. No se crean cuentas de Supabase Auth ni se envía correo.
- PostgreSQL embebido verifica migraciones v1–v5, RLS, FK, compatibilidad con etiquetas anteriores, sincronización desde el escritor antiguo y líneas base.
- Edge verifica etiquetas, interacciones, filtros de atribución dentro de Reportes, arrastre con confirmación del pipeline, foco y viewport estrecho. La API está simulada solo en el contexto de prueba del navegador.
- Build Vite y lint CRM/navegación. La auditoría estática adicional del proyecto sigue sin resultado completo por el bloqueo de procesamiento ya documentado.

## Pendientes reales

1. Configurar y probar Meta Ads y SMTP con las cuentas y un destinatario autorizado del usuario.
2. Validar el login real de los tres roles desde el navegador con Supabase Auth; las pruebas actuales verifican políticas/API con JWT de prueba.
3. Configurar Google Ads, GA4, WhatsApp Cloud y Twilio SMS y verificar sus cuentas reales. Los conectores, el editor visual y los campos personalizados ya están implementados y probados con proveedores simulados.
4. Railway queda a cargo del usuario. No se implementa resuscripción automática de contactos dados de baja.

Los reportes describen el CRM: ingresos de oportunidades actualmente ganadas, no un libro contable de facturas, cobros, devoluciones o anulaciones históricas.
