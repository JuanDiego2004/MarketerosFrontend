# Configuración por canal con datos existentes

El paso 3 conserva el drawer compartido y separa cada canal en objetivo y mensaje, programación y responsable, modalidad e inversión, y audiencia registrada.

## Reutilización

- Audiencias procede del mismo catálogo `segmento_audiencia` que administra el módulo Audiencias. La API de opciones consulta `AdministradorServicio.listar` y conserva sus permisos de lectura.
- Se muestran audiencias activas y se filtran localmente por nombre, descripción, ubicación, criterios e intereses, ignorando tildes y mayúsculas.
- La selección guarda `audiencia_id` y muestra edades, ubicación e intereses. La cobertura se completa desde la audiencia y puede ajustarse para el canal sin editar el catálogo.
- Objetivos combina opciones habituales de marketing con los objetivos existentes de campañas. «Escribir otro objetivo» permite un valor propio; no se fuerza a crear un catálogo separado.
- Los campos del asistente y del plan reutilizan `CampoContrato`, controles nativos y estilos CRM. Los iconos son Lucide React.

## Guardado y compatibilidad

Al confirmar, el servidor comprueba que la audiencia siga activa y que el usuario pueda consultarla, resuelve su nombre desde el catálogo y conserva el ID en la configuración del contrato. Vincula la audiencia con la campaña mediante la operación existente, que exige el permiso de vinculación y evita duplicados.

Los planes pagados nuevos requieren seleccionar una audiencia registrada. El servidor conserva compatibilidad con borradores anteriores que guardaban solo texto y no enviaban `audiencia_id`. En la interfaz se solicita vincular ese texto con un registro antes de continuar.

La difusión orgánica mantiene presupuesto cero. El presupuesto pagado muestra la moneda del contrato. Los borradores conservan el objetivo personalizado, la audiencia elegida y los ajustes de cobertura.

No se requieren tablas ni migraciones nuevas. Es necesario desplegar los cambios del backend en Render para que las opciones incluyan audiencias y objetivos y se creen las relaciones al confirmar.

## Compatibilidad con el backend publicado

La comprobación de Render encontró la audiencia «jovenes», activa, con edades de 14 a 22 años, en el catálogo administrativo. La versión publicada de `/api/crm/agencia/opciones` todavía omitía la propiedad `audiencias`. La interfaz interpretaba ese dato ausente como una lista vacía.

Si las opciones no incluyen el catálogo, el asistente consulta la misma operación `listarModuloAdministrador` utilizada por Audiencias, con la ruta del rol y el mismo token. Conserva la cancelación de lecturas. Un fallo muestra un error recuperable, en lugar de afirmar que no hay audiencias.

«Actualizar audiencias» permite volver a consultar ese catálogo sin cerrar el drawer, reiniciar el formulario ni perder archivos, selección o cobertura. El lector funciona con la versión publicada; la vinculación transaccional incorporada al backend sigue requiriendo desplegar ese código.

## Verificación

- Prueba de navegador: filtrado por interés y ubicación, exclusión de archivadas, objetivo existente y personalizado, cobertura editable, guardado y recuperación del ID, validación y móvil.
- Regresión: 12 pruebas de interfaz CRM y 2 de drawer aprobadas, incluidas opciones antiguas sin catálogo, fallo recuperable y recarga de un catálogo vacío.
- Java 25: pruebas unitarias de ID, nombre canónico, audiencia archivada/inexistente, permisos y compatibilidad.
- Resultado del backend: 15 pruebas unitarias y 3 de integración PostgreSQL aprobadas. La integración comprueba la audiencia vinculada y el nombre/cobertura persistidos; todos sus registros se revierten por transacción.
- ESLint de archivos afectados y compilación de producción aprobados.
- Auditoría estática limitada a 20 segundos: consultar `auditoria-audiencias-contrato.json`; el timeout no representa aprobación.
