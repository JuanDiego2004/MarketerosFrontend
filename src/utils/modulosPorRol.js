import {
  LayoutDashboard as Home,
  Settings2 as ListMagic,
  Building2 as People3,
  Megaphone as CardList,
  ChartNoAxesCombined as EaselAnalytics,
  ContactRound,
} from "lucide-react";

const inicio = {
  id: "inicio",
  nombre: "Dashboard",
  icono: Home,
  enlaces: [{ nombre: "Dashboard", ruta: "/dashboard" }],
};

const clientes = {
  id: "clientes",
  nombre: "Clientes",
  icono: People3,
  enlaces: [{ nombre: "Clientes y canales", ruta: "/clientes-canales" }],
};

const crm = {
  id: "crm",
  nombre: "CRM",
  icono: ContactRound,
  enlaces: [
    { nombre: "Contactos / Leads", ruta: "/contactos" },
    { nombre: "Cuentas / Empresas", ruta: "/cuentas" },
    { nombre: "Pipeline", ruta: "/pipeline" },
    { nombre: "Actividades", ruta: "/actividades" },
  ],
};
const crmAnalista = {
  ...crm,
  enlaces: crm.enlaces.filter((e) =>
    ["/contactos", "/actividades"].includes(e.ruta),
  ),
};

const campanas = {
  id: "campanas",
  nombre: "Marketing",
  icono: CardList,
  enlaces: [
    { nombre: "Campañas", ruta: "/campanas" },
    { nombre: "Audiencias", ruta: "/audiencias" },
    { nombre: "Contenido y aprobaciones", ruta: "/contenido" },
    { nombre: "Automatizaciones", ruta: "/automatizaciones" },
  ],
};

const resultados = {
  id: "resultados",
  nombre: "Resultados",
  icono: EaselAnalytics,
  enlaces: [
    { nombre: "Métricas e indicadores", ruta: "/metricas" },
    { nombre: "Análisis comparativo", ruta: "/analisis-comparativo" },
    { nombre: "Reportes y exportación", ruta: "/reportes" },
    { nombre: "Atribución", ruta: "/atribucion" },
    { nombre: "Metas y alertas", ruta: "/metas" },
  ],
};

const configuracion = {
  id: "configuracion",
  nombre: "Configuración",
  icono: ListMagic,
  enlaces: [
    { nombre: "Gestión de usuarios", ruta: "/usuarios" },
    { nombre: "Roles y permisos", ruta: "/roles-permisos" },
    { nombre: "Campos personalizados", ruta: "/campos-personalizados" },
    { nombre: "Integraciones", ruta: "/integraciones" },
    { nombre: "Auditoría", ruta: "/auditoria" },
  ],
};

export const modulosPorRol = {
  administrador: [inicio, crm, clientes, campanas, resultados, configuracion],
  projectManager: [inicio, crm, clientes, campanas, resultados],
  analista: [
    inicio,
    crmAnalista,
    {
      ...campanas,
      enlaces: campanas.enlaces.filter((e) => e.ruta !== "/automatizaciones"),
    },
    {
      ...resultados,
      enlaces: resultados.enlaces.filter((e) => e.ruta !== "/metas"),
    },
  ],
};
