import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🌍 Pages
import Landing from "./pages/Landing";
import SignIn from "./pages/dashboard/SignIn";
import SignUp from "./pages/dashboard/SignUp";
import ForgotPassword from "@/pages/dashboard/ForgotPassword";

// 🧩 Dashboard Layout + Subpages
import { DashboardLayout } from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Donors from "./pages/dashboard/Donors";
import Recipients from "./pages/dashboard/Recipients";
import Hospitals from "./pages/dashboard/Hospitals";
import Requests from "./pages/dashboard/Requests";
import Blockchain from "./pages/dashboard/Blockchain";
import Matching from "./pages/dashboard/Matching";
import RegisterDonor from "./pages/RegisterDonor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🏠 Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/hospitals" element={<Hospitals />} />


          {/* 📊 Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="donors" element={<Donors />} />
            <Route path="donors/add" element={<RegisterDonor />} />
            <Route path="recipients" element={<Recipients />} />
            <Route path="hospitals" element={<Hospitals />} />
            <Route path="requests" element={<Requests />} />
            <Route path="blockchain" element={<Blockchain />} />
            <Route path="matching" element={<Matching />} />
          </Route>

          {/* 🚫 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
