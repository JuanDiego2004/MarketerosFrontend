import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { ProveedorAuth, useAuth } from './contexto/ContextoAuth'
import RutaProtegida from './componentes/RutaProtegida'
import LayoutPrivado from './componentes/LayoutPrivado'

import PantallaLogin from './screens/login/PantallaLogin'
import PantallaRegistro from './screens/registro/PantallaRegistro'

import DashboardAdministrador from './screens/administrador/DashboardAdministrador'
import GestionUsuariosAdministrador from './screens/administrador/GestionUsuariosAdministrador'
import RolesPermisosAdministrador from './screens/administrador/RolesPermisosAdministrador'
import ClientesCanalesAdministrador from './screens/administrador/ClientesCanalesAdministrador'

import DashboardLider from './screens/lider/DashboardLider'
import GestionCampanasLider from './screens/lider/GestionCampanasLider'
import GestionAudienciasLider from './screens/lider/GestionAudienciasLider'
import MetricasIndicadoresLider from './screens/lider/MetricasIndicadoresLider'
import AnalisisComparativoLider from './screens/lider/AnalisisComparativoLider'
import ReportesLider from './screens/lider/ReportesLider'
import ClientesCanalesLider from './screens/lider/ClientesCanalesLider'

import DashboardAnalista from './screens/analista/DashboardAnalista'
import GestionCampanasAnalista from './screens/analista/GestionCampanasAnalista'
import GestionAudienciasAnalista from './screens/analista/GestionAudienciasAnalista'
import RegistroMetricasAnalista from './screens/analista/RegistroMetricasAnalista'
import AnalisisComparativoAnalista from './screens/analista/AnalisisComparativoAnalista'
import ReportesAnalista from './screens/analista/ReportesAnalista'

import './App.css'

function normalizar(texto = '') {
  return texto
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase()
}

function obtenerGrupoRol(nombreRol = '') {
  const rol = normalizar(nombreRol)

  if (rol.includes('admin')) return 'administrador'

  if (rol.includes('project manager') || rol.includes('lider de marketing')) {
    return 'lider'
  }

  if (rol.includes('analista') || rol.includes('operador')) {
    return 'analista'
  }

  return null
}

function RutaPorRol({ gruposPermitidos, children }) {
  const { usuario } = useAuth()
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol)

  if (!grupo || !gruposPermitidos.includes(grupo)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return children
}

function DashboardPorRol() {
  const { usuario } = useAuth()
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol)

  if (grupo === 'administrador') return <DashboardAdministrador />
  if (grupo === 'lider') return <DashboardLider />
  if (grupo === 'analista') return <DashboardAnalista />

  return <Navigate to="/sin-acceso" replace />
}

function PaginaPorRol({ administrador, lider, analista }) {
  const { usuario } = useAuth()
  const grupo = obtenerGrupoRol(usuario?.rol?.nombreRol)
  const Componente = { administrador, lider, analista }[grupo]

  return Componente
      ? <Componente />
      : <Navigate to="/sin-acceso" replace />
}

function SinAcceso() {
  return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <h1>No tienes permiso para acceder a esta sección.</h1>
        <Link className="mt-4 inline-block underline" to="/dashboard">
          Volver al dashboard
        </Link>
      </main>
  )
}

const TODOS = ['administrador', 'lider', 'analista']
const ADMIN = ['administrador']
const LIDER_Y_ANALISTA = ['lider', 'analista']
const ADMIN_Y_LIDER = ['administrador', 'lider']

export default function App() {
  return (
      <BrowserRouter>
        <ProveedorAuth>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PantallaLogin />} />
            <Route path="/registro" element={<PantallaRegistro />} />
            <Route path="/inicio" element={<Navigate to="/dashboard" replace />} />

           <Route
                element={
                  <RutaProtegida>
                    <LayoutPrivado />
                  </RutaProtegida>
                }
            >
              <Route
                  path="/dashboard"
                  element={
                    <RutaPorRol gruposPermitidos={TODOS}>
                      <DashboardPorRol />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/usuarios"
                  element={
                    <RutaPorRol gruposPermitidos={ADMIN}>
                      <GestionUsuariosAdministrador />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/roles-permisos"
                  element={
                    <RutaPorRol gruposPermitidos={ADMIN}>
                      <RolesPermisosAdministrador />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/clientes-canales"
                  element={
                    <RutaPorRol gruposPermitidos={ADMIN_Y_LIDER}>
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
                    <RutaPorRol gruposPermitidos={LIDER_Y_ANALISTA}>
                      <PaginaPorRol
                          lider={GestionCampanasLider}
                          analista={GestionCampanasAnalista}
                      />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/audiencias"
                  element={
                    <RutaPorRol gruposPermitidos={LIDER_Y_ANALISTA}>
                      <PaginaPorRol
                          lider={GestionAudienciasLider}
                          analista={GestionAudienciasAnalista}
                      />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/metricas"
                  element={
                    <RutaPorRol gruposPermitidos={['lider']}>
                      <MetricasIndicadoresLider />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/metricas/registro"
                  element={
                    <RutaPorRol gruposPermitidos={['analista']}>
                      <RegistroMetricasAnalista />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/analisis-comparativo"
                  element={
                    <RutaPorRol gruposPermitidos={LIDER_Y_ANALISTA}>
                      <PaginaPorRol
                          lider={AnalisisComparativoLider}
                          analista={AnalisisComparativoAnalista}
                      />
                    </RutaPorRol>
                  }
              />

              <Route
                  path="/reportes"
                  element={
                    <RutaPorRol gruposPermitidos={LIDER_Y_ANALISTA}>
                      <PaginaPorRol
                          lider={ReportesLider}
                          analista={ReportesAnalista}
                      />
                    </RutaPorRol>
                  }
              />
            </Route>

            <Route path="/sin-acceso" element={<SinAcceso />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ProveedorAuth>
      </BrowserRouter>
  )
}

