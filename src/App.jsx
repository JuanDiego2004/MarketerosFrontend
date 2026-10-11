import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAuth } from './contexto/ContextoAuth'
import RutaProtegida from './componentes/RutaProtegida'
import PantallaLogin from './screens/login/PantallaLogin'
import PantallaRegistro from './screens/registro/PantallaRegistro'
import PantallaInicio from './screens/inicio/PantallaInicio'
import PantallaUsuarios from './screens/usuarios/PantallaUsuarios'
import './App.css'

const App = () => {
  const pantallaProtegida = (
    <RutaProtegida>
      <PantallaInicio />
    </RutaProtegida>
  )

  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<PantallaLogin />} />
          <Route path="/registro" element={<PantallaRegistro />} />
          <Route path="/inicio" element={pantallaProtegida} />
          <Route path="/campanas" element={pantallaProtegida} />
          <Route path="/usuarios" element={<RutaProtegida><PantallaUsuarios /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ProveedorAuth>
    </BrowserRouter>
  )
}

export default App