# Composants de Modèles de Fiches de Paie

Ce module fournit une collection de composants modulaires et réutilisables pour générer des fiches de paie avec différents styles et designs.

## 🎯 Architecture

### Composant de Base
- **`PaySlipTemplateBase`** : Classe abstraite fournissant les fonctionnalités communes
  - Validation des données
  - Normalisation des entrées
  - Gestion des logos
  - Calculs automatiques
  - Génération de fichiers PDF

### Modèles Disponibles

#### 1. 🎨 Modèle Moderne (`PaySlipTemplateModern`)
**Design contemporain avec couleurs et mise en page attrayante**
- En-tête coloré avec fond bleu
- Sections visuellement distinctes
- Couleurs pour différencier gains et déductions
- Bloc net à payer mis en valeur
- Typographie moderne avec Helvetica

#### 2. 📄 Modèle Classique (`PaySlipTemplateClassic`)
**Style traditionnel sobre et professionnel**
- Design sobre et traditionnel
- Police Times pour un aspect formel
- Tableaux structurés avec bordures nettes
- Mise en page équilibrée
- Conformité avec les standards administratifs

#### 3. ✨ Modèle Minimaliste (`PaySlipTemplateMinimal`)
**Design épuré avec l'essentiel uniquement**
- Mise en page ultra épurée
- Informations condensées sur une page
- Génération rapide et légère
- Économie de papier et d'encre
- Lecture facile et directe

#### 4. 📋 Modèle Standard (`ExportPaySlip`)
**Modèle de base compatible avec l'existant**
- Compatible avec le code existant
- Fonctionnalités éprouvées
- Format standard de l'application

### Sélecteur de Modèles
- **`PaySlipTemplateSelector`** : Interface pour choisir entre les différents modèles
  - Aperçu visuel des modèles
  - Configuration en temps réel
  - Génération directe

## 🚀 Utilisation

### Import des Composants

```javascript
// Import simple d'un modèle spécifique
import PaySlipTemplateModern from './compoments/PaySlipTemplateModern';

// Import via l'index (recommandé)
import {
  PaySlipTemplateSelector,
  PaySlipTemplateModern,
  PaySlipTemplateClassic,
  PaySlipTemplateMinimal,
  PAYSLIP_TEMPLATES
} from './compoments';
```

### Utilisation Basique

```javascript
import React from 'react';
import { PaySlipTemplateModern } from './compoments';

const MyComponent = () => {
  const payslipData = {
    employee: {
      name: "Jean Dupont",
      matricule: "EMP001",
      poste: "Développeur",
      // ... autres données employé
    },
    employer: {
      name: "MonEntreprise SARL",
      address: "123 Rue de la Tech",
      // ... autres données employeur
    },
    salaryDetails: {
      monthlyRate: 500000,
      // ... autres détails salaire
    },
    // ... autres données
  };

  return (
    <PaySlipTemplateModern
      {...payslipData}
      onGenerated={(data) => console.log('PDF généré', data)}
    />
  );
};
```

### Utilisation du Sélecteur

```javascript
import React from 'react';
import { PaySlipTemplateSelector } from './compoments';

const PaySlipGenerator = () => {
  const handleGenerated = (payslipData) => {
    console.log('Fiche de paie générée:', payslipData);
  };

  return (
    <PaySlipTemplateSelector
      employee={employeeData}
      employer={employerData}
      salaryDetails={salaryData}
      remuneration={remunerationData}
      deductions={deductionsData}
      payPeriod="2025-01"
      onGenerated={handleGenerated}
    />
  );
};
```

### Génération Automatique

```javascript
// Génération automatique sans interface
<PaySlipTemplateModern
  {...payslipData}
  auto={true}
  onGenerated={handleSuccess}
/>
```

## 📋 API des Props

