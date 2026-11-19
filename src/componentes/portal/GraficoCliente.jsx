import { useId, useMemo } from "react";
import { numero, serieDiaria } from "../../utils/analiticaPortal";

export default function GraficoCliente({
  titulo,
  registros,
  campos,
  moneda,
  compacto = false,
}) {
  const id = useId();
  const serie = useMemo(
    () => serieDiaria(registros, moneda),
    [registros, moneda],
  );
  const max = serie.reduce(
    (mayor, r) => campos.reduce((m, [k]) => Math.max(m, r[k]), mayor),
    1,
  );
  const inicio = serie.length ? Date.parse(serie[0].fecha) : 0;
  const duracion = serie.length ? Date.parse(serie.at(-1).fecha) - inicio : 0;
  const puntos = (campo) =>
    serie
      .map(
        (r) =>
          `${32 + (duracion ? (Date.parse(r.fecha) - inicio) / duracion : 0.5) * 250},${99 - (r[campo] / max) * 76}`,
      )
      .join(" ");
  const descripcion = campos
    .map(
      ([k, n]) =>
        `${n}: ${numero(
          serie.reduce((s, r) => s + r[k], 0),
          moneda ? 2 : 0,
        )}${moneda ? ` ${moneda}` : ""}`,
    )
    .join(". ");
  return (
    <section
      className={`portal-grafico ${compacto ? "portal-grafico-compacto" : ""}`}
    >
      <h3>{titulo}</h3>
      {!serie.length ? (
        <p className="portal-sin-datos">Sin datos del periodo</p>
      ) : (
        <>
          <div className="portal-leyenda-grafico">
            {campos.map(([k, n, c]) => (
              <span key={k}>
                <i style={{ background: c }} />
                {n}
              </span>
            ))}
          </div>
          <svg viewBox="0 0 300 130" role="img" aria-labelledby={id}>
            <title id={id}>
              {titulo}. {descripcion}. Del {serie[0].fecha} al{" "}
              {serie.at(-1).fecha}.
            </title>
            {[23, 61, 99].map((y) => (
              <line key={y} x1="32" y1={y} x2="282" y2={y} stroke="#e9eef5" />
            ))}
            <text x="1" y="26">
              {numero(max >= 1000 ? max / 1000 : max, 1)}
              {max >= 1000 ? "k" : ""}
            </text>
            <text x="12" y="102">
              0
            </text>
            {campos.map(([k, , color]) => (
              <g key={k}>
                <polyline
                  points={puntos(k)}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {serie.length === 1 && (
                  <circle
                    cx="157"
                    cy={99 - (serie[0][k] / max) * 76}
                    r="3"
                    fill={color}
                  />
                )}
              </g>
            ))}
            <text x="32" y="122">
              {serie[0].fecha.slice(8)} / {serie[0].fecha.slice(5, 7)}
            </text>
            <text x="282" y="122" textAnchor="end">
              {serie.at(-1).fecha.slice(8)} / {serie.at(-1).fecha.slice(5, 7)}
            </text>
          </svg>
        </>
      )}
    </section>
  );
}
