import React, { useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Line } from "react-chartjs-2";
import { QRCodeCanvas } from "qrcode.react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiLogOut,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiBell,
  FiSearch,
  FiDownload,
  FiPlus,
  FiAlertTriangle,
  FiHome,
  FiUpload,
} from "react-icons/fi";
import EmployeeCard from "../compoments/card";
import PaySlipGenerator from "./PaySlipGenerator";
import { normalizeEmployeeData } from "../utils/displayUtils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Fonction pour calculer la taille de localStorage
const getLocalStorageSize = () => {
  let total = 0;
  for (const x in localStorage) {
    if (localStorage.hasOwnProperty(x)) {
      total += ((localStorage[x].length + x.length) * 2);
    }
  }
  return total / 1024 / 1024; // Taille en Mo
};

// Fonction pour gérer l'upload et le stockage du logo dans localStorage
const handleLogoUpload = (file, companyId, callback) => {
  console.log(`[handleLogoUpload] Début upload logo, type: ${file.type}, taille: ${(file.size / 1024).toFixed(2)} Ko`);
  if (!file.type.match(/image\/(png|jpeg)/)) {
    console.warn("[handleLogoUpload] Format d'image non supporté:", file.type);
    toast.error("Seuls les formats PNG et JPEG sont supportés.");
    return null;
  }

  if (file.size > 2 * 1024 * 1024) {
    console.warn("[handleLogoUpload] Fichier trop volumineux:", (file.size / 1024).toFixed(2), "Ko");
    toast.error("Le fichier est trop volumineux. Utilisez une image de moins de 2 Mo.");
    return null;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    console.log(`[handleLogoUpload] Taille de la dataURL: ${(dataUrl.length / 1024).toFixed(2)} Ko`);
    
    if (getLocalStorageSize() + dataUrl.length / 1024 / 1024 > 4.5) {
      console.warn(`[handleLogoUpload] localStorage presque plein (${getLocalStorageSize().toFixed(2)} Mo)`);
      toast.warn("Stockage local presque plein. Videz le cache ou réduisez la taille du logo.");
      return;
    }

    try {
      localStorage.setItem(`logo_${companyId}`, dataUrl);
      console.log(`[handleLogoUpload] Logo stocké dans localStorage pour companyId: ${companyId}`);
      callback(dataUrl);
    } catch (e) {
      console.error(`[handleLogoUpload] Échec stockage localStorage: ${e.message}`);
      toast.error("Échec du stockage local : limite dépassée. Réduisez la taille du logo.");
    }
  };
  reader.onerror = () => {
    console.error("[handleLogoUpload] Erreur lecture fichier:", reader.error.message);
    toast.error("Erreur lors de la lecture du fichier image.");
  };
  reader.readAsDataURL(file);
  return null;
};

// Fonction pour charger le logo depuis localStorage


// Centralized error handler
const handleError = (error, message) => {
  console.error(`[${message}] Erreur: ${error.message}`);
  toast.error(`${message}: ${error.message}`);
};

// EmployeeBadge Component
const EmployeeBadge = ({ employee, companyData, animationDelay, actionLoading }) => {
  const qrCodeUrl = `https://yourapp.com/employee/${employee.id}`;
  const [logoData, setLogoData] = useState(cacheLogo(companyData.id));

  const generateBadgePDF = useCallback(async () => {
    console.log(`[EmployeeBadge] Début génération badge PDF pour employé: ${employee.name}`);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [85, 54],
      });

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 85, 54, "F");

      let logoFormat = "PNG";
      if (logoData) {
        try {
          const extension = logoData.includes("image/png") ? "png" : "jpeg";
          logoFormat = extension === "png" ? "PNG" : "JPEG";
          console.log(`[EmployeeBadge] Format d'image détecté pour badge: ${logoFormat}`);
          doc.addImage(logoData, logoFormat, 5, 5, 25, 10);
          console.log("[EmployeeBadge] Logo ajouté au badge PDF");
        } catch (error) {
          console.error(`[EmployeeBadge] Erreur ajout logo dans badge: ${error.message}`);
          doc.setFontSize(8);
          doc.text("Logo non disponible", 15, 10, { align: "center" });
          toast.warn("Erreur lors de l'ajout du logo au badge.");
        }
      } else {
        console.warn("[EmployeeBadge] Aucun logo disponible dans localStorage");
        doc.setFontSize(8);
        doc.text(companyData.name, 15, 10, { align: "center" });
        toast.warn("Aucun logo chargé. Téléchargez un logo dans 'Paramètres de l'Entreprise'.");
      }

      doc.addImage(
        employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff`,
        "PNG",
        5,
        20,
        25,
        25
      );
      console.log("[EmployeeBadge] Photo de profil ajoutée au badge");

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(employee.name, 35, 20);
      doc.setFontSize(10);
      doc.text(employee.poste, 35, 26);
      doc.text(employee.department || "N/A", 35, 32);
      doc.text(`Matricule: ${employee.id.slice(0, 8)}`, 35, 38);

      const qrCanvas = document.getElementById(`qr-${employee.id}`);
      if (!qrCanvas) {
        throw new Error("Canvas QR code introuvable");
      }
      const qrDataUrl = qrCanvas.toDataURL("image/png");
      doc.addImage(qrDataUrl, "PNG", 60, 40, 20, 20);
      console.log("[EmployeeBadge] QR code ajouté au badge");

      doc.setFontSize(8);
      doc.text(companyData.name, 5, 50);

      doc.save(`badge_${employee.name.replace(/\s+/g, "_")}.pdf`);
      console.log(`[EmployeeBadge] Badge PDF généré pour ${employee.name}`);
      toast.success(`Badge de ${employee.name} généré !`);
    } catch (error) {
      handleError(error, "Erreur génération badge PDF");
    }
  }, [employee, companyData, logoData]);

  return (
    <div
      className="w-[340px] h-[216px] bg-white border-2 border-blue-500 rounded-lg shadow-md p-4 flex flex-col justify-between animate-scale-in"
      style={{ animationDelay }}
    >
      <div className="flex justify-center">
        {logoData ? (
          <img
            src={logoData}
            alt="Logo"
            className="h-10"
            onError={() => {
              console.error("[EmployeeBadge] Erreur chargement logo dans l'interface");
              toast.error("Erreur de chargement du logo dans l'interface. Vérifiez ou re-téléchargez.");
            }}
          />
        ) : (
          <span className="text-lg font-bold">{companyData.name}</span>
        )}
      </div>
      <div className="flex">
        <div className="w-1/3">
          <img
            src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff`}
            alt={employee.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
          />
        </div>
        <div className="w-2/3 pl-4">
          <h3 className="text-lg font-semibold">{employee.name}</h3>
          <p className="text-sm text-gray-600">{employee.poste}</p>
          <p className="text-sm text-gray-600">{employee.department || "N/A"}</p>
          <p className="text-xs text-gray-500">Matricule: {employee.id.slice(0, 8)}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <QRCodeCanvas id={`qr-${employee.id}`} value={qrCodeUrl} size={80} />
      </div>
      <Button onClick={generateBadgePDF} icon={FiDownload} aria-label="Télécharger le badge" disabled={actionLoading}>
        Télécharger
      </Button>
    </div>
  );
};

