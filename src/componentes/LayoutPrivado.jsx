import Header from "./header.jsx";
import Sidebar from "./sidebar/Sidebar.jsx";
import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function LayoutPrivado() {
  const [menuMovil, setMenuMovil] = useState(false);
  const botonMenu = useRef(null);
  const anterior = useRef(false);
  useEffect(() => {
    const medio = matchMedia("(max-width: 767px)");
    const cerrarEnEscritorio = () => { if (!medio.matches) setMenuMovil(false); };
    medio.addEventListener("change", cerrarEnEscritorio);
    return () => medio.removeEventListener("change", cerrarEnEscritorio);
  }, []);
  useEffect(() => {
    if (anterior.current && !menuMovil) botonMenu.current?.focus();
    anterior.current = menuMovil;
  }, [menuMovil]);
  return (
    <div className="app-shell">
      {menuMovil && <button type="button" className="sidebar-velo" aria-label="Cerrar navegación" tabIndex={-1} onClick={() => setMenuMovil(false)} />}
      <Sidebar movilAbierto={menuMovil} cerrarMovil={() => setMenuMovil(false)} />

      <div className="app-espacio" inert={menuMovil ? true : undefined}>
        <Header abrirMenu={() => setMenuMovil(true)} botonMenuRef={botonMenu} />
        <a href="#contenido-principal" className="app-saltar">Ir al contenido</a>
        <main id="contenido-principal" className="app-contenido" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
