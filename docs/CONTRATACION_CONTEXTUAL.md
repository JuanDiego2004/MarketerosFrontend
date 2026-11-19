# Contratación contextual

Revisión funcional: 18 de noviembre de 2026. Implementa la corrección descrita en `CRM_Requisitos_Funcionales_Contratos_Dinamicos_Mockaroo.md`.

## Recorrido principal

1. Abrir **Contratos → Nuevo contrato**.
2. Seleccionar la empresa o registrarla sin abandonar el asistente.
3. Completar datos generales y escoger Difusión, Análisis o Integral.
4. Configurar los elementos específicos del servicio.
5. Acordar precios, prestaciones y cantidades; revisar y confirmar.
6. Continuar desde la ficha del contrato creado.

El asistente permite guardar un borrador parcial, cerrar y recuperarlo desde la lista de contratos. Los archivos se conservan asociados al borrador. La confirmación crea el contrato y sus relaciones en una transacción; repetir la confirmación devuelve el mismo contrato.

## Servicios

| Servicio | Configuración durante el alta | Operación desde su ficha |
|---|---|---|
| Difusión | Video, imagen, carrusel o texto; material del cliente o producción pendiente; canales, textos, responsables, fechas y modalidad por canal | Materiales, revisión editorial y del cliente, publicaciones, calendario, presupuesto cuando corresponda, entregables e informes |
| Análisis | Plataforma, cuenta, referencias de campañas/anuncios, periodo, indicadores, metas, inversión de referencia y frecuencia | Anuncios observados, métricas, comparación, recomendaciones e informes; sin edición de material, publicación ni presupuesto ejecutable |
| Integral | Ambas configuraciones | Herramientas de difusión y análisis dentro del mismo contrato |

La modalidad orgánica no exige pauta. La pagada exige presupuesto y audiencia por canal. La mixta admite ambos tipos y valida que la distribución no exceda el máximo autorizado. Honorarios, producción, pauta autorizada y gasto registrado conservan significados distintos.

La entrega de un video por el cliente no exige contratar producción. Una producción pendiente requiere esa prestación, responsable y fecha de entrega. Si se acuerda aprobación del cliente, se marca en la pieza; el servidor impide registrar difusión sin aprobación de la última versión.

## Ficha y navegación

- `/contratos/nuevo`: asistente.
- `/contratos/borradores/:uuid`: recuperación y continuación.
- `/contratos/:id`: resumen y pestañas aplicables al servicio.
- **Agregar material o referencia**: abre otro borrador contextual del mismo contrato, conserva lo existente y respeta el alcance y presupuesto. No crea otro contrato, campaña ni entregables.
- `/entregas?contrato=:id`: compatibilidad mediante redirección a la ficha; se retira del sidebar.
- Anuncios, calendario, entregables e informes generales permanecen como vistas transversales. El calendario excluye referencias de solo análisis.

Las configuraciones iniciales de contratos confirmados se conservan. La edición genérica de contratos del asistente se bloquea para evitar que las relaciones se desincronicen. Las ampliaciones de trabajo mantienen la identidad del contrato y registran su propio historial.

## Referencias y Mockaroo

La búsqueda usa empresa, plataforma e ID o código; no consulta ni verifica cuentas de Facebook, TikTok o Google. Encontrar un anuncio existente lo vincula sin copiar sus métricas.

Al confirmar el contrato, la API guarda primero el contrato y sus relaciones y después solicita automáticamente un conjunto inicial de Mockaroo para los anuncios vinculados. Se cubren hasta siete días vigentes, sin fechas futuras. Esta carga inicial también se permite en difusión y no cambia el estado del contrato ni del anuncio. Si el proveedor falla, el contrato se conserva y «Ver estadísticas» ofrece reintentar. Un contrato cuyo inicio sea futuro muestra ese estado y no genera resultados antes de su vigencia.

**Métricas → Asociar datos Mockaroo** se conserva para ampliar el periodo cuando el servicio incluye análisis. Solo se piden días que faltan, dentro de la vigencia, con un máximo de 90 días por consulta. La clave anuncio/fecha/país evita duplicados. Consultar resultados ya disponibles no consume Mockaroo.

Las comparaciones, los totales del informe y el portal incluyen anuncios vinculados aunque procedan de otro contrato de la misma empresa. Se conserva la moneda y se rechaza una referencia incompatible. Las cifras no representan publicación ni validación en plataformas reales.

## Persistencia y despliegue

Backend: Java 25, Spring Boot, PostgreSQL. Frontend: React e iconos Lucide React existentes. Se mantienen WhatsApp, SMTP y Twilio.

- `crm-v12.sql`: borradores, archivos, configuración contextual, relaciones de anuncios e historial; fecha y aprobación de publicaciones.
- `crm-v13.sql`: ampliaciones contextuales sobre contratos existentes.
- Ambas migraciones se aplicaron en la base configurada durante esta corrección. En otra base deben ejecutarse después de v1–v11, en orden.
- `scripts/PrepararCrm.java --aplicar` detecta las tablas ya presentes. No vuelve a ejecutar migraciones aplicadas ni borra registros previos.

Los archivos requieren JWT y se validan en el servidor. Límite: 20 MB por archivo, 30 archivos y 100 MB por borrador. Los clientes externos conservan el acceso limitado a su empresa y los PDF publicados mantienen sus versiones.

## Verificación

- Navegación: 7 pruebas en Edge sobre la compilación de producción; difusión, análisis, integral, persistencia del borrador, error/reintento, materiales, comparación, PDF, portal y móvil.
- Migraciones y CSV: 5 pruebas; cadena v1–v13 y 59 tablas CRM con RLS.
- Backend: 32 pruebas de regresión aprobadas con Java 25, incluidas 15 de agencia con PostgreSQL y transacciones que revierten los datos. Después de ajustar la reutilización de referencias, las siete pruebas enfocadas del asistente, ampliaciones y métricas también pasaron; verifican asociación Mockaroo idempotente, comparación e informes de anuncios vinculados.
- Cierre: dos pruebas enfocadas adicionales aprobaron el bloqueo de difusión sin archivo y la conservación de elementos al ampliar contratos. Se generó el JAR con Java 25.
- Build de React completado. Permanece el aviso previo de tamaño de los paquetes gráficos/3D.
- La auditoría estática del plugin de diseño agotó 20 segundos sin producir dictamen. `auditoria-contratacion.json` registra el límite; no se presenta como una auditoría aprobada.

Las pruebas de interfaz interceptan la API; las de backend verifican persistencia real. No se hizo publicación en redes ni despliegue en Render. La matriz de casos del documento original sigue siendo la referencia de aceptación; las evidencias automatizadas descritas no equivalen a una revisión manual exhaustiva de cada casilla.

El frontend local usa `VITE_API_URL=https://marketerosagenciabackend.onrender.com`. Para utilizar la nueva API en esa conexión hay que volver a desplegar el backend actualizado y reiniciar/actualizar el frontend. La migración de la base, por sí sola, no actualiza el proceso que ya está ejecutándose en Render.
