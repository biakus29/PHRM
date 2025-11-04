// Dashboard dédié pour les comptes démo avec restrictions intégrées
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Users, FileText, Calendar, Settings, BarChart3, AlertCircle, Lock } from "lucide-react";
import { useDemo } from "../contexts/DemoContext";
import DemoBanner from "../components/DemoBanner";
import DemoLimitModal from "../components/DemoLimitModal";
import UpgradeForm from "../components/UpgradeForm";
import DashboardSidebar from "../components/DashboardSidebar";
import MobileFooterNav from "../components/MobileFooterNav";
import Card from "../components/Card";
import Button from "../components/Button";

const DemoDashboard = () => {
  const navigate = useNavigate();
  const { isDemoAccount, demoData, isExpired, timeRemaining, canPerformAction, trackDemoAction } = useDemo();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarState, setSidebarState] = useState("fullyOpen");
  const [showDemoLimit, setShowDemoLimit] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [demoLimitAction, setDemoLimitAction] = useState('');
  const [employees, setEmployees] = useState([]);

  // Charger les données démo
  useEffect(() => {
    if (isExpired) {
      navigate('/subscription');
      return;
    }

    // Charger les employés démo
    if (demoData?.employees) {
      setEmployees(demoData.employees);
    }
  }, [isExpired, demoData, navigate]);

  // Bloquer toute action payante
  const handleBlockedAction = (actionType) => {
    setDemoLimitAction(actionType);
    setShowDemoLimit(true);
    toast.info("Cette fonctionnalité est réservée aux comptes Pro. Passez en Pro pour débloquer toutes les fonctionnalités.");
  };

  // Gérer l'ajout d'employé (max 2)
  const handleAddEmployee = () => {
    if (employees.length >= 2) {
      handleBlockedAction('employee');
      return;
    }
    // Ouvrir le formulaire d'ajout
    toast.info("Vous pouvez créer jusqu'à 2 employés en mode démo");
  };

  // Gérer la création de fiche de paie
  const handleCreatePayslip = () => {
    if (!canPerformAction('payslip')) {
      handleBlockedAction('payslip');
      return;
    }
    toast.info("Vous pouvez créer une fiche de paie (sans export PDF) en mode démo");
  };

  // Bloquer tout export PDF
  const handleExportPDF = () => {
    handleBlockedAction('pdf');
  };

  // Bloquer création de documents RH
  const handleCreateDocument = () => {
    handleBlockedAction('document');
  };

  const handleUpgradeClick = () => {
    setShowDemoLimit(false);
    setShowUpgradeForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <DemoBanner />
      
      <div className="flex">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarState={sidebarState}
          setSidebarState={setSidebarState}
          userRole="demo"
        />

        <main className="flex-1 p-6">
          {/* En-tête avec info démo */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Tableau de bord Démo</h1>
              <p className="text-blue-100">
                Explorez PHRM avec des fonctionnalités limitées. Passez en Pro pour débloquer tout le potentiel !
              </p>
              {timeRemaining && (
                <p className="text-sm text-blue-100 mt-2">
                  ⏱️ Temps restant : {timeRemaining}
                </p>
              )}
            </div>
          </div>

          {/* Vue d'ensemble */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Carte Employés */}
              <Card title="Employés" icon={Users}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-blue-600">{employees.length}/2</span>
                    <span className="text-sm text-gray-500">Limite démo</span>
                  </div>
                  <Button
                    onClick={handleAddEmployee}
                    disabled={employees.length >= 2}
                    className="w-full"
                  >
                    {employees.length >= 2 ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Limite atteinte
                      </>
                    ) : (
                      "Ajouter un employé"
                    )}
                  </Button>
                  {employees.length >= 2 && (
                    <p className="text-xs text-orange-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Passez en Pro pour ajouter plus d'employés
                    </p>
                  )}
                </div>
              </Card>

              {/* Carte Fiches de paie */}
              <Card title="Fiches de paie" icon={FileText}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-green-600">Aperçu</span>
                    <span className="text-sm text-gray-500">Sans PDF</span>
                  </div>
                  <Button onClick={handleCreatePayslip} className="w-full">
                    Créer une fiche
                  </Button>
                  <p className="text-xs text-gray-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Export PDF réservé aux comptes Pro
                  </p>
                </div>
              </Card>

              {/* Carte Documents RH */}
              <Card title="Documents RH" icon={FileText}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Lock className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Bloqué</span>
                  </div>
                  <Button onClick={handleCreateDocument} variant="secondary" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Fonctionnalité Pro
                  </Button>
                  <p className="text-xs text-gray-500">
                    Contrats, attestations, certificats...
                  </p>
                </div>
              </Card>

              {/* Carte Statistiques */}
              <Card title="Statistiques" icon={BarChart3}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Lock className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Bloqué</span>
                  </div>
                  <Button onClick={() => handleBlockedAction('stats')} variant="secondary" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Fonctionnalité Pro
                  </Button>
                </div>
              </Card>

              {/* Carte Congés */}
              <Card title="Gestion des congés" icon={Calendar}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Lock className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Bloqué</span>
                  </div>
                  <Button onClick={() => handleBlockedAction('leaves')} variant="secondary" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Fonctionnalité Pro
                  </Button>
                </div>
              </Card>

              {/* Carte Paramètres */}
              <Card title="Paramètres" icon={Settings}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Lock className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Bloqué</span>
                  </div>
                  <Button onClick={() => handleBlockedAction('settings')} variant="secondary" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Fonctionnalité Pro
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Section Upgrade */}
          <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-2">🚀 Passez en Pro pour débloquer tout !</h2>
            <ul className="space-y-2 mb-4 text-sm">
              <li>✅ Employés illimités</li>
              <li>✅ Export PDF de tous les documents</li>
              <li>✅ Contrats, attestations, certificats</li>
              <li>✅ Gestion complète des congés</li>
              <li>✅ Statistiques avancées</li>
              <li>✅ Support prioritaire</li>
            </ul>
            <Button
              onClick={() => setShowUpgradeForm(true)}
              className="bg-white text-orange-600 hover:bg-gray-100"
            >
              Passer en Pro maintenant
            </Button>
          </div>
        </main>
      </div>

      <MobileFooterNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modal de limitation démo */}
      <DemoLimitModal
        isOpen={showDemoLimit}
        onClose={() => setShowDemoLimit(false)}
        onUpgrade={handleUpgradeClick}
        actionType={demoLimitAction}
      />

      {/* Formulaire d'upgrade */}
      {showUpgradeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UpgradeForm onClose={() => setShowUpgradeForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoDashboard;
