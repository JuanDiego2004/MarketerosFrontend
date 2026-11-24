const radianes = (valor) => (valor * Math.PI) / 180;
function distancia(a, b) {
  const latA = radianes(a.lat),
    latB = radianes(b.lat);
  return (
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Math.sin(latA) * Math.sin(latB) +
            Math.cos(latA) * Math.cos(latB) * Math.cos(radianes(a.lng - b.lng)),
        ),
      ),
    ) *
      180) /
    Math.PI
  );
}

// Limitar etiquetas, no resultados: los puntos y los países siguen siendo seleccionables.
export function distribuirSenales(candidatos, limite = 14) {
  const elegidos = [];
  const orden = [...candidatos]
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .sort(
      (a, b) =>
        Number(Boolean(b.seleccionada)) - Number(Boolean(a.seleccionada)) ||
        b.valor - a.valor ||
        a.clave.localeCompare(b.clave),
    );
  for (const candidato of orden) {
    if (elegidos.length >= limite) break;
    if (
      candidato.seleccionada ||
      elegidos.every((p) => distancia(p, candidato) > 17)
    )
      elegidos.push(candidato);
  }
  return elegidos.map((p, i) => ({
    ...p,
    lado: i % 2 ? "izquierdo" : "derecho",
  }));
}
