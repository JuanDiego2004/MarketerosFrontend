# Presupuesto autorizado y distribución por canal

El borrador revisado tenía 300 PEN asignados a Facebook y 0 PEN como máximo de pauta del contrato. El servidor rechazaba correctamente esa distribución; el asistente no la explicaba ni validaba en el paso de precios.

Para contratos nuevos de difusión o integral con pauta pagada o mixta, el drawer muestra el total de todos los materiales y canales, el máximo autorizado, el exceso o importe sin distribuir y el desglose por material/canal. Honorarios y producción se explican por separado.

El paso 3 permite terminar la planificación y explica que el máximo se define en el paso 4. En el paso 4, un exceso bloquea el avance y enfoca el máximo autorizado. El usuario puede editar los importes o pulsar «Usar total distribuido como máximo autorizado». No se ajusta ningún importe automáticamente. Guardar borrador sigue permitiendo datos incompletos.

La comparación se realiza con centavos enteros; por ejemplo, 0.10 + 0.20 cabe exactamente en 0.30. Se conservan la validación del backend y los controles originales de presupuesto para ampliaciones.

## Verificación

- Pruebas unitarias: suma de todas las piezas, límite, centavos e importes inválidos.
- Navegador: 300 distribuidos con 0 autorizado, bloqueo antes de confirmar, foco, edición a 299, corrección explícita a 300, honorarios y producción conservados, confirmación y móvil.
- ESLint de archivos afectados y compilación de producción.
- Resultado: 13 pruebas de interfaz CRM, 2 del drawer y 3 unitarias de presupuesto aprobadas.
- Auditoría estática limitada a 20 segundos: `auditoria-presupuesto-contrato.json`. Un timeout no representa aprobación.
