# Estadísticas iniciales del contrato

## Comportamiento

La confirmación del asistente guarda el contrato mediante la transacción existente y luego llama a `CrmEstadisticasIniciales`. Cuando Mockaroo responde, «Anuncios y publicaciones → Ver estadísticas» puede mostrar impresiones, clics, conversiones, inversión, CTR, CPC, CPM, evolución y países.

La carga inicial se permite también en Difusión y en contratos o anuncios en borrador. No activa el contrato ni publica el anuncio. Las aprobaciones y la ejecución editorial conservan su flujo.

Se solicitan hasta los últimos siete días dentro de la vigencia y hasta la fecha actual de Lima. Si el contrato inicia en el futuro, se informa esa situación y se espera a su vigencia. No se generan datos anteriores al inicio ni posteriores al fin.

## Persistencia y errores

- Reutiliza `crm_anuncio_metrica` y `crm_contrato_evento`; no hay migraciones nuevas.
- Genera solo días incompletos. La clave anuncio/fecha/país y `ON CONFLICT DO NOTHING` conservan los registros existentes.
- Los anuncios orgánicos mantienen inversión cero.
- Los lotes de Mockaroo no superan 990 filas por descarga, dentro del máximo de 1000 filas indicado para la cuenta. El proveedor recibe solo el esquema numérico y la cantidad de filas.
- Una respuesta incompleta se rechaza antes de guardar. Las filas se insertan juntas en una transacción separada de la creación del contrato.
- Si falla el proveedor, el contrato sigue creado. La vista rápida muestra el fallo y permite «Reintentar estadísticas», sin exigir otra creación ni una publicación previa.
- Sin filas, la interfaz muestra «sin datos» y la acción correspondiente; no dibuja tarjetas de cero como si fueran resultados.
- Si existen datos fuera del periodo consultado, «Ver periodo con estadísticas» permite consultarlos sin regenerarlos.

La configuración conserva los IDs de piezas, contenido, canales y referencias vinculados al confirmar, para que la revisión editorial y la modalidad por anuncio compartan la misma fuente.

## Despliegue y comprobación

El backend actualizado debe desplegarse en Render para que los próximos contratos ejecuten automáticamente la carga. Mockaroo usa las variables ya existentes `CRM_MOCKAROO_HABILITADO` y `CRM_MOCKAROO_API_KEY`; la clave nunca pasa al navegador.

Se cargó el contrato CTR-5 de la solicitud mediante la nueva operación, usando Mockaroo real. Render pudo leer 18 filas entre el 18 y el 19 de noviembre de 2026: nueve países y dos días. Se verificaron impresiones y clics positivos, CTR y datos para el mapa. No se cambiaron los estados del contrato ni de sus anuncios.

Pruebas: 19 unitarias del backend y 18 de integración PostgreSQL aprobadas; las pruebas de base se revierten por transacción. También pasaron 15 pruebas de interfaz CRM, 2 de drawer, ESLint de los archivos afectados y la compilación. Se verificaron creación con datos, reintento, idempotencia, inversión orgánica cero, lotes desordenados y límites de descarga.

La auditoría estática agotó su límite de 20 segundos: `auditoria-estadisticas-iniciales.json`. No se presenta como aprobada.
