# Analítica del Portal del Cliente

## Integración existente

- Ruta protegida `/portal`, rol `CLIENTE`, sesión de `ContextoAuth` y JWT de Supabase obtenido por el backend.
- `PortalCliente.jsx` conserva los contratos y servicios. `EntregasContratoCliente.jsx` reutiliza la vista previa, decisiones e informes versionados que ya existían.
- `AnaliticaCliente.jsx` consulta las estadísticas existentes en `crm_anuncio_metrica`. No genera estadísticas ni llama a plataformas publicitarias.
- Se reutiliza `GloboCampanas` / `react-globe.gl`, con países de Natural Earth 1:110m (datos geográficos públicos, ~199 KB). El renderizador carga de forma diferida y ajusta su resolución al tamaño del lienzo. Si falta WebGL, ofrece un mapa SVG con los mismos filtros y resultados.
- No se añadieron tablas de negocio. `crm-v14.sql` incorpora una consulta y políticas sobre las relaciones actuales de empresas, contratos, cuentas, campañas y anuncios.

## Aplicar el SQL manualmente en Supabase

1. Abre el proyecto de Supabase que utiliza este CRM y entra en **SQL Editor → New query** con la cuenta propietaria del proyecto.
2. Abre `MarketerosAgenciaBackend/src/main/resources/sql/crm-v14.sql` en el workspace. Copia **todo** el archivo, desde `BEGIN` hasta `COMMIT`, y ejecútalo en el editor.
3. El script requiere las migraciones existentes v1–v13. Es transaccional y se puede ejecutar de nuevo: reemplaza únicamente sus funciones y políticas con nombres `portal_cliente_*`. No crea datos DEMO ni elimina registros.
4. Comprueba la instalación con estas consultas de solo lectura:

```sql
select p.proname, p.prosecdef as usa_security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('crm_portal_ids','crm_portal_estadisticas');

select tablename, policyname, permissive, cmd
from pg_policies
where schemaname='public' and policyname like 'portal_cliente_%'
order by tablename, policyname;
```

La primera consulta debe devolver `crm_portal_ids = true` y `crm_portal_estadisticas = false`. La segunda muestra cinco políticas en cada una de las ocho tablas protegidas: lectura propia, aislamiento restrictivo y bloqueo de inserción, actualización y eliminación por acceso directo.

5. En el alojamiento del frontend configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con la URL y clave **publicable** de este proyecto; deben estar presentes al compilar. Mantén `VITE_API_URL` apuntando al backend existente en Render. Publica la versión actualizada del frontend. Despliega también los cambios de `CrmEntregaServicio` en **tu servicio existente de Render** para que la descarga/aprobación de materiales compruebe el tipo de servicio y la prestación `PUBLICACION` en el servidor.
6. Inicia sesión en el portal con un usuario activo de rol Cliente, asociado a su empresa en **Accesos al portal**. Selecciona un periodo donde ya existan métricas Mockaroo. El editor SQL no tiene esa sesión del cliente (`auth.uid()` normalmente es nulo allí); la verificación funcional debe hacerse desde el portal.

Alternativa por JDBC con las credenciales habituales de despliegue, sin pegarlas en el código: el script existente `scripts/PrepararCrm.java` admite `--portal-analitica` para inventario y `--portal-analitica --aplicar` para aplicar solo esta migración.

## Permisos y agregaciones

### Escena de cliente y administrador

El Portal del Cliente usa `PortalExperiencia.css` para el marco curvo, las pestañas con iconos Lucide, las tarjetas claras y los acentos lima. Resultados conserva el globo y los gráficos; Campañas muestra el detalle filtrado; Mi contrato organiza importes previstos y entregas en un recorrido por fechas; Materiales e Informes tienen vistas propias. El selector de contrato permanece disponible en la cabecera y los filtros de analítica se conservan al navegar entre pestañas. Materiales aparece únicamente si el contrato incluye publicación y no es de solo análisis. Las consultas, la autenticación y la validación de permisos en el servidor se reutilizan.

`EscenaGlobo.css` comparte el lienzo a todo el ancho y los paneles superpuestos en ambos dashboards. El zoom amplía el planeta detrás de las tarjetas. La tabla del cliente, los detalles, entregas e informes permanecen fuera de la escena.

