import { useAuth } from '../contexto/ContextoAuth'
import { Navigate } from 'react-router-dom'

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-sm opacity-60">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return usuario ? children : <Navigate to="/login" replace />
}

export default RutaProtegida
