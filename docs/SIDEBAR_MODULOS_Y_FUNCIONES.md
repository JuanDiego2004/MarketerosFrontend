# Módulos del sidebar y para qué sirve cada uno

Actualizado: 18 de noviembre de 2026. Corresponde a la navegación con contratación contextual CRM v12–v13.

Este documento describe el menú actual del sistema. La contratación se inicia con un asistente dinámico y continúa en la ficha del contrato. Materiales, comparación y PDF se encuentran en sus pestañas; Entregas y análisis se retiró del sidebar. Consulta `CONTRATACION_CONTEXTUAL.md`.

## 1. Qué organiza el sistema

El CRM permite a una agencia registrar empresas, cotizar sus servicios, gestionar contratos, organizar campañas y materiales, dar seguimiento a contactos y oportunidades, analizar inversión/resultados y entregar informes al cliente.

Recorrido principal:

`Empresa → Cotización → Contrato → Campaña → Anuncio y contenido → Resultados → Informe`

Recorrido comercial de los contactos:

`Contacto / Lead → Seguimiento → Oportunidad → Venta ganada o perdida → Atribución`

Los datos publicitarios proceden de Mockaroo y se conservan en la base. El sistema no publica videos ni anuncios reales en redes. WhatsApp, correo SMTP y SMS son canales de comunicación independientes y requieren configuración propia.

Los honorarios de la agencia, el presupuesto autorizado de anuncios, el gasto ejecutado y los ingresos atribuidos son conceptos distintos. Un importe previsto o una oportunidad ganada no acredita que se haya cobrado un pago.

## 2. Resumen de la navegación por rol

| Rol | Grupos visibles | Enlaces del sidebar | Enfoque |
| --- | ---: | ---: | --- |
| Administrador | 6 | 31 | Operación completa, configuración y accesos. |
| Líder / Project Manager | 5 | 24 | Coordinación de clientes, servicios, campañas y trabajo del equipo. |
| Analista | 4 | 16 | Consulta, análisis, actividades propias y elaboración de contenido/informes según permisos. |
| Cliente | Sin sidebar interno | 0 | Portal privado de su empresa en `/portal`. |

Los números cuentan enlaces, no pestañas, formularios ni fichas. Ver un módulo no concede automáticamente todas sus acciones: también se aplican los permisos del backend, el tipo de servicio y las prestaciones del contrato.

## 3. Estructura completa del sidebar del administrador

```text
Dashboard
└── Dashboard

CRM
├── Contactos / Leads
├── Pipeline
└── Actividades

Clientes
├── Clientes / Empresas
├── Cotizaciones
└── Contratos y servicios

Marketing
├── Campañas
├── Canales de difusión
├── Audiencias
├── Contenido y aprobaciones
├── Automatizaciones
├── Cuentas publicitarias
├── Anuncios y publicaciones
├── Calendario editorial
└── Entregables


Resultados
├── Métricas e indicadores
├── Análisis comparativo
├── Reportes y exportación
├── Atribución
├── Metas y alertas
├── Recomendaciones
├── Ajustes autorizados
└── Informes por contrato

Configuración
├── Gestión de usuarios
├── Roles y permisos
├── Campos personalizados
├── Canales de comunicación
├── Auditoría
├── Catálogo de servicios
└── Accesos al portal

Cerrar sesión
```

## 4. Dashboard

### 4.1. Dashboard

- **Ruta:** `/dashboard`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** obtener una vista general de las campañas y sus resultados, consultar indicadores, gráficos y cobertura geográfica y acceder al detalle de una campaña.
- **Cuándo se utiliza:** al iniciar la jornada para revisar la situación general. La cobertura planificada y los resultados geográficos registrados son datos diferentes; un punto en el mapa no representa necesariamente la ubicación de una persona.

## 5. CRM

### 5.1. Contactos / Leads

- **Ruta:** `/contactos`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** mantener las fichas de personas con nombre, correo, teléfono, estado, responsable y empresa/campaña relacionada. Permite trabajar con etiquetas, orígenes e interacciones, consentimientos, notas, archivos y campos personalizados; también ofrece importación y exportación CSV.
- **Uso típico:** registrar un lead generado por una campaña y conservar su seguimiento. Las estadísticas de Mockaroo no crean contactos ni consentimientos automáticamente.
- **Acceso:** administrador/líder gestionan; el analista consulta con los permisos correspondientes.

