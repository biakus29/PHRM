const fs = require('fs');
const path = require('path');

// Mapping des caractères mal encodés vers les caractères corrects
const encodingFixes = {
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ã ': 'à',
  'Ã´': 'ô',
  'Ã¢': 'â',
  'Ã®': 'î',
  'Ã»': 'û',
  'Ã§': 'ç',
  'Ã¼': 'ü',
  'Ã¶': 'ö',
  'Ã±': 'ñ',
  'Ã‰': 'É',
  'Ã€': 'À',
  'Ã‡': 'Ç',
  'EmployÃ©': 'Employe',
  'DÃ©tails': 'Details',
  'PÃ©riode': 'Periode',
  'RÃ©munÃ©ration': 'Remuneration',
  'travaillÃ©s': 'travailles',
  'supplÃ©mentaires': 'supplementaires',
  'IndemnitÃ©s': 'Indemnites',
  'DÃ©ductions': 'Deductions',
  'gÃ©nÃ©ration': 'generation',
  'utilisÃ©': 'utilise',
  'authentifiÃ©': 'authentifie',
  'trouvÃ©': 'trouve',
  'supprimÃ©e': 'supprimee',
  'tÃ©lÃ©chargement': 'telechargement',
  'DÃ©but': 'Debut',
  'supportÃ©': 'supporte',
  'supportÃ©s': 'supportes',
  'rÃ©duisez': 'reduisez',
  'stockÃ©': 'stocke',
  'Ã‰chec': 'Echec',
  'dÃ©passÃ©e': 'depassee',
  'donnÃ©es': 'donnees',
  'employÃ©s': 'employes',
  'employÃ©': 'employe',
  'VÃ©rifie': 'Verifie',
  'VÃ©rifier': 'Verifier',
  'franÃ§ais': 'francais',
  'prÃ©sents': 'presents',
  'mÃªme': 'meme',
  'vÃ©rifier': 'verifier',
  'dÃ©tails': 'details',
  'Ã©tat': 'etat',
  'Ã©tats': 'etats',
  'modÃ¨les': 'modeles',
  'affilÃ©e': 'affilee',
  'ChangÃ©': 'Change'
};

function fixFileEncoding(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer toutes les corrections d'encodage
    for (const [badChar, goodChar] of Object.entries(encodingFixes)) {
      if (content.includes(badChar)) {
        content = content.replace(new RegExp(badChar, 'g'), goodChar);
        hasChanges = true;
        console.log(`Corrigé: ${badChar} → ${goodChar} dans ${filePath}`);
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fichier corrigé: ${filePath}`);
    } else {
      console.log(`✨ Aucune correction nécessaire: ${filePath}`);
    }
    
    return hasChanges;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

function fixDirectoryEncoding(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let totalFixed = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      totalFixed += fixDirectoryEncoding(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      if (fixFileEncoding(fullPath)) {
        totalFixed++;
      }
    }
  }
  
  return totalFixed;
}

// Exécuter la correction
console.log('🔧 Début de la correction des caractères mal encodés...');
const srcPath = path.join(__dirname, 'src');
const totalFixed = fixDirectoryEncoding(srcPath);
console.log(`\n✅ Correction terminée! ${totalFixed} fichier(s) corrigé(s).`);
