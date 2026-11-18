import { UserRound, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexto/ContextoAuth";
import { solicitarCrm } from "../servicios/servicioCrm";
export default function Header() {
  const { usuario, token } = useAuth();
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
    <header className="relative flex min-h-12 items-center justify-end gap-4 bg-black px-5 text-white">
      <span className="flex items-center gap-2 text-sm">
        <UserRound size={20} />
        {usuario?.nombres || "Mi cuenta"}
      </span>
      <details className="relative">
        <summary
          className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-blue-400"
          aria-label={`Notificaciones: ${tareas.length} tareas vencidas`}
        >
          <Bell size={20} />
          {tareas.length > 0 && (
            <span className="text-xs">{tareas.length}</span>
          )}
        </summary>
        <div className="absolute right-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-lg border border-gray-700 bg-black p-4 shadow-xl">
          <p className="mb-2 text-sm font-semibold">Mis tareas vencidas</p>
          {tareas.length ? (
            tareas.map((t) => (
              <Link
                key={t.id}
                to="/actividades"
                className="mb-2 block rounded p-2 text-sm hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                {t.nombre}
                <small className="block text-gray-300">
                  {new Date(t.fecha).toLocaleString("es-PE", {
                    timeZone: "America/Lima",
                  })}
                </small>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-300">
              No hay recordatorios vencidos.
            </p>
          )}
        </div>
      </details>
    </header>
  );
}
