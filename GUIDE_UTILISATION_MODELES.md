# Guide d'Utilisation des Modèles PRHM

## 🎯 Vue d'ensemble

Ce guide vous montre concrètement où et comment utiliser les modèles de fiches de paie et de contrats dans l'application PRHM.

## 📍 Localisation des Modèles dans l'Application

### 1. Page de Démonstration (NOUVEAU)
**Fichier:** `src/pages/TemplatePreviewDemo.jsx`
- **Accès:** Ajoutez cette route dans votre App.js
- **Fonctionnalité:** Visualisation complète de tous les modèles avec aperçus en temps réel
- **Données de test:** Inclut des données d'exemple pour voir le rendu final

### 2. Génération de Fiches de Paie
**Fichier principal:** `src/pages/PaySlipGenerator.jsx`

#### Comment l'utiliser :
```jsx
// Dans votre composant parent
import PaySlipGenerator from './pages/PaySlipGenerator';

const handleGeneratePayslip = (employee) => {
  return (
    <PaySlipGenerator
      employee={employee}
      companyData={companyData}
      selectedTemplate="template1" // Choisir parmi template1-5
      onGenerate={(data) => console.log('Fiche générée:', data)}
      onClose={() => setShowGenerator(false)}
      isContractMode={false}
    />
  );
};
```

#### Modèles disponibles :
- `template1` - **Modèle Standard Camerounais** (recommandé)
- `template2` - **Modèle Simplifié Moderne** (avec QR code)
- `template3` - **Modèle Détaillé Complet** (toutes les informations)
- `template4` - **Modèle Entreprise Premium** (branding complet)
- `template5` - **Modèle CNPS Officiel** (conformité CNPS)

### 3. Export PDF des Fiches de Paie
**Fichier:** `src/compoments/ExportPaySlip.jsx`

#### Utilisation :
```jsx
import ExportPaySlip from './compoments/ExportPaySlip';

<ExportPaySlip
  employee={employeeData}
  employer={companyData}
  salaryDetails={salaryDetails}
  remuneration={remuneration}
  deductions={deductions}
  payPeriod="2025-01"
  generatedAt={new Date().toISOString()}
  selectedTemplate="template1" // Applique les styles du modèle
  auto={false} // true pour export automatique
  onExported={() => console.log('PDF exporté')}
/>
```

### 4. Interface de Sélection des Modèles
**Fichier:** `src/components/PaySlipTemplates.jsx`

#### Utilisation :
```jsx
import PaySlipTemplates from './components/PaySlipTemplates';

const [selectedTemplate, setSelectedTemplate] = useState('template1');

<PaySlipTemplates
  selectedTemplate={selectedTemplate}
  onSelectTemplate={setSelectedTemplate}
  onPreview={(template) => {
    console.log('Aperçu du modèle:', template);
    // Ouvrir modal d'aperçu
  }}
  onDownload={(template) => {
    console.log('Télécharger modèle:', template);
    // Logique de téléchargement
  }}
/>
```

## 🎨 Styles et Apparence des Modèles

### Modèle 1 - Standard Camerounais
```css
/* Style appliqué automatiquement */
.template1 {
  background: white;
  border: 1px solid #e5e7eb;
  colors: standard (noir/gris);
}
```

### Modèle 2 - Moderne
```css
.template2 {
  background: linear-gradient(to bottom right, #dbeafe, #e0e7ff);
  border: 1px solid #3b82f6;
  colors: bleu (#3b82f6, #1e40af);
}
```

### Modèle 3 - Détaillé
```css
.template3 {
  background: linear-gradient(to bottom right, #f0fdf4, #dcfce7);
  border: 1px solid #22c55e;
  colors: vert (#22c55e, #16a34a);
}
```

### Modèle 4 - Premium
```css
.template4 {
  background: linear-gradient(to bottom right, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  colors: orange/doré (#f59e0b, #d97706);
}
```

### Modèle 5 - CNPS Officiel
```css
.template5 {
  background: #f9fafb;
  border: 1px solid #374151;
  colors: noir/gris officiel;
}
```

## 🔧 Configuration et Personnalisation

### Modifier un Modèle Existant
**Fichier:** `src/utils/paySlipTemplates.js`

```javascript
export const PAYSLIP_TEMPLATE_CONFIGS = {
  template1: {
    name: 'Mon Modèle Personnalisé',
    layout: 'classic',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'signature'],
    // Nouvelles propriétés personnalisées
    colors: {
      primary: '#1e40af',
      secondary: '#64748b'
    },
    fonts: {
      title: 'Arial Black',
      body: 'Arial'
    }
  }
};
```

### Ajouter un Nouveau Modèle
```javascript
// Dans paySlipTemplates.js
export const PAYSLIP_TEMPLATE_CONFIGS = {
  // ... modèles existants
  template6: {
    name: 'Modèle Personnalisé Entreprise',
    layout: 'custom',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'custom-section', 'signature'],
    customSettings: {
      showQRCode: true,
      watermark: 'CONFIDENTIEL',
      headerColor: '#8b5cf6'
    }
  }
};
```

