import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperAdminDashboard from "./pages/superadmin";
import ClientAdminLogin from "./pages/loginclient";
import ClientAdminDashboard from "./pages/ClientAdminDashboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import SuperAdminLogin from "./pages/superadminlogin";
import DashboardLayout from "./pages/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/super-admin-login" element={<SuperAdminLogin />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/client-admin-login" element={<ClientAdminLogin />} />
        <Route path="/client-admin-dashboard" element={<ClientAdminDashboard />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/" element={<ClientAdminLogin />} />
        <Route path="/dashboard" element={<DashboardLayout />}/>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;