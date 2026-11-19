import { useMemo } from "react";

function trazado(geometria) {
  const poligonos =
    geometria.type === "Polygon"
      ? [geometria.coordinates]
      : geometria.coordinates;
  return poligonos
    .flatMap((poligono) =>
      poligono.map(
        (anillo) =>
          anillo
            .map(([lng, lat], i) => `${i ? "L" : "M"}${lng + 180},${90 - lat}`)
            .join(" ") + "Z",
      ),
    )
    .join(" ");
}

// La misma geografía y los mismos resultados, para equipos sin aceleración WebGL.
export default function MapaPaisesAlternativo({
  regiones,
  seleccionado,
  seleccionar,
}) {
  const formas = useMemo(
    () => regiones.map((r) => ({ ...r, trazo: trazado(r.geometry) })),
    [regiones],
  );
  return (
    <div className="portal-mapa-alternativo">
      <p>Vista 2D · WebGL no disponible</p>
      <svg
        viewBox="0 0 360 180"
        aria-label="Mapa mundial de resultados por país"
      >
        {formas.map((r, i) => (
          <path
            key={`${r.properties.iso}-${i}`}
            d={r.trazo}
            fill={r.properties.color}
            stroke={r.properties.iso === seleccionado ? "#173e7a" : "white"}
            strokeWidth={r.properties.iso === seleccionado ? 0.8 : 0.25}
            fillRule="evenodd"
            role={r.properties.conDatos ? "button" : undefined}
            tabIndex={r.properties.conDatos ? 0 : undefined}
            aria-label={
              r.properties.conDatos
                ? `Filtrar por ${r.properties.nombre}`
                : undefined
            }
            onClick={() => {
              if (r.properties.conDatos) seleccionar(r.properties.iso);
            }}
            onKeyDown={(e) => {
              if (r.properties.conDatos && ["Enter", " "].includes(e.key)) {
                e.preventDefault();
                seleccionar(r.properties.iso);
              }
            }}
          >
            <title>{r.properties.tooltip}</title>
          </path>
        ))}
      </svg>
    </div>
  );
}
