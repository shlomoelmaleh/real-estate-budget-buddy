import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PartnerProvider } from "@/contexts/PartnerContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import Index from "./pages/Index";
import { BudgetErrorBoundary } from "@/components/BudgetErrorBoundary";
import { LoginRedirect } from "./components/auth/LoginRedirect";

// Lazy-loaded routes (not needed on initial page load)
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminMyConfig = lazy(() => import("./pages/admin/AdminMyConfig"));
const AdminRoute = lazy(() => import("./components/auth/AdminRoute").then(m => ({ default: m.AdminRoute })));
const PartnerRoute = lazy(() => import("./components/auth/PartnerRoute").then(m => ({ default: m.PartnerRoute })));
const ConfigurationPanel = lazy(() => import("./components/PartnerConfig/ConfigurationPanel").then(m => ({ default: m.ConfigurationPanel })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
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
              {/* AdminFloatingButton moved to BudgetCalculator to control visibility by step */}
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
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
                    path="/admin/my-config"
                    element={
                      <AdminRoute>
                        <AdminMyConfig />
                      </AdminRoute>
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </PartnerProvider>
      </LanguageProvider>
    </CurrencyProvider>
  </QueryClientProvider>
);

export default App;
