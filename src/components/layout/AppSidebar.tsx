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
  Wrench,
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
const maintenanceItem = { title: "Maintenance", url: "/maintenance", icon: Wrench };

export function AppSidebar() {
  const { open } = useSidebar();
  
  const enableIntake = typeof window !== 'undefined' && localStorage.getItem("ENABLE_INTAKE") === "true";
  const enableCRM = typeof window !== 'undefined' && localStorage.getItem("ENABLE_CRM") === "true";
  const enableMaintenance = typeof window !== 'undefined' && localStorage.getItem("ENABLE_MAINTENANCE") === "true";

  const menuItems = [
    ...baseMenuItems.slice(0, 3),
    ...(enableIntake ? [intakeItem] : []),
    ...(enableCRM ? [crmItem] : []),
    ...(enableMaintenance ? [maintenanceItem] : []),
    ...baseMenuItems.slice(3),
  ];

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
