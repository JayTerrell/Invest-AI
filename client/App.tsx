import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import TechnicalAnalysis from "./pages/TechnicalAnalysis";
import Watchlist from "./pages/Watchlist";
import Financials from "./pages/Financials";
import Sector from "./pages/Sector";
import Ceo from "./pages/Ceo";
import News from "./pages/News";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout><div /></AppLayout>} />
          <Route path="/" element={<AppLayout><TechnicalAnalysis /></AppLayout>} />
          <Route path="/watchlist" element={<AppLayout><Watchlist /></AppLayout>} />
          <Route path="/financials" element={<AppLayout><Financials /></AppLayout>} />
          <Route path="/sector" element={<AppLayout><Sector /></AppLayout>} />
          <Route path="/ceo" element={<AppLayout><Ceo /></AppLayout>} />
          <Route path="/news" element={<AppLayout><News /></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
