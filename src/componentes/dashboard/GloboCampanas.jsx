import { Component, lazy, Suspense, useEffect, useState } from "react";
import "./EscenaGlobo.css";
const GloboInteractivo = lazy(() => import("./GloboInteractivo"));

class LimiteGlobo extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error
      ? this.props.alternativa || (
          <p className="marketing-globo-error" role="status">
            El globo requiere WebGL. Puedes consultar los resultados en la tabla
            o la lista.
          </p>
        )
      : this.props.children;
  }
}

export default function GloboCampanas(props) {
  const [geografia, setGeografia] = useState([]);
  const necesitaGeografia = props.temaClaro !== false && !props.regiones;
  useEffect(() => {
    if (!necesitaGeografia) return;
    const control = new AbortController();
    fetch("/mapa/paises-110m.geojson", { signal: control.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Geografía no disponible");
        return r.json();
      })
      .then((d) => {
        if (!control.signal.aborted) setGeografia(d.features);
      })
      .catch(() => {
        /* Los puntos y la lista permanecen disponibles si falta la cartografía. */
      });
    return () => control.abort();
  }, [necesitaGeografia]);
  return (
    <LimiteGlobo alternativa={props.alternativa}>
      <Suspense
        fallback={
          <p className="marketing-globo-error" role="status">
            Preparando el globo…
          </p>
        }
      >
        <GloboInteractivo {...props} regiones={props.regiones || geografia} />
      </Suspense>
    </LimiteGlobo>
  );
}
