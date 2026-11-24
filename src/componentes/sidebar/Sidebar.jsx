import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ChartPie, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAuth.jsx";
import { obtenerModulos } from "./funciones.js";
import "./Sidebar.css";

export default function Sidebar({ movilAbierto = false, cerrarMovil }) {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [compacto, setCompacto] = useState(() => localStorage.getItem("menuCompacto") === "true");
  const [movil, setMovil] = useState(() => matchMedia("(max-width: 767px)").matches);
  const [seleccion, setSeleccion] = useState({ ruta: pathname, id: undefined });
  const reducirMovimiento = useReducedMotion();
  const contenedor = useRef(null);
  const id = useId();
  const abierto = movil || !compacto;
  const grupos = obtenerModulos(usuario?.rol?.nombreRol);
  const grupoActivo = grupos.find((g) => g.enlaces.some((e) => e.ruta === pathname || pathname.startsWith(`${e.ruta}/`)));
  const grupoExpandido = seleccion.ruta === pathname && seleccion.id !== undefined ? seleccion.id : grupoActivo?.id;

  useEffect(() => {
    const medio = matchMedia("(max-width: 767px)");
    const actualizar = () => setMovil(medio.matches);
    medio.addEventListener("change", actualizar);
    return () => medio.removeEventListener("change", actualizar);
  }, []);
  useEffect(() => {
    if (movil && movilAbierto) contenedor.current?.querySelector("button")?.focus();
  }, [movil, movilAbierto]);

  function alternar() {
    setCompacto((valor) => {
      localStorage.setItem("menuCompacto", String(!valor));
      return !valor;
    });
  }
  function salir() {
    cerrarSesion();
    navegar("/login", { replace: true });
  }
  function recorrerMenu(evento) {
    if (!movil || !movilAbierto) return;
    if (evento.key === "Escape") { evento.preventDefault(); cerrarMovil?.(); }
    if (evento.key !== "Tab") return;
    const opciones = [...contenedor.current.querySelectorAll("a[href], button:not(:disabled)")].filter((e) => e.getClientRects().length);
    const primero = opciones[0], ultimo = opciones.at(-1);
    if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo?.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero?.focus(); }
  }
  const indicador = (activo) => activo && <motion.span className="sidebar-seleccion" layoutId={`seleccion-${id}`} transition={reducirMovimiento ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 36 }} />;

  return (
    <LayoutGroup id={id}>
      <motion.aside ref={contenedor} className="sidebar" aria-label="Menú del sistema" data-compacto={!abierto} data-movil-abierto={movilAbierto} inert={movil && !movilAbierto ? true : undefined} initial={false} animate={{ width: movil ? 280 : compacto ? 76 : 252 }} transition={{ duration: reducirMovimiento ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }} onKeyDown={recorrerMenu}>
        <div className="sidebar-marca">
          <span className="sidebar-isotipo"><ChartPie size={25} strokeWidth={1.8} aria-hidden="true" /></span>
          <div className="sidebar-texto"><strong>Marketing<span>System</span></strong><small>Tu agencia, conectada.</small></div>
          <button type="button" className="sidebar-cerrar-movil" onClick={cerrarMovil} aria-label="Cerrar menú"><X size={19} /></button>
        </div>
        <div className="sidebar-espacio"><span className="sidebar-espacio-icono">M</span><div className="sidebar-texto"><strong>Mi agencia</strong><small>Espacio de trabajo</small></div></div>
        <div className="sidebar-nav-cabecera"><span className="sidebar-texto">PRINCIPAL</span><button type="button" onClick={alternar} className="sidebar-alternar" aria-label={compacto ? "Expandir menú" : "Contraer menú"} title={compacto ? "Expandir menú" : "Contraer menú"}>{compacto ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {grupos.map((grupo) => {
            const Icono = grupo.icono;
            const directo = grupo.id === "inicio";
            const activo = grupo.id === grupoActivo?.id;
            const expandido = abierto && grupo.id === grupoExpandido;
            const resaltar = activo && (directo || !expandido);
            const contenido = <><span className="sidebar-icono"><Icono size={20} strokeWidth={1.7} aria-hidden="true" /></span><span className="sidebar-texto sidebar-nombre">{grupo.nombre}</span></>;
            return <div className="sidebar-grupo" key={grupo.id}>
              {grupo.id === "configuracion" && <div className="sidebar-separador"><span className="sidebar-texto">ADMINISTRACIÓN</span></div>}
              {directo ? <NavLink to={grupo.enlaces[0].ruta} onClick={cerrarMovil} className="sidebar-enlace" data-activo={resaltar} title={!abierto ? grupo.nombre : undefined} aria-label={grupo.nombre}>{indicador(resaltar)}{contenido}</NavLink> : <>
                <button type="button" className="sidebar-enlace sidebar-grupo-boton" data-activo={resaltar} data-contexto={activo} aria-label={grupo.nombre} aria-expanded={expandido} aria-controls={expandido ? `sidebar-${grupo.id}-${id}` : undefined} title={!abierto ? grupo.nombre : undefined} onClick={() => { if (compacto) { setCompacto(false); localStorage.setItem("menuCompacto", "false"); } setSeleccion({ ruta: pathname, id: !abierto || grupoExpandido !== grupo.id ? grupo.id : null }); }}>
                  {indicador(resaltar)}{contenido}<ChevronDown className="sidebar-texto sidebar-chevron" data-expandido={expandido} size={15} aria-hidden="true" />
                </button>
                <AnimatePresence initial={false}>
                  {expandido && <motion.div key="enlaces" id={`sidebar-${grupo.id}-${id}`} className="sidebar-submenu" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reducirMovimiento ? 0 : 0.22 }}>
                    {grupo.enlaces.map((enlace) => <NavLink key={enlace.ruta} to={enlace.ruta} onClick={cerrarMovil} className="sidebar-subenlace">{({ isActive }) => <>{indicador(isActive)}<span className="sidebar-subpunto" aria-hidden="true" /><span>{enlace.nombre}</span></>}</NavLink>)}
                  </motion.div>}
                </AnimatePresence>
              </>}
            </div>;
          })}
          {!grupos.length && <p className="sidebar-sin-modulos sidebar-texto">No hay módulos asignados para este rol.</p>}
        </nav>
        <footer className="sidebar-pie">
          <div className="sidebar-perfil"><span className="sidebar-avatar">{usuario?.nombres?.trim().charAt(0)?.toUpperCase() || "U"}</span><div className="sidebar-texto"><strong>{usuario?.nombres || "Mi cuenta"}</strong><small>{usuario?.rol?.nombreRol || "Sin rol"}</small></div></div>
          <button type="button" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión" className="sidebar-salir"><LogOut size={18} aria-hidden="true" /><span className="sidebar-texto">Cerrar sesión</span></button>
        </footer>
      </motion.aside>
    </LayoutGroup>
  );
}
