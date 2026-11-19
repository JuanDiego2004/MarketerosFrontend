import { Component, useEffect, useState } from "react";
import Spline from "@splinetool/react-spline";
import fondo from "../../assets/bg_dark.jpg";

// La decoración externa nunca debe desmontar el formulario de autenticación.
class LimiteDecoracion extends Component {
  state = { fallo: false };
  static getDerivedStateFromError() { return { fallo: true }; }
  render() { return this.state.fallo ? this.props.respaldo : this.props.children; }
}

export default function DecoracionLogin() {
  const [lista, setLista] = useState(false);
  const [agotada, setAgotada] = useState(false);
  useEffect(() => {
    if (lista) return;
    const espera = setTimeout(() => setAgotada(true), 10000);
    return () => clearTimeout(espera);
  }, [lista]);
  const respaldo = <img src={fondo} alt="" className="h-full w-full object-cover" />;
  return <div className="h-full w-full" aria-hidden="true">
    {agotada ? respaldo : <LimiteDecoracion respaldo={respaldo}>
      <Spline scene="https://prod.spline.design/OqA4aJs2JGF-rfcB/scene.splinecode" onLoad={() => setLista(true)} />
    </LimiteDecoracion>}
  </div>;
}
