import { jsPDF } from "jspdf";

export const generateBadgePDF = (employee, companyData, badgeModel) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [320, 210] });
  doc.text(`Badge pour ${employee.name} (${badgeModel})`, 20, 30);
  doc.save(`badge_${(employee.name || "employee").replace(/\s+/g, "_")}.pdf`);
};

export default generateBadgePDF;