### 5.2. Pipeline

- **Ruta:** `/pipeline`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** gestionar oportunidades comerciales asociadas con contactos, con etapas, responsable, valor, moneda, probabilidad y fecha de cierre. Dispone de lista y tablero.
- **Uso típico:** mover una oportunidad desde sus etapas iniciales hasta ganada o perdida. Las oportunidades ganadas participan en los resultados comerciales y la atribución; los honorarios previstos de un contrato no se convierten automáticamente en esas ventas.

### 5.3. Actividades

- **Ruta:** `/actividades`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** organizar tareas, llamadas, reuniones y seguimientos, asignar responsables y fechas, revisar vencimientos y consultar el calendario de actividades.
- **Uso típico:** programar una llamada vinculada con un contacto o una tarea de una oportunidad. El analista trabaja con sus actividades propias, según autorización.

## 6. Clientes

### 6.1. Clientes / Empresas

- **Ruta:** `/empresas`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** registrar una sola ficha por empresa y reunir sus datos generales, campañas, contactos, oportunidades, actividades, notas, archivos e historial.
- **Uso típico:** dar de alta una empresa antes de cotizarle o crear sus campañas. No se necesita crear otra cuenta CRM y relacionarla manualmente con ese cliente.
- **Conservación:** archivar cambia su estado a inactivo y conserva las relaciones; puede reactivarse.

### 6.2. Cotizaciones

- **Ruta:** `/cotizaciones`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** preparar una propuesta comercial con empresa, tipo de servicio, fechas, responsable, moneda, plataformas, alcance, prestaciones/cantidades, honorarios, producción y presupuesto.
- **Uso típico:** enviar la propuesta a revisión y aprobarla antes de utilizarla como origen de un contrato. Cotizar no equivale a registrar un cobro.

### 6.3. Contratos y servicios

- **Ruta:** `/contratos`.
- **Visible para:** administrador, líder y analista. Para el analista aparece como **Contratos**, dentro de Marketing.
- **Para qué sirve:** establecer qué servicio contrata cada empresa: gestión y difusión, solo análisis o gestión integral. Define condiciones, fechas, responsable, plataformas, prestaciones, cantidades y precios separados del presupuesto publicitario.
- **Uso típico:** aprobar y activar el servicio, vincular campañas, consultar su informe/avance, finalizarlo y registrar una renovación mediante otro contrato aprobado.
- **Acceso:** administrador/líder gestionan; el analista consulta. Solo análisis restringe las acciones de edición y publicación de publicidad, aunque el usuario tenga un rol interno con gestión.

## 7. Marketing

### 7.1. Campañas

- **Ruta:** `/campanas`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** organizar las acciones de marketing de una empresa: nombre, objetivo, fechas, estado, canal y presupuesto. Las campañas pueden vincularse a un contrato y a audiencias.
- **Uso típico:** crear la campaña interna que agrupa anuncios y resultados del servicio. La sección de captación permite configurar formularios para registrar leads con su origen, según permisos.
- **Diferencia:** una campaña es la iniciativa de marketing; el contrato establece el servicio que la agencia prestará.

### 7.2. Canales de difusión

- **Ruta:** `/canales-difusion`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** administrar el catálogo de medios que se utilizan al configurar campañas, como Facebook, TikTok o YouTube.
- **Uso típico:** indicar dónde corresponde difundir o analizar una campaña. Registrar un canal no conecta una cuenta ni publica un anuncio.

### 7.3. Audiencias

- **Ruta:** `/audiencias`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** organizar los públicos de las campañas y acceder a segmentos dinámicos de contactos, definidos mediante criterios como etiquetas, estado u origen.
- **Uso típico:** agrupar contactos interesados en determinado servicio, consultar quiénes cumplen los criterios y utilizar ese segmento en una automatización.
- **Diferencia:** un segmento agrupa contactos; una campaña organiza una acción de marketing. Configurarlo en el CRM no cambia una audiencia real en Meta o TikTok.

### 7.4. Contenido y aprobaciones

