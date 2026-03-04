import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import FeatureGate from "./components/FeatureGate";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import Overview from "./pages/Overview";
import Houses from "./pages/Houses";
import HouseDetail from "./pages/HouseDetail";
import Residents from "./pages/Residents";
import Payments from "./pages/Payments";
import Notices from "./pages/Notices";
import Messages from "./pages/Messages";
import Chores from "./pages/Chores";
import Incidents from "./pages/Incidents";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import Intake from "./pages/Intake";
import CRM from "./pages/CRM";
import CRMContactDetail from "./pages/CRMContactDetail";
import CRMReferrals from "./pages/CRMReferrals";
import Maintenance from "./pages/Maintenance";
import StartupWizardList from "./pages/StartupWizardList";
import StartupWizard from "./pages/StartupWizard";
import OperatorOnboarding from "./pages/OperatorOnboarding";
import TrainingHub from "./pages/TrainingHub";
import CoursesCatalog from "./pages/CoursesCatalog";
import CourseDetail from "./pages/CourseDetail";
import LessonViewer from "./pages/LessonViewer";
import TrainingAdmin from "./pages/TrainingAdmin";
import Analytics from "./pages/Analytics";
import InvestorPortal from "./pages/InvestorPortal";
import Projections from "./pages/Projections";
import QuickBooks from "./pages/QuickBooks";
import Staff from "./pages/Staff";
import DrugTests from "./pages/DrugTests";
import Recovery from "./pages/Recovery";
import Documents from "./pages/Documents";
import Checklists from "./pages/Checklists";
import ChecklistDetail from "./pages/ChecklistDetail";
import DocumentGenerate from "./pages/DocumentGenerate";
import Emergency from "./pages/Emergency";
import Accreditation from "./pages/Accreditation";
import CommunityEngagement from "./pages/CommunityEngagement";
import Expenses from "./pages/Expenses";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect, useState } from "react";
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
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserRoleProvider>
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
              <Route path="/drug-tests" element={<ProtectedRoute><MainLayout><DrugTests /></MainLayout></ProtectedRoute>} />
              <Route path="/recovery" element={<ProtectedRoute><MainLayout><Recovery /></MainLayout></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_DOCUMENT_TEMPLATES"><Documents /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/documents/generate/:templateId" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_DOCUMENT_TEMPLATES"><DocumentGenerate /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/checklists" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CHECKLISTS"><Checklists /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/checklists/:id" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CHECKLISTS"><ChecklistDetail /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/emergency" element={<ProtectedRoute><MainLayout><Emergency /></MainLayout></ProtectedRoute>} />
              <Route path="/accreditation" element={<ProtectedRoute><MainLayout><Accreditation /></MainLayout></ProtectedRoute>} />
              <Route path="/community-engagement" element={<ProtectedRoute><MainLayout><CommunityEngagement /></MainLayout></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><MainLayout><Expenses /></MainLayout></ProtectedRoute>} />
              <Route path="/intake" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_INTAKE"><Intake /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CRM"><CRM /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/crm/contacts/:id" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CRM"><CRMContactDetail /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/crm/referrals" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_CRM"><CRMReferrals /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_MAINTENANCE"><Maintenance /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><MainLayout><OperatorOnboarding /></MainLayout></ProtectedRoute>} />
              <Route path="/startup" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_STARTUP_WIZARD"><StartupWizardList /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/startup/:wizardId" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_STARTUP_WIZARD"><StartupWizard /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><TrainingHub /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/courses" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><CoursesCatalog /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/courses/:id" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><CourseDetail /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/courses/:id/lesson/:lessonId" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><LessonViewer /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/training/admin" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_LMS"><TrainingAdmin /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ANALYTICS"><Analytics /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/investor-portal" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_INVESTOR_PORTAL"><InvestorPortal /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/projections" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_ANALYTICS"><Projections /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="/quickbooks" element={<ProtectedRoute><MainLayout><FeatureGate flag="ENABLE_QUICKBOOKS"><QuickBooks /></FeatureGate></MainLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </UserRoleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
