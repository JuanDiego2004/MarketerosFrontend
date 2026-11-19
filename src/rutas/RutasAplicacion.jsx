import { Navigate, Route, Routes, useParams,useSearchParams } from "react-router-dom";
import PantallaAgencia from "../screens/agencia/PantallaAgencia";
import PortalCliente from "../screens/agencia/PortalCliente";
import AccesosPortal from "../screens/agencia/AccesosPortal";
import AsistenteContrato from "../screens/agencia/AsistenteContrato";
import FichaContrato from "../screens/agencia/FichaContrato";
import DashboardPorRol from "../componentes/autorizacion/DashboardPorRol";
import PaginaPorRol from "../componentes/autorizacion/PaginaPorRol";
import RutaPorRol from "../componentes/autorizacion/RutaPorRol";
import LayoutPrivado from "../componentes/LayoutPrivado";
import RutaProtegida from "../componentes/RutaProtegida";
import PantallaLogin from "../screens/login/PantallaLogin";
import PantallaRegistro from "../screens/registro/PantallaRegistro";
import ClientesCanalesAdministrador from "../screens/administrador/ClientesCanalesAdministrador";
import PantallaAdministracion from "../screens/administrador/PantallaAdministracion";
import GestionUsuariosAdministrador from "../screens/administrador/GestionUsuariosAdministrador";
import RolesPermisosAdministrador from "../screens/administrador/RolesPermisosAdministrador";
import ClientesCanalesLider from "../screens/lider/ClientesCanalesLider";
import GestionAudienciasLider from "../screens/lider/GestionAudienciasLider";
import GestionCampanasLider from "../screens/lider/GestionCampanasLider";
import AnalisisComparativoLider from "../screens/lider/AnalisisComparativoLider";
import MetricasIndicadoresLider from "../screens/lider/MetricasIndicadoresLider";
import ReportesLider from "../screens/lider/ReportesLider";
import GestionAudienciasAnalista from "../screens/analista/GestionAudienciasAnalista";
import GestionCampanasAnalista from "../screens/analista/GestionCampanasAnalista";
import AnalisisComparativoAnalista from "../screens/analista/AnalisisComparativoAnalista";
import RegistroMetricasAnalista from "../screens/analista/RegistroMetricasAnalista";
import ReportesAnalista from "../screens/analista/ReportesAnalista";
import SinAcceso from "../screens/inicio/SinAcceso";
import PantallaCrm from "../screens/crm/PantallaCrm";
import PantallaOperaciones from "../screens/crm/PantallaOperaciones";
import PantallaAtribucion from "../screens/crm/PantallaAtribucion";
import ModuloConCrm from "../screens/crm/ModuloConCrm";
import CamposPersonalizados from "../screens/crm/CamposPersonalizados";
import EditorFlujos from "../screens/crm/EditorFlujos";
import { GRUPOS_PERMITIDOS, GRUPOS_ROL } from "../utils/roles";

function CuentaAnterior() { const { id } = useParams(); return <Navigate to={`/empresas/${id}`} replace/>; }
function EntregasAnterior(){const [p]=useSearchParams();const id=p.get("contrato");return <Navigate to={id&&/^\d+$/.test(id)?`/contratos/${id}`:"/contratos"} replace/>;}

