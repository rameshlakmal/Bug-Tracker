import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export function Layout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/45">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border/60 bg-background/70 px-4 py-2 backdrop-blur md:hidden">
          <SidebarTrigger />
          <div className="text-sm font-semibold">Defect Tracker</div>
        </header>
        <main className="mx-auto w-full max-w-6xl p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