### Props Communes (tous les modèles)

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `employee` | Object | ✅ | Données de l'employé |
| `employer` | Object | ✅ | Données de l'employeur |
| `salaryDetails` | Object | ✅ | Détails du salaire |
| `remuneration` | Object | ✅ | Données de rémunération |
| `deductions` | Object | ✅ | Déductions et cotisations |
| `payPeriod` | String | ✅ | Période de paie (ex: "2025-01") |
| `generatedAt` | Date | ❌ | Date de génération |
| `primes` | Array | ❌ | Liste des primes |
| `indemnites` | Array | ❌ | Liste des indemnités |
| `onGenerated` | Function | ❌ | Callback après génération |
| `auto` | Boolean | ❌ | Génération automatique |
| `buttonText` | String | ❌ | Texte du bouton |
| `className` | String | ❌ | Classes CSS supplémentaires |

### Structure des Données

#### Employee Object
```javascript
{
  name: "Jean Dupont",
  matricule: "EMP001",
  poste: "Développeur",
  professionalClassification: "Cadre",
  cnpsNumber: "123456789",
  email: "jean@entreprise.com",
  dateOfBirth: "1990-01-01",
  placeOfBirth: "Yaoundé",
  department: "IT",
  service: "Développement",
  // ... autres champs
}
```

#### Employer Object
```javascript
{
  name: "MonEntreprise SARL",
  address: "BP 1234 Yaoundé",
  cnpsNumber: "987654321",
  phone: "237123456789",
  id: "company_123"
}
```

#### SalaryDetails Object
```javascript
{
  monthlyRate: 500000,
  dailyRate: 16667,
  hourlyRate: 2083,
  transportAllowance: 25000
}
```

## 🎨 Personnalisation

### Créer un Nouveau Modèle

```javascript
import PaySlipTemplateBase from './PaySlipTemplateBase';

class MonNouveauModele extends PaySlipTemplateBase {
  generateTemplate(doc, normalizedData, logo) {
    // Implémentez votre logique de génération PDF
    // ... votre code personnalisé
    
    return doc;
  }
}

export default MonNouveauModele;
```

### Modification des Styles

Chaque modèle peut être personnalisé en:
- Modifiant les couleurs dans le code source
- Ajustant les polices et tailles
- Changeant la mise en page
- Ajoutant de nouveaux éléments

## 🔧 Fonctionnalités Avancées

### Gestion des Logos
- Support PNG et JPEG
- Stockage en localStorage
- Gestion automatique des erreurs
- Fallback avec placeholder

### Validation des Données
- Validation automatique des champs obligatoires
- Messages d'erreur descriptifs
- Prévention de la génération avec données manquantes

### Optimisations
- Calculs automatiques (net à payer, totaux)
- Normalisation des données d'entrée
- Gestion des valeurs par défaut

## 🐛 Débogage

### Logs de Débogage
Les composants incluent des logs détaillés pour le débogage:
```javascript
// Activer les logs en mode développement
console.log('[PaySlipTemplate] Données normalisées:', normalizedData);
```

### Erreurs Communes
1. **Données manquantes** : Vérifiez que tous les champs requis sont fournis
2. **Logo non affiché** : Vérifiez le format (PNG/JPEG) et la taille (<2MB)
3. **PDF vide** : Assurez-vous que les données sont bien formatées

## 📱 Compatibilité

- ✅ React 16.8+
- ✅ jsPDF et jsPDF-AutoTable
- ✅ Navigateurs modernes
- ✅ Responsive design pour le sélecteur

## 🤝 Contribution

Pour contribuer:
1. Créez un nouveau modèle en héritant de `PaySlipTemplateBase`
2. Ajoutez-le au sélecteur dans `PaySlipTemplateSelector`
3. Mettez à jour l'index et cette documentation
4. Testez avec différents jeux de données

## 📄 Licence

Ces composants sont part du système PHRM et suivent les mêmes termes de licence.

---

💡 **Conseil** : Commencez par le `PaySlipTemplateSelector` pour une expérience utilisateur optimale, puis utilisez les modèles individuels pour des besoins spécifiques.