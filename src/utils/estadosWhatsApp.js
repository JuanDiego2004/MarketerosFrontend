export const estadoWhatsApp = (estado) => ({
  SENT: "Enviado", DELIVERED: "Entregado", READ: "Leído", FAILED: "Fallido",
  SIN_CONFIRMACION: "Sin confirmación",
})[estado] || "Sin confirmación";
export const tipoWhatsApp = (tipo) => ({text:"Texto",image:"Imagen",video:"Video",audio:"Audio",document:"Documento",button:"Botón",interactive:"Respuesta interactiva",reaction:"Reacción",location:"Ubicación",contacts:"Contacto"})[tipo] || "Otro mensaje";
