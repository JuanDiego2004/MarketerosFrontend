# Registros en el drawer compartido

Los registros y las ediciones de datos reutilizan `src/componentes/DrawerFormulario.jsx`, el mismo componente utilizado por Administración.

## Cobertura

- Contactos, empresas, importación de contactos, notas, adjuntos y consentimientos.
- Oportunidades, actividades, segmentos, metas, contenido y automatizaciones mediante las pantallas CRM compartidas.
- Etiquetas, interacciones y valores personalizados.
- Captación, vinculación de mensajes y campañas, e inversiones adicionales.
- Cotizaciones, cuentas publicitarias, anuncios, entregables, recomendaciones, ajustes e informes redactados.
- Alta y ampliación de contratos, incluida la creación de empresas sin abandonar el asistente.
- Nuevas versiones de material, PDF y accesos al portal.
- Los formularios administrativos existentes mantienen el mismo drawer y bloquean el cierre durante el guardado.
- El registro de cobertura y resultados geográficos del dashboard utiliza también el componente compartido.

Las confirmaciones de decisiones y descarte, las consultas y las vistas previas siguen usando el diálogo compartido. La autenticación, los filtros, las consultas y el editor visual de flujos conservan su contexto propio.

## Componente y compatibilidad

- Panel derecho de 560 px; variante amplia de 960 px para contratos; ancho completo en móvil.
- Encabezado fijo y cuerpo con desplazamiento interno.
- Modal nativo para foco confinado, fondo inerte, Escape, restauración del foco y capas anidadas.
- `ocupado` impide cerrar mediante Escape, el fondo o el botón de cierre mientras se guarda.
- `DialogoCrm formulario` adapta la interfaz de las pantallas CRM al drawer existente; no implementa otro panel.
- Cada pantalla conserva sus validaciones, permiso, API, control de versiones y confirmación de descarte. Los errores mantienen los datos para reintentar.

## Verificación

- 7 pruebas de navegación del CRM aprobadas: contactos, empresas, campañas, contratos, materiales, comparación, PDF y portal.
- 2 pruebas del drawer aprobadas: geometría de escritorio y móvil, foco, fondo inerte, Escape, descarte, guardado pendiente, error/reintento, notas, adjuntos y empresa anidada en contrato.
- Prueba de login aprobada; ESLint de los archivos modificados y compilación de producción aprobados.
- Prueba del dashboard aprobada, incluida la edición geográfica, los roles y la alternativa sin WebGL.
- Se corrigió la espera indefinida preexistente al volver a seleccionar el mismo filtro publicitario, detectada al establecer la referencia de pruebas.
- La auditoría estática del plugin agotó su límite de 20 segundos, sin dictamen. Se registra en `auditoria-drawer.json`; no sustituye las pruebas funcionales anteriores.

Comandos: `npm run test:crm:ui`, `npm run test:drawer`, `npm run test:auth`, `npm run build`. Las pruebas de navegador requieren `CRM_UI_URL` y usan respuestas interceptadas; no crean registros reales ni envían comunicaciones.
