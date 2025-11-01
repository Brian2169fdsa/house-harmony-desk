import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import FeatureGate from "./components/FeatureGate";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const isFeatureEnabled = (flag: string) => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(flag) === 'true';
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Overview /></MainLayout>} />
          <Route path="/houses" element={<MainLayout><Houses /></MainLayout>} />
          <Route path="/houses/:id" element={<MainLayout><HouseDetail /></MainLayout>} />
          <Route path="/residents" element={<MainLayout><Residents /></MainLayout>} />
          <Route path="/payments" element={<MainLayout><Payments /></MainLayout>} />
          <Route path="/notices" element={<MainLayout><Notices /></MainLayout>} />
          <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
          <Route path="/chores" element={<MainLayout><Chores /></MainLayout>} />
          <Route path="/incidents" element={<MainLayout><Incidents /></MainLayout>} />
          <Route path="/resources" element={<MainLayout><Resources /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
          <Route path="/intake" element={<MainLayout><FeatureGate flag="ENABLE_INTAKE"><Intake /></FeatureGate></MainLayout>} />
          <Route path="/crm" element={<MainLayout><FeatureGate flag="ENABLE_CRM"><CRM /></FeatureGate></MainLayout>} />
          <Route path="/crm/contacts/:id" element={<MainLayout><FeatureGate flag="ENABLE_CRM"><CRMContactDetail /></FeatureGate></MainLayout>} />
          <Route path="/crm/referrals" element={<MainLayout><FeatureGate flag="ENABLE_CRM"><CRMReferrals /></FeatureGate></MainLayout>} />
          <Route path="/maintenance" element={<MainLayout><FeatureGate flag="ENABLE_MAINTENANCE"><Maintenance /></FeatureGate></MainLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
