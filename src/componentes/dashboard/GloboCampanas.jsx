import { Component, lazy, Suspense } from "react";
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
  return (
    <LimiteGlobo alternativa={props.alternativa}>
      <Suspense
        fallback={
          <p className="marketing-globo-error" role="status">
            Preparando el globo…
          </p>
        }
      >
        <GloboInteractivo {...props} />
      </Suspense>
    </LimiteGlobo>
  );
}
