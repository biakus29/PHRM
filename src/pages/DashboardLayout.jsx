// src/components/DashboardLayout.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { auth } from "../firebase";
import { getCompanyData } from "../utils/firebaseUtils";
import { cacheLogo, handleLogoUpload, removeLogo } from "../utils/logoUtils";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLogOut, FiHome, FiUsers, FiCalendar, FiFileText, FiBell, FiUpload,FiAlertTriangle } from "react-icons/fi";
import EmployeeManagement from "./EmployeeManagement";
import DocumentGeneration from "./DocumentGeneration";
import Button from "../compoments/Button";
import Card from "../compoments/card";

const DashboardLayout = () => {
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [logoData, setLogoData] = useState(null);
  const navigate = useNavigate();

  const handleError = useCallback((error, message) => {
    console.error(`[${message}] Erreur: ${error.message}`);
    toast.error(`${message}: ${error.message}`);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      console.log("[fetchData] Début chargement données entreprise et employés");
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage("Utilisateur non authentifié.");
        console.error("[fetchData] Utilisateur non authentifié");
        toast.error("Utilisateur non authentifié, redirection vers login.");
        navigate("/client-admin-login");
        return;
      }

      try {
        setLoading(true);
        const company = await getCompanyData(user.uid);
        if (company) {
          setCompanyData(company);
          setLogoData(cacheLogo(company.id));
          console.log(`[fetchData] Données entreprise chargées, companyId: ${company.id}`);

          const unsubscribe = onSnapshot(
            collection(db, "clients", company.id, "employees"),
            (snapshot) => {
              const employeesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setEmployees(employeesData);
              console.log(`[fetchData] ${employeesData.length} employés chargés`);
              setLoading(false);
            },
            (error) => {
              handleError(error, "Erreur chargement employés");
              setLoading(false);
            }
          );
          return () => unsubscribe();
        } else {
          setErrorMessage("Aucun client trouvé pour cet utilisateur.");
          setLoading(false);
        }
      } catch (error) {
        handleError(error, "Erreur chargement données");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, handleError]);

  const handleLogout = useCallback(async () => {
    console.log("[handleLogout] Début déconnexion");
    try {
      setActionLoading(true);
      await auth.signOut();
      navigate("/client-admin-login");
      console.log("[handleLogout] Déconnexion réussie");
      toast.info("Déconnexion réussie.");
    } catch (error) {
      handleError(error, "Erreur déconnexion");
    } finally {
      setActionLoading(false);
    }
  }, [navigate, handleError]);

  const handleLogoChange = useCallback(
    (file) => {
      handleLogoUpload(file, companyData?.id, (dataUrl) => {
        if (dataUrl) {
          setLogoData(dataUrl);
          console.log("[DashboardLayout] Logo mis à jour dans l'interface");
          toast.success("Logo chargé avec succès !");
        }
      });
    },
    [companyData]
  );

  const renderSection = useMemo(() => {
    if (!companyData) {
      return (
        <div className="text-gray-600">Chargement des données de l'entreprise...</div>
      );
    }

    switch (activeSection) {
      case "overview":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
            <Card title="Utilisateurs">
              <p className="text-2xl font-bold text-blue-600">
                {companyData.currentUsers || 0} / {companyData.licenseMaxUsers || "N/A"}
              </p>
              <p className="text-sm text-gray-500 mt-2">Employés actifs</p>
            </Card>
            <Card title="Licence">
              <p className="text-lg font-medium text-gray-900">
                Expire le {new Date(companyData.licenseExpiry).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Statut: <span className={companyData.isActive ? "text-green-600" : "text-red-600"}>{companyData.isActive ? "Active" : "Expirée"}</span>
              </p>
            </Card>
            <Card title="Congés Totaux">
              <p className="text-2xl font-bold text-blue-600">
                {employees.reduce(
                  (sum, emp) =>
                    sum +
                    (emp.leaves?.history
                      ?.filter((req) => req.status === "Approuvé")
                      .reduce((s, r) => s + r.days, 0) || 0),
                  0
                )}{" "}
                jours
              </p>
              <p className="text-sm text-gray-500 mt-2">Congés approuvés</p>
            </Card>
            <Card title="Paramètres de l'Entreprise">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Logo de l'entreprise</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleLogoChange(e.target.files[0])}
                    className="p-2 border border-gray-300 rounded-lg"
                    disabled={actionLoading}
                    aria-label="Charger le logo de l'entreprise"
                  />
                  <FiUpload className="h-5 w-5 text-gray-600" aria-hidden="true" />
                </div>
                {logoData && (
                  <img
                    src={logoData}
                    alt={`Logo de ${companyData.name}`}
                    className="mt-2 h-16"
                    onError={() => {
                      console.error("[Overview] Erreur chargement logo dans Paramètres");
                      toast.error("Erreur de chargement du logo. Vérifiez ou re-téléchargez.");
                    }}
                  />
                )}
                {logoData && (
                  <Button
                    onClick={() => {
                      console.log(`[Overview] Suppression logo pour companyId: ${companyData.id}`);
                      removeLogo(companyData.id);
                      setLogoData(null);
                    }}
                    variant="ghost"
                    className="mt-2"
                    disabled={actionLoading}
                    aria-label="Supprimer le logo"
                  >
                    Supprimer le logo
                  </Button>
                )}
              </div>
            </Card>
          </div>
        );
      case "employees":
        return (
          <EmployeeManagement
            companyData={companyData}
            employees={employees}
            setEmployees={setEmployees}
            actionLoading={actionLoading}
            setActionLoading={setActionLoading}
          />
        );
      case "badges":
        return (
          <DocumentGeneration
            companyData={companyData}
            employees={employees}
            actionLoading={actionLoading}
            setActionLoading={setActionLoading}
          />
        );
      default:
        return (
          <Card title={activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}>
            <p className="text-gray-600">
              Fonctionnalité "{activeSection}" en cours de développement.
            </p>
          </Card>
        );
    }
  }, [activeSection, companyData, employees, actionLoading, setActionLoading, logoData, handleLogoChange]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg flex items-start gap-3 animate-pulse">
          <FiAlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{errorMessage || "Aucune donnée disponible."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col space-y-4">
        <div className="flex items-center gap-2 mb-6">
          {logoData ? (
            <img
              src={logoData}
              alt={`Logo de ${companyData.name}`}
              className="h-10"
              onError={() => {
                console.error("[Sidebar] Erreur chargement logo dans la barre latérale");
                toast.error("Erreur de chargement du logo. Vérifiez ou re-téléchargez.");
              }}
            />
          ) : (
            <span className="text-lg font-bold">{companyData.name}</span>
          )}
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {[
              { id: "overview", label: "Vue d’ensemble", icon: FiHome },
              { id: "employees", label: "Employés", icon: FiUsers },
              { id: "leaves", label: "Congés", icon: FiCalendar },
              { id: "absences", label: "Absences", icon: FiCalendar },
              { id: "payslips", label: "Fiches de paie", icon: FiFileText },
              { id: "notifications", label: "Notifications", icon: FiBell },
              { id: "reports", label: "Rapports", icon: FiFileText },
              { id: "badges", label: "Badges", icon: FiUsers },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? "bg-blue-500 text-white rounded-lg"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  disabled={actionLoading}
                  aria-label={`Naviguer vers ${item.label}`}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <Button
          onClick={handleLogout}
          variant="danger"
          icon={FiLogOut}
          aria-label="Déconnexion"
          disabled={actionLoading}
        >
          Déconnexion
        </Button>
      </aside>
      <main className="flex-1 p-4 sm:p-6">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 animate-scale-in">
            Tableau de bord - {companyData.name}
          </h1>
        </header>
        {renderSection}
      </main>
    </div>
  );
};

export default DashboardLayout;