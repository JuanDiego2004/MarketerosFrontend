
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../contexto/ContextoAuth.jsx';
import { modulosPorRol } from '../../utils/modulosPorRol.js';
import PieChartFill from "supercons/PieChartFill";
import {obtenerModulos, sidebarVariants, textoVariants} from "./funciones.js";


export default function Sidebar() {
    const { usuario, cerrarSesion } = useAuth();
    const navegar = useNavigate();

    const modulos = obtenerModulos(usuario?.rol?.nombreRol);

    function salir() {
        cerrarSesion();
        navegar('/login', { replace: true });
    }

    return (
        <motion.aside
            variants={sidebarVariants}
            initial="cerrado"
            animate="cerrado"
            whileHover="abierto"
            transition={{
                width: {
                    duration: 0.3,
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
                    <PieChartFill size={48} color={"white"} />
                    {/* {usuario?.nombres?.charAt(0)?.toUpperCase() ?? 'U'} */}
                </div>

                <motion.div
                    variants={textoVariants}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <p className="font-semibold">
                        {usuario?.nombres}
                    </p>
                    <p className="text-sm text-gray-400">
                        {usuario?.rol?.nombreRol ?? 'Sin rol'}
                    </p>
                </motion.div>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-2">
                {modulos.map((modulo) => {
                    const Icono = modulo.icono;

                    return (
                        <NavLink
                            key={modulo.ruta}
                            to={modulo.ruta}
                            title={modulo.nombre}
                            className={({ isActive }) =>
                                `flex h-[40px] shrink-0 items-center gap-3 rounded-lg px-2
                transition-colors ${
                                    isActive
                                        ? 'bg-blue-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-800'
                                }`
                            }
                        >
              <span className="flex w-6 shrink-0 items-center justify-center">
                <Icono size={28} className="shrink-0" aria-hidden="true" />
              </span>

                            <motion.span
                                variants={textoVariants}
                                className="overflow-hidden whitespace-nowrap font-inter"
                            >
                                {modulo.nombre}
                            </motion.span>
                        </NavLink>
                    );
                })}

                {modulos.length === 0 && (
                    <motion.p
                        variants={textoVariants}
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
                className="
          mt-4 flex h-12 shrink-0 items-center gap-3 rounded-lg
          px-3 text-left text-gray-300 hover:bg-gray-800
        "
            >
        <span className="flex w-6 shrink-0 items-center justify-center text-xl">
          ↪
        </span>

                <motion.span
                    variants={textoVariants}
                    className="overflow-hidden whitespace-nowrap"
                >
                    Cerrar sesión
                </motion.span>
            </button>
        </motion.aside>
    );
}


