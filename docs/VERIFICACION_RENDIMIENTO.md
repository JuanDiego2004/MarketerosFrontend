# Verificación de rendimiento publicitario

18 de noviembre de 2026. Cambios locales; no se hizo commit, push ni despliegue.

| Comprobación | Resultado |
| --- | --- |
| Maven Java 25: CrmMockarooTests, CrmMensajeriaTests, CrmWhatsAppVerificacionTests, CrmPublicidadDemoPostgresTests y CrmEvolucionPostgresTests | 27 pruebas aprobadas; la suite Evolución se repitió tras corregir el manejo de rutas |
| PostgreSQL/MockMvc | Datos de cada prueba con rollback, HTTP y correo controlados; sin mensajes reales |
| `npm run test:crm` | 5 aprobadas; migraciones hasta v8, 40 tablas CRM con RLS |
| `npm run test:crm:ui` | 2 recorridos Edge aprobados: CRM/WhatsApp y rendimiento |
| Edge: recorrido de rendimiento ampliado | Aprobado tras añadir validación de inversión en móvil y ausencia de edición para analista |
| ESLint de los nueve archivos fuente afectados por este flujo | Aprobado |
| `npm run build` | Aprobado; permanece advertencia de tamaño de chunks |
| `mvnw.cmd -q -DskipTests package` con JDK 25.0.4.1 | JAR generado; contiene controlador de rendimiento y SQL v8, sin clases CrmGoogle |
| `git diff --check`, ambos proyectos | Sin errores |
| `designmd lint DESIGN.md` | 0 errores, 4 advertencias de tokens de navegación sin referencia en el documento |
| `npm run lint` global | 6 errores previos: cuatro exportaciones en tablaGlass/funciones.jsx, dos en ContextoAuth.jsx; archivos no modificados por este cambio |
| Auditoría premium estricta | Sin resultado dentro de 20 segundos; no aprobada. Registro en auditoria-ui-rendimiento.json |

El caso financiero valida 270 de pauta importada + 50 adicionales, ingreso de venta ganada 1200 y ROI de 275%. Un gasto histórico de la misma campaña/moneda/fecha no duplica la pauta. El filtro Perú conserva 320 de inversión comercial mientras muestra 30 de pauta publicitaria de ese país. Reintentar el alta con el mismo UUID no duplica el gasto; cambiar sus datos produce conflicto. Anular conserva la fila, reduce el gasto a 270 y rechaza versiones anteriores.

Se verifican carga, vacío, error de conexión/bloqueador, reintento, respuesta inválida, persistencia, caché, validación y foco, permisos, CSV, mapa, gráfico, URL y viewport estrecho. Capturas: publicidad-demo-escritorio.png, publicidad-demo-movil.png y rendimiento-inversion-movil.png. Los nombres de archivos anteriores se conservan para compatibilidad técnica.

No se ha certificado contabilidad, cobros bancarios ni una conexión publicitaria real: Mockaroo sigue siendo la fuente sintética de estadísticas. WhatsApp, Twilio y SMTP conservan sus integraciones y consentimientos. Los ingresos del panel comercial vienen de oportunidades ganadas del CRM.

## Actualizar el entorno publicado

1. La base configurada en este workspace ya tiene v8. Si Render apunta a otra base, aplicar allí las migraciones pendientes hasta v8 antes de desplegar. No repetir SQL sobre grupos completos.
2. Publicar primero el backend actualizado, con Java 25 y las variables Mockaroo del entorno de Render. Conservar las credenciales WhatsApp y su webhook; configurar su versión mediante CRM_WHATSAPP_VERSION. El .env local no modifica Render.
3. Actualizar el frontend. Ahora consulta `/api/crm/rendimiento`; necesita este backend antes de poder usar la pantalla.
4. Abrir Métricas → Rendimiento publicitario, vincular campaña, sincronizar y registrar contactos/oportunidades para obtener el retorno comercial. No es necesario conectar cuentas de anuncios Meta o Google.

Los históricos anteriores permanecen. No se borraron tablas, clientes, campañas ni mensajes. La anulación de inversiones es auditable y las migraciones son aditivas.
