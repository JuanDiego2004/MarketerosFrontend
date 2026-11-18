import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol, GRUPOS_ROL } from "../../utils/roles";
import PanelCaptacion from "./PanelCaptacion";
import PantallaOperaciones from "./PantallaOperaciones";
import PantallaAtribucion from "./PantallaAtribucion";
const PublicidadDemo = lazy(() => import("./PublicidadDemo"));
export default function ModuloConCrm({ tipo, children }) {
  const [p, setP] = useSearchParams();
  const vista = p.get("crm");
  const rendimiento = tipo === "metricas" && (!vista || vista === "rendimiento" || vista === "demo");
  const { usuario } = useAuth();
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol || "");
  const permitir = tipo !== "campanas" || grupo !== GRUPOS_ROL.ANALISTA;
  return (
    <>
      <nav className="crm crm-acciones" aria-label="Secciones del módulo">
        <button
          className="crm-boton"
          aria-pressed={!rendimiento && (!vista || vista === "registro")}
          onClick={() => setP(tipo === "metricas" ? { crm: "registro" } : {})}
        >
          {tipo === "metricas" ? "Registro de métricas" : "Gestión actual"}
        </button>
        {permitir && (
          <button
            className="crm-boton"
            aria-pressed={vista === "nuevo"}
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
        {tipo === "metricas" && <button className="crm-boton" aria-pressed={rendimiento} onClick={() => setP({ crm: "rendimiento" })}>Rendimiento publicitario</button>}
      </nav>
      {rendimiento ? <Suspense fallback={<p className="crm" role="status">Cargando rendimiento publicitario…</p>}><PublicidadDemo/></Suspense> : !vista || vista === "registro" || !permitir ? (
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
