import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

// Fonction utilitaire pour gérer le logo
const cacheLogo = (companyId) => {
  if (!companyId) return null;
  return localStorage.getItem(`logo_${companyId}`);
};

// Fonction utilitaire pour gérer les erreurs
const handleError = (error, message) => {
  console.error(`[${message}] Erreur:`, error.stack || error.message);
  toast.error(`${message}: ${error.message}`);
};

const exportPaySlipToPDF = (paySlipData, employee, companyData, setActionLoading) => {
  console.log(`[exportPaySlipToPDF] Début génération fiche de paie PDF pour ${employee?.name || "Inconnu"}`);
  try {
    // Validation des données
    if (!paySlipData || !employee || !companyData) {
      throw new Error("Données manquantes : paySlipData, employee ou companyData.");
    }
    if (
      !paySlipData.employee ||
      !paySlipData.employer ||
      !paySlipData.salaryDetails ||
      !paySlipData.remuneration ||
      !paySlipData.deductions ||
      !paySlipData.payPeriod
    ) {
      throw new Error("Propriétés requises manquantes dans les données de la fiche de paie.");
    }

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
    const pageHeight = doc.internal.pageSize.height;
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

    if (logoData) {
      try {
        const extension = logoData.includes("image/png") ? "png" : logoData.includes("image/jpeg") ? "jpeg" : null;
        if (!extension) throw new Error("Format d'image non supporté.");
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
      `Généré le: ${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
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

    // Vérifier la hauteur avant la section suivante
    if (y > pageHeight - 50) {
      doc.addPage();
      y = topMargin;
    }

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
    doc.text(`Classification: ${paySlipData.employee?.professionalCategory || "N/A"}`, leftMargin, y);
    y += sectionSpacing;

    // Vérifier la hauteur
    if (y > pageHeight - 80) {
      doc.addPage();
      y = topMargin;
    }

    // Détails Salariaux
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Détails Salariaux", leftMargin, y);
    y += lineHeight;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["Taux mensuel", Number(paySlipData.salaryDetails?.monthlyRate || 0).toLocaleString("fr-FR")],
        ["Taux journalier", Number(paySlipData.salaryDetails?.dailyRate || 0).toLocaleString("fr-FR")],
        ["Taux horaire", Number(paySlipData.salaryDetails?.hourlyRate || 0).toLocaleString("fr-FR")],
        ["Indemnité de transport", Number(paySlipData.salaryDetails?.transportAllowance || 0).toLocaleString("fr-FR")],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7 },
      columnStyles: { 0: { cellWidth: textWidth * 0.7 }, 1: { cellWidth: textWidth * 0.3, halign: "right" } },
      margin: { left: leftMargin, right: rightMargin },
    });
    y = doc.lastAutoTable.finalY + sectionSpacing;

    // Vérifier la hauteur
    if (y > pageHeight - 80) {
      doc.addPage();
      y = topMargin;
    }

    // Rémunération
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Rémunération", leftMargin, y);
    y += lineHeight;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["Jours travaillés", Number(paySlipData.remuneration?.workedDays || 0).toLocaleString("fr-FR")],
        ["Heures supplémentaires", Number(paySlipData.remuneration?.overtime || 0).toLocaleString("fr-FR")],
        ["Total", Number(paySlipData.remuneration?.total || 0).toLocaleString("fr-FR")],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7 },
      columnStyles: { 0: { cellWidth: textWidth * 0.7 }, 1: { cellWidth: textWidth * 0.3, halign: "right" } },
      margin: { left: leftMargin, right: rightMargin },
    });
    y = doc.lastAutoTable.finalY + sectionSpacing;

    // Vérifier la hauteur
    if (y > pageHeight - 100) {
      doc.addPage();
      y = topMargin;
    }

    // Retenues
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Retenues", leftMargin, y);
    y += lineHeight;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["CNPS (PVIS)", Number(paySlipData.deductions?.pvis || 0).toLocaleString("fr-FR")],
        ["IRPP", Number(paySlipData.deductions?.irpp || 0).toLocaleString("fr-FR")],
        ["CAC", Number(paySlipData.deductions?.cac || 0).toLocaleString("fr-FR")],
        ["CFC", Number(paySlipData.deductions?.cfc || 0).toLocaleString("fr-FR")],
        ["RAV", Number(paySlipData.deductions?.rav || 0).toLocaleString("fr-FR")],
        ["TDL", Number(paySlipData.deductions?.tdl || 0).toLocaleString("fr-FR")],
        ["FNE", Number(paySlipData.deductions?.fne || 0).toLocaleString("fr-FR")],
        ["Total retenues", Number(paySlipData.deductions?.total || 0).toLocaleString("fr-FR")],
        ["Net à payer", Number((paySlipData.remuneration?.total || 0) - (paySlipData.deductions?.total || 0)).toLocaleString("fr-FR")],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7 },
      columnStyles: { 0: { cellWidth: textWidth * 0.7 }, 1: { cellWidth: textWidth * 0.3, halign: "right" } },
      margin: { left: leftMargin, right: rightMargin },
    });
    y = doc.lastAutoTable.finalY + sectionSpacing;

    // Signatures
    if (y > pageHeight - 30) {
      doc.addPage();
      y = topMargin;
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Fait à Yaoundé, le ${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
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
    doc.text(companyData.companyRepresentative || "N/A", leftMargin + 5, y);
    doc.text(`${paySlipData.employee?.firstName || ""} ${paySlipData.employee?.lastName || ""}`, pageWidth / 2 + 10, y);
    y += lineHeight;
    doc.text("Lu et approuvé", leftMargin + 5, y);
    doc.text("Lu et approuvé", pageWidth / 2 + 10, y);

    // Pied de page
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(companyData.name || "PHRM", leftMargin, pageHeight - 5);
    doc.text("Page 1", pageWidth - rightMargin, pageHeight - 5, { align: "right" });

    // Sanitisation du nom de fichier
    const safeFileName = `fiche_de_paie_${(paySlipData.employee?.matricule || "unknown").replace(/[^a-zA-Z0-9]/g, "_")}_${(paySlipData.payPeriod || "unknown").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    doc.save(safeFileName);
    console.log(`[exportPaySlipToPDF] Fiche de paie PDF générée: ${safeFileName}`);
    toast.success("Fiche de paie exportée en PDF !");
  } catch (error) {
    handleError(error, "Erreur lors de l'exportation PDF");
  } finally {
    setActionLoading(false);
  }
};

export default exportPaySlipToPDF;