- **Ruta:** `/contenido`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** preparar piezas y textos de campaña y controlar su revisión mediante borrador, en revisión, aprobado o rechazado.
- **Uso típico:** revisar el contenido antes de asociarlo a un anuncio. El analista trabaja con borradores propios y los envía a revisión; no obtiene aprobación administrativa por el tipo de contrato.
- **Diferencia:** esta pantalla controla la pieza editorial; la carga de imágenes/videos y la revisión del material por el cliente se encuentran actualmente en la ficha del contrato.

### 7.5. Automatizaciones

- **Ruta:** `/automatizaciones`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** crear flujos a partir de segmentos de contactos, con tareas, email, WhatsApp, SMS, condiciones y esperas, y consultar ejecuciones y errores.
- **Uso típico:** programar un seguimiento cuando un contacto cumple los criterios del segmento.
- **Reglas:** los mensajes requieren configuración y consentimiento del canal. Guardar el flujo no lo activa; cada contacto se procesa una vez por automatización. La ejecución programada depende de su habilitación en el backend.

### 7.6. Cuentas publicitarias

- **Ruta:** `/cuentas-publicitarias`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** representar las cuentas publicitarias del catálogo local, con empresa, plataforma, nombre, código y moneda, para relacionarlas con anuncios.
- **Uso típico:** registrar una cuenta de demostración de Facebook de una empresa que contrata solo análisis.
- **Diferencia:** no es la ficha de la empresa, una cuenta de usuario ni una cuenta real conectada a la red social. Sus códigos son identificadores locales.

### 7.7. Anuncios y publicaciones

- **Ruta:** `/anuncios`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** registrar anuncios vinculados a contrato, cuenta publicitaria y campaña, con ID local, formato, fecha y contenido asociado. Permite consultar sus estadísticas y, con autorización, actualizar los datos de Mockaroo.
- **Uso típico:** registrar un video de una campaña, revisar/aprobar/programar su anuncio y registrar una publicación simulada.
- **Reglas:** solo análisis registra referencias de anuncios y no permite editarlos o publicarlos. La publicación exige las aprobaciones correspondientes. Subir o publicar aquí no envía el anuncio a una red social real.

### 7.8. Calendario editorial

- **Ruta:** `/calendario-editorial`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** consultar la agenda de anuncios/publicaciones por fecha y filtrar por contrato.
- **Uso típico:** comprobar qué piezas están previstas y consultar sus estados. Actualmente es una agenda paginada y ordenada por fecha; no publica automáticamente en redes al llegar la fecha.

### 7.9. Entregables

- **Ruta:** `/entregables`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** registrar el trabajo prometido en el servicio, con descripción, fecha, cantidad, prestación y estado, y controlar su aprobación/completado.
- **Uso típico:** llevar el cumplimiento de dos videos, cuatro publicaciones o un informe mensual. Los límites del contrato impiden completar cantidades superiores a las acordadas cuando el entregable tiene una prestación asignada.
- **Diferencia:** el entregable representa un compromiso de trabajo; el archivo es el material producido para cumplirlo.

### 7.10. Ficha del contrato (desde Contratos)

- **Ruta:** `/contratos/:id`; `/entregas?contrato=:id` redirige para conservar enlaces antiguos. No agrega una entrada al sidebar.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** centralizar el servicio y las herramientas aplicables a ese contrato:

  - **Materiales:** subir y previsualizar imágenes/videos, conservar versiones y solicitar aprobación al cliente.
  - **Comparación:** comparar anuncios y plataformas con el periodo anterior de igual duración.
  - **Informes PDF:** generar versiones conservadas, descargarlas y publicarlas para el cliente.
- **Uso típico:** seleccionar el contrato y el anuncio para entregar una pieza o revisar sus resultados.
- **Acceso:** administrador/líder gestionan materiales y publicación de PDF; el analista consulta y puede generar informes con permiso de Contenido. Solo análisis no habilita cargas. El alcance también puede impedir producción/edición aunque el servicio sea difusión o integral.
- **Organización actual:** está en el menú general. La propuesta de trasladar estas herramientas al interior de cada contrato se discutió, pero no se ha implementado ese cambio de navegación.

## 8. Resultados

### 8.1. Métricas e indicadores