El mundo gira automáticamente y ofrece pausa, reanudación, acercar, alejar y restablecer. La selección y el arrastre pausan el giro; restablecer la vista conserva el estado de pausa elegido. Se respeta la preferencia de movimiento reducido y se suspende el renderizado en pestañas ocultas o fuera de pantalla. El dibujo usa una resolución menor mientras se mueve; en reposo se dibuja una imagen más nítida y se detiene.

Las señales muestran etiquetas y flechas sobre lugares existentes: países con resultados para el cliente y ubicaciones de las campañas para el administrador. Las etiquetas cercanas se distribuyen, las de la cara posterior se ocultan y sus textos evitan los paneles y otras etiquetas. Esto no modifica puntos, países ni estadísticas.

`PanelGlobo` conserva las tarjetas superpuestas en escritorio y las convierte en paneles plegables en móvil. Esta adaptación reutiliza las consultas y permisos actuales y no requiere otra migración SQL.

Pruebas específicas: `pnpm run test:globo` y, con `CRM_UI_URL` apuntando al servidor local, `pnpm run test:globo:ui`.

### Datos

- El navegador usa la clave publicable y el JWT de su sesión actual. No hay `service_role` en el frontend, sesiones adicionales ni un identificador de empresa controlable desde los filtros.
- `crm_portal_ids` resuelve la empresa desde `auth.uid()`, usuario activo, rol Cliente y acceso activo. Valida también que la cuenta del anuncio, su contrato de origen y la campaña pertenezcan a esa empresa.
- La consulta es `SECURITY INVOKER`: RLS se aplica tanto al RPC como a lecturas directas. Las políticas restrictivas preservan el aislamiento frente a políticas permisivas antiguas. Las escrituras del CRM siguen pasando por su backend autorizado, con el propietario de las tablas o el rol de servidor que ya utiliza.
- Las consultas de anuncios de entregas comprueban también la empresa de su contrato de origen, cuenta y campaña. El resumen antiguo solo considera la moneda del contrato; el dashboard nuevo utiliza la consulta por monedas separadas.
- Un anuncio vinculado al contrato de difusión y a otro de análisis se cuenta una sola vez al consultar todos los contratos. Al seleccionar un contrato, se respetan sus anuncios propios y referenciados.
- Los filtros de contrato, campaña, plataforma, país, fechas, moneda y búsqueda se ejecutan en la consulta. El selector de métrica solo cambia la representación geográfica de esos mismos resultados.
- El CTR es ponderado por impresiones. CPC y CPM se calculan por moneda. Nunca se agregan PEN y USD. Para pintar inversión se fija una moneda concreta.
- El modelo actual no tiene alcance ni ingresos/costos verificados. Alcance y ROAS/ROI quedan no disponibles. `ingresos` de Mockaroo se expone siempre como **ingresos estimados** y las conversiones como acciones publicitarias.
- CSV y PDF vuelven a consultar con la sesión y los filtros capturados antes de exportar: una revocación impide nuevas exportaciones. Incluyen todos los resultados filtrados, no solo la página visible, y la marca **Datos simulados · Mockaroo**. CSV protege celdas que podrían interpretarse como fórmulas.

## Verificación

Desde `MarketerosFrontend`:

```powershell
pnpm run test:portal
pnpm run build
# Con un servidor local o preview accesible:
$env:CRM_UI_URL='http://127.0.0.1:5187'
pnpm run test:portal:ui
# Para verificar además el polígono interactivo de Perú con WebGL:
$env:PORTAL_WEBGL='1'
pnpm run test:portal:ui
```

Las pruebas SQL utilizan PostgreSQL aislado (PGlite), dos empresas, contratos compartidos, políticas antiguas demasiado amplias, filtros y revocación. Las pruebas de navegador usan fixtures interceptadas **solo dentro de las pruebas**; la aplicación no incluye resultados hardcodeados. La suite de backend `CrmPortalPermisosTests` verifica que solo análisis y contratos sin publicación no puedan aprobar materiales, y que la aprobación contratada siga operativa.

La aplicación y los permisos sobre el Supabase real deben verificarse después de ejecutar el SQL manualmente; las pruebas aisladas no acreditan que esa migración ya esté desplegada.

Cartografía: [Natural Earth, dominio público](https://www.naturalearthdata.com/about/terms-of-use/), límites de países 1:110m v5.1.2. No representa ubicaciones de personas.
