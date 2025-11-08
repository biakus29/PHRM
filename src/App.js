import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperAdminDashboard from "./pages/superadmin";
import ClientAdminLogin from "./pages/loginclient";
import ClientAdminDashboard from "./pages/ClientAdminDashboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import SuperAdminLogin from "./pages/superadminlogin";
import InteractiveDemo from "./pages/InteractiveDemo";
import DemoSignup from "./pages/DemoSignup";
import DemoDashboard from "./pages/DemoDashboard";
import PublicDemo from "./pages/PublicDemo";
import RegisterClient from "./pages/RegisterClient";
import FeaturesPage from "./pages/FeaturesPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import PublicJobs from "./pages/PublicJobs";
import PublicJobDetail from "./pages/PublicJobDetail";
import PublicApply from "./pages/PublicApply";
import CandidateProfile from "./pages/CandidateProfile";
import CandidateApplications from "./pages/CandidateApplications";
import BlogPage from "./pages/BlogPage";
import { FiscalSettingsProvider } from "./contexts/FiscalSettingsContext";
import { DemoProvider } from "./contexts/DemoContext";
import DemoBanner from "./components/DemoBanner";
import { NonDemoRoute, DemoOnlyRoute } from "./components/ProtectedRoute";


function App() {
  return (
    <FiscalSettingsProvider>
      <DemoProvider>
        <BrowserRouter>
          <DemoBanner />
          <Routes>
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/client-admin-login" element={<ClientAdminLogin />} />
            <Route path="/client-admin-dashboard" element={
              <NonDemoRoute>
                <ClientAdminDashboard />
              </NonDemoRoute>
            } />
            <Route path="/demo-dashboard" element={
              <DemoOnlyRoute>
                <DemoDashboard />
              </DemoOnlyRoute>
            } />
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/demo-signup" element={<DemoSignup />} />
            <Route path="/demo" element={<PublicDemo />} />
            <Route path="/register-client" element={<RegisterClient />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/interactive-demo" element={<InteractiveDemo />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/offres" element={<PublicJobs />} />
            <Route path="/offres/:jobId" element={<PublicJobDetail />} />
            <Route path="/postuler/:jobId" element={<PublicApply />} />
            <Route path="/candidat/profil" element={<CandidateProfile />} />
            <Route path="/candidat/mes-candidatures" element={<CandidateApplications />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/" element={<ClientAdminLogin />} />
          </Routes>
        </BrowserRouter>
      </DemoProvider>
    </FiscalSettingsProvider>
  );
}

export default App;