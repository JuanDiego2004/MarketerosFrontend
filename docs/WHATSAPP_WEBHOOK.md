# WhatsApp en el CRM: recepción y entrega

Actualizado: 17 de noviembre de 2026. Esta integración guarda respuestas de contactos y confirmaciones verificadas de Meta. Los envíos siguen saliendo de las automatizaciones existentes.

## Configuración del backend

Completar en `.env` de `backend_agencia` para ejecución local, o en **Environment** del servicio de Render para el backend desplegado:

```dotenv
CRM_WHATSAPP_PHONE_ID=identificador_del_numero_configurado_en_meta
CRM_WHATSAPP_TOKEN=token_de_acceso_con_permiso_de_mensajeria
CRM_WHATSAPP_APP_SECRET=secreto_de_la_app_meta_que_recibe_el_webhook
CRM_WHATSAPP_VERIFY_TOKEN=cadena_aleatoria_propia_de_32_a_256_caracteres
CRM_PUBLIC_URL=https://dominio-publico-del-backend
```

- `APP_SECRET`: está en Meta Developers → tu app → Configuración de la app → Básica. Es el secreto de la app que tiene conectado el número de WhatsApp.
- `VERIFY_TOKEN`: lo eliges tú, con 32–256 caracteres aleatorios. No es el token de acceso de WhatsApp ni el secreto de la app. Se coloca exactamente igual en Meta y en el backend.
- `PHONE_ID`: es el Phone Number ID, no el teléfono ni el ID de la cuenta de mensajes. Esta implementación recibe los eventos del único número configurado en esa variable.
- No pegar secretos en capturas, chats, variables `VITE_*` o el repositorio. El ejemplo `.env.crm.example` solo contiene nombres y comentarios.

Para generar el token de verificación en tu PowerShell local puedes ejecutar:

```powershell
$crmBytes = New-Object byte[] 32
$crmRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$crmRng.GetBytes($crmBytes)
[BitConverter]::ToString($crmBytes).Replace('-', '').ToLowerInvariant()
$crmRng.Dispose()
```

Copia el resultado al entorno donde corre el backend y al campo de Meta. El `.env` local no configura Render: allí debes guardar las variables en **Environment** y desplegar/reiniciar el servicio. Para recepción, también se necesitan el secreto y el identificador del número; el token de acceso por sí solo no configura el webhook.

## Configuración en Meta

1. Publicar el backend con HTTPS válido. Meta no puede acceder a `localhost`.
2. Abrir Meta Developers → app de WhatsApp → Casos de uso → Personalizar → Configuración (o WhatsApp → Configuración, según el panel).
3. En **Callback URL / URL de devolución**, pegar:

   ```text
   https://dominio-publico-del-backend/api/webhooks/whatsapp
   ```

4. En **Verify token / Token de verificación**, pegar el valor de `CRM_WHATSAPP_VERIFY_TOKEN`.
5. Pulsar **Verificar y guardar** y suscribir el campo **messages** para la cuenta de WhatsApp conectada a esa app.
6. Verificar con un mensaje real del destinatario autorizado al número configurado. Para el número de prueba, utilizar destinatarios habilitados por Meta.

Registrar un número real, preparar plantillas y configurar facturación/verificación según los requisitos que Meta muestre para la cuenta siguen siendo pasos del proveedor. Un token del panel de prueba caduca; para el uso continuo, emplear el token de usuario del sistema apropiado.

El GET de verificación requiere únicamente `CRM_WHATSAPP_VERIFY_TOKEN` y responde con el desafío exacto cuando coincide el token. Meta envía los parámetros `hub.mode=subscribe`, `hub.verify_token` y `hub.challenge`. Abrir la URL sola en el navegador devuelve 400 cuando ese token ya está configurado: no comprueba la suscripción. Un token configurado vacío o fuera de 32–256 caracteres devuelve 503; un token recibido distinto devuelve 403.

Los POST siguen exigiendo el identificador del número, el secreto de la app y el token de verificación configurados, además de `X-Hub-Signature-256`, calculada por Meta usando el secreto de la app y el cuerpo original. Configuración incompleta devuelve 503 indicando los nombres de las variables pendientes, sin sus valores; una firma incorrecta devuelve 403. No requiere JWT de Supabase para el endpoint de Meta; las pantallas de consulta sí requieren sesión y permisos CRM.

Esta separación y los mensajes específicos requieren desplegar la actualización del backend. Si Render sigue devolviendo el mensaje genérico «Configura el webhook de WhatsApp en el backend», aún está ejecutando la versión anterior.

## Dónde verlo

- **Configuración → Integraciones → Recepción y entrega de WhatsApp**: administrador consulta mensajes y estados; ve la URL del webhook y la fecha del último evento guardado. «Credenciales configuradas» no certifica que la suscripción de Meta esté activa.
- El filtro inicial muestra mensajes sin contacto. Desmarcarlo muestra todos los recibidos, con paginación de 20.
- **Vincular contacto** permite asociar o corregir la asociación de un mensaje, con confirmación, auditoría y control de versión. No cambia otros mensajes ni concede consentimiento.
- **Ficha de contacto → Resumen → Mensajes recibidos por WhatsApp**: lectura para los roles que ya tienen permiso de consultar ese contacto. Actualizar WhatsApp consulta de nuevo el backend.
- **Automatizaciones → Editor visual → Ver pasos**: estado de entrega verificado, fecha y código de error cuando Meta lo proporciona. El estado del paso y el estado de entrega se muestran por separado.