- **Ruta:** `/metricas`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** consultar rendimiento publicitario, inversión, impresiones, clics, conversiones, CTR, CPC, CPM y otros indicadores; dispone de gráficos, mapa y exportación. Incluye acceso al registro de métricas y al embudo/ingresos.
- **Uso típico:** revisar el rendimiento de una campaña y sus resultados comerciales. El administrador puede sincronizar la fuente y registrar/anular gastos adicionales, según permisos y servicio.
- **Diferencia:** los datos agregados de campaña y los datos propios de anuncios de contratos se conservan separados para evitar duplicar la pauta. Las conversiones de la plataforma no equivalen automáticamente a leads ni ventas del CRM.

### 8.2. Análisis comparativo

- **Ruta:** `/analisis-comparativo`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** comparar los resultados agregados de campañas del módulo existente.
- **Uso típico:** contrastar campañas para identificar diferencias de desempeño.
- **Diferencia:** para comparar anuncios concretos, plataformas y periodos de un contrato se utiliza la pestaña Comparación de la ficha del contrato.

### 8.3. Reportes y exportación

- **Ruta:** `/reportes`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** consultar y exportar reportes de campañas y métricas por periodo, y acceder a reportes de ingresos/atribución.
- **Uso típico:** descargar un CSV para revisar resultados fuera del sistema.
- **Diferencia:** se orienta a datos operativos/comerciales del CRM; los PDF versionados destinados al cliente se gestionan en la ficha del contrato.

### 8.4. Atribución

- **Ruta:** `/atribucion`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** relacionar oportunidades ganadas con sus campañas de origen mediante primer origen, último origen o reparto lineal, y analizar ingresos, inversión y retorno sin mezclar monedas.
- **Uso típico:** estudiar qué campañas contribuyeron a las ventas registradas. Se consideran interacciones anteriores al cierre; los ingresos sintéticos de Mockaroo no se convierten en ventas ganadas.
- **Límite:** el ROI publicitario no incluye todos los costos del negocio ni sustituye contabilidad.

### 8.5. Metas y alertas

- **Ruta:** `/metas`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** establecer metas de campaña y revisar el avance de leads e ingresos en el periodo.
- **Uso típico:** detectar campañas que se alejan de los objetivos acordados. Las alertas de presupuesto y renovación del contrato también se muestran en su informe/avance, dentro del flujo de servicios.

### 8.6. Recomendaciones

- **Ruta:** `/recomendaciones`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** registrar hallazgos y próximas acciones, asociados a un contrato y opcionalmente a un anuncio.
- **Uso típico:** documentar que aumentó el CPC y recomendar revisar la creatividad. Son observaciones redactadas por el equipo, no recomendaciones generadas automáticamente ni cambios ejecutados en una plataforma.
- **Acceso:** redactar requiere Contenido; aprobar/completar requiere gestión.

### 8.7. Ajustes autorizados

- **Ruta:** `/ajustes`.
- **Visible para:** administrador y líder.
- **Para qué sirve:** registrar propuestas de ajuste, su justificación y aprobación. El importe de un ajuste completado incrementa el presupuesto autorizado dentro del CRM.
- **Uso típico:** aprobar un incremento de presupuesto después de revisar resultados de una campaña.
- **Reglas:** el incremento no es gasto ejecutado ni modifica un presupuesto real en Meta/TikTok. Solo análisis no permite estos ajustes publicitarios.

### 8.8. Informes por contrato

- **Ruta:** `/informes-contrato`.
- **Visible para:** administrador, líder y analista.
- **Para qué sirve:** seleccionar un contrato y consultar automáticamente su resumen: condiciones, inversión, métricas descargadas de sus anuncios, evolución, trabajos e historial. Permite exportar el informe de consulta.
- **Uso típico:** revisar los resultados del servicio de una empresa sin crear un informe manual primero.
- **Dos partes:** arriba se consulta el resumen de resultados; debajo se listan los informes redactados con conclusiones. Si faltan estadísticas, se descargan desde Anuncios. Para generar y entregar versiones PDF se usa la ficha del contrato.

## 9. Configuración

### 9.1. Gestión de usuarios

- **Ruta:** `/usuarios`.
- **Visible para:** administrador.
- **Para qué sirve:** administrar las cuentas de las personas que ingresan al sistema, su estado y rol.
- **Uso típico:** crear usuarios del equipo o un usuario con rol Cliente. Una empresa registrada no se convierte automáticamente en un usuario con acceso al portal.

### 9.2. Roles y permisos

