# Rendimiento publicitario con Mockaroo

Actualizado: 18 de noviembre de 2026. El nombre de este archivo se conserva para enlaces anteriores. El modelo vigente se describe en [MODELO_PRODUCTO_MARKETING.md](MODELO_PRODUCTO_MARKETING.md).

Mockaroo genera estadísticas sintéticas para este proyecto universitario. Meta, TikTok y YouTube identifican plataformas asociadas a la campaña; no se consultan sus API ni se publican anuncios. La interfaz usa lenguaje de negocio y muestra **Fuente: Mockaroo**. La procedencia se mantiene en la API y la base de datos.

## Configuración

En el `.env` privado del backend o Environment de Render:

```dotenv
CRM_MOCKAROO_HABILITADO=true
CRM_MOCKAROO_API_KEY=tu_clave_privada
```

Reiniciar el backend con Java 25 y actualizar también el frontend. El `.env` local no configura Render. La clave no se envía al navegador ni se coloca en variables `VITE_*`. El backend envía únicamente un esquema numérico al destino fijo `https://api.mockaroo.com/api/generate.json`, con `X-API-Key` y User-Agent de aplicación. No se necesita crear un esquema en la web de Mockaroo ni transmitir clientes, teléfonos o correos.

Aplicar las migraciones aditivas v7 y v8 después de v1–v6. El auxiliar `scripts/PrepararCrm.java --aplicar` identifica los grupos pendientes. v7 conserva las tablas internas `crm_publicidad_demo` y `crm_publicidad_demo_metrica`; v8 añade `crm_inversion`. No se renombran ni borran históricos. La base configurada en este workspace ya tiene v8. Docker no aplica SQL al arrancar.

## Uso

1. Registrar una empresa y una campaña interna.
2. Abrir **Resultados → Métricas e indicadores → Rendimiento publicitario**.
3. Como administrador, usar **Vincular campaña**, elegir campaña, plataforma y moneda. La referencia se genera como `META-123`, sin un ID publicitario real.
4. Elegir entre 1 y 90 días y pulsar **Sincronizar estadísticas**.
5. Consultar indicadores, gráfico y mapa; filtrar por país o exportar CSV.
6. Registrar gastos adicionales, como producción audiovisual. No duplicar la pauta importada.
7. Registrar contactos con origen de campaña y oportunidades comerciales. Al cerrar una oportunidad como ganada, su importe participa en ingresos, ROAS y ROI dentro del período de cierre.

Lectura: permiso CRM de Atribución. Vincular, sincronizar y gestionar inversiones adicionales: gestión de Integraciones, reservada al administrador. La API aplica los mismos permisos. Los errores conservan los resultados anteriores y permiten reintentar.

## Persistencia y límites

Nueve países y hasta 90 días producen **810 filas**, por debajo de las 1000 filas por descarga del plan indicado por el usuario. Solo se solicitan días faltantes. Consultar, filtrar y recargar no consume Mockaroo. Se valida cantidad de filas, identificadores y rangos antes de guardar el lote. Una respuesta inválida no guarda parciales. Dos sincronizaciones simultáneas pueden consumir dos solicitudes, pero no duplican filas ni sobrescriben históricos.

Las conversiones de plataforma no crean contactos, consentimientos ni ventas. El CSV publicitario incluye proveedor, plataforma, moneda y métricas; no presenta el ingreso generado por Mockaroo como venta del CRM. Las divisas se mantienen separadas.

El gráfico y mapa filtran estadísticas de la plataforma seleccionada. Los puntos son representativos por país, no posiciones individuales. Geometría local Natural Earth de dominio público, sin teselas externas. El resumen comercial abarca la campaña interna completa, en la moneda y período seleccionados; país no altera ese resumen.

## Compatibilidad y reversión

El frontend usa `/api/crm/rendimiento`. Se conservan `/api/crm/demostracion` y `/api/crm/publicidad-demo` como alias autorizados. La ruta neutra reduce falsos positivos de bloqueadores. `ERR_BLOCKED_BY_CLIENT` es un bloqueo del navegador, no un fallo de clave; el cliente ofrece diagnóstico y reintento.

Los conectores Meta Ads, Google Ads y GA4 se retiraron. Sus datos históricos permanecen para atribución. WhatsApp Cloud, Twilio y SMTP se conservan; WhatsApp usa `CRM_WHATSAPP_VERSION`, con compatibilidad del antiguo valor de versión.

`CRM_MOCKAROO_HABILITADO=false` detiene nuevas descargas y conserva la lectura. Revertir código no exige borrar las tablas aditivas. No restaurar credenciales de conectores publicitarios retirados para operar esta versión.

## Verificación

PostgreSQL/MockMvc con rollback comprueba permisos, persistencia, caché por día, filtros, lotes inválidos, atribución de ventas ganadas, gastos adicionales, idempotencia y anulación versionada. El caso financiero incorpora 270 de pauta, 50 adicionales y una venta ganada de 1200: inversión 320 y ROI 275%; filtrar Perú no cambia el total comercial. El gasto histórico del mismo día no se cuenta de nuevo.

Edge comprueba vinculación, validación/foco, errores y recuperación, sincronización, registro/anulación de inversión, gráfico, mapa, filtros, URL, CSV, móvil y lectura. El otro recorrido conserva contactos, pipeline, flujos y WhatsApp. Migraciones incluye v8 y 40 tablas CRM con RLS. Las capturas conservan sus nombres internos `publicidad-demo-escritorio.png` y `publicidad-demo-movil.png`.

Mockaroo se comprobó con una descarga real de nueve filas antes de esta transición; no se repite en cada prueba. Las regresiones usan HTTP controlado. La auditoría estática adicional premium no produjo resultado en 20 segundos y no se declara aprobada. No se desplegaron estos cambios en Render.

Referencias: [API Mockaroo](https://www.mockaroo.com/docs), [licencia Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/).