## Reglas del registro

- Al recibir un mensaje, se busca un contacto existente por el teléfono internacional exacto. No se modifica su nombre, responsable, datos o consentimiento.
- Remitentes desconocidos o identificados solo por el BSUID de WhatsApp quedan pendientes de vincular; no se crean leads automáticamente ni se infiere su teléfono.
- Se guardan texto, respuestas de botones/listas, reacciones y títulos de contenido multimedia. No se descargan archivos ni se ejecutan enlaces o contenido del remitente. Tipos sin texto muestran una descripción del tipo; el texto se limita a 10000 caracteres y se indica si fue truncado.
- La misma combinación número del negocio + ID de mensaje se guarda una vez, aunque Meta reintente. Repetir el evento no altera una vinculación manual posterior.
- Los estados `sent`, `delivered`, `read`, `failed` conservan su propio historial. Una lectura confirmada prevalece sobre una entrega, fallo o envío que lleguen después fuera de orden; una entrega prevalece sobre un fallo, y un fallo sobre solo enviado. No se inventan fechas o estados intermedios.
- El estado se conserva aunque el webhook llegue antes de que termine la llamada de envío del CRM. Al quedar registrado el ID del proveedor, se asocia con su confirmación guardada.
- Los envíos previos a esta migración no tenían instantánea del número remitente y pueden quedar sin seguimiento. No se atribuyen automáticamente a otro número.
- Las estadísticas cuentan una vez cada envío de los últimos 30 días por su estado verificado más avanzado. «Sin confirmación» no significa entregado o fallido. Estados de mensajes ajenos a un envío del CRM no incrementan esos contadores.
- El webhook no envía respuestas, no reintenta mensajes salientes ni cambia retroactivamente las ramas de un flujo. No es un cliente completo de WhatsApp; integra la recepción y la trazabilidad con el CRM.

## Datos y operación

`crm-v6.sql` añade dos tablas con RLS, una vista con `security_invoker`, índices y columnas opcionales para rastrear el número/destinatario de los envíos. Conserva los registros y estados anteriores de `crm_envio`. Los mensajes vinculados se eliminan al eliminar su contacto, mediante FK con cascada.

Los mensajes sin vincular permanecen en la bandeja administrativa hasta que se vinculen; esta entrega no incluye una política automática de borrado por antigüedad. Los estados de proveedor conservan solo IDs, estado, fecha y código de error, sin cuerpos de mensajes ni respuestas completas del proveedor.

Aplicar mediante `scripts/PrepararCrm.java --aplicar` con el driver PostgreSQL y JDK 25, siguiendo la secuencia de migraciones. El auxiliar omite grupos ya presentes y detiene esquemas parciales. No repetir manualmente las migraciones sobre tablas existentes.

Reversión: quitar la suscripción/callback en Meta antes de volver a un backend anterior; mantener las tablas para conservar datos y volver a activar después sin duplicados. Detener las automatizaciones antes de revertir el código de envío.

## Comprobaciones

Se verifican firma sobre bytes originales, desafío GET, límite de 3 MB, fallo cerrado sin secretos, número distinto ignorado, deduplicación, remitente sin teléfono, permisos y vinculación versionada sin consentimiento automático. Las pruebas simulan Meta y no envían comunicaciones reales. La activación contra Meta requiere el dominio y los secretos propios del usuario.

La corrección de verificación completó tres pruebas aisladas y tres pruebas de integración PostgreSQL/MockMvc. Comprueban que el GET funciona sin credenciales de recepción, que el POST continúa bloqueado sin secreto, que el desafío se devuelve sin cambios y que los tokens faltantes o distintos producen el diagnóstico correspondiente.

La clase de evolución completó 10 pruebas Spring Boot/MockMvc contra PostgreSQL con rollback. También pasaron el lint CRM, el build Vite, las 5 pruebas CSV/migraciones y la prueba Edge de ficha, bandeja, conflicto de vinculación, estados verificados y viewport estrecho. La primera ejecución sufrió una interrupción de red; la repetición pasó. Capturas: `crm-whatsapp-escritorio.png` y `crm-whatsapp-movil.png`.

La auditoría estática adicional de UI volvió a bloquearse sin producir resultado y se interrumpió; no se declara aprobada. Las comprobaciones de navegador y compilación anteriores sí se ejecutaron.

Se comprobó el JAR Java 25 actualizado: salud 200/UP, Swagger 200, bandeja sin sesión 401 y webhook presente en OpenAPI. Con la configuración local del webhook incompleta, la verificación pública respondió 503 como se esperaba. Frontend disponible en 5173. El arranque de comprobación mantiene desactivadas las automatizaciones programadas; no se enviaron mensajes reales ni se configuró la suscripción en Meta.

Referencias: [crear el webhook y validar su firma](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint), [eventos, reintentos y BSUID](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview), [tokens de acceso](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/).
