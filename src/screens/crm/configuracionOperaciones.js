const campo = (id, nombre, tipo = "text", extra = {}) => ({
  id,
  nombre,
  tipo,
  ...extra,
});
const seleccion = (id, nombre, opciones, requerido = true) =>
  campo(id, nombre, "select", { opciones, requerido });
const lista = (id, nombre, catalogo, requerido = true) =>
  campo(id, nombre, "select", { catalogo, requerido });
const numero = (id, nombre, min = 0, max = 999999999999.99) =>
  campo(id, nombre, "number", { min, max });
const nombre = campo("nombre", "Nombre", "text", {
  requerido: true,
  maxLength: 160,
});
const responsable = lista("responsable_id", "Responsable", "responsables");
const campana = lista("campana_id", "Campaña", "campanas");
const texto = (id, nombre, maxLength = 4000) =>
  campo(id, nombre, "textarea", { maxLength });
const estados = ["NUEVO", "CONTACTADO", "CALIFICADO", "CLIENTE", "DESCARTADO"];
export const operaciones = {
  pipeline: {
    titulo: "Pipeline de oportunidades",
    descripcion:
      "Organiza el embudo, asigna responsables y registra cierres reales.",
    campos: [
      nombre,
      lista("contacto_id", "Contacto", "contactos"),
      lista("etapa_id", "Etapa", "etapas"),
      responsable,
      numero("valor", "Valor"),
      seleccion("moneda", "Moneda", ["PEN", "USD", "EUR"]),
      numero("probabilidad", "Probabilidad (%)", 0, 100),
      campo("fecha_cierre", "Cierre estimado", "date", { requerido: true }),
      texto("motivo_perdida", "Motivo de pérdida", 1000),
    ],
    columnas: [
      "nombre",
      "etapa_id",
      "responsable_id",
      "valor",
      "moneda",
      "fecha_cierre",
    ],
  },
  etapas: {
    titulo: "Etapas del pipeline",
    descripcion:
      "Los tipos ganada y perdida determinan los resultados de las oportunidades. El orden debe ser único.",
    campos: [
      nombre,
      numero("orden", "Orden", 0, 1000),
      seleccion("tipo", "Tipo", ["ABIERTA", "GANADA", "PERDIDA"]),
    ],
    columnas: ["nombre", "orden", "tipo"],
  },
  actividades: {
    titulo: "Actividades y tareas",
    descripcion:
      "Llamadas, reuniones y seguimiento. El analista gestiona únicamente sus propias tareas.",
    campos: [
      nombre,
      seleccion("tipo", "Tipo", [
        "LLAMADA",
        "REUNION",
        "SEGUIMIENTO",
        "RECORDATORIO",
      ]),
      seleccion("estado", "Estado", ["PENDIENTE", "COMPLETADA", "CANCELADA"]),
      campo("fecha", "Fecha y hora", "datetime-local", { requerido: true }),
      responsable,
      lista("contacto_id", "Contacto", "contactos", false),
      lista("cuenta_id", "Empresa (alternativa al contacto)", "cuentas", false),
      lista(
        "oportunidad_id",
        "Oportunidad (alternativa al contacto)",
        "oportunidades",
        false,
      ),
      texto("descripcion", "Descripción"),
    ],
    columnas: ["nombre", "tipo", "fecha", "estado", "responsable_id"],
  },
  segmentos: {
    titulo: "Segmentos dinámicos",
    descripcion:
      "Las condiciones se combinan con Y y se evalúan sobre los contactos actuales.",
    campos: [
      nombre,
      seleccion("estado", "Estado", estados, false),
      campo("etiqueta", "Etiqueta exacta", "text", { maxLength: 120 }),
      campo("origen", "Origen exacto", "text", { maxLength: 120 }),
      lista("etapa_id", "Etapa de oportunidad", "etapas", false),
      numero(
        "sin_actividad_dias",
        "Sin actividad en los últimos días",
        0,
        3650,
      ),
    ],
    columnas: ["nombre", "estado", "etiqueta", "origen", "sin_actividad_dias"],
  },
  scoring: {
    titulo: "Reglas de puntuación",
    descripcion:
      "Cada regla coincidente suma sus puntos una vez. El resultado se muestra en la ficha del contacto.",
    campos: [
      nombre,
      seleccion("campo", "Criterio", [
        "ESTADO",
        "ETIQUETA",
        "ORIGEN",
        "ACTIVIDAD_COMPLETADA",
      ]),
      campo("valor", "Valor exacto del criterio", "text", {
        requerido: true,
        maxLength: 120,
      }),
      numero("puntos", "Puntos", -1000, 1000),
    ],
    columnas: ["nombre", "campo", "valor", "puntos"],
  },
  metas: {
    titulo: "Metas por campaña",
    descripcion:
      "Define objetivos de captación e ingresos por período y moneda.",
    campos: [
      nombre,
      campana,
      campo("desde", "Inicio", "date", { requerido: true }),
      campo("hasta", "Fin", "date", { requerido: true }),
      numero("leads", "Objetivo de leads", 0, 10000000),
      numero("ingresos", "Objetivo de ingresos"),
      seleccion("moneda", "Moneda", ["PEN", "USD", "EUR"]),
    ],
    columnas: [
      "nombre",
      "campana_id",
      "desde",
      "hasta",
      "leads",
      "ingresos",
      "moneda",
    ],
  },
  contenido: {
    titulo: "Contenido y aprobaciones",
    descripcion:
      "Prepara piezas, envíalas a revisión y registra la decisión del líder.",
    campos: [
      nombre,
      { ...campana, requerido: false },
      responsable,
      seleccion("estado", "Estado", [
        "BORRADOR",
        "EN_REVISION",
        "APROBADO",
        "RECHAZADO",
      ]),
      { ...texto("texto", "Contenido", 10000), requerido: true },
      texto("observacion", "Observación de revisión", 1000),
    ],
    columnas: ["nombre", "campana_id", "responsable_id", "estado"],
  },
  automatizaciones: {
    titulo: "Automatizaciones",
    descripcion:
      "Cada contacto que entra al segmento recibe una acción una sola vez por flujo. Email requiere consentimiento MARKETING / EMAIL vigente.",
    campos: [
      nombre,
      lista("segmento_id", "Segmento", "segmentos"),
      seleccion("accion", "Acción", ["CREAR_TAREA", "EMAIL"]),
      campo("asunto", "Asunto / nombre de tarea", "text", {
        requerido: true,
        maxLength: 160,
      }),
      texto("mensaje", "Mensaje (admite {{nombre}})", 10000),
      campo("activa", "Flujo activo", "checkbox"),
    ],
    columnas: ["nombre", "segmento_id", "accion", "activa"],
  },
  integraciones: {
    titulo: "Canales de comunicación",
    descripcion: "Gestiona la comunicación y consulta la fuente de rendimiento publicitario.",
    campos: [],
    columnas: [],
  },
  auditoria: {
    titulo: "Auditoría de cambios",
    descripcion:
      "Registro de acciones, autor y fecha. Los registros de auditoría son de solo lectura.",
    campos: [],
    columnas: ["recurso", "registro_id", "accion", "autor_id", "created_at"],
  },
};
export const etiquetas = {
  nombre: "Nombre",
  estado: "Estado",
  tipo: "Tipo",
  orden: "Orden",
  etapa_id: "Etapa",
  responsable_id: "Responsable",
  contacto_id: "Contacto",
  campana_id: "Campaña",
  fecha_cierre: "Cierre estimado",
  fecha: "Fecha y hora",
  valor: "Valor",
  moneda: "Moneda",
  etiqueta: "Etiqueta",
  origen: "Origen",
  sin_actividad_dias: "Sin actividad (días)",
  campo: "Criterio",
  puntos: "Puntos",
  desde: "Inicio",
  hasta: "Fin",
  leads: "Leads",
  ingresos: "Ingresos",
  segmento_id: "Segmento",
  activa: "Activo",
  accion: "Acción",
  campana_externa: "Campaña Meta",
  recurso: "Recurso",
  registro_id: "Registro",
  autor_id: "Autor",
  created_at: "Fecha",
  contacto: "Contacto",
  total: "Total",
  cantidad: "Cantidad",
  detalle: "Detalle",
  id: "ID",
};
