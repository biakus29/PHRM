import React, { useMemo } from "react";
import Button from "../components/Button";
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

const NavItem = React.memo(({ id, label, icon: Icon, badge, isActive, setActiveTab, sidebarState }) => {
  return (
    <li key={id} className="relative group">
      <span
        aria-hidden
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r ${
          isActive ? "bg-blue-600" : "bg-transparent group-hover:bg-blue-200"
        }`}
      />
      <button
        onClick={() => setActiveTab(id)}
        aria-current={isActive ? "page" : undefined}
        className={`w-full flex items-center gap-3 p-3 pl-4 rounded-lg transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-300 ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
            : "text-gray-700 hover:bg-blue-50"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {sidebarState === "fullyOpen" && (
          <span className="flex-1 text-sm font-medium truncate">{label}</span>
        )}
        {sidebarState === "fullyOpen" && badge != null && (
          <span
            className={`ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs ${
              isActive ? "bg-white/20 text-white" : "bg-blue-600 text-white"
            }`}
          >
            {badge}
          </span>
        )}
      </button>
      {sidebarState === "minimized" && (
        <span
          role="tooltip"
          className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow hidden group-hover:block whitespace-nowrap"
        >
          {label}
        </span>
      )}
    </li>
  );
});

const mainItems = [
  { id: "overview", label: "Tableau de bord", icon: BarChart3 },
  { id: "employees", label: "Employés", icon: Users },
  { id: "leaves", label: "Congés", icon: Calendar },
  { id: "absences", label: "Absences", icon: Clock },
  { id: "payslips", label: "Paie", icon: CreditCard },
  { id: "reports", label: "Déclarations", icon: Download },
];

const toolsItems = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "badges", label: "Badges", icon: Users },
  { id: "settings", label: "Paramètres", icon: Settings },
];

const DashboardSidebar = ({
  sidebarState = "fullyOpen",
  setSidebarState,
  companyData,
  activeTab,
  setActiveTab,
  logoData,
  handleLogout,
  notifications = [],
}) => {
  const notificationCount = useMemo(() => notifications?.length || 0, [notifications]);

  const toggleSidebar = () => {
    setSidebarState((prev) => {
      if (prev === "fullyOpen") return "minimized";
      if (prev === "minimized") return "hidden";
      return "fullyOpen";
    });
  };

  return (
    <>
      <aside
        className={`hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:bg-white md:border-r md:border-blue-100 md:transition-all md:duration-300 ${
          sidebarState === "fullyOpen" ? "md:w-64" : sidebarState === "minimized" ? "md:w-16" : "md:w-0 md:-translate-x-full"
        } lg:static lg:translate-x-0 lg:h-screen lg:flex lg:flex-col`}
      >
        <div className="p-4 border-b border-blue-100">
          <div className="flex items-center justify-between">
            {sidebarState === "fullyOpen" ? (
              <div className="flex items-center gap-3 min-w-0">
                {logoData ? (
                  <img
                    src={logoData}
                    alt="Logo"
                    className="h-10 w-10 object-cover rounded-lg ring-1 ring-blue-100"
                    onError={(e) => (e.target.src = "/fallback-logo.png")}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-gray-900 truncate">RH Dashboard</h1>
                  <p className="text-xs text-gray-500 truncate" title={companyData?.name || "Entreprise"}>
                    {companyData?.name || "Entreprise"}
                  </p>
                </div>
              </div>
            ) : sidebarState === "minimized" ? (
              <div className="w-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : null}
            <Button
              onClick={toggleSidebar}
              variant="outline"
              size="sm"
              className="lg:hidden"
              aria-label={
                sidebarState === "fullyOpen"
                  ? "Réduire la barre latérale"
                  : sidebarState === "minimized"
                  ? "Masquer la barre latérale"
                  : "Ouvrir la barre latérale"
              }
            >
              {sidebarState === "fullyOpen" ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-6">
            <div>
              {sidebarState === "fullyOpen" && (
                <div className="px-2 pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Principal
                </div>
              )}
              <ul className="space-y-1">
                {mainItems.map((it) => (
                  <NavItem
                    key={it.id}
                    id={it.id}
                    label={it.label}
                    icon={it.icon}
                    isActive={activeTab === it.id}
                    setActiveTab={setActiveTab}
                    sidebarState={sidebarState}
                  />
                ))}
              </ul>
            </div>

            <div>
              {sidebarState === "fullyOpen" && (
                <div className="px-2 pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Outils
                </div>
              )}
              <ul className="space-y-1">
                {toolsItems.map((it) => (
                  <NavItem
                    key={it.id}
                    id={it.id}
                    label={it.label}
                    icon={it.icon}
                    badge={it.id === "notifications" ? notificationCount : it.badge}
                    isActive={activeTab === it.id}
                    setActiveTab={setActiveTab}
                    sidebarState={sidebarState}
                  />
                ))}
              </ul>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-blue-100">
          {sidebarState === "fullyOpen" && (
            <div className="mb-2 text-xs text-gray-500">
              <div className="truncate">
                <span className="font-medium text-gray-700">Société:</span>{" "}
                {companyData?.name || "N/A"}
              </div>
              {companyData?.cnpsNumber && (
                <div className="truncate">
                  <span className="font-medium text-gray-700">CNPS:</span>{" "}
                  {companyData.cnpsNumber}
                </div>
              )}
            </div>
          )}
          <Button onClick={handleLogout} variant="danger" className="w-full justify-center">
            {sidebarState === "fullyOpen" ? "Déconnexion" : <X className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Bouton flottant pour rouvrir la barre latérale */}
      {sidebarState === "hidden" && (
        <Button
          onClick={() => setSidebarState("fullyOpen")}
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 lg:hidden rounded-full p-2 shadow-lg"
          aria-label="Ouvrir la barre latérale"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      )}

      {/* Overlay désactivé sur mobile - sidebar cachée */}
    </>
  );
};

export default DashboardSidebar;