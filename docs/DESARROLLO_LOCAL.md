# Desarrollo local

El frontend usa dos destinos según el modo de Vite:

- `pnpm dev` carga `.env` y llama al backend local: `http://localhost:8080`.
- `pnpm build` carga `.env.production` y conserva el backend publicado de Render.

Inicia el backend desde `backend_agencia` con Java 25:

```powershell
.\scripts\IniciarBackend.ps1 -Puerto 8080
```

En otra terminal inicia el frontend desde `MarketingSystem`:

```powershell
pnpm dev --host 127.0.0.1
```

Rutas locales:

- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:8080/swagger-ui/index.html`

El backend local necesita acceso de red a la base de datos configurada en `backend_agencia/.env`. Si Supabase no resuelve o no responde, Spring Boot se detiene antes de abrir el puerto 8080 y el frontend mostrará que el servidor no responde.
