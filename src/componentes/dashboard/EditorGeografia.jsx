import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  guardarCoberturaDashboard,
  obtenerDetalleDashboard,
  guardarResultadoDashboard,
  quitarCoberturaDashboard,
  quitarResultadoDashboard,
} from "../../servicios/servicioAdministrador";
import { numero } from "./datosMarketing";

const CAMPOS_RESULTADO = [
  "impresiones",
  "clics",
  "conversiones",
  "inversion",
  "ingresos",
];
const INICIAL = {
  pais: "",
  codigoPais: "",
  ciudad: "",
  latitud: "",
  longitud: "",
};

export default function EditorGeografia({
  campana,
  datos,
  token,
  apiBase,
  desde,
  hasta,
  puedeCobertura,
  cerrar,
  alGuardar,
}) {
  const dialogo = useRef(null);
  const [tab, setTab] = useState(puedeCobertura ? "cobertura" : "resultados");
  const [lugar, setLugar] = useState(INICIAL),
    [ubicacion, setUbicacion] = useState("");
  const [metrica, setMetrica] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [valores, setValores] = useState(
    Object.fromEntries(CAMPOS_RESULTADO.map((c) => [c, "0"])),
  );
  const [error, setError] = useState(""),
    [ocupado, setOcupado] = useState(false);
  const ubicaciones = useMemo(
    () => [
      ...new Map(
        datos.ubicaciones
          .filter((u) => String(u.idCampana) === String(campana.idCampana))
          .map((u) => [String(u.idUbicacion), u]),
      ).values(),
    ],
    [datos, campana],
  );
  const metricas = detalle?.metricas || [];
  const cobertura = datos.ubicaciones.filter(
    (u) =>
      u.vista === "COBERTURA" &&
      String(u.idCampana) === String(campana.idCampana),
  );
  const original = metricas.find((m) => String(m.idMetrica) === metrica);
  const desglose = detalle?.resultadosGeograficos.find(
    (r) =>
      String(r.idMetrica) === metrica && String(r.idUbicacion) === ubicacion,
  );
  useEffect(() => {
    const elemento = dialogo.current;
    elemento.showModal();
    return () => elemento.close();
  }, []);

  useEffect(() => {
    if (tab !== "resultados" || detalle) return;
    const controlador = new AbortController();
    obtenerDetalleDashboard(
      token,
      apiBase,
      campana.idCampana,
      desde,
      hasta,
      controlador.signal,
    )
      .then((valor) => {
        if (!controlador.signal.aborted) {
          setDetalle(valor);
          setError("");
        }
      })
      .catch((e) => {
        if (!controlador.signal.aborted) setError(e.message);
      });
    return () => controlador.abort();
  }, [tab, detalle, token, apiBase, campana.idCampana, desde, hasta]);

  function elegir(m, u) {
    setMetrica(m);
    setUbicacion(u);
    const actual = detalle?.resultadosGeograficos.find(
      (r) => String(r.idMetrica) === m && String(r.idUbicacion) === u,
    );
    setValores(
      Object.fromEntries(
        CAMPOS_RESULTADO.map((c) => [c, String(actual?.[c] || 0)]),
      ),
    );
  }
  async function ejecutar(accion) {
    setOcupado(true);
    setError("");
    try {
      await accion();
      alGuardar();
    } catch (e) {
      setError(e.message);
      setOcupado(false);
    }
  }
  function guardar(e) {
    e.preventDefault();
    if (tab === "cobertura")
      ejecutar(() =>
        guardarCoberturaDashboard(token, apiBase, campana.idCampana, {
          ...lugar,
          codigoPais: lugar.codigoPais.toUpperCase(),
          latitud: Number(lugar.latitud),
          longitud: Number(lugar.longitud),
        }),
      );
    else
      ejecutar(() =>
        guardarResultadoDashboard(
          token,
          apiBase,
          metrica,
          ubicacion,
          Object.fromEntries(
            CAMPOS_RESULTADO.map((c) => [c, Number(valores[c])]),
          ),
        ),
      );
  }
  return (
    <dialog
      className="marketing-dialogo"
      ref={dialogo}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) cerrar();
      }}
      aria-labelledby="titulo-geografia"
    >
      <div className="marketing-panel-titulo">
        <div>
          <span className="marketing-eyebrow">{campana.nombre}</span>
          <h2 id="titulo-geografia">Geografía de campaña</h2>
        </div>
        <button
          className="marketing-boton marketing-boton-icono"
          disabled={ocupado}
          aria-label="Cerrar geografía"
          onClick={cerrar}
        >
          <X size={18} />
        </button>
      </div>
      <div className="marketing-segmentado">
        {puedeCobertura && (
          <button
            disabled={ocupado}
            aria-pressed={tab === "cobertura"}
            onClick={() => setTab("cobertura")}
          >
            Cobertura
          </button>
        )}
        <button
          disabled={ocupado}
          aria-pressed={tab === "resultados"}
          onClick={() => setTab("resultados")}
        >
          Resultados
        </button>
      </div>
      <form onSubmit={guardar}>
        {tab === "resultados" && !detalle && !error && (
          <p className="marketing-ayuda" role="status">
            Consultando el desglose de esta campaña…
          </p>
        )}
        <fieldset
          disabled={ocupado || (tab === "resultados" && !detalle)}
          className="marketing-formulario"
        >
          {tab === "cobertura" ? (
            <>
              <p className="marketing-ayuda marketing-ancho">
                Registra el país o ciudad objetivo. Para un país completo, deja
                la ciudad vacía y utiliza sus coordenadas representativas.
              </p>
              {[
                ["pais", "País", "text"],
                ["codigoPais", "Código ISO de país (PE, CO, MX…)", "text"],
                ["ciudad", "Ciudad (opcional)", "text"],
                ["latitud", "Latitud", "number"],
                ["longitud", "Longitud", "number"],
              ].map(([campo, etiqueta, tipo]) => (
                <label className="marketing-campo" key={campo}>
                  {etiqueta}
                  <input
                    type={tipo}
                    required={campo !== "ciudad"}
                    maxLength={
                      campo === "codigoPais"
                        ? 2
                        : campo === "ciudad"
                          ? 150
                          : 100
                    }
                    pattern={campo === "codigoPais" ? "[A-Za-z]{2}" : undefined}
                    min={
                      campo === "latitud"
                        ? -90
                        : campo === "longitud"
                          ? -180
                          : undefined
                    }
                    max={
                      campo === "latitud"
                        ? 90
                        : campo === "longitud"
                          ? 180
                          : undefined
                    }
                    step={tipo === "number" ? "0.0000001" : undefined}
                    value={lugar[campo]}
                    onChange={(e) =>
                      setLugar({ ...lugar, [campo]: e.target.value })
                    }
                  />
                </label>
              ))}
            </>
          ) : (
            <>
              <p className="marketing-ayuda marketing-ancho">
                Distribuye una métrica registrada entre ubicaciones. El total
                distribuido debe caber dentro de la métrica original. Los
                importes están en PEN.
              </p>
              <label className="marketing-campo">
                Métrica del período
                <select
                  required
                  value={metrica}
                  onChange={(e) => elegir(e.target.value, ubicacion)}
                >
                  <option value="">Seleccionar métrica</option>
                  {metricas.map((m) => (
                    <option key={m.idMetrica} value={m.idMetrica}>
                      #{m.idMetrica} · {m.fecha} · {numero(m.impresiones)}{" "}
                      impresiones
                    </option>
                  ))}
                </select>
              </label>
              <label className="marketing-campo">
                Ubicación
                <select
                  required
                  value={ubicacion}
                  onChange={(e) => elegir(metrica, e.target.value)}
                >
                  <option value="">Seleccionar ubicación</option>
                  {ubicaciones.map((u) => (
                    <option key={u.idUbicacion} value={u.idUbicacion}>
                      {u.ciudad || "Todo el país"}, {u.pais}
                    </option>
                  ))}
                </select>
              </label>
              {CAMPOS_RESULTADO.map((campo) => (
                <label className="marketing-campo" key={campo}>
                  {campo === "inversion"
                    ? "Inversión"
                    : campo.charAt(0).toUpperCase() + campo.slice(1)}
                  {original && (
                    <small>Total original {numero(original[campo])}</small>
                  )}
                  <input
                    type="number"
                    min="0"
                    max={original?.[campo]}
                    step={
                      ["inversion", "ingresos"].includes(campo)
                        ? "0.000001"
                        : "1"
                    }
                    required
                    value={valores[campo]}
                    onChange={(e) =>
                      setValores({ ...valores, [campo]: e.target.value })
                    }
                  />
                </label>
              ))}
              {!ubicaciones.length && (
                <p className="marketing-ayuda marketing-ancho">
                  Primero registra una ubicación de cobertura para esta campaña.
                </p>
              )}
            </>
          )}
          {error && (
            <p className="marketing-error marketing-ancho" role="alert">
              {error}
            </p>
          )}
          <div className="marketing-formulario-acciones marketing-ancho">
            {tab === "resultados" && desglose && (
              <button
                className="marketing-boton"
                type="button"
                onClick={() =>
                  ejecutar(() =>
                    quitarResultadoDashboard(
                      token,
                      apiBase,
                      metrica,
                      ubicacion,
                    ),
                  )
                }
              >
                Retirar desglose
              </button>
            )}
            <button
              className="marketing-boton marketing-boton-activo"
              type="submit"
              disabled={tab === "resultados" && (!metrica || !ubicacion)}
            >
              {ocupado ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </fieldset>
      </form>
      {tab === "cobertura" && cobertura.length > 0 && (
        <div className="marketing-cobertura-lista">
          <h3>Cobertura registrada</h3>
          {cobertura.map((u) => (
            <div key={u.idUbicacion}>
              <span>
                {u.ciudad || "Todo el país"}, {u.pais}
              </span>
              <button
                className="marketing-enlace"
                disabled={ocupado}
                onClick={() =>
                  ejecutar(() =>
                    quitarCoberturaDashboard(
                      token,
                      apiBase,
                      campana.idCampana,
                      u.idUbicacion,
                    ),
                  )
                }
              >
                Retirar cobertura
              </button>
            </div>
          ))}
        </div>
      )}
    </dialog>
  );
}
