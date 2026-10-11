import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexto/ContextoAuth'

const PantallaInicio = () => {
  const { usuario, permisos, cerrarSesion } = useAuth()
  const navegar = useNavigate()

  const manejarCerrarSesion = () => {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg">👤</div>
        <div>
          <h1 className="text-3xl font-bold">¡Bienvenido, {usuario?.nombres}!</h1>
          <p className="mt-2 text-sm text-gray-400">{usuario?.correo}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Sesión activa</p>
          <p className="text-sm text-gray-300">ID: {usuario?.idUsuario}</p>
          <p className="text-sm text-gray-300">Rol: {usuario?.rol?.nombreRol}</p>
          <p className="text-sm text-gray-300">Estado: {usuario?.estado}</p>
          <p className="text-sm text-gray-300">Permisos: {permisos.join(', ') || 'Sin permisos asignados'}</p>
        </div>
        <button onClick={manejarCerrarSesion}
          className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 active:scale-[0.98]">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default PantallaInicio