- **Ruta:** `/roles-permisos`.
- **Visible para:** administrador.
- **Para qué sirve:** administrar las autorizaciones de cada rol para las funciones del sistema.
- **Uso típico:** revisar qué operaciones tiene permitidas un líder o analista. Se mantienen los límites de negocio del backend: agregar un código de permiso no convierte al analista en administrador ni permite que un Cliente entre al CRM interno.

### 9.3. Campos personalizados

- **Ruta:** `/campos-personalizados`.
- **Visible para:** administrador.
- **Para qué sirve:** definir datos adicionales tipados para las fichas de contactos.
- **Uso típico:** añadir información particular que necesita la agencia sin crear un módulo nuevo. El catálogo es administrativo; la lectura/edición de valores sigue los permisos de la ficha.

### 9.4. Canales de comunicación

- **Ruta:** `/integraciones`.
- **Visible para:** administrador.
- **Para qué sirve:** consultar la configuración y seguimiento de WhatsApp Cloud, correo SMTP y Twilio SMS. Incluye la bandeja de mensajes recibidos de WhatsApp y su vinculación con contactos.
- **Uso típico:** revisar si el canal está configurado y consultar confirmaciones de mensajes. Los envíos se preparan desde Automatizaciones.
- **Diferencia:** WhatsApp/email/SMS sirven para comunicarse con contactos; Facebook/TikTok/YouTube del catálogo de difusión representan medios de publicidad. Aceptación por el proveedor no siempre acredita entrega; WhatsApp puede aportar estados verificados mediante webhook.

### 9.5. Auditoría

- **Ruta:** `/auditoria`.
- **Visible para:** administrador.
- **Para qué sirve:** consultar acciones relevantes con registro, autor y fecha, como cambios de estado, inversiones, decisiones de aprobación y accesos.
- **Uso típico:** comprobar quién realizó una operación. Es un registro de consulta; no se editan sus eventos desde esta pantalla.

### 9.6. Catálogo de servicios

- **Ruta:** `/servicios`.
- **Visible en sidebar para:** administrador.
- **Para qué sirve:** consultar los tres servicios principales y habilitarlos o deshabilitarlos para nuevas contrataciones: gestión y difusión, monitoreo/análisis e integral.
- **Uso típico:** decidir qué modalidades ofrece la agencia. Deshabilitar una modalidad no borra los contratos existentes.
- **Nota:** el líder puede abrir la ruta de consulta, pero no tiene un enlace en su sidebar ni permiso administrativo para cambiar el catálogo.

### 9.7. Accesos al portal

- **Ruta:** `/accesos-portal`.
- **Visible para:** administrador.
- **Para qué sirve:** vincular un usuario con rol Cliente a una empresa y activar o revocar su acceso al portal.
- **Uso típico:** después de crear al usuario Cliente, asignarle su empresa. Ese usuario solo podrá consultar contratos, materiales, resultados e informes autorizados de esa empresa.
- **Diferencia:** Gestión de usuarios crea/administra la cuenta; Accesos al portal establece a qué empresa puede entrar.

## 10. Qué ve cada rol en el sidebar

### Administrador

Ve los 31 enlaces descritos, distribuidos en Dashboard, CRM, Clientes, Marketing, Resultados y Configuración.

### Líder / Project Manager

Ve los mismos grupos operativos que el administrador, salvo Configuración: 24 enlaces. No tiene en su sidebar Gestión de usuarios, Roles y permisos, Campos personalizados, Canales de comunicación, Auditoría, Catálogo de servicios ni Accesos al portal.

### Analista

| Grupo | Enlaces visibles |
| --- | --- |
| Dashboard | Dashboard. |
| CRM | Contactos / Leads; Actividades. |
| Marketing | Campañas; Audiencias; Contenido y aprobaciones; Anuncios y publicaciones; Calendario editorial; Entregables; Contratos. |
| Resultados | Métricas e indicadores; Análisis comparativo; Reportes y exportación; Atribución; Recomendaciones; Informes por contrato. |

Son 16 enlaces. No ve Pipeline, Clientes / Empresas, Cotizaciones, Canales de difusión, Automatizaciones, Cuentas publicitarias, Metas y alertas, Ajustes autorizados ni Configuración.

### Cliente

