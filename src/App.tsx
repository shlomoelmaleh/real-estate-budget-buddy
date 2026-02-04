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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <PartnerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin/partners"
                element={
                  <AdminRoute>
                    <AdminPartners />
                  </AdminRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* --- GLOBAL WIDGETS --- */}
            {/* Accessibility Widget - UserWay */}
            <AccessibilityWidget />
            {/* Floating WhatsApp button - appears on every page */}
            <FloatingWhatsApp />
          </BrowserRouter>
        </TooltipProvider>
      </PartnerProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
