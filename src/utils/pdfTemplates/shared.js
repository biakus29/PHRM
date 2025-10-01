// Utilitaires partagés pour tous les templates de bulletins de paie

export const COLORS = {
  headerGray: [220, 220, 220],
  lightGray: [240, 240, 240],
  darkGray: [180, 180, 180],
  gains: [200, 255, 200],
  deductions: [255, 200, 200],
  black: [0, 0, 0],
  white: [255, 255, 255],
  yellow: [255, 255, 200],
  blue: [200, 220, 255],
  orange: [255, 220, 180]
};

export const FONTS = {
  title: { family: 'helvetica', style: 'bold', size: 14 },
  subtitle: { family: 'helvetica', style: 'bold', size: 12 },
  header: { family: 'helvetica', style: 'bold', size: 10 },
  normal: { family: 'helvetica', style: 'normal', size: 9 },
  small: { family: 'helvetica', style: 'normal', size: 8 },
  tiny: { family: 'helvetica', style: 'normal', size: 7 }
};

export function setFont(doc, fontConfig) {
  doc.setFont(fontConfig.family, fontConfig.style);
  doc.setFontSize(fontConfig.size);
}

export function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== '' && !['N/A', '—', 'undefined', 'null'].includes(String(v).trim());
}

// Fonction améliorée pour ajouter le logo avec espace réservé systématique
export function addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, options = {}) {
  const {
    logoSize = 24,
    position = 'center', // 'center', 'left', 'right'
    reserveSpace = true,
    backgroundColor = null
  } = options;

  const reservedHeight = logoSize + 6; // Espace réservé même sans logo
  let logoAdded = false;

  try {
    const employerId = payslipData?.employer?.id;
    if (employerId) {
      // Tentative de récupération du logo depuis localStorage
      const logoData = localStorage.getItem(`logo_${employerId}`);
      if (logoData) {
        const extension = logoData.includes('image/png') ? 'PNG' :
                         logoData.includes('image/jpeg') ? 'JPEG' :
                         logoData.includes('image/jpg') ? 'JPEG' : null;
        
        if (extension) {
          let logoX;
          switch (position) {
            case 'left':
              logoX = margin;
              break;
            case 'right':
              logoX = pageWidth - margin - logoSize;
              break;
            case 'center':
            default:
              logoX = (pageWidth - logoSize) / 2;
          }

          // Fond pour le logo si spécifié
          if (backgroundColor) {
            doc.setFillColor(...backgroundColor);
            doc.rect(logoX - 2, currentY - 2, logoSize + 4, logoSize + 4, 'F');
          }

          doc.addImage(logoData, extension, logoX, currentY, logoSize, logoSize);
          logoAdded = true;
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors de l\'ajout du logo:', error);
  }

  // Retourner la nouvelle position Y (avec espace réservé même sans logo)
  return reserveSpace ? currentY + reservedHeight : (logoAdded ? currentY + logoSize + 6 : currentY);
}

// Récupérer les primes/indemnités personnalisées de l'employeur
export function getEmployerCustomItems(employerId, type = 'primes') {
  try {
    const configKey = `employer_config_${employerId}`;
    const configData = localStorage.getItem(configKey);
    if (configData) {
      const config = JSON.parse(configData);
      return type === 'primes' ? (config.customPrimes || []) : (config.customIndemnites || []);
    }
  } catch (error) {
    console.warn(`Erreur lors de la récupération des ${type} personnalisées:`, error);
  }
  return [];
}

export default {
  COLORS,
  FONTS,
  setFont,
  hasValue,
  addLogoWithReservedSpace,
  getEmployerCustomItems
};
