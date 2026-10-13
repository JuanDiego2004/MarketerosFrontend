import Header from './header.jsx'
import Sidebar from './sidebar/Sidebar.jsx'
import { Outlet } from 'react-router-dom'

export default function LayoutPrivado() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[url(/fondo6.jpeg)] bg-cover bg-center">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto rounded-tl-[28px]  p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
