import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAuth";
import { obtenerGrupoRol, GRUPOS_ROL } from "../../utils/roles";
import PanelCaptacion from "./PanelCaptacion";
import PantallaOperaciones from "./PantallaOperaciones";
import PantallaAtribucion from "./PantallaAtribucion";
import Pestanas from "../../componentes/ui/Pestanas";
const PublicidadDemo = lazy(() => import("./PublicidadDemo"));
export default function ModuloConCrm({ tipo, children }) {
  const [p, setP] = useSearchParams();
  const vista = p.get("crm");
  const rendimiento = tipo === "metricas" && (!vista || vista === "rendimiento" || vista === "demo");
  const { usuario } = useAuth();
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol || "");
  const permitir = tipo !== "campanas" || grupo !== GRUPOS_ROL.ANALISTA;
  const opciones = [
    { valor: "registro", etiqueta: tipo === "metricas" ? "Registro de métricas" : "Gestión actual" },
    ...(permitir ? [{ valor: "nuevo", etiqueta: tipo === "campanas" ? "Captación de leads" : tipo === "audiencias" ? "Segmentos dinámicos" : tipo === "reportes" ? "Reportes de ingresos" : "Embudo e ingresos" }] : []),
    ...(tipo === "metricas" ? [{ valor: "rendimiento", etiqueta: "Rendimiento publicitario" }] : []),
  ];
  return (
    <>
      <Pestanas etiqueta="Secciones del módulo" className="ui-pestanas-modulo" opciones={opciones} valor={rendimiento ? "rendimiento" : !permitir || !vista ? "registro" : vista} alCambiar={(valor) => setP(valor === "registro" && tipo !== "metricas" ? {} : { crm: valor })} />
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
