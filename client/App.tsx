import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { MarketProvider } from "@/context/MarketContext";
import TerminalLayout from "./components/layout/TerminalLayout";
import Landing from "./pages/Landing";
import Terminal from "./pages/Terminal";
import Watchlist from "./pages/Watchlist";
import Financials from "./pages/Financials";
import Sector from "./pages/Sector";
import Ceo from "./pages/Ceo";
import News from "./pages/News";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Hash routing for static single-file hosting (previews); browser routing otherwise.
const Router =
  import.meta.env.VITE_HASH_ROUTER === "1" ? HashRouter : BrowserRouter;

const wrap = (el: React.ReactNode) => <TerminalLayout>{el}</TerminalLayout>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <MarketProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/terminal" element={wrap(<Terminal />)} />
            <Route path="/watchlist" element={wrap(<Watchlist />)} />
            <Route path="/financials" element={wrap(<Financials />)} />
            <Route path="/sector" element={wrap(<Sector />)} />
            <Route path="/ceo" element={wrap(<Ceo />)} />
            <Route path="/news" element={wrap(<News />)} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MarketProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
