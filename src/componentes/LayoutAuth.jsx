import { useEffect, useState } from 'react'
import fondoClaro from '../assets/bg_light.jpg'
import fondoOscuro from '../assets/bg_dark.jpg'

const LayoutAuth = ({ children }) => {
  const [esModoOscuro, setEsModoOscuro] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const manejarCambio = (e) => setEsModoOscuro(e.matches)
    mediaQuery.addEventListener('change', manejarCambio)
    return () => mediaQuery.removeEventListener('change', manejarCambio)
  }, [])

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700 ${esModoOscuro ? 'dark' : ''}`}
      style={{
        backgroundImage: `url(${esModoOscuro ? fondoOscuro : fondoClaro})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl px-8 py-10 shadow-2xl bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 text-gray-800 dark:text-white">
          <div className="flex justify-end mb-4">
            <span className="text-xs opacity-50 select-none">
              {esModoOscuro ? '🌙 Modo oscuro' : '☀️ Modo claro'}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default LayoutAuth
