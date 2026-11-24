# Frontend publicado en Render

Frontend: https://marketerosfrontend.onrender.com
Backend: https://marketerosagenciabackend.onrender.com

La comprobación del sitio publicado confirmó que el JavaScript utiliza el backend correcto. El preflight desde el nuevo dominio recibía HTTP 403 porque el backend todavía autorizaba únicamente los orígenes locales.

## Backend

En el servicio del backend, Environment:

```ini
APP_CORS_ALLOWED_ORIGINS=https://marketerosfrontend.onrender.com
```

Sin rutas ni barra final. Si también se usará el backend desde desarrollo local:

```ini
APP_CORS_ALLOWED_ORIGINS=https://marketerosfrontend.onrender.com,http://localhost:5173,http://localhost:3000
```

Guardar y desplegar/reiniciar el backend. La variable que ya exista en Render prevalece sobre el valor predeterminado del código.

El backend tiene el dominio publicado y localhost como valores predeterminados, y su Blueprint define el dominio de producción. CORS permite las solicitudes JSON y los encabezados Authorization del CRM; las rutas privadas siguen exigiendo autenticación.

## Rutas del frontend

El sitio publicado respondía 200 en /, pero 404 al abrir directamente /login y /contratos. En el servicio del frontend, Redirects/Rewrites, añadir:

| Source | Destination | Action |
| --- | --- | --- |
| /* | /index.html | Rewrite |

Así React Router resuelve la URL sin redirigir al usuario a otra ruta. El archivo render.yaml contiene la misma regla para despliegues administrados mediante Blueprint. Añadir el archivo a un servicio creado manualmente no aplica por sí solo la regla del panel.

Build: pnpm install --frozen-lockfile && pnpm run build.
Publish directory: dist.
VITE_API_URL: https://marketerosagenciabackend.onrender.com.

Documentación oficial: https://render.com/docs/redirects-rewrites y https://render.com/docs/blueprint-spec.
