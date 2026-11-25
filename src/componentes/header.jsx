import { Bell, ChevronRight, CircleUserRound, Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import "./HeaderNotch.css";
import { Link, useLocation } from "react-router-dom";
import { obtenerModulos } from "./sidebar/funciones";
import { useAuth } from "../contexto/ContextoAuth";
import { solicitarCrm } from "../servicios/servicioCrm";
export default function Header({ abrirMenu, botonMenuRef }) {
  const { usuario, token } = useAuth();
  const { pathname } = useLocation();
  const grupos = obtenerModulos(usuario?.rol?.nombreRol);
  const grupo = grupos.find((g) => g.enlaces.some((e) => pathname === e.ruta || pathname.startsWith(`${e.ruta}/`)));
  const enlace = grupo?.enlaces.find((e) => pathname === e.ruta || pathname.startsWith(`${e.ruta}/`));
  const [tareas, setTareas] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const notch = useRef(null);
  const botonCuenta = useRef(null);
  const omitirFoco = useRef(false);
  const panelId = useId();
  const cerrar = useCallback((devolverFoco = false) => {
    setExpandido(false);
    if (devolverFoco) {
      omitirFoco.current = true;
      botonCuenta.current?.focus();
      omitirFoco.current = false;
    }
  }, []);
  useEffect(() => {
    if (!expandido) return;
    const fuera = (evento) => { if (!notch.current?.contains(evento.target)) cerrar(); };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [expandido, cerrar]);
  useEffect(() => {
    if (!token) return;
    const c = new AbortController();
    const cargar = () =>
      solicitarCrm("/operaciones/notificaciones", token, { signal: c.signal })
        .then((d) => {
          if (!c.signal.aborted) setTareas(Array.isArray(d) ? d : []);
        })
        .catch(() => {});
    cargar();
    const timer = setInterval(cargar, 60000);
    return () => {
      c.abort();
      clearInterval(timer);
    };
  }, [token]);
  return (
    <header className="app-header">
      <button type="button" ref={botonMenuRef} className="app-menu-movil app-icono" onClick={abrirMenu} aria-label="Abrir menú"><Menu size={21} /></button>
      <nav className="app-migas" aria-label="Ubicación actual"><span>{grupo?.nombre || "Espacio de trabajo"}</span><ChevronRight size={14} aria-hidden="true" /><strong>{enlace?.nombre || "Mi agencia"}</strong></nav>
      <div
        ref={notch}
        className="app-notch"
        data-expandido={expandido}
        onMouseEnter={() => setExpandido(true)}
        onMouseLeave={(evento) => {
          if (!evento.currentTarget.contains(document.activeElement)) cerrar();
        }}
        onFocusCapture={() => {
          if (omitirFoco.current) { omitirFoco.current = false; return; }
          setExpandido(true);
        }}
        onBlurCapture={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget)) cerrar();
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") {
            evento.preventDefault();
            evento.stopPropagation();
            cerrar(true);
          }
        }}
      >
        <div className="app-notch-controles">
          <button type="button" ref={botonCuenta} className="app-notch-icono" aria-label="Mi cuenta" aria-expanded={expandido} aria-controls={panelId} onClick={() => setExpandido(true)}><CircleUserRound size={21} strokeWidth={1.6} /></button>
          <span className="app-notch-divisor" aria-hidden="true" />
          <button type="button" className="app-notch-icono" aria-label={`Notificaciones: ${tareas.length} tareas vencidas`} aria-expanded={expandido} aria-controls={panelId} onClick={() => setExpandido(true)}><Bell size={20} strokeWidth={1.6} />{tareas.length > 0 && <span className="app-notch-contador">{tareas.length}</span>}</button>
        </div>
        <section id={panelId} className="app-notch-panel" aria-label="Mi cuenta y notificaciones" aria-hidden={!expandido} inert={!expandido ? true : undefined}>
          <div className="app-notch-interior">
            <div className="app-notch-perfil">
              <span className="app-notch-avatar">{usuario?.nombres?.trim().charAt(0)?.toUpperCase() || "U"}</span>
              <div><strong>{usuario?.nombres || "Mi cuenta"}</strong><small>{usuario?.rol?.nombreRol || ""}</small></div>
              <button type="button" className="app-notch-cerrar" aria-label="Cerrar panel de cuenta" onClick={() => cerrar(true)}><X size={16} /></button>
            </div>
            <div className="app-notch-titulo"><h2>Mis tareas vencidas</h2><span>{tareas.length}</span></div>
            <div className="app-notch-lista">
              {tareas.length ? tareas.map((t) => <Link key={t.id} to="/actividades" className="app-notch-tarea" onClick={() => cerrar(true)}><span className="app-notch-tarea-icono"><Bell size={15} /></span><span><strong>{t.nombre}</strong><small>{new Date(t.fecha).toLocaleString("es-PE", {timeZone:"America/Lima"})}</small></span></Link>) : <p className="app-notch-vacio">No hay recordatorios vencidos.</p>}
            </div>
            <Link className="app-notch-actividad" to="/actividades" onClick={() => cerrar(true)}>Ver mis actividades</Link>
          </div>
        </section>
      </div>
    </header>
  );
}
