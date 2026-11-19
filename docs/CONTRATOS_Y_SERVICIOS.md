# Contratos y servicios de agencia

Actualización v12–v13: el alta se realiza con el asistente específico del servicio y la operación continúa en la ficha del contrato. Materiales, comparación y PDF están en esa ficha; `/entregas` redirige. El recorrido vigente se describe en [CONTRATACION_CONTEXTUAL.md](CONTRATACION_CONTEXTUAL.md). Las secciones v10/v11 siguientes se conservan como referencia histórica.

Implementación de la propuesta funcional del 18 de noviembre de 2026. La fuente publicitaria es Mockaroo; no se publican anuncios en redes. WhatsApp, SMTP y SMS conservan su funcionamiento independiente.

## Recorrido

1. Registrar la empresa una sola vez en Clientes / Empresas.
2. Crear una cotización, enviarla a revisión y aprobarla.
3. Crear un contrato y seleccionar la cotización aprobada para recuperar sus condiciones; revisar el alcance, fechas, precios, plataformas y responsable.
4. Enviar el contrato a revisión, aprobarlo y activarlo.
5. Crear una campaña existente en el módulo Campañas para la misma empresa y usar Vincular campaña en el contrato.
6. Crear una cuenta publicitaria y registrar anuncios vinculados al contrato, cuenta y campaña.
7. Gestión/difusión e integral: crear contenido en Contenido y aprobaciones, aprobarlo y asociarlo al anuncio. Enviar anuncio a revisión, aprobar, programar y Simular publicación cuando llegue su fecha.
8. Solo análisis: registrar el anuncio de referencia; queda como Externo simulado y no admite publicación ni edición.
9. Seleccionar fechas dentro del contrato y usar Actualizar datos simulados. Ver estadísticas muestra indicadores, evolución diaria, mapa y detalle por país.
10. Registrar entregables, recomendaciones, informes y ajustes. Aprobar y completar los trabajos. Informe y avance reúne condiciones, gasto, anuncios, trabajos e historial; exporta un archivo de texto legible.
11. Finalizar el contrato. Crear otro contrato aprobado para la misma empresa y Registrar renovación en el anterior.

## Tres escenarios listos para recorrer

Como administrador, en Contratos pulsar **Preparar tres escenarios de demostración** y confirmar. Crea Comercial Andina / Difusión, Calzados del Valle / Análisis y Café Mantaro / Integral, con empresa, cotización aprobada, contrato activo, campaña, cuenta, anuncio y entregable relacionados. Repetir no duplica los escenarios. No descarga estadísticas ni envía mensajes: abrir cada anuncio, elegir fechas y actualizar con la clave Mockaroo configurada. La preparación requiere al menos una campaña con canal registrado en la base.

## Reglas y datos

En Informes por contrato, seleccionar el contrato consulta directamente su informe de resultados, sin crear un registro manual ni llamar a Mockaroo. Incluye los totales de todos sus anuncios/países, indicadores calculados sobre esos totales, evolución diaria y exportación de resultados. Los informes redactados (conclusiones y hallazgos) se listan aparte. Cuando no hay estadísticas descargadas se muestra una indicación específica. Cambiar de contrato cancela la consulta previa; un error permite reintentar sin perder la selección.

Regresión de esta corrección: dos pruebas PostgreSQL con rollback aprobadas (totales, aislamiento entre contratos, lectura del analista y gastos), recorrido Edge de informes aprobado (selección sin informes manuales, reintento, cambio, estado sin estadísticas, exportación, móvil y cero escrituras), recorrido de servicios existente aprobado, ESLint y compilación Vite aprobados. JAR Java 25 actualizado. No requiere SQL nuevo ni volver a descargar estadísticas. La captura `informes-resultados-contrato.png` documenta el resultado.

