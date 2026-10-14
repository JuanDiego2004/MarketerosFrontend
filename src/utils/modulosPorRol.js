import Home from "supercons/Home";
import People3Center from "supercons/People3Center";
import ListMagic from "supercons/ListMagic";
import People3 from "supercons/People3";
import CardList from "supercons/CardList";
import EaselPlay from "supercons/EaselPlay";
import SlackFill from "supercons/SlackFill";
import EaselAnalytics from "supercons/EaselAnalytics";
import EventAnalytics from "supercons/EventAnalytics";

export const modulosPorRol = {
    administrador: [
        { nombre: 'Dashboard', ruta: '/dashboard', icono: Home },
        { nombre: 'Gestión de usuarios', ruta: '/usuarios', icono: People3Center },
        { nombre: 'Roles y permisos', ruta: '/roles-permisos', icono: ListMagic },
        { nombre: 'Clientes y canales de difusión', ruta: '/clientes-canales', icono: People3 },
        { nombre: 'Gestión de campañas', ruta: '/campanas', icono: CardList },
        { nombre: 'Gestión de audiencias', ruta: '/audiencias', icono: EaselPlay },
        { nombre: 'Métricas e indicadores', ruta: '/metricas', icono: SlackFill },
        { nombre: 'Análisis comparativo', ruta: '/analisis-comparativo', icono: EaselAnalytics },
        { nombre: 'Reportes y exportación', ruta: '/reportes', icono: EventAnalytics },
    ],
    projectManager: [
        { nombre: 'Dashboard', ruta: '/dashboard', icono: Home },
        { nombre: 'Gestión de campañas', ruta: '/campanas', icono: CardList },
        { nombre: 'Gestión de audiencias', ruta: '/audiencias', icono: EaselPlay },
        { nombre: 'Métricas e indicadores', ruta: '/metricas', icono: SlackFill },
        { nombre: 'Análisis comparativo', ruta: '/analisis-comparativo', icono: EaselAnalytics },
        { nombre: 'Reportes y exportación', ruta: '/reportes', icono: EventAnalytics },
        { nombre: 'Clientes y canales de difusión', ruta: '/clientes-canales', icono: People3 },
    ],
    analista: [
        { nombre: 'Dashboard', ruta: '/dashboard', icono: Home },
        { nombre: 'Gestión de campañas', ruta: '/campanas', icono: CardList  },
        { nombre: 'Gestión de audiencias', ruta: '/audiencias' , icono: EaselPlay},
        { nombre: 'Métricas e indicadores', ruta: '/metricas', icono: SlackFill },
        { nombre: 'Análisis comparativo', ruta: '/analisis-comparativo', icono: EaselAnalytics },
        { nombre: 'Reportes y exportación', ruta: '/reportes', icono: EventAnalytics  },
    ],
}
