import {modulosPorRol} from "../../utils/modulosPorRol.js";

export function normalizar(texto = '') {
    return texto
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();
}

export function obtenerModulos(nombreRol) {
    const rol = normalizar(nombreRol);

    if (rol.includes('admin')) {
        return modulosPorRol.administrador;
    }

    if (
        rol.includes('project manager') ||
        rol.includes('lider de marketing')
    ) {
        return modulosPorRol.projectManager;
    }

    if (rol.includes('analista') || rol.includes('operador')) {
        return modulosPorRol.analista;
    }

    return [];
}

export const sidebarVariants = {
    cerrado: {
        width: 56,
    },
    abierto: {
        width: 260,
    },
};

export const textoVariants = {
    cerrado: {
        opacity: 0,
        width: 0,
        x: -8,
        transition: {
            duration: 0.15,
        },
    },
    abierto: {
        opacity: 1,
        width: 180,
        x: 0,
        transition: {
            duration: 0.25,
            delay: 0.05,
        },
    },
};
