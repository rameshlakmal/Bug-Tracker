import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  PenSquare,
  FileBarChart2,
  TrendingUp,
  Settings2,
  ChevronDown,
  FolderKanban,
  Timer,
  Users,
} from 'lucide-react'

const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/entry', label: 'Entry', icon: PenSquare },
  { to: '/report', label: 'Report', icon: FileBarChart2 },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
] as const

const adminSubItems = [
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/sprints', label: 'Sprints', icon: Timer },
  { to: '/admin/developers', label: 'Developers', icon: Users },
] as const

export function AppSidebar() {
  const location = useLocation()
  const isAdminActive = location.pathname.startsWith('/admin')
  const [adminOpen, setAdminOpen] = useState(isAdminActive)

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-r border-sidebar-border/60"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-muted/40 text-foreground shadow-sm">
            {'\uD83D\uDC1B'}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold leading-tight">Defect Tracker</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <NavLink to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Collapsible Admin group */}
              <Collapsible.Root open={adminOpen} onOpenChange={setAdminOpen} asChild>
                <SidebarMenuItem>
                  <Collapsible.Trigger asChild>
                    <SidebarMenuButton
                      isActive={isAdminActive}
                      tooltip="Admin"
                      className="group-data-[collapsible=icon]:justify-center"
                    >
                      <Settings2 />
                      <span>Admin</span>
                      <ChevronDown
                        className="ml-auto transition-transform group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180"
                        data-state={adminOpen ? 'open' : 'closed'}
                      />
                    </SidebarMenuButton>
                  </Collapsible.Trigger>

                  <Collapsible.Content>
                    <SidebarMenuSub>
                      {adminSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname.startsWith(item.to)}
                          >
                            <NavLink to={item.to}>
                              <item.icon />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </Collapsible.Content>
                </SidebarMenuItem>
              </Collapsible.Root>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  )
}
