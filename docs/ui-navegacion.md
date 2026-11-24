# Navegación y controles del sistema

El lateral azul sigue los grupos y rutas de `modulosPorRol`: Dashboard, CRM, Clientes, Marketing, Resultados y Configuración según el rol actual. El elemento seleccionado se une al fondo del área de trabajo con dos curvas. Motion desplaza ese indicador entre las secciones y anima el despliegue de los grupos. El botón de contraer conserva la preferencia en este navegador.

En móvil se utiliza un panel superpuesto, con fondo atenuado, foco contenido en el menú, cierre con Escape y devolución del foco al botón de apertura. El contenido de fondo queda `inert` mientras está abierto. Al navegar, el panel se cierra. Las animaciones respetan la preferencia de movimiento reducido.

`componentes/ui/Pestanas.jsx` comparte la presentación segmentada y el indicador animado entre las fichas CRM, contratos, módulos de marketing, pipeline y actividades. Las fichas conservan la semántica tablist/tab/tabpanel; los selectores de vistas mantienen botones `aria-pressed` y el estado/URL existente. Flechas izquierda/derecha y Home/End permiten recorrer las opciones. Las secciones largas tienen desplazamiento horizontal en móvil y en la ficha de contrato.

`SistemaUI.css` unifica etiquetas, campos, búsqueda, fechas, selectores, botones y tablas. Los filtros se alinean en escritorio y se redistribuyen en móvil. Las tablas amplias se desplazan dentro de su contenedor. No se añadieron dependencias, consultas, permisos ni datos de demostración a la aplicación.

## Verificación

Con el servidor local en ejecución:

```powershell
$env:CRM_UI_URL='http://127.0.0.1:5188'
pnpm run test:navegacion:ui
pnpm run build
```

La prueba usa registros interceptados únicamente en su contexto de navegador: comprueba filtros enviados a la API, pestañas con teclado, navegación por rol, menú móvil, foco, Escape, movimiento reducido y ausencia de desbordamiento. Las capturas `sistema-*.png` de esta carpeta muestran esa sesión de prueba.