// CompanyAdminDashboard Component
const CompanyAdminDashboard = () => {
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "Employé",
    poste: "",
    phone: "",
    department: "",
    hireDate: "",
    status: "Actif",
    cnpsNumber: "",
    professionalCategory: "",
    baseSalary: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [newNotification, setNewNotification] = useState("");
  const [newAbsence, setNewAbsence] = useState({ employeeId: "", date: "", reason: "", duration: 1 });
  const [showPaySlipForm, setShowPaySlipForm] = useState(false);
  const [showPaySlip, setShowPaySlip] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
  const [paySlipData, setPaySlipData] = useState(null);
  const [logoData, setLogoData] = useState(cacheLogo("temp_company_id")); // Initialiser avec un ID temporaire
  const navigate = useNavigate();

  // Mettre à jour logoData lorsque companyData est chargé
  useEffect(() => {
    if (companyData?.id) {
      setLogoData(cacheLogo(companyData.id));
    }
  }, [companyData]);
const cacheLogo = (companyId) => {
  const cacheKey = `logo_${companyId}`;
  const cachedLogo = localStorage.getItem(cacheKey);
  if (cachedLogo && cachedLogo.startsWith("data:image")) {
    console.log(`[cacheLogo] Logo chargé depuis localStorage pour companyId: ${companyId}`);
    return cachedLogo;
  }
  console.warn(`[cacheLogo] Aucun logo trouvé dans localStorage pour companyId: ${companyId}, utilisation du logo par défaut`);
  return "/images/default-logo.png"; // Chemin vers l'image par défaut
};
  // Define updateEmployee first to avoid TDZ
  const updateEmployee = useCallback(async (id, updatedData) => {
    console.log(`[updateEmployee] Mise à jour employé ID: ${id}`);
    try {
      setActionLoading(true);
      const employeeRef = doc(db, "clients", companyData.id, "employees", id);
      await updateDoc(employeeRef, updatedData);
      console.log(`[updateEmployee] Employé mis à jour avec succès`);
      toast.success("Employé mis à jour !");
    } catch (error) {
      handleError(error, "Erreur mise à jour employé");
    } finally {
      setActionLoading(false);
    }
  }, [companyData]);

const savePaySlip = useCallback(async (employeeId, paySlipData) => {
  console.log(`[savePaySlip] Enregistrement fiche de paie pour employé ID: ${employeeId}`, paySlipData);
  try {
    setActionLoading(true);
    const employee = employees.find((emp) => emp.id === employeeId);
    const updatedPaySlips = [
      ...(employee.payslips || []),
      { ...paySlipData, date: new Date().toISOString() },
    ];
    await updateEmployee(employeeId, { payslips: updatedPaySlips });
    console.log(`[savePaySlip] Fiche de paie enregistrée`);
    toast.success("Fiche de paie enregistrée avec succès !");
  } catch (error) {
    handleError(error, "Erreur enregistrement fiche de paie");
  } finally {
    setActionLoading(false);
  }
}, [employees, updateEmployee]);


  const saveContractData = useCallback(async (employeeId, contractData) => {
    console.log(`[saveContractData] Enregistrement contrat pour employé ID: ${employeeId}`);
    try {
      setActionLoading(true);
      const employeeRef = doc(db, "clients", companyData.id, "employees", employeeId);
      await updateDoc(employeeRef, {
        contract: {
          ...contractData,
          generatedAt: new Date().toISOString(),
        },
      });
      console.log(`[saveContractData] Contrat enregistré`);
      toast.success("Contrat enregistré avec succès !");
    } catch (error) {
      handleError(error, "Erreur enregistrement contrat");
    } finally {
      setActionLoading(false);
    }
  }, [companyData]);

  const updateCompanyUsers = useCallback(async (newCount) => {
    console.log(`[updateCompanyUsers] Mise à jour nombre d'utilisateurs: ${newCount}`);
    try {
      setActionLoading(true);
      const companyRef = doc(db, "clients", companyData.id);
      await updateDoc(companyRef, { currentUsers: newCount });
      setCompanyData((prev) => ({ ...prev, currentUsers: newCount }));
      console.log(`[updateCompanyUsers] Nombre d'utilisateurs mis à jour`);
    } catch (error) {
      handleError(error, "Erreur mise à jour utilisateurs");
    } finally {
      setActionLoading(false);
    }
  }, [companyData]);

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
        const clientsQuery = query(
          collection(db, "clients"),
          where("adminUid", "==", user.uid)
        );
        const clientsSnapshot = await getDocs(clientsQuery);
        if (!clientsSnapshot.empty) {
          const companyDoc = clientsSnapshot.docs[0];
          const companyId = companyDoc.id;
          setCompanyData({ id: companyId, ...companyDoc.data() });
          console.log(`[fetchData] Données entreprise chargées, companyId: ${companyId}`);

          const unsubscribe = onSnapshot(
            collection(db, "clients", companyId, "employees"),
            (snapshot) => {
              const employeesData = snapshot.docs.map((doc) => {
                const employeeData = {
                  id: doc.id,
                  ...doc.data(),
                };
                return normalizeEmployeeData(employeeData);
              });
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
          console.error("[fetchData] Aucun client trouvé");
          toast.error("Aucun client trouvé pour cet utilisateur.");
          setLoading(false);
        }
      } catch (error) {
        handleError(error, "Erreur chargement données");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const generateAllBadgesPDF = useCallback(async () => {
    console.log("[generateAllBadgesPDF] Début génération PDF tous les badges");
    try {
      setActionLoading(true);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let yOffset = 10;
      let logoFormat = "PNG";
      const logoData = cacheLogo(companyData.id);

      for (const [index, employee] of employees.entries()) {
        console.log(`[generateAllBadgesPDF] Génération badge pour employé: ${employee.name}`);
        if (index > 0) {
          yOffset += 60;
          if (yOffset > 250) {
            doc.addPage();
            yOffset = 10;
            console.log("[generateAllBadgesPDF] Nouvelle page ajoutée");
          }
        }

        if (logoData) {
          try {
            const extension = logoData.includes("image/png") ? "png" : "jpeg";
            logoFormat = extension === "png" ? "PNG" : "JPEG";
            console.log(`[generateAllBadgesPDF] Format d'image détecté: ${logoFormat}`);
            doc.addImage(logoData, logoFormat, 10, yOffset, 25, 10);
            console.log(`[generateAllBadgesPDF] Logo ajouté pour ${employee.name}`);
          } catch (error) {
            console.error(`[generateAllBadgesPDF] Erreur ajout logo: ${error.message}`);
            doc.setFontSize(8);
            doc.text(companyData.name, 15, yOffset + 5, { align: "center" });
            toast.warn("Erreur lors de l'ajout du logo au badge.");
          }
        } else {
          doc.setFontSize(8);
          doc.text(companyData.name, 15, yOffset + 5, { align: "center" });
          console.log(`[generateAllBadgesPDF] Nom de l'entreprise utilisé pour ${employee.name}`);
          toast.warn("Aucun logo chargé. Téléchargez un logo dans 'Paramètres de l'Entreprise'.");
        }

        doc.addImage(
          employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff`,
          "PNG",
          10,
          yOffset + 15,
          25,
          25
        );

        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text(employee.name, 40, yOffset + 20);
        doc.setFontSize(10);
        doc.text(employee.poste, 40, yOffset + 26);
        doc.text(employee.department || "N/A", 40, yOffset + 32);
        doc.text(`Matricule: ${employee.id.slice(0, 8)}`, 40, yOffset + 38);

        const qrCanvas = document.getElementById(`qr-${employee.id}`);
        if (!qrCanvas) {
          console.error(`[generateAllBadgesPDF] Canvas QR code introuvable pour ${employee.name}`);
          throw new Error("Canvas QR code introuvable");
        }
        const qrDataUrl = qrCanvas.toDataURL("image/png");
        doc.addImage(qrDataUrl, "PNG", 160, yOffset + 30, 20, 20);

        doc.setFontSize(8);
        doc.text(companyData.name, 10, yOffset + 50);
      }

      doc.save(`${companyData.name}_badges.pdf`);
      console.log("[generateAllBadgesPDF] PDF tous les badges généré");
      toast.success("Badges exportés en PDF !");
    } catch (error) {
      handleError(error, "Erreur génération badges PDF");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

// Fonction exportPaySlipToPDF modifiée pour tenir sur une seule page
// Fonction exportPaySlipToPDF optimisée pour une seule page et compatibilité OCR
const exportPaySlipToPDF = useCallback(async (paySlipData, employee) => {
  console.log(`[exportPaySlipToPDF] Début génération fiche de paie PDF pour ${employee.name}`);
  try {
    setActionLoading(true);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const leftMargin = 15;
    const rightMargin = 15;
    const topMargin = 10;
    const pageWidth = doc.internal.pageSize.width;
    const textWidth = pageWidth - leftMargin - rightMargin;
    let y = topMargin;
    const lineHeight = 5;
    const sectionSpacing = 5;
    const majorSectionSpacing = 7;

    let logoFormat = "PNG";
    const logoData = cacheLogo(companyData.id);
    console.log(`[exportPaySlipToPDF] Tentative chargement logo depuis localStorage`);

    // En-tête simplifié
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 25, "F"); // Hauteur réduite à 25 mm
    doc.setLineWidth(0.3);
    // doc.rect(leftMargin - 5, topMargin - 5, textWidth + 20, 20, "S"); // Rectangle compact

    if (logoData) {
      try {
        const extension = logoData.includes("image/png") ? "png" : "jpeg";
        logoFormat = extension === "png" ? "PNG" : "JPEG";
        console.log(`[exportPaySlipToPDF] Format d'image détecté: ${logoFormat}`);
        doc.addImage(logoData, logoFormat, leftMargin, topMargin, 20, 20); // Logo réduit à 20x20 mm
        console.log("[exportPaySlipToPDF] Logo ajouté à la fiche de paie");
      } catch (error) {
        console.error(`[exportPaySlipToPDF] Erreur ajout logo: ${error.message}`);
        doc.setFontSize(6);
        doc.text("Logo non disponible", leftMargin + 10, topMargin + 10, { align: "center" });
        toast.warn("Erreur lors de l'ajout du logo à la fiche de paie.");
      }
    } else {
      doc.setFontSize(6);
      doc.text("Logo non disponible", leftMargin + 10, topMargin + 10, { align: "center" });
      console.log("[exportPaySlipToPDF] Texte 'Logo non disponible' utilisé");
      toast.warn("Aucun logo chargé. Téléchargez un logo dans 'Paramètres de l'Entreprise'.");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(companyData.name || "PHRM", pageWidth - rightMargin, topMargin + 5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(companyData.address || "BP 16194 Yaoundé, Cameroun", pageWidth - rightMargin, topMargin + 10, { align: "right" });
    doc.text("Tél: 22214081", pageWidth - rightMargin, topMargin + 15, { align: "right" });
    doc.text(`N° CNPS: ${companyData.cnpsNumber || "Non spécifié"}`, pageWidth - rightMargin, topMargin + 20, { align: "right" });
    y += 25;

    // Titre
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FICHE DE PAIE", pageWidth / 2, y, { align: "center" });
    y += lineHeight;
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += sectionSpacing;

    // Période et date
    doc.setFontSize(7);
    doc.text(`Période: ${paySlipData.payPeriod || "N/A"}`, leftMargin, y);
    doc.text(
      `Généré le: ${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - rightMargin,
      y,
      { align: "right" }
    );
    y += sectionSpacing;

    // Section Employeur
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Employeur", leftMargin, y);
    y += lineHeight + 2;
    doc.setLineWidth(0.2);
    doc.rect(leftMargin - 5, y - 4, textWidth + 10, 15, "S"); // Rectangle réduit
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Raison sociale: ${paySlipData.employer?.companyName || "N/A"}`, leftMargin, y);
    y += lineHeight;
    doc.text(`Adresse: ${paySlipData.employer?.address || "N/A"}`, leftMargin, y);
    y += lineHeight;
    doc.text(`Numéro CNPS: ${paySlipData.employer?.cnpsNumber || "N/A"}`, leftMargin, y);
    y += sectionSpacing;

    // Section Salarié
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Salarié", leftMargin, y);
    y += lineHeight + 2;
    doc.setLineWidth(0.2);
    doc.rect(leftMargin - 5, y - 4, textWidth + 10, 15, "S"); // Rectangle réduit
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Nom: ${paySlipData.employee?.lastName || ""} ${paySlipData.employee?.firstName || ""}`, leftMargin, y);
    y += lineHeight;
    doc.text(`Matricule: ${paySlipData.employee?.matricule || "N/A"}`, leftMargin, y);
    y += lineHeight;
    doc.text(`Classification: ${paySlipData.employee?.professionalClassification || "N/A"}`, leftMargin, y);
    y += sectionSpacing;

    // Détails Salariaux
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Détails Salariaux", leftMargin, y);
    y += lineHeight;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["Taux mensuel", paySlipData.salaryDetails?.monthlyRate?.toFixed(2) || "N/A"],
        ["Taux journalier", paySlipData.salaryDetails?.dailyRate?.toFixed(2) || "N/A"],
        ["Taux horaire", paySlipData.salaryDetails?.hourlyRate?.toFixed(2) || "N/A"],
        ["Indemnité de transport", paySlipData.salaryDetails?.transportAllowance?.toFixed(2) || "N/A"],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7 },
      columnStyles: { 0: { cellWidth: textWidth * 0.7 }, 1: { cellWidth: textWidth * 0.3, halign: "right" } },
      margin: { left: leftMargin, right: rightMargin },
    });
    y = doc.lastAutoTable.finalY + sectionSpacing;

    // Rémunération
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Rémunération", leftMargin, y);
    y += lineHeight;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["Jours travaillés", paySlipData.remuneration?.workedDays?.toFixed(2) || "N/A"],
        ["Heures supplémentaires", paySlipData.remuneration?.overtime?.toFixed(2) || "N/A"],
        ["Total", paySlipData.remuneration?.total?.toFixed(2) || "N/A"],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7 },
      columnStyles: { 0: { cellWidth: textWidth * 0.7 }, 1: { cellWidth: textWidth * 0.3, halign: "right" } },
      margin: { left: leftMargin, right: rightMargin },
    });
    y = doc.lastAutoTable.finalY + sectionSpacing;

    // Retenues
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Retenues", leftMargin, y);
    y += lineHeight;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["PVID (CNPS)", paySlipData.deductions?.pvid?.toFixed(2) || "N/A"],
        ["IRPP", paySlipData.deductions?.irpp?.toFixed(2) || "N/A"],
        ["CAC", paySlipData.deductions?.cac?.toFixed(2) || "N/A"],
        ["CFC", paySlipData.deductions?.cfc?.toFixed(2) || "N/A"],
        ["RAV", paySlipData.deductions?.rav?.toFixed(2) || "N/A"],
        ["TDL", paySlipData.deductions?.tdl?.toFixed(2) || "N/A"],
        ["Total retenues", paySlipData.deductions?.total?.toFixed(2) || "N/A"],
        ["Net à payer", ((paySlipData.remuneration?.total || 0) - (paySlipData.deductions?.total || 0)).toFixed(2)],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7 },
      columnStyles: { 0: { cellWidth: textWidth * 0.7 }, 1: { cellWidth: textWidth * 0.3, halign: "right" } },
      margin: { left: leftMargin, right: rightMargin },
    });
    y = doc.lastAutoTable.finalY + sectionSpacing;

    // Signatures
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Fait à Yaoundé, le ${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += sectionSpacing;
    doc.setLineWidth(0.2);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("Pour l’Employeur", leftMargin + 5, y + 5);
    doc.text("Pour l’Employé(e)", pageWidth / 2 + 10, y + 5);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.text(companyData.companyRepresentative || "", leftMargin + 5, y);
    doc.text(`${paySlipData.employee?.firstName || ""} ${paySlipData.employee?.lastName || ""}`, pageWidth / 2 + 10, y);
    y += lineHeight;
    doc.text("Lu et approuvé", leftMargin + 5, y);
    doc.text("Lu et approuvé", pageWidth / 2 + 10, y);

    // Pied de page
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(companyData.name || "PHRM", leftMargin, doc.internal.pageSize.height - 5);
    doc.text("Page 1 / 1", pageWidth - rightMargin, doc.internal.pageSize.height - 5, { align: "right" });

    doc.save(`fiche_de_paie_${paySlipData.employee?.matricule || "unknown"}_${paySlipData.payPeriod || "unknown"}.pdf`);
    console.log(`[exportPaySlipToPDF] Fiche de paie PDF générée pour ${employee.name}`);
    toast.success("Fiche de paie exportée en PDF !");
  } catch (error) {
    handleError(error, "Erreur exportation PDF");
  } finally {
    setActionLoading(false);
  }
}, [companyData]);


  const openPaySlipForm = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowPaySlipForm(true);
  }, []);

const handlePaySlipGeneration = useCallback((generatedPaySlip) => {
  console.log("[handlePaySlipGeneration] Fiche de paie générée:", generatedPaySlip);
  if (generatedPaySlip) {
    const completePaySlip = {
      ...generatedPaySlip,
      employee: {
        ...generatedPaySlip.employee,
        lastName: generatedPaySlip.employee.lastName || selectedEmployee.name.split(" ")[1] || "N/A",
        firstName: generatedPaySlip.employee.firstName || selectedEmployee.name.split(" ")[0] || "N/A",
        matricule: generatedPaySlip.employee.matricule || selectedEmployee.id.slice(0, 8),
        professionalClassification: generatedPaySlip.employee.professionalClassification || selectedEmployee.professionalCategory || "N/A",
      },
      employer: {
        companyName: companyData.name || "PHRM",
        address: companyData.address || "BP 16194 Yaoundé, Cameroun",
        cnpsNumber: companyData.cnpsNumber || "Non spécifié",
      },
      salaryDetails: generatedPaySlip.salaryDetails || {
        monthlyRate: selectedEmployee.baseSalary || 0,
        dailyRate: (selectedEmployee.baseSalary / 30 || 0).toFixed(2),
        hourlyRate: ((selectedEmployee.baseSalary / 30 / 8) || 0).toFixed(2),
        transportAllowance: 0,
      },
      remuneration: generatedPaySlip.remuneration || { workedDays: 0, overtime: 0, total: selectedEmployee.baseSalary || 0 },
      deductions: generatedPaySlip.deductions || { pvid: 0, irpp: 0, cac: 0, cfc: 0, rav: 0, tdl: 0, total: 0 },
      payPeriod: generatedPaySlip.payPeriod || `${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
      generatedAt: new Date().toISOString(),
    };
    setPaySlipData(completePaySlip);
    savePaySlip(selectedEmployee.id, completePaySlip);
  }
  setShowPaySlipForm(false);
  setShowPaySlip(!!generatedPaySlip);
}, [selectedEmployee, companyData, savePaySlip]);

  const openContractForm = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowContractForm(true);
  }, []);

  const handleContractGeneration = useCallback((contractData) => {
    console.log("[handleContractGeneration] Contrat généré");
    if (contractData) {
      saveContractData(selectedEmployee.id, contractData);
    }
    setShowContractForm(false);
  }, [selectedEmployee, saveContractData]);

  const addEmployee = useCallback(async (e) => {
    e.preventDefault();
    console.log("[addEmployee] Tentative ajout nouvel employé");
    if (
      !newEmployee.name ||
      !newEmployee.email ||
      !newEmployee.poste ||
      !newEmployee.hireDate ||
      !newEmployee.cnpsNumber ||
      !newEmployee.professionalCategory ||
      !newEmployee.baseSalary
    ) {
      console.warn("[addEmployee] Champs obligatoires manquants");
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!companyData) {
      console.error("[addEmployee] Données entreprise non disponibles");
      toast.error("Données de l'entreprise non disponibles.");
      return;
    }
    if (employees.length >= companyData.licenseMaxUsers) {
      console.warn("[addEmployee] Limite d’utilisateurs atteinte");
      toast.error("Limite d’utilisateurs atteinte pour votre licence !");
      return;
    }
    try {
      setActionLoading(true);
      const employeeRef = doc(collection(db, "clients", companyData.id, "employees"));
      const employeeData = {
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        poste: newEmployee.poste,
        phone: newEmployee.phone || "",
        department: newEmployee.department || "",
        hireDate: newEmployee.hireDate,
        status: newEmployee.status,
        cnpsNumber: newEmployee.cnpsNumber,
        professionalCategory: newEmployee.professionalCategory,
        baseSalary: Number(newEmployee.baseSalary),
        createdAt: new Date().toISOString(),
        leaves: { balance: 25, requests: [], history: [] },
        absences: [],
        payslips: [],
        notifications: [],
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.name)}&background=3B82F6&color=fff`,
      };
      await setDoc(employeeRef, employeeData);
      setNewEmployee({
        name: "",
        email: "",
        role: "Employé",
        poste: "",
        phone: "",
        department: "",
        hireDate: "",
        status: "Actif",
        cnpsNumber: "",
        professionalCategory: "",
        baseSalary: "",
      });
      await updateCompanyUsers(employees.length + 1);
      console.log(`[addEmployee] Employé ajouté, ID: ${employeeRef.id}`);
      toast.success("Employé ajouté avec succès !");
      openContractForm({ id: employeeRef.id, ...employeeData });
    } catch (error) {
      handleError(error, "Erreur création employé");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees, newEmployee, updateCompanyUsers, openContractForm]);

  const deleteEmployee = useCallback(async (id) => {
    console.log(`[deleteEmployee] Tentative suppression employé ID: ${id}`);
    if (!window.confirm("Supprimer cet employé ?")) return;
    try {
      setActionLoading(true);
      const employeeRef = doc(db, "clients", companyData.id, "employees", id);
      await deleteDoc(employeeRef);
      await updateCompanyUsers(employees.length - 1);
      console.log(`[deleteEmployee] Employé supprimé`);
      toast.success("Employé supprimé !");
    } catch (error) {
      handleError(error, "Erreur suppression employé");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees, updateCompanyUsers]);

  const handlePaySlipUpload = useCallback(async (e, employeeId) => {
    console.log(`[handlePaySlipUpload] Upload fiche de paie pour employé ID: ${employeeId}`);
    const file = e.target.files[0];
    if (!file) return;
    try {
      setActionLoading(true);
      // Simuler un stockage local pour les fiches de paie
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        console.log(`[handlePaySlipUpload] Fiche de paie convertie en dataURL, taille: ${(dataUrl.length / 1024).toFixed(2)} Ko`);
        const employee = employees.find((emp) => emp.id === employeeId);
        const updatedPaySlips = [
          ...(employee.payslips || []),
          { url: dataUrl, date: new Date().toISOString() },
        ];
        await updateEmployee(employeeId, { payslips: updatedPaySlips });
        console.log("[handlePaySlipUpload] Fiche de paie enregistrée localement");
        toast.success("Fiche de paie enregistrée avec succès !");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      handleError(error, "Erreur enregistrement fiche de paie");
    } finally {
      setActionLoading(false);
    }
  }, [employees, updateEmployee]);

  const handleLeaveRequest = useCallback(async (employeeId, requestIndex, action) => {
    console.log(`[handleLeaveRequest] Gestion demande congé, employé ID: ${employeeId}, action: ${action}`);
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee || !employee.leaves.requests[requestIndex]) {
      console.warn("[handleLeaveRequest] Demande invalide");
      toast.error("Demande invalide !");
      return;
    }
    try {
      setActionLoading(true);
      const request = employee.leaves.requests[requestIndex];
      const updatedRequests = [...employee.leaves.requests];
      const updatedHistory = [...employee.leaves.history];
      updatedRequests[requestIndex] = { ...request, status: action };
      updatedHistory.push({ ...request, status: action });
      let updatedBalance = employee.leaves.balance;
      if (action === "Approuvé") {
        updatedBalance -= request.days;
      }
      await updateEmployee(employeeId, {
        leaves: {
          balance: updatedBalance,
          requests: updatedRequests,
          history: updatedHistory,
        },
      });
      console.log(`[handleLeaveRequest] Demande congé ${action.toLowerCase()}`);
      toast.success(`Demande de congé ${action.toLowerCase()} !`);
    } catch (error) {
      handleError(error, "Erreur gestion congé");
    } finally {
      setActionLoading(false);
    }
  }, [employees, updateEmployee]);

  const recordAbsence = useCallback(async (e) => {
    e.preventDefault();
    console.log("[recordAbsence] Tentative enregistrement absence");
    if (!newAbsence.employeeId || !newAbsence.date || !newAbsence.reason || newAbsence.duration <= 0) {
      console.warn("[recordAbsence] Champs absence manquants");
      toast.error("Veuillez remplir tous les champs de l'absence.");
      return;
    }
    try {
      setActionLoading(true);
      const employee = employees.find((emp) => emp.id === newAbsence.employeeId);
      const updatedAbsences = [
        ...(employee.absences || []),
        {
          date: newAbsence.date,
          reason: newAbsence.reason,
          duration: Number(newAbsence.duration),
        },
      ];
      await updateEmployee(newAbsence.employeeId, { absences: updatedAbsences });
      setNewAbsence({ employeeId: "", date: "", reason: "", duration: 1 });
      console.log("[recordAbsence] Absence enregistrée");
      toast.success("Absence enregistrée !");
    } catch (error) {
      handleError(error, "Erreur enregistrement absence");
    } finally {
      setActionLoading(false);
    }
  }, [employees, newAbsence, updateEmployee]);

  const sendNotification = useCallback(async (e) => {
    e.preventDefault();
    console.log("[sendNotification] Tentative envoi notification");
    if (!newNotification.trim()) {
      console.warn("[sendNotification] Message vide");
      toast.error("Veuillez entrer un message.");
      return;
    }
    try {
      setActionLoading(true);
      const promises = employees.map(async (employee) => {
        const updatedNotifications = [
          ...(employee.notifications || []),
          {
            id: `${employee.id}_${Date.now()}`,
            message: newNotification,
            date: new Date().toISOString(),
            read: false,
          },
        ];
        await updateEmployee(employee.id, { notifications: updatedNotifications });
      });
      await Promise.all(promises);
      setNewNotification("");
      console.log("[sendNotification] Notification envoyée à tous les employés");
      toast.success("Notification envoyée à tous les employés !");
    } catch (error) {
      handleError(error, "Erreur envoi notification");
    } finally {
      setActionLoading(false);
    }
  }, [employees, newNotification, updateEmployee]);

  const generatePDFReport = useCallback(() => {
    console.log("[generatePDFReport] Début génération rapport PDF");
    try {
      setActionLoading(true);
      const doc = new jsPDF();
      doc.setFont("times", "normal");
      doc.setFontSize(16);
      doc.text(`Rapport RH - ${companyData.name}`, 10, 10);
      doc.setFontSize(12);
      doc.text(`Employés : ${companyData.currentUsers}/${companyData.licenseMaxUsers}`, 10, 20);
      doc.text(`Date d'expiration : ${new Date(companyData.licenseExpiry).toLocaleDateString()}`, 10, 30);
      doc.text("Liste des employés :", 10, 40);
      doc.autoTable({
        startY: 50,
        head: [["Nom", "Rôle", "Poste", "Congés restants", "Statut"]],
        body: employees.map((emp) => [
          emp.name,
          emp.role,
          emp.poste,
          emp.leaves.balance,
          emp.status,
        ]),
        theme: "grid",
        styles: { font: "times", fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        margin: { left: 10, right: 10 },
      });
      doc.setFontSize(8);
      doc.text("Généré par PHRM - Système de gestion des ressources humaines", 105, 280, { align: "center" });
      doc.save(`${companyData.name}_rapport.pdf`);
      console.log("[generatePDFReport] Rapport PDF généré");
      toast.success("Rapport PDF généré !");
    } catch (error) {
      handleError(error, "Erreur génération PDF");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

  const generateExcelReport = useCallback(() => {
    console.log("[generateExcelReport] Début génération rapport Excel");
    try {
      setActionLoading(true);
      const worksheet = XLSX.utils.json_to_sheet(
        employees.map((emp) => ({
          Nom: emp.name,
          Email: emp.email,
          Rôle: emp.role,
          Poste: emp.poste,
          Téléphone: emp.phone || "N/A",
          Département: emp.department || "N/A",
          "Date d'embauche": new Date(emp.hireDate).toLocaleDateString(),
          Statut: emp.status,
          "Solde Congés": emp.leaves.balance,
          Absences: emp.absences?.length || 0,
          "Numéro CNPS": emp.cnpsNumber || "N/A",
          "Catégorie Professionnelle": emp.professionalCategory || "N/A",
          "Dernière Fiche de Paie": emp.payslips?.[0]?.date ? new Date(emp.payslips[0].date).toLocaleDateString() : "Aucune",
          "Contrat Généré": emp.contract ? new Date(emp.contract.generatedAt).toLocaleDateString() : "Aucun",
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
      XLSX.writeFile(workbook, `${companyData.name}_rapport.xlsx`);
      console.log("[generateExcelReport] Rapport Excel généré");
      toast.success("Rapport Excel généré !");
    } catch (error) {
      handleError(error, "Erreur génération Excel");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

  const generateCSVReport = useCallback(() => {
    console.log("[generateCSVReport] Début génération rapport CSV");
    try {
      setActionLoading(true);
      const csvData = employees.map((emp) => ({
        Nom: emp.name,
        Email: emp.email,
        Rôle: emp.role,
        Poste: emp.poste,
        Téléphone: emp.phone || "N/A",
        Département: emp.department || "N/A",
        "Date d'embauche": new Date(emp.hireDate).toLocaleDateString(),
        Statut: emp.status,
        "Solde Congés": emp.leaves.balance,
        Absences: emp.absences?.length || 0,
        "Numéro CNPS": emp.cnpsNumber || "N/A",
        "Catégorie Professionnelle": emp.professionalCategory || "N/A",
        "Dernière Fiche de Paie": emp.payslips?.[0]?.date ? new Date(emp.payslips[0].date).toLocaleDateString() : "Aucune",
        "Contrat Généré": emp.contract ? new Date(emp.contract.generatedAt).toLocaleDateString() : "Aucun",
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${companyData.name}_rapport.csv`);
      link.click();
      URL.revokeObjectURL(url);
      console.log("[generateCSVReport] Rapport CSV généré");
      toast.success("Rapport CSV généré !");
    } catch (error) {
      handleError(error, "Erreur génération CSV");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

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
  }, [navigate]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (searchQuery) {
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.poste.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      if (sortBy === "poste") return a.poste.localeCompare(b.poste);
      if (sortBy === "hireDate") return new Date(a.hireDate) - new Date(b.hireDate);
      return 0;
    });
  }, [employees, searchQuery, sortBy]);

  const leaveChartData = useMemo(() => {
    const months = Array(12).fill(0);
    employees.forEach((emp) => {
      emp.leaves.history?.forEach((req) => {
        if (req.status === "Approuvé") {
          const date = new Date(req.date);
          months[date.getMonth()] += req.days;
        }
      });
    });

    return {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
      datasets: [
        {
          label: "Jours de congé pris",
          data: months,
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [employees]);

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
   <div className="min-h-screen bg-pale-blue flex">
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
      {/* Sidebar */}
      <aside className="w-64 hover-blue shadow-md p-4 flex flex-col space-y-4">
        <div className="flex items-center gap-2 mb-6">
          {logoData ? (
            <img
              src={logoData}
              alt="Logo"
              className="h-10"
              onError={() => {
                console.error("[Sidebar] Erreur chargement logo dans la barre latérale");
                toast.error("Erreur de chargement du logo dans la barre latérale. Vérifiez ou re-téléchargez.");
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
                >
                  <item.icon className="h-5 w-5" />
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

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 animate-scale-in">
            Tableau de bord - {companyData.name}
          </h1>
        </header>

        {showPaySlipForm && selectedEmployee && (
          <PaySlipGenerator
            employee={selectedEmployee}
            companyData={companyData}
            onGenerate={handlePaySlipGeneration}
            onClose={() => setShowPaySlipForm(false)}
            isContractMode={false}
          />
        )}

        {showContractForm && selectedEmployee && (
          <PaySlipGenerator
            employee={selectedEmployee}
            companyData={companyData}
            onGenerate={handleContractGeneration}
            onClose={() => setShowContractForm(false)}
            isContractMode={true}
          />
        )}

        {showPaySlip && paySlipData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="relative max-h-[90vh] overflow-y-auto bg-blue-500 p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <PaySlip {...paySlipData} />
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={() => exportPaySlipToPDF(paySlipData, selectedEmployee)}
                  icon={FiDownload}
                  aria-label="Exporter en PDF"
                  disabled={actionLoading}
                >
                  Exporter
                </Button>
                <Button
                  onClick={() => setShowPaySlip(false)}
                  variant="danger"
                  aria-label="Fermer"
                  disabled={actionLoading}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedPaySlip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="relative max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <PaySlip {...selectedPaySlip.paySlip} />
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={() => exportPaySlipToPDF(selectedPaySlip.paySlip, selectedEmployee)}
                  icon={FiDownload}
                  aria-label="Exporter en PDF"
                  disabled={actionLoading}
                >
                  Exporter
                </Button>
                <Button
                  onClick={() => setSelectedPaySlip(null)}
                  variant="danger"
                  aria-label="Fermer"
                  disabled={actionLoading}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
            <Card title="Utilisateurs">
              <p className="text-2xl font-bold text-blue-600">
                {companyData.currentUsers || 0} / {companyData.licenseMaxUsers}
              </p>
              <p className="text-sm text-gray-500 mt-2">Employés actifs</p>
            </Card>
            <Card title="Licence">
              <p className="text-lg font-medium text-gray-900">
                Expire le {new Date(companyData.licenseExpiry).toLocaleDateString()}
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
                    (emp.leaves.history
                      ?.filter((req) => req.status === "Approuvé")
                      .reduce((s, r) => s + r.days, 0) ||
                      0),
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
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleLogoUpload(file, companyData.id, (dataUrl) => {
                          if (dataUrl) {
                            setLogoData(dataUrl);
                            console.log("[Overview] Logo mis à jour dans l'interface");
                            toast.success("Logo chargé avec succès !");
                          }
                        });
                      }
                    }}
                    className="p-2 border border-gray-300 rounded-lg"
                    disabled={actionLoading}
                  />
                  <FiUpload className="h-5 w-5 text-gray-600" />
                </div>
                {logoData && (
                  <img
                    src={logoData}
                    alt="Logo"
                    className="mt-2 h-16"
                    onError={() => {
                      console.error("[Overview] Erreur chargement logo dans Paramètres");
                      toast.error("Erreur de chargement du logo dans l'interface. Vérifiez ou re-téléchargez.");
                    }}
                  />
                )}
                {logoData && (
                  <Button
                    onClick={() => {
                      console.log(`[Overview] Suppression logo pour companyId: ${companyData.id}`);
                      localStorage.removeItem(`logo_${companyData.id}`);
                      setLogoData(null);
                      toast.info("Logo supprimé du stockage local.");
                    }}
                    variant="ghost"
                    className="mt-2"
                    disabled={actionLoading}
                  >
                    Supprimer le logo
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeSection === "employees" && (
          <Card title="Gestion des Employés" className="animate-scale-in">
            <form onSubmit={addEmployee} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Nom"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={actionLoading}
              >
                <option value="Employé">Employé</option>
                <option value="Manager">Manager</option>
              </select>
              <input
                type="text"
                placeholder="Poste"
                value={newEmployee.poste}
                onChange={(e) => setNewEmployee({ ...newEmployee, poste: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <input
                type="tel"
                placeholder="Téléphone (optionnel)"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={actionLoading}
              />
              <input
                type="text"
                placeholder="Départément (optionnel)"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={actionLoading}
              />
              <input
                type="date"
                placeholder="Date d'embauche"
                value={newEmployee.hireDate}
                onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <select
                value={newEmployee.status}
                onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={actionLoading}
              >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="En congé">En congé</option>
              </select>
              <input
                type="text"
                placeholder="Numéro CNPS"
                value={newEmployee.cnpsNumber}
                onChange={(e) => setNewEmployee({ ...newEmployee, cnpsNumber: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <input
                type="text"
                placeholder="Catégorie Professionnelle"
                value={newEmployee.professionalCategory}
                onChange={(e) => setNewEmployee({ ...newEmployee, professionalCategory: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <input
                type="number"
                placeholder="Salaire de base (FCFA)"
                value={newEmployee.baseSalary}
                onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <Button
                type="submit"
                icon={FiPlus}
                aria-label="Ajouter un employé"
                className="col-span-1"
                disabled={actionLoading}
              >
                Ajouter
              </Button>
            </form>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <FiSearch className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                  disabled={actionLoading}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg bg-white mt-2 sm:mt-0"
                disabled={actionLoading}
              >
                <option value="name">Trier par Nom</option>
                <option value="role">Trier par Rôle</option>
                <option value="poste">Trier par Poste</option>
                <option value="hireDate">Trier par Date d'Embauche</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredEmployees.map((employee, index) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={(emp) => {
                    const newName = prompt("Nouveau nom :", emp.name) || emp.name;
                    updateEmployee(emp.id, { name: newName });
                  }}
                  onDelete={deleteEmployee}
                  onRequestLeave={handleLeaveRequest}
                  onUploadPaySlip={handlePaySlipUpload}
                  onCreatePaySlip={() => openPaySlipForm(employee)}
                  onManageContract={() => openContractForm(employee)}
                  animationDelay={`${index * 100}ms`}
                />
              ))}
            </div>
          </Card>
        )}

        {activeSection === "leaves" && (
          <Card title="Gestion des Congés" className="animate-scale-in">
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.flatMap((emp) =>
                      emp.leaves.requests?.map((req, index) => (
                        <tr
                          key={`${emp.id}-${index}`}
                          className="hover:bg-gray-50 animate-row-enter"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {emp.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(req.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{req.days}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                req.status === "En attente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : req.status === "Approuvé"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {req.status === "En attente" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleLeaveRequest(emp.id, index, "Approuvé")}
                                  variant="ghost"
                                  className="text-green-600"
                                  disabled={actionLoading}
                                >
                                  Approuver
                                </Button>
                                <Button
                                  onClick={() => handleLeaveRequest(emp.id, index, "Refusé")}
                                  variant="ghost"
                                  className="text-red-600"
                                  disabled={actionLoading}
                                >
                                  Refuser
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistiques des congés</h3>
                <div className="h-64">
                  <Line
                    data={leaveChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: true, text: "Congés pris par mois" },
                      },
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: "Jours" } },
                        x: { title: { display: true, text: "Mois" } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeSection === "absences" && (
          <Card title="Gestion des Absences" className="animate-scale-in">
            <form onSubmit={recordAbsence} className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <select
                value={newAbsence.employeeId}
                onChange={(e) => setNewAbsence({ ...newAbsence, employeeId: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              >
                <option value="">Sélectionner un employé</option>
                {employees.map((emp) => (
                     <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Date de l'absence"
                value={newAbsence.date}
                onChange={(e) => setNewAbsence({ ...newAbsence, date: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <input
                type="text"
                placeholder="Raison de l'absence"
                value={newAbsence.reason}
                onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <input
                type="number"
                placeholder="Durée (jours)"
                value={newAbsence.duration}
                onChange={(e) => setNewAbsence({ ...newAbsence, duration: e.target.value })}
                min="1"
                className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={actionLoading}
              />
              <Button
                type="submit"
                icon={FiPlus}
                aria-label="Enregistrer l'absence"
                className="col-span-1"
                disabled={actionLoading}
              >
                Enregistrer
              </Button>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raison
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durée (jours)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.flatMap((emp) =>
                    emp.absences?.map((absence, index) => (
                      <tr
                        key={`${emp.id}-${index}`}
                        className="hover:bg-gray-50 animate-row-enter"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {emp.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(absence.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {absence.reason}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {absence.duration}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeSection === "payslips" && (
          <Card title="Gestion des Fiches de Paie" className="animate-scale-in">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.flatMap((emp) =>
                    emp.payslips?.map((payslip, index) => (
                      <tr
                        key={`${emp.id}-${index}`}
                        className="hover:bg-gray-50 animate-row-enter"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {emp.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {payslip.payPeriod}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payslip.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setSelectedPaySlip({ paySlip: payslip });
                              console.log(`[Payslips] Affichage fiche de paie pour ${emp.name}, période: ${payslip.payPeriod}`);
                            }}
                            variant="ghost"
                            className="text-blue-600"
                            disabled={actionLoading}
                          >
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeSection === "notifications" && (
          <Card title="Envoyer une Notification" className="animate-scale-in">
            <form onSubmit={sendNotification} className="mb-6">
              <textarea
                placeholder="Message de la notification..."
                value={newNotification}
                onChange={(e) => setNewNotification(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                disabled={actionLoading}
              />
              <Button
                type="submit"
                icon={FiBell}
                aria-label="Envoyer la notification"
                className="mt-4"
                disabled={actionLoading}
              >
                Envoyer à tous
              </Button>
            </form>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.flatMap((emp) =>
                    emp.notifications?.map((notif, index) => (
                      <tr
                        key={`${emp.id}-${notif.id}`}
                        className="hover:bg-gray-50 animate-row-enter"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {emp.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{notif.message}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(notif.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              notif.read ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {notif.read ? "Lu" : "Non lu"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeSection === "reports" && (
          <Card title="Rapports RH" className="animate-scale-in">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                onClick={generatePDFReport}
                icon={FiFileText}
                aria-label="Générer rapport PDF"
                disabled={actionLoading}
              >
                Rapport PDF
              </Button>
              <Button
                onClick={generateExcelReport}
                icon={FiFileText}
                aria-label="Générer rapport Excel"
                disabled={actionLoading}
              >
                Rapport Excel
              </Button>
              <Button
                onClick={generateCSVReport}
                icon={FiFileText}
                aria-label="Générer rapport CSV"
                disabled={actionLoading}
              >
                Rapport CSV
              </Button>
            </div>
            <div className="h-64">
              <Line
                data={leaveChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: "Congés pris par mois" },
                  },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: "Jours" } },
                    x: { title: { display: true, text: "Mois" } },
                  },
                }}
              />
            </div>
          </Card>
        )}

        {activeSection === "badges" && (
          <Card title="Badges des Employés" className="animate-scale-in">
            <Button
              onClick={generateAllBadgesPDF}
              icon={FiDownload}
              aria-label="Exporter tous les badges"
              className="mb-6"
              disabled={actionLoading}
            >
              Exporter tous les badges
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredEmployees.map((employee, index) => (
                <EmployeeBadge
                  key={employee.id}
                  employee={employee}
                  companyData={companyData}
                  animationDelay={`${index * 100}ms`}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

// Composant Button générique
const Button = ({ children, onClick, type = "button", variant = "primary", icon: Icon, className = "", disabled, ...props }) => {
  const baseStyles = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-blue-500",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
};

// Composant Card générique
const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

// Composant PaySlip (simplifié pour l'exemple)
const PaySlip = ({ employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt }) => {
  const safeEmployee = employee || {};
  const safeEmployer = employer || { companyName: "N/A", address: "N/A", cnpsNumber: "N/A" };
  const safeSalaryDetails = salaryDetails || { monthlyRate: 0, dailyRate: 0, hourlyRate: 0, transportAllowance: 0 };
  const safeRemuneration = remuneration || { workedDays: 0, overtime: 0, total: 0 };
  const safeDeductions = deductions || { pvid: 0, irpp: 0, cac: 0, cfc: 0, rav: 0, tdl: 0, total: 0 };
  const netToPay = (safeRemuneration.total - safeDeductions.total).toFixed(2);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Fiche de Paie</h2>
      <p className="text-center">Période: {payPeriod || "N/A"}</p>
      <p className="text-center">Généré le: {new Date(generatedAt || '2025-06-29T11:34:00.000Z').toLocaleDateString("fr-FR")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Employeur</h3>
          <p>Raison sociale: {safeEmployer.companyName}</p>
          <p>Adresse: {safeEmployer.address}</p>
          <p>Numéro CNPS: {safeEmployer.cnpsNumber}</p>
        </div>
        <div>
          <h3 className="font-semibold">Salarié</h3>
          <p>Nom: {safeEmployee.lastName || ""} {safeEmployee.firstName || ""}</p>
          <p>Matricule: {safeEmployee.matricule || "N/A"}</p>
          <p>Classification: {safeEmployee.professionalClassification || "N/A"}</p>
        </div>
      </div>
      <h3 className="font-semibold">Détails Salariaux</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Description</th>
            <th className="border p-2">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Taux mensuel</td>
            <td className="border p-2">{safeSalaryDetails.monthlyRate.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Taux journalier</td>
            <td className="border p-2">{safeSalaryDetails.dailyRate.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Taux horaire</td>
            <td className="border p-2">{safeSalaryDetails.hourlyRate.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Indemnité de transport</td>
            <td className="border p-2">{safeSalaryDetails.transportAllowance.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <h3 className="font-semibold">Rémunération</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Description</th>
            <th className="border p-2">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Jours travaillés</td>
            <td className="border p-2">{safeRemuneration.workedDays.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Heures supplémentaires</td>
            <td className="border p-2">{safeRemuneration.overtime.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Total</td>
            <td className="border p-2">{safeRemuneration.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <h3 className="font-semibold">Retenues</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Description</th>
            <th className="border p-2">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">PVID (CNPS)</td>
            <td className="border p-2">{safeDeductions.pvid.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">IRPP</td>
            <td className="border p-2">{safeDeductions.irpp.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">CAC</td>
            <td className="border p-2">{safeDeductions.cac.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">CFC</td>
            <td className="border p-2">{safeDeductions.cfc.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">RAV</td>
            <td className="border p-2">{safeDeductions.rav.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">TDL</td>
            <td className="border p-2">{safeDeductions.tdl.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Total retenues</td>
            <td className="border p-2">{safeDeductions.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2"><strong>Net à payer</strong></td>
            <td className="border p-2"><strong>{netToPay}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};


export default CompanyAdminDashboard;                                                                                       