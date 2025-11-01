import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
