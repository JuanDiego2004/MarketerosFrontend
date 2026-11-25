import { BrowserRouter } from "react-router-dom";
import { ProveedorAuth } from "./contexto/ContextoAuth";
import RutasAplicacion from "./rutas/RutasAplicacion";
import "./App.css";
import "./componentes/ui/SistemaUI.css";
import "./componentes/portal/PortalExperiencia.css";
import "./componentes/crm/DialogoCrm.css";

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <RutasAplicacion />
      </ProveedorAuth>
    </BrowserRouter>
  );
}