No usa el sidebar de la agencia. Accede al portal privado `/portal` y puede seleccionar sus contratos, consultar condiciones/entregables/resultados, revisar materiales y descargar los PDF publicados para su empresa. Aprobar un material no publica anuncios reales.

## 11. Secciones relacionadas que no tienen enlace propio en el sidebar

| Sección | Dónde se encuentra | Para qué sirve |
| --- | --- | --- |
| Ficha de empresa | Dentro de Clientes / Empresas. | Reunir las relaciones y el historial de la empresa. |
| Ficha de contacto | Dentro de Contactos / Leads. | Ver seguimiento, interacciones, consentimientos y archivos de la persona. |
| Captación de leads | Dentro de Campañas, según rol. | Configurar formularios y registrar contactos con origen. |
| Segmentos dinámicos | Dentro de Audiencias; ruta `/segmentos`. | Calcular qué contactos cumplen criterios y exportarlos. |
| Scoring | Ruta `/scoring`, administrador/líder. | Gestionar reglas de puntuación de contactos. |
| Etapas del pipeline | Ruta `/pipeline/etapas`, administrador. | Configurar las etapas comerciales. |
| Editor visual de automatización | Desde una automatización. | Diseñar pasos, condiciones y esperas. |
| Recepción y entrega de WhatsApp | Dentro de Canales de comunicación. | Consultar mensajes, vinculaciones y estados verificados. |
| Prestaciones del contrato | Formulario de cotización/contrato. | Definir capacidades y cantidades del servicio. |
| Materiales, comparación y versiones PDF | Pestañas de la ficha del contrato. | Producir/revisar materiales, analizar anuncios y entregar informes. |
| Portal del cliente | Ruta independiente `/portal`. | Acceso exclusivo de un Cliente a su empresa. |

**Cerrar sesión** es una acción fija al pie del sidebar, no un módulo: elimina la sesión local y vuelve al login.

## 12. Diferencias que ayudan a entender el menú

| Conceptos parecidos | Diferencia |
| --- | --- |
| Empresa / Usuario | La empresa contrata servicios; el usuario es una persona que puede iniciar sesión. |
| Cotización / Contrato | La cotización propone condiciones; el contrato organiza el servicio acordado. |
| Contrato / Campaña | El contrato define qué hará la agencia; la campaña organiza una iniciativa publicitaria. |
| Campaña / Anuncio | La campaña agrupa la acción de marketing; el anuncio es una pieza o referencia concreta con estadísticas propias. |
| Audiencia / Contacto | La audiencia/segmento agrupa personas; el contacto es una ficha individual. |
| Contenido / Material multimedia | Contenido organiza texto y revisión editorial; el material es el archivo de imagen/video asociado al anuncio. |
| Entregable / la ficha del contrato | Entregable controla el compromiso de trabajo; la ficha del contrato contiene herramientas de archivos, comparación y PDF. |
| Recomendación / Ajuste | La recomendación propone qué hacer; un ajuste aprobado/completado registra un cambio autorizado dentro del CRM. |
| Métricas / Atribución | Métricas mide desempeño; Atribución relaciona las ventas registradas con los orígenes de marketing. |
| Informes por contrato / PDF versionado | El primero consulta el resumen actual; el segundo conserva una versión entregable que no cambia al actualizar los datos. |
| Presupuesto / Gasto / Honorarios | Presupuesto es autorización de pauta; gasto es lo ejecutado; honorarios son el precio del servicio de la agencia. |
| Difusión / Comunicación | Difusión identifica medios publicitarios; Comunicación gestiona mensajes a contactos. |

## 13. Fuentes del inventario

Inventario contrastado con los archivos locales:

- `src/utils/modulosPorRol.js`: nombres, grupos y enlaces visibles por rol.
- `src/componentes/sidebar/Sidebar.jsx` y `funciones.js`: representación del menú y selección por rol.
- `src/rutas/RutasAplicacion.jsx`: rutas y acceso por grupos.
- `src/screens/agencia/` y `src/screens/crm/`: funciones de las pantallas.
- `docs/CONTRATOS_Y_SERVICIOS.md` y `docs/FASES_FINALES_CRM.md`: reglas y límites de servicios/entregas.

El documento describe la versión del código local; una instancia publicada puede seguir mostrando otra versión hasta actualizar su frontend y backend.
