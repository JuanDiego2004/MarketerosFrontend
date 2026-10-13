
import { motion } from "motion/react";

export default function Loader({
                                           size = 64,
                                           color = "#8B5CF6",
                                           label = "Cargando...",
                                           showLabel = true,
                                           className = "",
                                       }) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-3 ${className}`}
        >
            <motion.svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                role="status"
                aria-label={label}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="overflow-visible"
                style={{
                    filter: `drop-shadow(0 0 8px ${color}55)`,
                }}
            >
                {/* Halo exterior */}
                <motion.path
                    d="M50 8 L92 84 L8 84 Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    animate={{
                        scale: [0.9, 1.08, 0.9],
                        opacity: [0.15, 0.5, 0.15],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                    }}
                />

                {/* Triángulo principal */}
                <motion.path
                    d="M50 16 L84 78 L16 78 Z"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    animate={{
                        pathLength: [0.65, 1, 0.65],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Núcleo pulsante */}
                <motion.circle
                    cx="50"
                    cy="56"
                    r="4"
                    fill={color}
                    animate={{
                        scale: [0.7, 1.4, 0.7],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                    }}
                />
            </motion.svg>

            {showLabel && (
                <motion.span
                    className="text-xs font-medium tracking-widest text-gray-500 dark:text-gray-400"
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    {label}
                </motion.span>
            )}
        </div>
    );
}
