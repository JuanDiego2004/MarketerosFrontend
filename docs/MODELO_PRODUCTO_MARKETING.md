# Modelo de inversión, rendimiento y ventas

## Recorrido del producto

Empresa cliente → campaña interna → estadísticas por plataforma → contacto con origen → oportunidad comercial → venta ganada → atribución e indicadores.

Una empresa puede tener varias campañas, y cada campaña puede tener estadísticas de Meta, TikTok y YouTube. La fuente actual es Mockaroo: datos sintéticos persistidos para el proyecto universitario, sin conexiones reales a cuentas de anuncios. La interfaz muestra «Fuente: Mockaroo» y conserva el vocabulario de un CRM de marketing. WhatsApp Cloud es un canal real e independiente de esa fuente.

Registrar una empresa o importar métricas no crea contactos ni ventas automáticamente. Los leads se registran en Contactos o mediante los formularios propios de captación, conservando su campaña/origen. Segmentos y automatizaciones trabajan sobre esos contactos; no se generan consentimientos a partir de estadísticas. Las oportunidades se gestionan en Pipeline, con valor, moneda, responsable, etapa y fecha de cierre.

## Inversión

- La pauta se incorpora con las estadísticas diarias de cada plataforma y país.
- Los gastos adicionales se registran por campaña, fecha, moneda, concepto e importe positivo. No hay que introducir otra vez la pauta importada.
- PEN y USD nunca se suman ni convierten implícitamente.
- El resumen suma todas las plataformas y países de la campaña interna para la moneda y período seleccionados.
- Los históricos de conectores retirados se conservan. Cuando existe pauta Mockaroo para la misma campaña, moneda y fecha, esa pauta tiene prioridad sobre el histórico para evitar doble contabilización. Esta política corresponde a la sustitución de proveedor de este proyecto, no a una conciliación entre plataformas reales.
- Un gasto adicional se anula mediante confirmación y versión; conserva su fila y auditoría. Las altas tienen UUID idempotente para evitar duplicados al reintentar.

## Ventas e indicadores

El panel comercial usa **oportunidades actualmente ganadas cuyo cierre pertenece al período**. No utiliza ingresos generados por Mockaroo. La atribución del panel es al primer origen y respeta las interacciones anteriores al cierre. Los reportes de atribución conservan los modelos primero, último y lineal.

| Indicador | Cálculo |
| --- | --- |
| CTR | Clics / impresiones × 100 |
| CPC | Pauta / clics |
| CPM | Pauta / impresiones × 1000 |
| CPA de plataforma | Pauta / conversiones de plataforma |
| CPL comercial | Inversión total / leads registrados por primer origen en el período |
| ROAS sobre ventas ganadas | Ingresos ganados atribuidos / inversión total |
| ROI publicitario | (Ingresos atribuidos − inversión total) / inversión total × 100 |

Cuando un denominador es cero se muestra «—». Conversiones de plataforma y leads del CRM son magnitudes distintas. Los leads usan fecha de creación y las ventas fecha de cierre; el informe corresponde a un período, no a una cohorte de captación.

Una venta ganada no acredita que el cliente ya pagó. Este panel no sustituye caja, facturación ni contabilidad. El ROI publicitario no descuenta costos de productos o servicios ni impuestos; no representa utilidad neta. Estas limitaciones aparecen junto a los resultados.

## Filtros y trazabilidad

Cliente, campaña, fecha y país quedan en la URL. País filtra mapa, gráfico, indicadores y CSV publicitarios de una plataforma. El resumen comercial conserva el total de campaña para todos los países y canales; su alcance aparece explícito. El CSV publicitario no mezcla ingresos comerciales con ingresos estimados del proveedor.

La referencia identifica el vínculo local, no un ID de anuncio real. La base conserva nombres técnicos anteriores y procedencia para compatibilidad. No se presenta la fuente como una consulta a Meta. No hay publicación de anuncios ni elección de audiencia efectiva en plataformas externas.

## Operación y permisos

El administrador vincula/sincroniza y gestiona inversiones; los roles con lectura de Atribución consultan. Crear o anular una inversión registra auditoría; los conflictos de versión se rechazan con 409. El backend exige sesión y autorización.

Aplicar migraciones hasta v8 antes de activar esta versión. El backend usa Java 25 y las dos variables Mockaroo. WhatsApp conserva sus propias credenciales y webhook; los conectores publicitarios Meta/Google ya no forman parte del flujo vigente. No se elimina ningún histórico ni se modifica un anuncio externo.

## Identidad única de empresa

## Servicios contratados

La propuesta del 18 de noviembre añade cotizaciones, contratos y tres modalidades de servicio. Ver [CONTRATOS_Y_SERVICIOS.md](CONTRATOS_Y_SERVICIOS.md). La decisión nueva exige señalar datos simulados y publicaciones de demostración en esas vistas; reemplaza la omisión de esas etiquetas descrita anteriormente. Las métricas propias de anuncios del contrato y los históricos agregados de campañas permanecen separados para evitar doble pauta. Los honorarios previstos de la agencia no se incorporan a ventas atribuidas del cliente.

Desde CRM v9, Clientes / Empresas registra una sola ficha en `/empresas`. Campañas utiliza automáticamente su identidad comercial y Contactos usa su perfil CRM. No se requiere crear ni vincular una segunda cuenta. Canales de difusión está separado en Marketing; los canales de comunicación están en Configuración. Ver [EMPRESAS_UNIFICADAS.md](EMPRESAS_UNIFICADAS.md).
