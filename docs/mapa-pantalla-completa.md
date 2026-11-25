# Dashboard con mapa de borde a borde

La vista de marketing y la analítica del cliente usan toda la superficie disponible como mapa, detrás de los controles y las tarjetas. En administración se conserva la navegación lateral; el encabezado global ya no reserva una franja sobre el dashboard. Cuenta, notificaciones y menú móvil siguen accesibles. El portal elimina el marco exterior únicamente en Resultados y Campañas; las secciones de contrato, materiales e informes conservan sus flujos.

Se elimina la cabecera «Una visión global» y la barra permanente de campos. La búsqueda queda en una cápsula flotante. Fechas y filtros se consultan en un panel que se cierra con Escape, clic exterior o «Ver resultados», sin perder la selección. El detalle del CRM y la tabla de resultados se abren encima del mapa, sin alargar la página. El botón de ampliar usa la API nativa de pantalla completa y permite volver a la navegación normal.

Se conserva `react-globe.gl`, la rotación automática, su pausa al interactuar y la preferencia de movimiento reducido. El canvas usa el ancho y alto reales del contenedor, incluso detrás de las tarjetas y al hacer zoom. El enfoque inicial se acerca al planeta, y las señales evitan también las nuevas zonas de controles flotantes. Los paneles se pliegan en móvil para dejar libre el mapa.

Los filtros, exportaciones y consultas existentes se mantienen. La vista de administración comienza en Resultados; Cobertura sigue disponible como vista distinta. El rediseño no cambia permisos, conexiones a proveedores ni reglas de aislamiento del portal.

Validación con APIs interceptadas y registros aislados:

```powershell
$env:CRM_UI_URL='http://127.0.0.1:5188'
node --test --test-concurrency=1 tests/escena-globo-navegador.test.mjs
node --test tests/controles-mapa-navegador.test.mjs
pnpm run build
```

Las pruebas verifican canvas y escena con altura igual al viewport, controles por encima del mapa, filtros cerrados inicialmente, giro, zoom, selección geográfica, paneles móviles, ausencia de desbordamiento, foco, Escape y pantalla completa nativa. Las capturas `mapa-admin-pantalla.png`, `mapa-cliente-pantalla.png` y sus variantes móviles corresponden a datos de prueba, no a datos de clientes reales.
