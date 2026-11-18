// CSV RFC 4180: comas, comillas escapadas y saltos de línea dentro de celdas.
export function leerCsvCrm(texto) {
  const filas = [];
  let fila = [],
    celda = "",
    comillas = false,
    cerrada = false;
  const fuente = texto.replace(/^\uFEFF/, "");
  for (let i = 0; i < fuente.length; i++) {
    const c = fuente[i];
    if (comillas) {
      if (c === '"' && fuente[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        comillas = false;
        cerrada = true;
      } else celda += c;
    } else if (c === '"' && !celda && !cerrada) comillas = true;
    else if (c === ",") {
      fila.push(celda);
      celda = "";
      cerrada = false;
    } else if (c === "\n" || c === "\r") {
      fila.push(celda);
      if (fila.some((v) => v.trim())) filas.push(fila);
      fila = [];
      celda = "";
      cerrada = false;
      if (c === "\r" && fuente[i + 1] === "\n") i++;
    } else if (cerrada || c === '"')
      throw new Error(
        "CSV inválido: revisa las comillas y separa las columnas con comas.",
      );
    else celda += c;
  }
  if (comillas) throw new Error("El CSV contiene comillas sin cerrar.");
  fila.push(celda);
  if (fila.some((v) => v.trim())) filas.push(fila);
  if (filas.length < 2)
    throw new Error("El CSV debe incluir encabezados y al menos un contacto.");
  const cabecera = filas.shift().map((v) => v.trim());
  const permitidas = [
    "nombre",
    "correo",
    "telefono",
    "estado",
    "origen",
    "etiquetas",
    "cuentaId",
    "campanaId",
    "responsableId",
  ];
  if (
    !cabecera.includes("nombre") ||
    new Set(cabecera).size !== cabecera.length ||
    cabecera.some((c) => !permitidas.includes(c))
  )
    throw new Error(
      "Usa los encabezados de la plantilla CSV; nombre es obligatorio.",
    );
  if (filas.length > 500)
    throw new Error("Importa como máximo 500 contactos por archivo.");
  return filas.map((valores, i) => {
    if (valores.length !== cabecera.length)
      throw new Error(`Fila ${i + 2}: el número de columnas no coincide.`);
    const dato = Object.fromEntries(
      cabecera.map((c, j) => [c, valores[j].trim()]),
    );
    if (!dato.nombre || (!dato.correo && !dato.telefono))
      throw new Error(`Fila ${i + 2}: indica nombre y correo o teléfono.`);
    for (const campo of ["cuentaId", "campanaId", "responsableId"]) {
      if (dato[campo] && !/^\d+$/.test(dato[campo]))
        throw new Error(`Fila ${i + 2}: ${campo} debe ser un ID numérico.`);
      dato[campo] = dato[campo] ? Number(dato[campo]) : null;
    }
    return {
      ...dato,
      estado: dato.estado || "NUEVO",
      origen: dato.origen || "CSV",
    };
  });
}
