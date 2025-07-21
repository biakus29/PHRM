// src/utils/pdfUtils.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { cacheLogo } from "./logoUtils";

// Génère un badge individuel en PDF
export const generateBadgePDF = async (employee, companyData) => {
  console.log(`[generateBadgePDF] Génération badge PDF pour ${employee.name}`);
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [85, 54],
    });

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 85, 54, "F");

    const logoData = cacheLogo(companyData.id);
    if (logoData) {
      try {
        const extension = logoData.includes("image/png") ? "png" : "jpeg";
        const logoFormat = extension === "png" ? "PNG" : "JPEG";
        doc.addImage(logoData, logoFormat, 5, 5, 25, 10);
        console.log("[generateBadgePDF] Logo ajouté");
      } catch (error) {
        console.error(`[generateBadgePDF] Erreur ajout logo: ${error.message}`);
        doc.setFontSize(8);
        doc.text("Logo non disponible", 15, 10, { align: "center" });
        toast.warn("Erreur lors de l'ajout du logo au badge.");
      }
    } else {
      console.warn("[generateBadgePDF] Aucun logo disponible");
      doc.setFontSize(8);
      doc.text(companyData.name, 15, 10, { align: "center" });
    }

    doc.addImage(
      employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff`,
      "PNG",
      5,
      20,
      25,
      25
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
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

    doc.setFontSize(8);
    doc.text(companyData.name, 5, 50);

    doc.save(`badge_${employee.name.replace(/\s+/g, "_")}.pdf`);
    console.log(`[generateBadgePDF] Badge PDF généré pour ${employee.name}`);
    toast.success(`Badge de ${employee.name} généré !`);
  } catch (error) {
    console.error(`[generateBadgePDF] Erreur: ${error.message}`);
    toast.error(`Erreur génération badge PDF: ${error.message}`);
    throw error;
  }
};

// Génère un PDF pour tous les badges
export const generateAllBadgesPDF = async (employees, companyData, setProgress, setActionLoading) => {
  console.log("[generateAllBadgesPDF] Début génération PDF tous les badges");
  if (!window.confirm("Générer les badges pour tous les employés ?")) return;
  try {
    setActionLoading(true);
    setProgress(0);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yOffset = 10;
    const logoData = cacheLogo(companyData.id);
    const total = employees.length;

    for (const [index, employee] of employees.entries()) {
      console.log(`[generateAllBadgesPDF] Génération badge pour ${employee.name}`);
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
          const logoFormat = extension === "png" ? "PNG" : "JPEG";
          doc.addImage(logoData, logoFormat, 10, yOffset, 25, 10);
        } catch (error) {
          console.error(`[generateAllBadgesPDF] Erreur ajout logo: ${error.message}`);
          doc.setFontSize(8);
          doc.text(companyData.name, 15, yOffset + 5, { align: "center" });
          toast.warn("Erreur lors de l'ajout du logo au badge.");
        }
      } else {
        doc.setFontSize(8);
        doc.text(companyData.name, 15, yOffset + 5, { align: "center" });
      }

      doc.addImage(
        employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff`,
        "PNG",
        10,
        yOffset + 15,
        25,
        25
      );

      doc.setFont("helvetica", "normal");
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

      setProgress(((index + 1) / total) * 100);
    }

    doc.save(`${companyData.name}_badges.pdf`);
    console.log("[generateAllBadgesPDF] PDF tous les badges généré");
    toast.success("Badges exportés en PDF !");
  } catch (error) {
    console.error(`[generateAllBadgesPDF] Erreur: ${error.message}`);
    toast.error(`Erreur génération badges PDF: ${error.message}`);
    throw error;
  } finally {
    setActionLoading(false);
    setProgress(0);
  }
};

// Génère un rapport PDF
export const generatePDFReport = async (companyData, employees, setActionLoading) => {
  console.log("[generatePDFReport] Début génération rapport PDF");
  try {
    setActionLoading(true);
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text(`Rapport RH - ${companyData.name}`, 10, 10);
    doc.setFontSize(12);
    doc.text(`Employés : ${companyData.currentUsers}/${companyData.licenseMaxUsers}`, 10, 20);
    doc.text(`Date d'expiration : ${new Date(companyData.licenseExpiry).toLocaleDateString("fr-FR")}`, 10, 30);
    doc.text("Liste des employés :", 10, 40);
    autoTable(doc, {
      startY: 50,
      head: [["Nom", "Rôle", "Poste", "Congés restants", "Statut"]],
      body: employees.map((emp) => [
        emp.name,
        emp.role,
        emp.poste,
        emp.leaves?.balance || 0,
        emp.status,
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      margin: { left: 10, right: 10 },
    });
    doc.setFontSize(8);
    doc.text("Généré par PHRM - Système de gestion des ressources humaines", 105, 280, { align: "center" });
    doc.save(`${companyData.name}_rapport.pdf`);
    console.log("[generatePDFReport] Rapport PDF généré");
    toast.success("Rapport PDF généré !");
  } catch (error) {
    console.error(`[generatePDFReport] Erreur: ${error.message}`);
    toast.error(`Erreur génération PDF: ${error.message}`);
    throw error;
  } finally {
    setActionLoading(false);
  }
};
