import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "../../contexto/ContextoAuth.jsx";
import { ChartPie as PieChartFill, ChevronDown, LogOut } from "lucide-react";
import { obtenerModulos, sidebarVariants, textoVariants } from "./funciones.js";

export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState({ ruta: pathname, id: undefined });
  const reducirMovimiento = useReducedMotion();
  const variantesTexto = reducirMovimiento
    ? { cerrado: { opacity: 0, width: 0 }, abierto: { opacity: 1, width: 180 } }
    : textoVariants;

  const grupos = obtenerModulos(usuario?.rol?.nombreRol);
  const grupoActivo = grupos.find((grupo) =>
    grupo.enlaces.some(
      (enlace) =>
        enlace.ruta === pathname || pathname.startsWith(`${enlace.ruta}/`),
    ),
  );
  const grupoExpandido =
    seleccion.ruta === pathname && seleccion.id !== undefined
      ? seleccion.id
      : grupoActivo?.id;

  function salir() {
    cerrarSesion();
    navegar("/login", { replace: true });
  }

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="cerrado"
      animate={abierto ? "abierto" : "cerrado"}
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={(evento) => {
        if (!evento.currentTarget.contains(document.activeElement))
          setAbierto(false);
      }}
      onFocusCapture={() => setAbierto(true)}
      onBlurCapture={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget))
          setAbierto(false);
      }}
      transition={{
        width: {
          duration: reducirMovimiento ? 0 : 0.3,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      className="
        sticky top-0 flex h-screen shrink-0 flex-col
        overflow-hidden bg-black p-2 text-white
      "
    >
      <div className="mb-8 flex h-12 shrink-0 items-center gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-full  font-bold
          "
        >
          <PieChartFill size={30} strokeWidth={1.75} aria-hidden="true" />
          {/* {usuario?.nombres?.charAt(0)?.toUpperCase() ?? 'U'} */}
        </div>

        <motion.div
          variants={variantesTexto}
          className="overflow-hidden whitespace-nowrap"
        >
          <p className="font-semibold">{usuario?.nombres}</p>
          <p className="text-sm text-gray-400">
            {usuario?.rol?.nombreRol ?? "Sin rol"}
          </p>
        </motion.div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      >
        {grupos.map((grupo) => {
          const Icono = grupo.icono;
          const esDashboard = grupo.id === "inicio";
          const activo = grupo.id === grupoActivo?.id;
          const expandido = abierto && grupo.id === grupoExpandido;
          const clasesGrupo = `flex h-10 w-full shrink-0 items-center gap-3 rounded-lg px-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white ${
            activo && (esDashboard || !abierto)
              ? "bg-blue-700 text-white"
              : "text-gray-300 hover:bg-gray-800"
          }`;

          return (
            <div key={grupo.id} className="shrink-0">
              {esDashboard ? (
                <NavLink
                  to={grupo.enlaces[0].ruta}
                  aria-label={grupo.nombre}
                  className={clasesGrupo}
                >
                  <span className="flex w-6 shrink-0 items-center justify-center">
                    <Icono size={21} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <motion.span
                    variants={variantesTexto}
                    className="overflow-hidden whitespace-nowrap font-inter text-sm"
                  >
                    {grupo.nombre}
                  </motion.span>
                </NavLink>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label={grupo.nombre}
                    aria-expanded={expandido}
                    aria-controls={`sidebar-${grupo.id}`}
                    onClick={() => {
                      setAbierto(true);
                      setSeleccion({
                        ruta: pathname,
                        id:
                          !abierto || grupoExpandido !== grupo.id
                            ? grupo.id
                            : null,
                      });
                    }}
                    className={clasesGrupo}
                  >
                    <span className="flex w-6 shrink-0 items-center justify-center">
                      <Icono size={21} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <motion.span
                      variants={variantesTexto}
                      className="min-w-0 flex-1 overflow-hidden whitespace-nowrap font-inter text-sm"
                    >
                      {grupo.nombre}
                    </motion.span>
                    {abierto && (
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`transition-transform ${expandido ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>
                  <div
                    id={`sidebar-${grupo.id}`}
                    hidden={!expandido}
                    className="ml-9 space-y-0.5 border-l border-white/15 pl-2"
                  >
                    {grupo.enlaces.map((enlace) => (
                      <NavLink
                        key={enlace.ruta}
                        to={enlace.ruta}
                        className={({ isActive }) =>
                          `block rounded-md px-2 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                            isActive
                              ? "bg-blue-700 text-white"
                              : "text-gray-300 hover:bg-gray-800"
                          }`
                        }
                      >
                        {enlace.nombre}
                      </NavLink>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {grupos.length === 0 && (
          <motion.p
            variants={variantesTexto}
            className="overflow-hidden whitespace-nowrap text-sm text-gray-400"
          >
            No hay módulos asignados para este rol.
          </motion.p>
        )}
      </nav>

      <button
        type="button"
        onClick={salir}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="
          mt-4 flex h-12 shrink-0 items-center gap-3 rounded-lg
          px-3 text-left text-gray-300 hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white
        "
      >
        <span className="flex w-6 shrink-0 items-center justify-center text-xl">
          <LogOut size={20} aria-hidden="true" />
        </span>

        <motion.span
          variants={variantesTexto}
          className="overflow-hidden whitespace-nowrap"
        >
          Cerrar sesión
        </motion.span>
      </button>
    </motion.aside>
  );
}
