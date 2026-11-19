# Fases finales de la agencia

Actualización v12–v13: el asistente y la ficha contextual de contratos reemplazan la entrada independiente de Entregas y análisis. El material inicial se carga durante el alta. La guía vigente es [CONTRATACION_CONTEXTUAL.md](CONTRATACION_CONTEXTUAL.md); las rutas antiguas aquí descritas conservan redirección de compatibilidad.

## Uso

### 1. Multimedia

Marketing → Entregas y análisis → seleccionar contrato → Materiales → seleccionar anuncio. Subir PNG/JPEG para formato IMAGEN o MP4/WebM para VIDEO, hasta 20 MB. El servidor valida firmas de formato; imágenes hasta 20 megapíxeles. El archivo se almacena en PostgreSQL con su autor y fecha, no en el disco efímero de Render. La previsualización descarga con JWT; las solicitudes por rango permiten reproducción de video. Cada carga conserva una versión nueva. Programados/publicados requieren crear otro anuncio para cambiar el material.

Solicitar aprobación al cliente envía el material al portal sin mandar mensajes ni correos. Reemplazar material invalida las revisiones previas. Si se solicitó revisión, publicar exige aprobación de la versión más reciente. La aprobación interna de Contenido permanece como requisito adicional.

### 2. Alcance contractual

Al crear o editar un borrador de contrato/cotización, seleccionar prestaciones y cantidades: Producción, Edición, Publicación, Análisis, Informes. Solo análisis admite Análisis e Informes. Los límites de Publicación/Análisis controlan el número de anuncios no cancelados; los entregables con prestación no pueden completar cantidades superiores a las acordadas. Producción/Edición habilita las cargas y edición de contenido. Los archivos de revisión no consumen otro entregable: el trabajo realizado se cuenta completando entregables. Los contratos aprobados no se reescriben; usar un contrato nuevo/renovación para renegociar prestaciones.

Compatibilidad: los contratos y cotizaciones existentes reciben cantidades amplias (10000) para las prestaciones de su modalidad. No se interpreta automáticamente texto como «2 videos» ni se restringen contratos activos por migrar. Los nuevos borradores de la UI requieren cantidades explícitas; las escrituras antiguas que no envían prestaciones conservan comportamiento previo. La API anterior sigue operativa.

### 3. Comparaciones

Entregas y análisis → Comparación: seleccionar hasta diez anuncios del mismo contrato, fechas de uno a noventa días sin futuro. Se muestran métricas por anuncio y agregadas por plataforma, y el periodo previo de igual duración. Los porcentajes de variación se calculan contra el periodo anterior; no tener datos o tener base cero produce «—». Las consultas no generan datos ni consumen Mockaroo. Para comparar periodos descargar primero los días requeridos dentro del contrato. No se convierten monedas.

### 4. PDF y versiones

Entregas y análisis → Informes PDF: título, conclusiones y Generar nueva versión PDF. Cada versión guarda una instantánea y el documento; las actualizaciones de métricas o condiciones posteriores no la modifican. La plantilla de Solo análisis se centra en resultados/hallazgos; Difusión e Integral incluyen ejecución y publicaciones. Se excluyen historial interno y trabajos aún pendientes de aprobación del PDF entregable. Publicar para el cliente permite descargar esa versión desde el portal. Crear/publicar no envía emails. Publicación exige gestión; el analista con Contenido puede redactar/generar, no publicar. Las solicitudes llevan UUID idempotente para no generar dos versiones al reintentar.

Los PDF se generan con Apache PDFBox 3.0.8, A4 y tipografía estándar que admite español; caracteres fuera del repertorio de la fuente se sustituyen por `?`. Las pruebas extraen texto y renderizan la salida. Las versiones guardadas no se borran desde la UI.

### 5. Portal

