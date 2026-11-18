# Dashboard de marketing

El Dashboard usa `react-globe.gl`, con carga diferida del motor 3D y agrupación espacial mediante `supercluster`. Las consultas iniciales agregan las métricas por campaña y día. El editor consulta las métricas originales de una campaña al abrir Resultados. La selección de campaña actualiza las tarjetas, los gráficos y el resumen CRM. La lista permite seleccionar campañas con teclado y utilizar el Dashboard cuando WebGL falla.

## Datos y geografía

- Los totales operativos proceden de `metrica_operativa`, con la moneda PEN que utiliza el módulo de métricas existente.
- Los gastos sincronizados de Meta y Google y los ingresos atribuidos del CRM se presentan en su moneda original, en Captación y ventas. El selector de atribución utiliza los modelos existentes.
- Cobertura representa la segmentación geográfica configurada. Resultados representa los desgloses geográficos registrados para métricas existentes.
- Las campañas históricas sin coordenadas continúan disponibles en la lista.
- Una campaña puede tener múltiples ubicaciones. Los desgloses se consultan por separado de sus totales, y su suma no puede superar la métrica original.
- El editor permite registrar países o ciudades con coordenadas. Los conectores existentes siguen sincronizando sus resultados agregados. La importación automática de desgloses geográficos de proveedores requiere ampliar cada conector según los datos que ofrezca la cuenta.
- Los datos sintéticos del modo demostración se procesan localmente.

## Habilitar la base de datos

La migración aditiva e idempotente está en `MarketerosAgenciaBackend/src/main/resources/sql/dashboard-v1.sql`. Crea tres tablas con RLS y un trigger que impide reducir una métrica por debajo de su desglose geográfico. Se ejecuta con el propietario de la base de datos o el rol de migraciones.

El script existente del backend admite estas opciones con el controlador PostgreSQL en el classpath y las variables DB_URL, DB_USERNAME y DB_PASSWORD configuradas en su `.env`.

```powershell
# Ejecutar desde MarketerosAgenciaBackend.
java -cp <postgresql.jar> scripts/PrepararCrm.java --dashboard
java -cp <postgresql.jar> scripts/PrepararCrm.java --dashboard --aplicar
```

El backend conserva el endpoint anterior `/dashboard`. El nuevo Dashboard consume `/dashboard/marketing?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` bajo las bases `/api/admin`, `/api/lider` y `/api/analista`. Las consultas requieren DASHBOARD_VER y sus alias existentes. La cobertura requiere CAMPANA_MODIFICAR y los resultados METRICA_REGISTRAR.

## Verificación local

```powershell
pnpm install --frozen-lockfile
pnpm run build
node --test tests/dashboard-marketing.test.mjs
# Con Vite iniciado en el puerto elegido.
$env:DASHBOARD_UI_URL='http://127.0.0.1:5174'
node --test tests/dashboard-navegador.test.mjs
```

La prueba de navegador usa Edge instalado, una sesión ficticia y respuestas de API interceptadas dentro de su contexto aislado. Comprueba selección, filtros, guardado de cobertura y resultados, móvil y alternativa sin WebGL. De forma predeterminada verifica el recorrido mediante la lista con WebGL deshabilitado. Para incluir la inicialización del globo y su captura, configura `DASHBOARD_WEBGL=1` en un entorno con aceleración gráfica disponible. Las capturas se guardan en la carpeta temporal del sistema.

## Textura terrestre

La textura local `public/mapa/earth-blue-marble.jpg` procede del ejemplo de three-globe, fijado a la versión 2.45.6. La interfaz muestra la atribución NASA / Blue Marble.

[Recurso de origen](https://unpkg.com/three-globe@2.45.6/example/img/earth-blue-marble.jpg)
