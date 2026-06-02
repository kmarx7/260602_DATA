import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import FlowStepper from '@/components/layout/FlowStepper'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <FlowStepper />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
