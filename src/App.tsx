import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PartnerProvider } from "@/contexts/PartnerContext";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminPartners from "./pages/admin/AdminPartners";
import { AdminRoute } from "./components/auth/AdminRoute";
import { PartnerRoute } from "./components/auth/PartnerRoute";
import { ConfigurationPanel } from "./components/PartnerConfig/ConfigurationPanel";
import { BudgetErrorBoundary } from "@/components/BudgetErrorBoundary";
import { LoginRedirect } from "./components/auth/LoginRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      {/* AccessibilityWidget only needs LanguageProvider */}
      <AccessibilityWidget />

      <PartnerProvider>
        {/* FloatingWhatsApp needs both Language and Partner */}
        <FloatingWhatsApp />

        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LoginRedirect />
            <Routes>
              <Route path="/" element={
                <BudgetErrorBoundary>
                  <Index />
                </BudgetErrorBoundary>
              } />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin/partners"
                element={
                  <AdminRoute>
                    <AdminPartners />
                  </AdminRoute>
                }
              />
              <Route
                path="/partner/config"
                element={
                  <PartnerRoute>
                    <ConfigurationPanel />
                  </PartnerRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <PartnerRoute>
                    <ConfigurationPanel />
                  </PartnerRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PartnerProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
