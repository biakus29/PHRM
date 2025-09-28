import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { displayDate } from "../utils/displayUtils";

// Champs obligatoires pour la génération d'une fiche de paie
const REQUIRED_FIELDS = [
  { key: 'employee.name', label: "Nom de l'employé" },
  { key: 'employee.matricule', label: 'Matricule' },
  { key: 'salaryDetails.monthlyRate', label: 'Salaire mensuel' },
  { key: 'payPeriod', label: 'Période de paie' },
];

// Fonction utilitaire pour accéder aux propriétés d'objet par chemin
function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Fonction utilitaire pour échapper le texte
const escapeText = (str) => (str ? String(str).replace(/[\n\r]/g, " ") : "");

/**
 * Composant de base abstrait pour tous les modèles de fiches de paie
 * Fournit les fonctionnalités communes et la validation
 */
class PaySlipTemplateBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isGenerating: false
    };
  }

  /**
   * Valide les données obligatoires pour la génération de fiche de paie
   * @param {Object} payslipData - Données de la fiche de paie
   * @returns {Array} - Liste des champs manquants
   */
  validateData(payslipData) {
    return REQUIRED_FIELDS.filter(field => !getValue(payslipData, field.key));
  }

  /**
   * Normalise les données de la fiche de paie avec des valeurs par défaut
   * @param {Object} rawData - Données brutes
   * @returns {Object} - Données normalisées
   */
  normalizeData(rawData) {
    const {
      employee = {},
      employer = {},
      salaryDetails = {},
      remuneration = {},
      deductions = {},
      payPeriod = 'N/A',
      generatedAt = new Date(),
      primes = [],
      indemnites = []
    } = rawData;

    return {
      employee: {
        name: employee.name || 'N/A',
        matricule: employee.matricule || 'N/A',
        poste: employee.poste || 'N/A',
        professionalClassification: employee.professionalClassification || 'N/A',
        cnpsNumber: employee.cnpsNumber || 'N/A',
        email: employee.email || 'N/A',
        dateOfBirth: employee.dateOfBirth || 'N/A',
        placeOfBirth: employee.placeOfBirth || 'N/A',
        hireDate: employee.hireDate || 'N/A',
        department: employee.department || 'N/A',
        service: employee.service || 'N/A',
        diplomas: employee.diplomas || 'N/A',
        echelon: employee.echelon || 'N/A',
        supervisor: employee.supervisor || 'N/A'
      },
      employer: {
        name: employer.name || employer.companyName || 'VIGILCAM SECURITY & SERVICES SARL',
        address: employer.address || 'BP 16194 Yaoundé',
        cnpsNumber: employer.cnpsNumber || 'Non spécifié',
        phone: employer.phone || '22214081',
        id: employer.id
      },
      salaryDetails: {
        monthlyRate: salaryDetails.monthlyRate || 0,
        dailyRate: salaryDetails.dailyRate || 0,
        hourlyRate: salaryDetails.hourlyRate || 0,
        transportAllowance: salaryDetails.transportAllowance || 0
      },
      remuneration: {
        workedDays: remuneration.workedDays || 0,
        overtime: remuneration.overtime || 0,
        total: remuneration.total || 0
      },
      deductions: {
        pvid: deductions.pvid || 0,
        irpp: deductions.irpp || 0,
        cac: deductions.cac || 0,
        cfc: deductions.cfc || 0,
        rav: deductions.rav || 0,
        tdl: deductions.tdl || 0,
        fne: deductions.fne || 0,
        total: deductions.total || 0
      },
      payPeriod,
      generatedAt,
      primes,
      indemnites
    };
  }

  /**
   * Calcule le salaire net à payer
   * @param {Object} normalizedData - Données normalisées
   * @returns {number} - Salaire net
   */
  calculateNetPay(normalizedData) {
    const { remuneration, deductions, primes = [], indemnites = [] } = normalizedData;
    const primesTotal = primes.reduce((acc, p) => acc + Number(p.value || p.montant || 0), 0);
    const indemnitesTotal = indemnites.reduce((acc, i) => acc + Number(i.value || i.montant || 0), 0);
    
    return Math.max(0, 
      Number(remuneration.total || 0) + 
      Number(primesTotal) + 
      Number(indemnitesTotal) - 
      Number(deductions.total || 0)
    );
  }

  /**
   * Récupère le logo de l'employeur depuis le localStorage
   * @param {string} employerId - ID de l'employeur
   * @returns {Object|null} - Données du logo ou null
   */
  getLogo(employerId) {
    try {
      const logoData = localStorage.getItem(`logo_${employerId}`);
      if (logoData) {
        const extension = logoData.includes('image/png') ? 'PNG' : 
                         logoData.includes('image/jpeg') ? 'JPEG' : null;
        return { data: logoData, extension };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du logo:', error);
    }
    return null;
  }

  /**
   * Ajoute le logo au PDF si disponible
   * @param {jsPDF} doc - Instance jsPDF
   * @param {Object} logo - Données du logo
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} width - Largeur
   * @param {number} height - Hauteur
   */
  addLogo(doc, logo, x, y, width, height) {
    if (logo && logo.extension) {
      try {
        doc.addImage(logo.data, logo.extension, x, y, width, height);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du logo:', error);
        // Dessiner un rectangle gris en remplacement
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, width, height, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Logo non disponible', x + width/2, y + height/2, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  }

  /**
   * Génère le nom de fichier pour la fiche de paie
   * @param {Object} normalizedData - Données normalisées
   * @returns {string} - Nom de fichier sécurisé
   */
  generateFileName(normalizedData) {
    const { employee, payPeriod } = normalizedData;
    const safeName = employee.name.replace(/[^a-zA-Z0-9]/g, "_");
    const safePeriod = payPeriod.replace(/[^a-zA-Z0-9]/g, "_");
    return `fiche_paie_${safeName}_${safePeriod}.pdf`;
  }

  /**
   * Méthode abstraite à implémenter par les classes filles
   * Génère le contenu spécifique du modèle de fiche de paie
   * @param {jsPDF} doc - Instance jsPDF
   * @param {Object} normalizedData - Données normalisées
   * @param {Object} logo - Données du logo
   * @abstract
   */
  generateTemplate(doc, normalizedData, logo) {
    throw new Error('La méthode generateTemplate doit être implémentée par la classe fille');
  }

  /**
   * Génère la fiche de paie PDF
   */
  generatePDF = async () => {
    if (this.state.isGenerating) return;

    this.setState({ isGenerating: true });

    try {
      // Validation des données
      const missingFields = this.validateData(this.props);
      if (missingFields.length > 0) {
        const message = "Impossible de générer le PDF. Champs manquants :\n" + 
                       missingFields.map(f => `- ${f.label}`).join("\n");
        toast.error(message);
        return;
      }

      // Normalisation des données
      const normalizedData = this.normalizeData(this.props);
      
      // Récupération du logo
      const logo = this.getLogo(normalizedData.employer.id);

      // Création du PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Génération du contenu spécifique au modèle
      await this.generateTemplate(doc, normalizedData, logo);

      // Sauvegarde
      const fileName = this.generateFileName(normalizedData);
      doc.save(fileName);

      // Callback de succès
      if (this.props.onGenerated) {
        this.props.onGenerated(normalizedData);
      }

      toast.success(`Fiche de paie générée avec succès : ${fileName}`);
      console.log('Fiche de paie générée:', fileName);

    } catch (error) {
      console.error('Erreur lors de la génération de la fiche de paie:', error);
      toast.error('Erreur lors de la génération de la fiche de paie');
    } finally {
      this.setState({ isGenerating: false });
    }
  };

  render() {
    const { children, buttonText = "Générer la fiche de paie", className = "" } = this.props;
    const { isGenerating } = this.state;

    // Si auto est activé, génération automatique
    if (this.props.auto) {
      React.useEffect(() => {
        this.generatePDF();
      }, []);
      return null;
    }

    return (
      <div className={`payslip-template ${className}`}>
        {children}
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Génération de la Fiche de Paie</h3>
          <p className="text-sm text-gray-600 mb-4">
            Cliquez sur le bouton ci-dessous pour générer et télécharger la fiche de paie au format PDF.
          </p>
          <button
            onClick={this.generatePDF}
            disabled={isGenerating}
            className={`px-4 py-2 ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} 
                       text-white rounded-md transition-colors duration-200 flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isGenerating ? 'Génération en cours...' : buttonText}
          </button>
        </div>
      </div>
    );
  }
}

export default PaySlipTemplateBase;
export { escapeText, getValue };