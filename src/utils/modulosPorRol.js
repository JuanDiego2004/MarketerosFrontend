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
  enlaces: [{ nombre: "Clientes / Empresas", ruta: "/empresas" }, { nombre: "Cotizaciones", ruta: "/cotizaciones" }, { nombre: "Contratos y servicios", ruta: "/contratos" }],
};

const crm = {
  id: "crm",
  nombre: "CRM",
  icono: ContactRound,
  enlaces: [
    { nombre: "Contactos / Leads", ruta: "/contactos" },
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
    { nombre: "Canales de difusión", ruta: "/canales-difusion" },
    { nombre: "Audiencias", ruta: "/audiencias" },
    { nombre: "Contenido y aprobaciones", ruta: "/contenido" },
    { nombre: "Automatizaciones", ruta: "/automatizaciones" },
    { nombre: "Cuentas publicitarias", ruta: "/cuentas-publicitarias" },
    { nombre: "Anuncios y publicaciones", ruta: "/anuncios" },
    { nombre: "Calendario editorial", ruta: "/calendario-editorial" },
    { nombre: "Entregables", ruta: "/entregables" },
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
    { nombre: "Recomendaciones", ruta: "/recomendaciones" },
    { nombre: "Ajustes autorizados", ruta: "/ajustes" },
    { nombre: "Informes por contrato", ruta: "/informes-contrato" },
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
    { nombre: "Canales de comunicación", ruta: "/integraciones" },
    { nombre: "Auditoría", ruta: "/auditoria" },
    { nombre: "Catálogo de servicios", ruta: "/servicios" },
    { nombre: "Accesos al portal", ruta: "/accesos-portal" },
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
      enlaces: [...campanas.enlaces.filter((e) => !["/automatizaciones", "/canales-difusion", "/cuentas-publicitarias"].includes(e.ruta)), { nombre: "Contratos", ruta: "/contratos" }],
    },
    {
      ...resultados,
      enlaces: resultados.enlaces.filter((e) => !["/metas", "/ajustes"].includes(e.ruta)),
    },
  ],
};
