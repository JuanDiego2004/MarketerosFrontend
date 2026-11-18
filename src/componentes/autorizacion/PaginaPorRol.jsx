import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol } from "../../utils/roles";

export default function PaginaPorRol({ administrador, lider, analista }) {
  const { usuario } = useAuth();
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol);
  const Componente = { administrador, lider, analista }[grupo];

  return Componente ? <Componente /> : <Navigate to="/sin-acceso" replace />;
}
