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
  FlaskConical,
  HeartHandshake,
  FileText,
  ShieldAlert,
  UserCog,
  BarChart2,
  TrendingUp,
  Calculator,
  Link2,
  Rocket,
  ClipboardCheck,
  GraduationCap,
  Award,
  HandshakeIcon,
  Receipt,
  MapPin,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const coreItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Houses", url: "/houses", icon: Home },
  { title: "Residents", url: "/residents", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Notices", url: "/notices", icon: Bell },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Chores", url: "/chores", icon: ClipboardList },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "Resources", url: "/resources", icon: BookOpen },
];

const residentCareItems = [
  { title: "Drug Tests", url: "/drug-tests", icon: FlaskConical },
  { title: "Recovery", url: "/recovery", icon: HeartHandshake },
];

const safetyItems = [
  { title: "Emergency", url: "/emergency", icon: ShieldAlert },
  { title: "Accreditation", url: "/accreditation", icon: Award },
  { title: "Community", url: "/community-engagement", icon: HandshakeIcon },
];

const adminItems = [
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Settings", url: "/settings", icon: Settings },
];

const onboardingItem = { title: "Operator Onboarding", url: "/onboarding", icon: MapPin };

const intakeItem = { title: "Intake", url: "/intake", icon: UserPlus };
const crmItem = { title: "CRM", url: "/crm", icon: Briefcase };
const maintenanceItem = { title: "Maintenance", url: "/maintenance", icon: Wrench };
const analyticsItem = { title: "Analytics", url: "/analytics", icon: BarChart2 };
const projectionsItem = { title: "Projections", url: "/projections", icon: Calculator };
const expensesItem = { title: "Expenses", url: "/expenses", icon: Receipt };
const investorPortalItem = { title: "Investor Portal", url: "/investor-portal", icon: TrendingUp };
const quickBooksItem = { title: "QuickBooks", url: "/quickbooks", icon: Link2 };
const startupWizardItem = { title: "Startup Wizard", url: "/startup", icon: Rocket };
const lmsItem = { title: "Training", url: "/training", icon: GraduationCap };
const checklistsItem = { title: "Checklists", url: "/checklists", icon: ClipboardCheck };
const documentTemplatesItem = { title: "Documents", url: "/documents", icon: FileText };

function NavGroup({
  label,
  items,
  open,
}: {
  label?: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  open: boolean;
}) {
  return (
    <SidebarGroup>
      {label && open && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
  );
}

export function AppSidebar() {
  const { open } = useSidebar();

  const enableIntake = typeof window !== "undefined" && localStorage.getItem("ENABLE_INTAKE") === "true";
  const enableCRM = typeof window !== "undefined" && localStorage.getItem("ENABLE_CRM") === "true";
  const enableMaintenance = typeof window !== "undefined" && localStorage.getItem("ENABLE_MAINTENANCE") === "true";
  const enableAnalytics = typeof window !== "undefined" && localStorage.getItem("ENABLE_ANALYTICS") === "true";
  const enableInvestorPortal = typeof window !== "undefined" && localStorage.getItem("ENABLE_INVESTOR_PORTAL") === "true";
  const enableQuickBooks = typeof window !== "undefined" && localStorage.getItem("ENABLE_QUICKBOOKS") === "true";
  const enableStartupWizard = typeof window !== "undefined" && localStorage.getItem("ENABLE_STARTUP_WIZARD") === "true";
  const enableChecklists = typeof window !== "undefined" && localStorage.getItem("ENABLE_CHECKLISTS") === "true";
  const enableDocumentTemplates = typeof window !== "undefined" && localStorage.getItem("ENABLE_DOCUMENT_TEMPLATES") === "true";
  const enableLMS = typeof window !== "undefined" && localStorage.getItem("ENABLE_LMS") === "true";

  const featureItems = [
    onboardingItem,
    ...(enableIntake ? [intakeItem] : []),
    ...(enableCRM ? [crmItem] : []),
    ...(enableMaintenance ? [maintenanceItem] : []),
    ...(enableStartupWizard ? [startupWizardItem] : []),
    ...(enableChecklists ? [checklistsItem] : []),
    ...(enableDocumentTemplates ? [documentTemplatesItem] : []),
    ...(enableLMS ? [lmsItem] : []),
  ];

  const analyticsItems = [
    ...(enableAnalytics ? [analyticsItem, projectionsItem, expensesItem] : []),
    ...(enableInvestorPortal ? [investorPortalItem] : []),
    ...(enableQuickBooks ? [quickBooksItem] : []),
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-6">
          <h1 className="text-xl font-semibold text-sidebar-foreground">SoberOps</h1>
        </div>

        <NavGroup items={coreItems} open={open} />

        {featureItems.length > 0 && (
          <NavGroup label="Features" items={featureItems} open={open} />
        )}

        {analyticsItems.length > 0 && (
          <NavGroup label="Analytics & Finance" items={analyticsItems} open={open} />
        )}

        <NavGroup label="Resident Care" items={residentCareItems} open={open} />
        <NavGroup label="Safety & Compliance" items={safetyItems} open={open} />
        <NavGroup label="Administration" items={adminItems} open={open} />
      </SidebarContent>
    </Sidebar>
  );
}
