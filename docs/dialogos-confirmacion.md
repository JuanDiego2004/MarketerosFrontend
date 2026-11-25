# Confirmaciones compartidas

`DialogoCrm` conserva los formularios en `DrawerFormulario`. Sus otras vistas se muestran en un diálogo nativo centrado, insertado directamente en `document.body` para aislarlo de las reglas de ancho y espaciado del CRM. Las confirmaciones tienen ilustración vectorial local, título y explicación centrados, aviso opcional y pie de acciones. Los detalles, informes y vistas previas conservan una presentación amplia, sin ilustración.

Los usos existentes de `<div className="crm-acciones">` se adaptan como pie del modal, incluso dentro de fragmentos de React. Se conservan etiquetas, eventos y condiciones `disabled`. La última acción del pie es la principal; las anteriores mantienen el tratamiento secundario. No se modifican consultas, permisos ni operaciones del servidor.

Opciones de presentación:

```jsx
<DialogoCrm
  titulo="Confirmar envío de correo"
  ilustracion="correo"
  aviso="Esta acción no se puede deshacer."
  variante="normal"
  ocupado={enviando}
  cerrar={cancelar}
>
  <p>Explicación real de la operación y sus destinatarios.</p>
  <div className="crm-acciones">
    <button onClick={cancelar}>Cancelar</button>
    <button onClick={confirmar}>Confirmar y enviar</button>
  </div>
</DialogoCrm>
```

`variante="peligro"` identifica acciones destructivas; `variante="normal"` evita heredar el estilo de peligro de un botón antiguo. El aviso se indica solo cuando corresponde a la operación. `confirmacion={false}` permite mantener explícitamente la presentación de detalle, y `ancho="amplio"` admite contenido extenso.

Los títulos usan identificadores únicos para las confirmaciones anidadas. El diálogo conserva el foco en su interior y lo devuelve al control anterior al cerrar. Mientras está ocupado se bloquean el cierre, Escape y las acciones. Las animaciones respetan movimiento reducido.

## Pruebas

La muestra en `tests/apoyos/dialogos-confirmacion.html` sirve únicamente con Vite para las pruebas y no forma parte del build publicado. No importa servicios ni envía mensajes. Con el servidor de desarrollo activo:

```powershell
$env:CRM_UI_URL='http://127.0.0.1:5188'
node --test tests/dialogos-confirmacion-navegador.test.mjs
```

Las capturas `confirmacion-*.png` muestran datos ficticios de esa prueba. Las pruebas de drawers y entregas comprueban además el uso del componente en módulos reales con API interceptada.
