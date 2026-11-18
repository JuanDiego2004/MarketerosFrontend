import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol } from "../../utils/roles";

export default function RutaPorRol({ gruposPermitidos, children }) {
  const { usuario } = useAuth();
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol);

  if (!grupo || !gruposPermitidos.includes(grupo)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return children;
}
