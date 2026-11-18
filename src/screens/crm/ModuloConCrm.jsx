import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol, GRUPOS_ROL } from "../../utils/roles";
import PanelCaptacion from "./PanelCaptacion";
import PantallaOperaciones from "./PantallaOperaciones";
import PantallaAtribucion from "./PantallaAtribucion";
export default function ModuloConCrm({ tipo, children }) {
  const [p, setP] = useSearchParams();
  const vista = p.get("crm");
  const { usuario } = useAuth();
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol || "");
  const permitir = tipo !== "campanas" || grupo !== GRUPOS_ROL.ANALISTA;
  return (
    <>
      <nav className="crm crm-acciones" aria-label="Secciones del módulo">
        <button
          className="crm-boton"
          aria-pressed={!vista}
          onClick={() => setP({})}
        >
          Gestión actual
        </button>
        {permitir && (
          <button
            className="crm-boton"
            aria-pressed={!!vista}
            onClick={() => setP({ crm: "nuevo" })}
          >
            {tipo === "campanas"
              ? "Captación de leads"
              : tipo === "audiencias"
                ? "Segmentos dinámicos"
                : tipo === "reportes"
                  ? "Reportes de ingresos"
                  : "Embudo e ingresos"}
          </button>
        )}
      </nav>
      {!vista || !permitir ? (
        children
      ) : tipo === "campanas" ? (
        <PanelCaptacion />
      ) : tipo === "audiencias" ? (
        <PantallaOperaciones recurso="segmentos" />
      ) : (
        <PantallaAtribucion />
      )}
    </>
  );
}
