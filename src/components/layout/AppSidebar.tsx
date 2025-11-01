import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  BookOpen,
  Settings,
  Home,
  UserPlus,
  Briefcase,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const ENABLE_INTAKE = import.meta.env.VITE_ENABLE_INTAKE === 'true';
const ENABLE_CRM = import.meta.env.VITE_ENABLE_CRM === 'true';

const baseMenuItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Houses", url: "/houses", icon: Home },
  { title: "Residents", url: "/residents", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Notices", url: "/notices", icon: Bell },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Chores", url: "/chores", icon: ClipboardList },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

const intakeItem = { title: "Intake", url: "/intake", icon: UserPlus };
const crmItem = { title: "CRM", url: "/crm", icon: Briefcase };

const menuItems = [
  ...baseMenuItems.slice(0, 3), // Overview, Houses, Residents
  ...(ENABLE_INTAKE ? [intakeItem] : []),
  ...(ENABLE_CRM ? [crmItem] : []),
  ...baseMenuItems.slice(3), // Rest of the menu
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-6">
          <h1 className="text-xl font-semibold text-sidebar-foreground">
            SoberOps
          </h1>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