export default function RutasAplicacion() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PantallaLogin />} />
      <Route path="/registro" element={<PantallaRegistro />} />
      <Route path="/inicio" element={<Navigate to="/dashboard" replace />} />
      <Route path="/portal" element={<RutaProtegida><RutaPorRol gruposPermitidos={[GRUPOS_ROL.CLIENTE]}><PortalCliente/></RutaPorRol></RutaProtegida>}/>

      <Route
        element={
          <RutaProtegida>
            <LayoutPrivado />
          </RutaProtegida>
        }
      >
        <Route path="/contratos/nuevo" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER}><AsistenteContrato/></RutaPorRol>}/>
        <Route path="/contratos/borradores/:borrador" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER}><AsistenteContrato/></RutaPorRol>}/>
        <Route path="/contratos/:id" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}><FichaContrato/></RutaPorRol>}/>
        <Route path="/entregas" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}><EntregasAnterior/></RutaPorRol>}/>
        <Route path="/accesos-portal" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR}><AccesosPortal/></RutaPorRol>}/>
        {[['/contratos','contratos'],['/cotizaciones','cotizaciones'],['/cuentas-publicitarias','cuentas-publicitarias'],['/anuncios','anuncios'],['/calendario-editorial','calendario'],['/entregables','entregables'],['/recomendaciones','recomendaciones'],['/ajustes','ajustes'],['/informes-contrato','informes'],['/servicios','servicios']].map(([path,recurso]) => <Route key={path} path={path} element={<RutaPorRol gruposPermitidos={['cotizaciones','cuentas-publicitarias','ajustes','servicios'].includes(recurso) ? GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER : GRUPOS_PERMITIDOS.TODOS}><PantallaAgencia key={recurso} recurso={recurso}/></RutaPorRol>}/>)}
        <Route path="/automatizaciones/:id/flujo" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER}><EditorFlujos/></RutaPorRol>}/>
        <Route path="/campos-personalizados" element={<RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR}><CamposPersonalizados/></RutaPorRol>}/>
        {[
          ["/pipeline", "pipeline", GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER],
          ["/pipeline/etapas", "etapas", GRUPOS_PERMITIDOS.ADMINISTRADOR],
          ["/actividades", "actividades", GRUPOS_PERMITIDOS.TODOS],
          ["/segmentos", "segmentos", GRUPOS_PERMITIDOS.TODOS],
          ["/scoring", "scoring", GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER],
          ["/metas", "metas", GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER],
          ["/contenido", "contenido", GRUPOS_PERMITIDOS.TODOS],
          [
            "/automatizaciones",
            "automatizaciones",
            GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER,
          ],
          ["/integraciones", "integraciones", GRUPOS_PERMITIDOS.ADMINISTRADOR],
          ["/auditoria", "auditoria", GRUPOS_PERMITIDOS.ADMINISTRADOR],
        ].map(([path, recurso, grupos]) => (
          <Route
            key={path}
            path={path}
            element={
              <RutaPorRol gruposPermitidos={grupos}>
                <PantallaOperaciones key={recurso} recurso={recurso} />
              </RutaPorRol>
            }
          />
        ))}
        <Route
          path="/atribucion"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <PantallaAtribucion />
            </RutaPorRol>
          }
        />
        <Route
          path="/contactos"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <PantallaCrm key="contactos-lista" />
            </RutaPorRol>
          }
        />
        <Route
          path="/contactos/:id"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <PantallaCrm key="contactos-ficha" />
            </RutaPorRol>
          }
        />
        <Route path="/cuentas" element={<Navigate to="/empresas" replace/>}/>
        <Route path="/cuentas/:id" element={<CuentaAnterior/>}/>
        <Route path="/clientes-canales" element={<Navigate to="/empresas" replace/>}/>
        <Route
          path="/empresas"
          element={
            <RutaPorRol
              gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER}
            >
              <PantallaCrm key="cuentas-lista" recurso="cuentas" />
            </RutaPorRol>
          }
        />
        <Route
          path="/empresas/:id"
          element={
            <RutaPorRol
              gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER}
            >
              <PantallaCrm key="cuentas-ficha" recurso="cuentas" />
            </RutaPorRol>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <DashboardPorRol />
            </RutaPorRol>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR}>
              <GestionUsuariosAdministrador />
            </RutaPorRol>
          }
        />
        <Route
          path="/roles-permisos"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR}>
              <RolesPermisosAdministrador />
            </RutaPorRol>
          }
        />
        <Route
          path="/canales-difusion"
          element={
            <RutaPorRol
              gruposPermitidos={GRUPOS_PERMITIDOS.ADMINISTRADOR_LIDER}
            >
              <PaginaPorRol
                administrador={ClientesCanalesAdministrador}
                lider={ClientesCanalesLider}
              />
            </RutaPorRol>
          }
        />
        <Route
          path="/campanas"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <ModuloConCrm tipo="campanas">
                <PaginaPorRol
                  administrador={PantallaAdministracion}
                  lider={GestionCampanasLider}
                  analista={GestionCampanasAnalista}
                />
              </ModuloConCrm>
            </RutaPorRol>
          }
        />
        <Route
          path="/audiencias"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <ModuloConCrm tipo="audiencias">
                <PaginaPorRol
                  administrador={PantallaAdministracion}
                  lider={GestionAudienciasLider}
                  analista={GestionAudienciasAnalista}
                />
              </ModuloConCrm>
            </RutaPorRol>
          }
        />
        <Route
          path="/metricas"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <ModuloConCrm tipo="metricas">
                <PaginaPorRol
                  administrador={PantallaAdministracion}
                  lider={MetricasIndicadoresLider}
                  analista={RegistroMetricasAnalista}
                />
              </ModuloConCrm>
            </RutaPorRol>
          }
        />
        <Route
          path="/metricas/registro"
          element={
            <RutaPorRol gruposPermitidos={[GRUPOS_ROL.ANALISTA]}>
              <Navigate to="/metricas" replace />
            </RutaPorRol>
          }
        />
        <Route
          path="/analisis-comparativo"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <PaginaPorRol
                administrador={PantallaAdministracion}
                lider={AnalisisComparativoLider}
                analista={AnalisisComparativoAnalista}
              />
            </RutaPorRol>
          }
        />
        <Route
          path="/reportes"
          element={
            <RutaPorRol gruposPermitidos={GRUPOS_PERMITIDOS.TODOS}>
              <ModuloConCrm tipo="reportes">
                <PaginaPorRol
                  administrador={PantallaAdministracion}
                  lider={ReportesLider}
                  analista={ReportesAnalista}
                />
              </ModuloConCrm>
            </RutaPorRol>
          }
        />
      </Route>

      <Route path="/sin-acceso" element={<SinAcceso />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
