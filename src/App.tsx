import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import FeatureGate from "./components/FeatureGate";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AssistantProvider } from "./contexts/AssistantContext";
import { AssistantPanel } from "./components/assistant/AssistantPanel";
import { AssistantFAB } from "./components/assistant/AssistantFAB";
import { lazy, Suspense, useEffect, useState } from "react";

// ─── Lazy-loaded page components (code-splitting) ─────────────────────────
const Overview = lazy(() => import("./pages/Overview"));
const Houses = lazy(() => import("./pages/Houses"));
const HouseDetail = lazy(() => import("./pages/HouseDetail"));
const Residents = lazy(() => import("./pages/Residents"));
const Payments = lazy(() => import("./pages/Payments"));
const Notices = lazy(() => import("./pages/Notices"));
const Messages = lazy(() => import("./pages/Messages"));
const Chores = lazy(() => import("./pages/Chores"));
const Incidents = lazy(() => import("./pages/Incidents"));
const Resources = lazy(() => import("./pages/Resources"));
const Settings = lazy(() => import("./pages/Settings"));
const Intake = lazy(() => import("./pages/Intake"));
const CRM = lazy(() => import("./pages/CRM"));
const CRMContactDetail = lazy(() => import("./pages/CRMContactDetail"));
const CRMReferrals = lazy(() => import("./pages/CRMReferrals"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const StartupWizardList = lazy(() => import("./pages/StartupWizardList"));
const StartupWizard = lazy(() => import("./pages/StartupWizard"));
const TrainingHub = lazy(() => import("./pages/TrainingHub"));
const CoursesCatalog = lazy(() => import("./pages/CoursesCatalog"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const LessonViewer = lazy(() => import("./pages/LessonViewer"));
const TrainingAdmin = lazy(() => import("./pages/TrainingAdmin"));
const Analytics = lazy(() => import("./pages/Analytics"));
const InvestorPortal = lazy(() => import("./pages/InvestorPortal"));
const Projections = lazy(() => import("./pages/Projections"));
const QuickBooks = lazy(() => import("./pages/QuickBooks"));
const Staff = lazy(() => import("./pages/Staff"));
const StaffScheduling = lazy(() => import("./pages/StaffScheduling"));
const InvestorManagement = lazy(() => import("./pages/InvestorManagement"));
const MaintenanceBudgets = lazy(() => import("./pages/MaintenanceBudgets"));
const PreventiveMaintenance = lazy(() => import("./pages/PreventiveMaintenance"));
const AlumniNetwork = lazy(() => import("./pages/AlumniNetwork"));
const AgentHub = lazy(() => import("./pages/AgentHub"));
const AgentActivityLog = lazy(() => import("./pages/AgentActivityLog"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const MarketingAnalytics = lazy(() => import("./pages/MarketingAnalytics"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const QuickBooksSettings = lazy(() => import("./pages/QuickBooksSettings"));
const QuickBooksSyncDashboard = lazy(() => import("./pages/QuickBooksSyncDashboard"));
const QuickBooksReports = lazy(() => import("./pages/QuickBooksReports"));
const MessageTemplateManager = lazy(() => import("./pages/MessageTemplateManager"));
const PortfolioView = lazy(() => import("./pages/PortfolioView"));
const DrugTests = lazy(() => import("./pages/DrugTests"));
const Recovery = lazy(() => import("./pages/Recovery"));
const Documents = lazy(() => import("./pages/Documents"));
const Checklists = lazy(() => import("./pages/Checklists"));
const ChecklistDetail = lazy(() => import("./pages/ChecklistDetail"));
const DocumentGenerate = lazy(() => import("./pages/DocumentGenerate"));
const Emergency = lazy(() => import("./pages/Emergency"));
const OccupancyDashboard = lazy(() => import("./pages/OccupancyDashboard"));
const ReportCenter = lazy(() => import("./pages/ReportCenter"));
const CommunicationCenter = lazy(() => import("./pages/CommunicationCenter"));
const CommunicationHistory = lazy(() => import("./pages/CommunicationHistory"));
const CommunicationTemplates = lazy(() => import("./pages/CommunicationTemplates"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserRoleProvider>
            <AssistantProvider>
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
            <Routes>
              <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />

              <Route path="/" element={<ProtectedRoute><MainLayout><Overview /></MainLayout></ProtectedRoute>} />
              <Route path="/houses" element={<ProtectedRoute><MainLayout><Houses /></MainLayout></ProtectedRoute>} />
              <Route path="/houses/:id" element={<ProtectedRoute><MainLayout><HouseDetail /></MainLayout></ProtectedRoute>} />
              <Route path="/residents" element={<ProtectedRoute><MainLayout><Residents /></MainLayout></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><MainLayout><Payments /></MainLayout></ProtectedRoute>} />
              <Route path="/notices" element={<ProtectedRoute><MainLayout><Notices /></MainLayout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MainLayout><Messages /></MainLayout></ProtectedRoute>} />
              <Route path="/chores" element={<ProtectedRoute><MainLayout><Chores /></MainLayout></ProtectedRoute>} />
              <Route path="/incidents" element={<ProtectedRoute><MainLayout><Incidents /></MainLayout></ProtectedRoute>} />
              <Route path="/resources" element={<ProtectedRoute><MainLayout><Resources /></MainLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute><MainLayout><Staff /></MainLayout></ProtectedRoute>} />
              <Route path="/staff/scheduling" element={<ProtectedRoute><MainLayout><StaffScheduling /></MainLayout></ProtectedRoute>} />
              <Route path="/drug-tests" element={<ProtectedRoute><MainLayout><DrugTests /></MainLayout></ProtectedRoute>} />
              <Route path="/recovery" element={<ProtectedRoute><MainLayout><Recovery /></MainLayout></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_DOCUMENT_TEMPLATES"><Documents /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/documents/generate/:templateId" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_DOCUMENT_TEMPLATES"><DocumentGenerate /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/checklists" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CHECKLISTS"><Checklists /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/checklists/:id" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CHECKLISTS"><ChecklistDetail /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/emergency" element={<ProtectedRoute><MainLayout><Emergency /></MainLayout></ProtectedRoute>} />
              <Route path="/intake" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_INTAKE"><Intake /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CRM"><CRM /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/crm/contacts/:id" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CRM"><CRMContactDetail /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/crm/referrals" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CRM"><CRMReferrals /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_MAINTENANCE"><Maintenance /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/maintenance/budgets" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_MAINTENANCE"><MaintenanceBudgets /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/maintenance/preventive" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_MAINTENANCE"><PreventiveMaintenance /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/startup" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_STARTUP_WIZARD"><StartupWizardList /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/startup/:wizardId" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_STARTUP_WIZARD"><StartupWizard /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><TrainingHub /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/courses" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><CoursesCatalog /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/courses/:id" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><CourseDetail /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/courses/:id/lesson/:lessonId" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><LessonViewer /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/admin" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><TrainingAdmin /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ANALYTICS"><Analytics /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/investor-portal" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_INVESTOR_PORTAL"><InvestorPortal /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/investor-portal/investors" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_INVESTOR_PORTAL"><InvestorManagement /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/projections" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ANALYTICS"><Projections /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/quickbooks" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_QUICKBOOKS"><QuickBooks /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/alumni" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ALUMNI"><AlumniNetwork /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_AI_AGENTS"><AgentHub /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/agents/activity" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_AI_AGENTS"><AgentActivityLog /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/compliance" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_AI_AGENTS"><ComplianceDashboard /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/analytics/marketing" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ANALYTICS"><MarketingAnalytics /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/notification-settings" element={<ProtectedRoute><MainLayout><NotificationSettings /></MainLayout></ProtectedRoute>} />
              <Route path="/quickbooks/settings" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_QUICKBOOKS"><QuickBooksSettings /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/quickbooks/sync" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_QUICKBOOKS"><QuickBooksSyncDashboard /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/quickbooks/reports" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_QUICKBOOKS"><QuickBooksReports /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/messages/templates" element={<ProtectedRoute><MainLayout><MessageTemplateManager /></MainLayout></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ANALYTICS"><PortfolioView /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/occupancy" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_OCCUPANCY_OPTIMIZER"><OccupancyDashboard /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_REPORTS"><ReportCenter /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/communications" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_COMMUNICATIONS"><CommunicationCenter /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/communications/history" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_COMMUNICATIONS"><CommunicationHistory /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/communications/templates" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_COMMUNICATIONS"><CommunicationTemplates /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/audit-log" element={<ProtectedRoute><MainLayout><AuditLog /></MainLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <AssistantPanel />
            <AssistantFAB />
            </AssistantProvider>
          </UserRoleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
