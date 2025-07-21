// src/components/DocumentGeneration.jsx
import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { toast } from "react-toastify";
import { FiDownload, FiFileText } from "react-icons/fi";
import { generateAllBadgesPDF, generatePDFReport } from "../utils/pdfUtils";
import EmployeeBadge from "../compoments/EmployeeBadge";
import Button from "../compoments/Button";
import Card from "../compoments/card";

const DocumentGeneration = ({ companyData, employees, actionLoading, setActionLoading }) => {
  const [progress, setProgress] = useState(0);

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
          "Date d'embauche": new Date(emp.hireDate).toLocaleDateString("fr-FR"),
          Statut: emp.status,
          "Solde Congés": emp.leaves?.balance || 0,
          Absences: emp.absences?.length || 0,
          "Numéro CNPS": emp.cnpsNumber || "N/A",
          "Catégorie Professionnelle": emp.professionalCategory || "N/A",
          "Dernière Fiche de Paie": emp.payslips?.[0]?.date ? new Date(emp.payslips[0].date).toLocaleDateString("fr-FR") : "Aucune",
          "Contrat Généré": emp.contract ? new Date(emp.contract.generatedAt).toLocaleDateString("fr-FR") : "Aucun",
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
      XLSX.writeFile(workbook, `${companyData.name}_rapport.xlsx`);
      console.log("[generateExcelReport] Rapport Excel généré");
      toast.success("Rapport Excel généré !");
    } catch (error) {
      console.error(`[generateExcelReport] Erreur: ${error.message}`);
      toast.error(`Erreur génération Excel: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees, setActionLoading]);

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
        "Date d'embauche": new Date(emp.hireDate).toLocaleDateString("fr-FR"),
        Statut: emp.status,
        "Solde Congés": emp.leaves?.balance || 0,
        Absences: emp.absences?.length || 0,
        "Numéro CNPS": emp.cnpsNumber || "N/A",
        "Catégorie Professionnelle": emp.professionalCategory || "N/A",
        "Dernière Fiche de Paie": emp.payslips?.[0]?.date ? new Date(emp.payslips[0].date).toLocaleDateString("fr-FR") : "Aucune",
        "Contrat Généré": emp.contract ? new Date(emp.contract.generatedAt).toLocaleDateString("fr-FR") : "Aucun",
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
      console.error(`[generateCSVReport] Erreur: ${error.message}`);
      toast.error(`Erreur génération CSV: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees, setActionLoading]);

  return (
    <Card title="Badges et Rapports des Employés" className="animate-scale-in">
      {progress > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Génération en cours : {progress.toFixed(1)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button
          onClick={() => generateAllBadgesPDF(employees, companyData, setProgress, setActionLoading)}
          icon={FiDownload}
          aria-label="Exporter tous les badges"
          disabled={actionLoading}
        >
          Exporter tous les badges
        </Button>
        <Button
          onClick={() => generatePDFReport(companyData, employees, setActionLoading)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {employees.map((employee, index) => (
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
  );
};

export default DocumentGeneration;