// Utilitaires pour la gestion des QR codes
import { QRCodeCanvas } from "qrcode.react";

// Fonction utilitaire pour générer l'URL du QR code
export const generateQRCodeUrl = (employee, companyData) => {
  const baseUrl = "https://prhm.app";
  const employeeId = employee.matricule || employee.id;
  const companyId = companyData?.id;
  
  // URL enrichie avec les informations de l'employé
  const qrData = {
    type: "employee_badge",
    employeeId: employeeId,
    employeeName: employee.name,
    matricule: employee.matricule,
    poste: employee.poste,
    companyId: companyId,
    companyName: companyData?.name,
    url: `${baseUrl}/employee/${employeeId}`,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(qrData);
};

// Fonction pour générer un QR code avec informations directes de l'utilisateur
export const generateUserInfoQRCode = (employee, companyData) => {
  // Format simple et direct avec les informations principales
  const userInfo = {
    nom: employee.name,
    matricule: employee.matricule || employee.id,
    poste: employee.poste,
    entreprise: companyData?.name,
    email: employee.email,
    telephone: employee.phone,
    departement: employee.department,
    dateEmbauche: employee.hireDate,
    statut: employee.status || "Actif"
  };
  
  return JSON.stringify(userInfo);
};

// Fonction pour générer un QR code avec format vCard (pour contacts)
export const generateVCardQRCode = (employee, companyData) => {
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${employee.name}
ORG:${companyData?.name || ''}
TITLE:${employee.poste || ''}
EMAIL:${employee.email || ''}
TEL:${employee.phone || ''}
NOTE:Matricule: ${employee.matricule || employee.id}
END:VCARD`;
  
  return vCard;
};

// Composant QR code réutilisable
export const EmployeeQRCode = ({ employee, companyData, size = 80, level = "M", includeMargin = false, className = "" }) => {
  const qrCodeUrl = generateQRCodeUrl(employee, companyData);
  
  return (
    <div className={`bg-white p-1 rounded ${className}`}>
      <QRCodeCanvas 
        value={qrCodeUrl} 
        size={size} 
        level={level}
        includeMargin={includeMargin}
      />
    </div>
  );
};

// Fonction pour décoder les données du QR code
export const decodeQRCodeData = (qrCodeString) => {
  try {
    // Essayer de décoder comme JSON
    const data = JSON.parse(qrCodeString);
    return data;
  } catch (error) {
    // Si ce n'est pas du JSON, vérifier si c'est un vCard
    if (qrCodeString.includes('BEGIN:VCARD')) {
      return {
        type: 'vCard',
        raw: qrCodeString,
        message: 'Carte de contact détectée'
      };
    }
    // Si ce n'est ni JSON ni vCard, retourner comme URL simple
    return {
      type: 'url',
      url: qrCodeString,
      message: 'URL simple détectée'
    };
  }
};

// Fonction pour valider les données du QR code
export const validateQRCodeData = (data) => {
  if (!data || typeof data !== 'object') return false;
  
  // Validation pour les données JSON (ancien format)
  if (data.type === 'employee_badge') {
    const requiredFields = ['type', 'employeeId', 'employeeName', 'url'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }
  
  // Validation pour les informations utilisateur
  if (data.nom && data.matricule) {
    return true;
  }
  
  // Validation pour vCard
  if (data.type === 'vCard') {
    return true;
  }
  
  // Validation pour URL simple
  if (data.type === 'url' && data.url) {
    return true;
  }
  
  return false;
};

// Fonction pour générer un QR code simple (URL uniquement)
export const generateSimpleQRCodeUrl = (employee) => {
  const baseUrl = "https://prhm.app";
  const employeeId = employee.matricule || employee.id;
  return `${baseUrl}/employee/${employeeId}`;
}; 