1. Administrador → Gestión de usuarios: crear un usuario con rol **Cliente** (el rol se incorpora mediante v11), usando el mecanismo de cuentas existente. No dar roles internos al cliente.
2. Configuración → Accesos al portal: elegir ese usuario y su empresa, marcar acceso activo y confirmar.
3. Cliente inicia sesión normalmente: el login lo dirige a `/portal`. El portal tiene cierre de sesión propio.
4. Seleccionar contrato: consultar sus condiciones, prestaciones, entregables, publicaciones y resultados agregados.
5. Revisar material: aprobar o solicitar cambios con observación. Las decisiones quedan auditadas y no cambian la segmentación ni publican anuncios reales.
6. Descargar los PDF que la agencia publicó. Borradores internos de informes no son visibles.

Cada consulta valida usuario activo, rol exacto Cliente, acceso vigente y pertenencia de contrato/archivo/PDF a su empresa. Una revocación impide nuevas consultas sin esperar la expiración del JWT. Un usuario Cliente no obtiene módulos internos aunque alguien le agregue permisos CRM. No se crearon usuarios externos ni enviaron invitaciones durante la implementación; cada acceso se asigna explícitamente.

## Despliegue

La migración aditiva `crm-v11.sql` añade cinco tablas con RLS, prestaciones en entregables y el rol Cliente. Se aplicó mediante PrepararCrm a la base configurada. No borra tablas ni perfiles existentes. Si Render usa otra base, ejecutar allí los pendientes antes del nuevo backend. Actualizar backend Java 25 y frontend; el contenedor no ejecuta SQL por sí solo.

No se requieren nuevos tokens. Para multimedia se eleva el límite multipart a 20 MB/21 MB por petición; los adjuntos CRM anteriores mantienen su comprobación específica de 5 MB. No hace falta bucket público ni variables VITE de secretos. Los nuevos archivos requieren JWT y los PDF del portal requieren además publicación.

Reversión: mantener las tablas y los documentos. El código anterior puede seguir leyendo las entidades antiguas; retirar las entradas nuevas del frontend al volver de versión. No borrar archivos o informes para revertir la interfaz.

## Verificación y límites operativos

Resultado final de la implementación: 27 pruebas backend aprobadas (10 de Agencia/PostgreSQL, 6 de Operaciones y 11 de Acceso), 5 de CSV/migraciones y 6 recorridos Edge. La regresión final de navegador se realizó contra `vite preview` de la compilación, evitando reinicios por recarga de desarrollo. ESLint de los archivos frontend afectados, build Vite y JAR Java 25 aprobados. `git diff --check` sin errores. Se inspeccionaron las capturas del portal y la página PDF renderizada. La auditoría premium estricta no terminó en 20 segundos y no se declara aprobada; constancia en `auditoria-ui-fases-finales.json`. Permanecen los avisos de bundles grandes y el lint global previamente documentado fuera de estos cambios.

No se hizo commit, push ni despliegue a Render. Se detuvo el servidor temporal de pruebas; el frontend habitual del usuario no se modificó ni se detuvo. No se crearon usuarios reales de clientes ni se asignaron accesos fuera de transacciones de prueba.

Pruebas transaccionales contra PostgreSQL cubren límites, formatos, descarga parcial de video, invalidación de revisión, aprobación de última versión, aislamiento de dos empresas, publicación de PDF, revocación de acceso, idempotencia, estabilidad de bytes tras cambiar datos, comparación y periodos. El proveedor Mockaroo está controlado; no se envían comunicaciones ni publican anuncios.

Pruebas Edge recorren carga/reintento/previsualización, comparación, PDF/publicación/descarga, asignación de acceso y aprobación del Cliente; el portal se comprueba en móvil y se rechaza su entrada a contratos internos. Se mantienen los recorridos anteriores del CRM. La migración aislada comprueba v1–v11 y 53 tablas CRM con RLS.

La publicación real de anuncios sigue fuera del sistema. El portal no factura ni acredita cobros. Los resultados simulados no crean leads/ventas/consentimientos. El envío automático de invitaciones no está habilitado. Los listados secundarios están acotados (100 versiones, 200 publicaciones/revisiones/entregables, 30 materiales recientes por anuncio); los archivos/versiones anteriores se conservan.
