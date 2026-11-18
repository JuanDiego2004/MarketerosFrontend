# Guardado de etiquetas del contacto

18 de noviembre de 2026.

Se reprodujo en Edge con API simulada: escribir «Interesado» en Gestionar etiquetas y pulsar Guardar cerraba el diálogo sin crear ni asignar ninguna etiqueta. La regresión falló con 0 asignaciones en lugar de 1.

RelacionesContacto ahora crea o reutiliza el nombre escrito al guardar y lo incluye en la asignación. Crear y seleccionar sigue preparando varias etiquetas antes de confirmar. Las etiquetas se conservan seleccionadas si falla la asignación; reintentar no vuelve a crearlas. Abrir el diálogo descarta el nombre de un borrador anterior. Se mantienen API, permisos y sincronización del backend con segmentos.

Validación:

- Prueba Edge `tests/crm-navegador.test.mjs`: aprobada. Comprueba guardado directo, persistencia tras recarga, reutilización por nombre, creación explícita, error de asignación, recuperación y viewport de 390 px. La API de esta prueba está simulada; no modifica contactos reales.
- `npm run test:crm`: cinco pruebas aprobadas, incluida sincronización relacional de etiquetas por migraciones en PostgreSQL aislado.
- `npm run build`: aprobado; advertencia existente por tamaño de paquetes.
- ESLint de `RelacionesContacto.jsx`: aprobado.
- `npm run lint`: seis errores en archivos no modificados por esta corrección (`tablaGlass/funciones.jsx` y `ContextoAuth.jsx`).
- Auditoría estática adicional de frontend premium: ejecutada e interrumpida al no producir resultado; no se declara aprobada.

Captura del estado de error recuperable en móvil: `crm-etiquetas-error-movil.png`.

La corrección está en el frontend local. Una instancia ya publicada necesita una nueva compilación y despliegue del frontend.
