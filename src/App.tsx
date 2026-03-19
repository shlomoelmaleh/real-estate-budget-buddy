import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { PartnerProvider, usePartner } from "@/contexts/PartnerContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { useEffect } from "react";
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

function CurrencyProviderWithPartner({ children }: { children: React.ReactNode }) {
  const { partner } = usePartner();
  const defaultCurrency = (partner as any)?.default_currency;
  return (
    <CurrencyProvider defaultCurrency={defaultCurrency}>
      {children}
    </CurrencyProvider>
  );
}

function PartnerLanguageApplier({ children }: { children: React.ReactNode }) {
  const { partner, isLoading } = usePartner();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    if (!isLoading && partner) {
      const defaultLang = (partner as any)?.default_language;
      if (defaultLang && ['he', 'en', 'fr'].includes(defaultLang)) {
        setLanguage(defaultLang);
      }
    }
  }, [partner, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      {/* AccessibilityWidget only needs LanguageProvider */}
      <AccessibilityWidget />

      <PartnerProvider>
        <PartnerLanguageApplier>
        <CurrencyProviderWithPartner>
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
        </CurrencyProviderWithPartner>
      </PartnerProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
