import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperAdminDashboard from "./pages/superadmin";
import ClientAdminLogin from "./pages/loginclient";
import ClientAdminDashboard from "./pages/ClientAdminDashboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import SuperAdminLogin from "./pages/superadminlogin";
import InteractiveDemo from "./pages/InteractiveDemo";
import DemoSignup from "./pages/DemoSignup";
import { FiscalSettingsProvider } from "./contexts/FiscalSettingsContext";
import { DemoProvider } from "./contexts/DemoContext";


function App() {
  return (
    <FiscalSettingsProvider>
      <DemoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/client-admin-login" element={<ClientAdminLogin />} />
            <Route path="/client-admin-dashboard" element={<ClientAdminDashboard />} />
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/demo-signup" element={<DemoSignup />} />
            <Route path="/demo" element={<InteractiveDemo />} />
            <Route path="/" element={<ClientAdminLogin />} />
          </Routes>
        </BrowserRouter>
      </DemoProvider>
    </FiscalSettingsProvider>
  );
}

export default App;