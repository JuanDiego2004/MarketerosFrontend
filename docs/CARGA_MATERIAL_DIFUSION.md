# Material en contratos de difusión

En «Configuración del servicio» (paso 3), los contratos nuevos de difusión e integral muestran la primera pieza y «Subir video» directamente. También se preparan los borradores anteriores que todavía no tenían piezas. Análisis conserva su configuración sin materiales para difundir; las ampliaciones siguen permitiendo añadir únicamente referencias.

Si el cliente entrega el anuncio:

1. Completar título y descripción y seleccionar VIDEO, IMAGEN o CARRUSEL.
2. Seleccionar el archivo y pulsar «Cargar archivos seleccionados». Hasta 20 MB por archivo; video MP4/WebM o imagen PNG/JPEG.
3. Elegir al menos un canal y completar su planificación.
4. Continuar con el alcance y los precios.

Si la agencia creará el material, seleccionar «La agencia lo producirá», mantener «Pendiente de producción», indicar responsable y fecha, y contratar «Producción de piezas» en el alcance. El archivo se entrega posteriormente desde el contrato.

El asistente bloquea el avance del paso 3 si falta cargar el archivo o seleccionar canales y lleva el foco al control correspondiente. Guardar borrador sigue permitiendo datos incompletos. Cambiar de servicio conserva su configuración anterior; seleccionar una cotización aplica la misma regla para evitar piezas incompatibles con análisis. El backend mantiene su validación y autorización.

La revisión de la base configurada encontró vacíos los catálogos tras el borrado manual. Se aplicó `backend_agencia/scripts/restaurar-catalogos-contratacion.sql`: tres servicios y un canal activo de configuración. No se añadieron empresas ni campañas. El script conserva los registros existentes y admite repetición.

## Verificación

- Prueba de regresión: antes del cambio no aparecía «Subir video» sin «Agregar contenido».
- Navegador con API interceptada: carga MP4, error y reintento; recuperación de borrador vacío y con archivos; validación de material y canales; difusión, análisis desde cotización, integral y ampliación.
- Drawer compartido: teclado, foco, cierre, cambios pendientes, error/reintento y móvil.
- SQL en PostgreSQL local embebido: restauración idempotente y conservación de configuración personalizada.
- ESLint de archivos modificados y compilación de producción.
- Resultado: 8 pruebas de interfaz CRM, 2 del drawer y 1 del script de catálogos aprobadas.
- Auditoría estática: consultar `auditoria-carga-difusion.json`; un timeout no representa aprobación del auditor.

Las pruebas del navegador comprueban el flujo con respuestas controladas; no publican anuncios ni crean contratos en la base remota.
