
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import CheckCircle from "supercons/CheckCircle";
import ViewClose from "supercons/ViewClose";
import Info from "supercons/Info";

const estilos = {
    exito: {
        bg: "bg-green-500/10",
        borde: "border-green-300/30",
        icono: CheckCircle,
        color: "text-green-400",
    },
    error: {
        bg: "bg-red-500/10",
        borde: "border-red-300/30",
        icono: ViewClose,
        color: "text-red-400",
    },
    advertencia: {
        bg: "bg-orange-500/10",
        borde: "border-orange-300/30",
        icono: Info,
        color: "text-orange-400",
    },
};

export default function Toast({
                                  visible = false,
                                  tipo = "success",
                                  titulo = "Notificación",
                                  descripcion = "",
                                  duracion = 6000,
                                  onClose,
                              }) {
    const estilo = estilos[tipo] ?? estilos.success;
    const Icono = estilo.icono;

    useEffect(() => {
        if (!visible) return;

        const temporizador = setTimeout(() => {
            onClose?.();
        }, duracion);

        return () => clearTimeout(temporizador);
    }, [visible, duracion, onClose]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{
                        opacity: 0,
                        x: 100,
                        scale: 0.9,
                    }}
                    animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                    }}
                    exit={{
                        opacity: 0,
                        x: 100,
                        scale: 0.9,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                    }}
                    className={`
                        fixed top-5 right-5 z-[9999]
                        min-w-[320px] max-w-[400px]
                        rounded-xl border p-4
                        shadow-xl backdrop-blur-xl
                        text-white
                        ${estilo.bg}
                        ${estilo.borde}
                    `}
                >
                    <div className="flex items-start gap-3">
                        <Icono
                            className={`h-6 w-6 shrink-0 ${estilo.color}`}
                        />

                        <div className="flex-1">
                            <h2 className="font-semibold">
                                {titulo}
                            </h2>

                            <p className="text-sm text-white/75">
                                {descripcion}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