## 📊 Données Requises pour Chaque Modèle

### Données Employé (Obligatoires)
```javascript
const employee = {
  name: 'NKOMO Jean Pierre',
  matricule: 'EMP001',
  poste: 'Développeur',
  department: 'IT',
  contract: {
    salaryBrut: 750000,
    hireDate: '2024-01-15'
  }
};
```

### Données Entreprise (Obligatoires)
```javascript
const companyData = {
  name: 'VIGILCAM SECURITY & SERVICES SARL',
  address: 'BP 16194 Yaoundé',
  cnpsNumber: 'J123456789',
  phone: '22214081'
};
```

### Données Spécifiques par Modèle

#### Template 1 (Standard) - Données minimales
- Employé : nom, matricule, poste, salaire
- Entreprise : nom, adresse, CNPS

#### Template 2 (Moderne) - Avec QR Code
- Toutes les données du Template 1
- `qrCodeData` : données pour le QR code

#### Template 3 (Détaillé) - Données complètes
- Toutes les données précédentes
- `employee.seniority` : ancienneté
- `employee.childrenCount` : nombre d'enfants
- `primes[]` : tableau des primes
- `indemnites[]` : tableau des indemnités

#### Template 4 (Premium) - Avec sécurité
- Toutes les données du Template 3
- `securityFeatures` : filigrane, signature digitale

#### Template 5 (CNPS Officiel) - Conformité
- Toutes les données légales obligatoires
- `cnpsValidation` : données de validation CNPS

## 🚀 Intégration dans votre Application

### 1. Ajouter la Route de Démonstration
```jsx
// Dans App.js
import TemplatePreviewDemo from './pages/TemplatePreviewDemo';

function App() {
  return (
    <Router>
      <Routes>
        {/* Vos routes existantes */}
        <Route path="/demo-templates" element={<TemplatePreviewDemo />} />
      </Routes>
    </Router>
  );
}
```

### 2. Utiliser dans un Dashboard
```jsx
// Dans votre dashboard
import { PAYSLIP_TEMPLATE_CONFIGS } from './utils/paySlipTemplates';

const Dashboard = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  
  return (
    <div>
      <h2>Choisir un modèle de fiche de paie</h2>
      <select 
        value={selectedTemplate} 
        onChange={(e) => setSelectedTemplate(e.target.value)}
      >
        {Object.entries(PAYSLIP_TEMPLATE_CONFIGS).map(([key, template]) => (
          <option key={key} value={key}>
            {template.name}
          </option>
        ))}
      </select>
      
      <PaySlipGenerator
        selectedTemplate={selectedTemplate}
        // ... autres props
      />
    </div>
  );
};
```

### 3. Export Automatique avec Modèle
```jsx
const handleAutoExport = (employeeData) => {
  return (
    <ExportPaySlip
      {...employeeData}
      selectedTemplate="template1"
      auto={true} // Export automatique
      onExported={() => {
        toast.success('Fiche de paie exportée avec succès !');
      }}
    />
  );
};
```

## 🎯 Cas d'Usage Recommandés

### Pour une PME
- **Modèle recommandé :** Template 1 (Standard Camerounais)
- **Pourquoi :** Conformité légale, simplicité, coût réduit

### Pour une Grande Entreprise
- **Modèle recommandé :** Template 4 (Premium) ou Template 5 (CNPS Officiel)
- **Pourquoi :** Branding professionnel, sécurité renforcée

### Pour les Startups
- **Modèle recommandé :** Template 2 (Moderne)
- **Pourquoi :** Design moderne, QR code pour la tech

### Pour les Administrations
- **Modèle recommandé :** Template 5 (CNPS Officiel)
- **Pourquoi :** Conformité maximale, traçabilité

## 🔍 Débogage et Résolution de Problèmes

### Erreur d'Import
```javascript
// ❌ Erreur
import { PAYSLIP_TEMPLATES } from './utils/paySlipTemplates';

// ✅ Correct
import { PAYSLIP_TEMPLATE_CONFIGS } from './utils/paySlipTemplates';
```

### Modèle Non Trouvé
```javascript
// Vérification avant utilisation
const template = PAYSLIP_TEMPLATE_CONFIGS[templateId];
if (!template) {
  console.error(`Modèle ${templateId} non trouvé`);
  return;
}
```

### Données Manquantes
```javascript
// Validation des données requises
const validatePayslipData = (employee, company) => {
  const required = ['name', 'matricule'];
  const missing = required.filter(field => !employee[field]);
  
  if (missing.length > 0) {
    throw new Error(`Champs manquants: ${missing.join(', ')}`);
  }
};
```

## 📞 Support

Pour toute question sur l'utilisation des modèles :
1. Consultez la page de démonstration : `/demo-templates`
2. Vérifiez la documentation technique : `ANALYSE_MODELES.md`
3. Testez avec les données d'exemple fournies

---

*Dernière mise à jour : Janvier 2025*