- Empresa única; campaña vinculada a un solo contrato. Las empresas históricas no se duplican por migrar.
- El código de cuenta/anuncio identifica únicamente un registro del catálogo local. Buscar un ID desconocido deja la lista sin resultados; no inventa métricas.
- Solo análisis impide editar anuncios, contenido y campañas vinculadas, o registrar gastos adicionales publicitarios. Las recomendaciones y reportes no modifican anuncios.
- Los contratos aprobados conservan sus condiciones. Ajustes requieren aprobación y completado; su importe incrementa el presupuesto autorizado. No representa gasto ejecutado ni cambios de audiencia externos.
- Honorarios, precio de producción y presupuesto se almacenan separados. Monedas PEN/USD separadas, sin conversión implícita. La modalidad orgánica exige presupuesto pagado cero y sus métricas tienen gasto cero.
- Un contrato detalla condiciones y frecuencia en texto; desde v11 incorpora prestaciones y cantidades estructuradas. Los entregables representan unidades concretas con cantidad y estados. No hay facturación recurrente.
- Cada anuncio tiene estadísticas propias persistidas por día/país. Se reutiliza CrmMockarooServicio, con máximo 810 filas por solicitud de 90 días. Consultar no descarga nuevamente. No se mezclan estos datos con las estadísticas agregadas antiguas ni con ventas ganadas; así no se duplica pauta. La vista anterior de rendimiento permanece disponible para los históricos.
- Los ingresos estimados del dataset se identifican como tales, sin convertirlos en ventas, leads o consentimientos. Las ventas de la agencia no se añaden a la atribución del cliente.
- Alertas del informe: gasto mayor o igual al 80 % del presupuesto y finalización dentro de 15 días o vencida. Recomendaciones son manuales, no predicciones automáticas.
- Calendario editorial es agenda por fecha, filtrada por contrato y paginada; no ejecuta publicaciones programadas en segundo plano.
- Los materiales usan Contenido y, desde v11, almacenamiento privado de imágenes/videos con aprobación por versión. Notas y adjuntos existentes continúan disponibles. No hay publicación multimedia externa.
- Desde v11 existe un portal privado con rol Cliente y asignación administrativa de empresa, sin conceder módulos internos.

## API y permisos

Base `/api/crm/agencia`: opciones; listas paginadas; POST/PUT de cotizaciones, contratos, cuentas-publicitarias, anuncios, entregables, recomendaciones, ajustes e informes; transiciones `/:recurso/:id/estado`; vínculos `/contratos/:id/campanas`; informe `/contratos/:id/informe`; estadísticas `/anuncios/:id/metricas`; sincronización POST `/anuncios/:id/sincronizar`; escenarios POST `/escenarios`; catálogo PUT `/catalogo/:codigo`.

Se reutilizan permisos vigentes: Atribución para consulta, Cuentas para gestión, Contenido para redactar informes/recomendaciones, Campos para catálogo y administrador/Integraciones para escenarios. El líder no obtiene administración de usuarios; el analista no obtiene gestión de contratos o anuncios. Las escrituras registran auditoría y rechazan versiones obsoletas. No hay eliminación física de contratos desde la nueva UI.

## Migración y despliegue

`crm-v10.sql` añade siete tablas con RLS y los tres servicios iniciales. Aplicada en la base configurada del workspace mediante PrepararCrm con Java 25. Conserva los datos y migraciones anteriores. Si Render utiliza otra base, aplicar allí v10 antes de publicar. Docker no ejecuta SQL automáticamente.

Actualizar backend Java 25 y frontend. No se hizo commit, push ni despliegue. No se publicaron anuncios, enviaron mensajes ni descargaron datos reales de Mockaroo durante las pruebas. Para una reversión conservar las tablas y el histórico; los módulos anteriores siguen disponibles. No borrar registros para volver a una interfaz anterior.

## Verificación

Las pruebas PostgreSQL con rollback cubren contratos/precios/versiones/permisos, restricciones de análisis, relaciones cruzadas, aprobación/publicación, métricas por anuncio y caché, ajuste autorizado y escenarios idempotentes. El proveedor se controla en pruebas. El recorrido Edge cubre formulario, validación/foco, error/reintento, aprobación, informe, anuncio de análisis sin edición/publicación y viewport estrecho. La prueba aislada ejecuta migraciones v1–v10 y comprueba 48 tablas CRM con RLS. Ver resultados finales de ejecución en la entrega.

Resultado final: 22 pruebas backend aprobadas (6 de servicios, 11 de acceso y 5 de rendimiento), 5 pruebas CSV/migración y los 4 recorridos Edge aprobados. ESLint de los archivos frontend afectados y compilación Vite aprobados; Maven generó el JAR con Java 25. `git diff --check` sin errores. La auditoría premium estricta no terminó dentro de 20 segundos, registrada en `auditoria-ui-servicios.json`; no se declara aprobada. Permanecen las advertencias anteriores de tamaño de bundles y los errores globales de lint ya documentados fuera de estos archivos. Las capturas de contrato/informe y formulario móvil se inspeccionaron visualmente.
