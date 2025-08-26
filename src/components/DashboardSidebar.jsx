import React from "react";
import Button from "../compoments/Button";
import {
  Users,
  Calendar,
  Clock,
  CreditCard,
  Bell,
  Settings,
  BarChart3,
  Menu,
  X,
  Download,
} from "lucide-react";

const DashboardSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  companyData,
  activeTab,
  setActiveTab,
  logoData,
  handleLogout,
  notifications = [],
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-blue-100 transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-16"
      } md:static md:h-screen md:flex md:flex-col`}
    >
      <div className="p-4 border-b border-blue-100">
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              {logoData ? (
                <img src={logoData} alt="Logo" className="h-10 rounded-lg" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">RH Dashboard</h1>
                <p className="text-sm text-gray-500">{companyData?.name}</p>
              </div>
            </div>
          )}
          <Button onClick={() => setSidebarOpen(!sidebarOpen)} variant="outline" size="sm" className="md:hidden">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {[
            { id: "overview", label: "Tableau de bord", icon: BarChart3 },
            { id: "employees", label: "Employés", icon: Users },
            { id: "leaves", label: "Congés", icon: Calendar },
            { id: "absences", label: "Absences", icon: Clock },
            { id: "payslips", label: "Paie", icon: CreditCard },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "badges", label: "Badges", icon: Users },
            { id: "reports", label: "Rapports", icon: Download },
            { id: "settings", label: "Paramètres", icon: Settings },
          ].map((item) => (
            <li key={item.id} className="relative group">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                    : "text-gray-600 hover:bg-blue-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
              {!sidebarOpen && (
                <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded hidden group-hover:block">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-blue-100">
        <Button onClick={handleLogout} variant="danger" className="w-full justify-start">
          {sidebarOpen && "Déconnexion"}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
