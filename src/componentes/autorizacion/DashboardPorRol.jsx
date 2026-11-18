import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import DashboardAdministrador from "../../screens/administrador/DashboardAdministrador";
import DashboardLider from "../../screens/lider/DashboardLider";
import DashboardAnalista from "../../screens/analista/DashboardAnalista";
import { GRUPOS_ROL, obtenerGrupoRol } from "../../utils/roles";

const dashboardsPorGrupo = {
  [GRUPOS_ROL.ADMINISTRADOR]: DashboardAdministrador,
  [GRUPOS_ROL.LIDER]: DashboardLider,
  [GRUPOS_ROL.ANALISTA]: DashboardAnalista,
};

export default function DashboardPorRol() {
  const { usuario } = useAuth();
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol);
  const Dashboard = dashboardsPorGrupo[grupo];

  return Dashboard ? <Dashboard /> : <Navigate to="/sin-acceso" replace />;
}
