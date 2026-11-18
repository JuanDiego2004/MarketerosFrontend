---
version: alpha
name: "MarketingSystem"
description: "Panel operativo de agencia con navegación oscura y contenido de datos claro"
colors:
  navigation: "#000000"
  navigation-text: "#D1D5DB"
  primary: "#1D4ED8"
  content-background: "#F3F4F6"
  surface: "#FFFFFF"
  content-text: "#0F172A"
typography:
  sans:
    fontFamily: "Inter, sans-serif"
  utility:
    fontFamily: "DM Sans, sans-serif"
rounded:
  navigation: "0.5rem"
  surface: "1rem"
spacing:
  navigation-closed: "3.5rem"
  navigation-open: "16.25rem"
components:
  sidebar: {}
  table: {}
  drawer: {}
---

# MarketingSystem Design System

## Overview

### Creative North Star

El tablero de trabajo de una agencia: la navegación actúa como índice compacto y el área clara prioriza registros, cifras y decisiones.

### Product context and register

Aplicación en español para administradores, líderes y analistas de marketing. La referencia visual es la interfaz existente: rail negro, selección azul, superficies claras, iconos Lucide React y tablas densas. El producto se usa principalmente en escritorio.

Los valores de este archivo documentan el código existente; las clases Tailwind de `src/componentes/sidebar/Sidebar.jsx`, `src/componentes/LayoutPrivado.jsx` y las pantallas son la fuente de ejecución. Antes de cambiar un valor duradero se actualizan ambos lugares.

## Colors

La navegación usa `navigation` y `navigation-text`; `primary` distingue la ruta actual. El contenido usa `content-background`, `surface` y `content-text`. Los estados de foco deben ser visibles en la navegación oscura. No se usa el azul para elementos que no se puedan activar.

## Typography

Inter se usa en el sidebar; DM Sans y las otras familias importadas en `src/App.css` se mantienen donde ya están aplicadas. Etiquetas en español y en estilo de oración. Los números de métricas requieren tabulares cuando se comparan.

## Layout

El sidebar tiene ancho cerrado de 56 px y abierto de 260 px, según `src/componentes/sidebar/funciones.js`. El contenido principal conserva su propio scroll. Los grupos del sidebar desplazan sus subrutas dentro de un área con scroll; Cerrar sesión queda accesible al final.

## Elevation & Depth

La jerarquía del sidebar se expresa con fondo y color de selección. Las pantallas usan superficies blancas y bordes suaves. No se añaden sombras a la navegación.

## Shapes

Los enlaces y botones de navegación usan radio de 8 px. Las tarjetas principales usan radios mayores. La sangría y línea vertical identifican las subrutas sin agregar otra paleta.

## Components

### Foundational visual states

Los enlaces y botones tienen estado normal, hover, foco visible y activo. La ruta activa permanece marcada al abrir o cerrar grupos. Las rutas inaccesibles no aparecen para el rol actual.

### Navigation and data display

Dashboard es un enlace directo. Clientes, Campañas, Resultados y Configuración son grupos desplegables. Solo se listan rutas funcionales. Se conserva el vocabulario de las pantallas actuales.

### Iconography and motion

Lucide React identifica grupos y acciones con trazo uniforme (1,75 para grupos, tamaños de 16–22 px). El rail se expande en 0,3 s al entrar con mouse o foco y respeta movimiento reducido. CRM reúne Contactos, Cuentas, Pipeline y Actividades; el analista ve Contactos y sus Actividades. Marketing incorpora Contenido y Automatizaciones; Resultados añade Atribución y Metas. `src/screens/crm/Crm.css` es el dueño de los estilos CRM y mantiene la paleta existente; el acento de acción es azul #1D4ED8. Los diálogos CRM son elementos `<dialog>` modales del producto, con foco confinado por el navegador y restaurado al cierre. El tablero y calendario desplazan sus columnas horizontalmente sin ensanchar la página. Las notificaciones del header muestran tareas reales del usuario.

## Do's and Don'ts

- Mantener visibles la ruta activa y el foco de teclado.
- Añadir nuevas entradas cuando tengan pantalla, API y autorización completas.
- Evitar una lista plana larga de enlaces y menús sin destino funcional.
