import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import StravaCallback from "./pages/StravaCallback.tsx";
import Admin from "./pages/Admin.tsx";
import Achievements from "./pages/Achievements.tsx";
import QRStart from "./pages/QRStart.tsx";
import QRFinish from "./pages/QRFinish.tsx";
import QRGenerator from "./pages/QRGenerator.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/strava/callback" element={<StravaCallback />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/qr/start" element={<QRStart />} />
          <Route path="/qr/finish" element={<QRFinish />} />
          <Route path="/qr/generate" element={<QRGenerator />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
