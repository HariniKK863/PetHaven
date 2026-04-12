import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index";
import AdoptPage from "./pages/AdoptPage";
import PetDetailsPage from "./pages/PetDetailsPage";
import LostFoundPage from "./pages/LostFoundPage";
import ReportInjuredPage from "./pages/ReportInjuredPage";
import VetServicesPage from "./pages/VetServicesPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/adopt" element={<RequireAuth><AdoptPage /></RequireAuth>} />
            <Route path="/adopt/:id" element={<RequireAuth><PetDetailsPage /></RequireAuth>} />
            <Route path="/lost-found" element={<RequireAuth><LostFoundPage /></RequireAuth>} />
            <Route path="/report-injured" element={<RequireAuth><ReportInjuredPage /></RequireAuth>} />
            <Route path="/vet-services" element={<RequireAuth><VetServicesPage /></RequireAuth>} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
