import { Bell, ChevronRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
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
  useEffect(() => {
    if (!token) return;
    const c = new AbortController();
    const cargar = () =>
      solicitarCrm("/operaciones/notificaciones", token, { signal: c.signal })
        .then((d) => {
          if (!c.signal.aborted) setTareas(d);
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
      <details className="app-notificaciones">
        <summary
          className="app-icono"
          aria-label={`Notificaciones: ${tareas.length} tareas vencidas`}
        >
          <Bell size={20} />
          {tareas.length > 0 && (
            <span className="app-contador">{tareas.length}</span>
          )}
        </summary>
        <div className="app-notificaciones-panel">
          <p className="mb-2 text-sm font-semibold">Mis tareas vencidas</p>
          {tareas.length ? (
            tareas.map((t) => (
              <Link
                key={t.id}
                to="/actividades"
                className="app-notificacion"
              >
                {t.nombre}
                <small>
                  {new Date(t.fecha).toLocaleString("es-PE", {
                    timeZone: "America/Lima",
                  })}
                </small>
              </Link>
            ))
          ) : (
            <p className="app-notificaciones-vacio">
              No hay recordatorios vencidos.
            </p>
          )}
        </div>
      </details>
      <div className="app-cuenta"><span className="app-avatar">{usuario?.nombres?.trim().charAt(0)?.toUpperCase() || "U"}</span><div><strong>{usuario?.nombres || "Mi cuenta"}</strong><small>{usuario?.rol?.nombreRol || ""}</small></div></div>
    </header>
  );
}
