import { Outlet } from 'react-router-dom'
import { useUI } from '../context/UIContext'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import MobileBottomNav from '../components/layout/MobileBottomNav'

export default function DashboardLayout() {
  const { sidebarCollapsed } = useUI()

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <Sidebar mobile />

      <div
        className={`transition-[padding] duration-200 ${
          sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-72'
        }`}
      >
        <Topbar />
        <main className="p-4 pb-24 lg:p-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
