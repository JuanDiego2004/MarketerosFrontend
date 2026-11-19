// Compara importes con centavos enteros para evitar diferencias de coma flotante.
export function centavosContrato(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return 0n;
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(texto);
  return partes ? BigInt(partes[1]) * 100n + BigInt((partes[2] || "").padEnd(2, "0")) : null;
}

export function presupuestoContrato(form) {
  const filas = (form.piezas || []).flatMap((pieza, i) =>
    (pieza.canales || []).map(canal => ({
      material: pieza.titulo || `Pieza ${i + 1}`,
      plataforma: canal.plataforma,
      centavos: centavosContrato(canal.presupuesto),
    })),
  );
  const autorizado = centavosContrato(form.presupuesto);
  const valido = autorizado !== null && filas.every(fila => fila.centavos !== null);
  const distribuido = valido ? filas.reduce((total, fila) => total + fila.centavos, 0n) : null;
  return { filas, autorizado, distribuido, valido, exceso: valido && distribuido > autorizado ? distribuido - autorizado : 0n };
}

export function mostrarPauta(centavos, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda, minimumFractionDigits: 2 }).format(Number(centavos) / 100);
}

export function importePauta(centavos) {
  return `${centavos / 100n}.${String(centavos % 100n).padStart(2, "0")}`;
}
