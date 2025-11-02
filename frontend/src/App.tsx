import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Detections from "./pages/Detections";
import Residents from "./pages/Residents";
import AccessLogs from "./pages/AccessLogs";
import Lookup from "./pages/Lookup";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/detections" element={
            <ProtectedRoute>
              <Layout>
                <Detections />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/residents" element={
            <ProtectedRoute>
              <Layout>
                <Residents />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/access-logs" element={
            <ProtectedRoute>
              <Layout>
                <AccessLogs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/lookup" element={
            <ProtectedRoute>
              <Layout>
                <Lookup />
              </Layout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
