# Analyse des Modèles de Fiches de Paie et de Contrat

## Vue d'ensemble

Le projet PRHM dispose d'un système complet de modèles pour la génération de fiches de paie et de contrats de travail, avec plusieurs niveaux de personnalisation et de styles.

## Architecture des Modèles

### 1. Modèles de Fiches de Paie

#### Configuration principale (`src/utils/paySlipTemplates.js`)

Le système utilise 5 modèles prédéfinis :

1. **Template 1 - Modèle Standard Camerounais**
   - Layout : `classic`
   - Sections : header, employee, salary, deductions, summary, signature
   - Conforme aux normes camerounaises
   - Inclut logo entreprise et calculs CNPS complets

2. **Template 2 - Modèle Simplifié Moderne**
   - Layout : `modern`
   - Sections : header, employee, salary, summary, qr
   - Design épuré avec QR code de vérification
   - Couleurs professionnelles bleues

3. **Template 3 - Modèle Détaillé Complet**
   - Layout : `detailed`
   - Sections : header, employee, salary, deductions, history, notes, signature
   - Toutes les informations légales
   - Historique des primes et indemnités

4. **Template 4 - Modèle Entreprise Premium**
   - Layout : `premium`
   - Sections : header, employee, salary, deductions, summary, security, signature
   - Design professionnel avec branding complet
   - Filigrane de sécurité et signature digitale

5. **Template 5 - Modèle CNPS Officiel**
   - Layout : `official`
   - Sections : header, employee, salary, cnps, deductions, validation, signature
   - Format conforme aux exigences CNPS
   - Validation automatique et traçabilité

#### Composants de rendu

- **`src/components/PaySlipTemplates.jsx`** : Interface de sélection des modèles
- **`src/compoments/PaySlipTemplate.jsx`** : Composant de rendu avec 3 styles (default, modern, minimal)
- **`src/compoments/ExportPaySlip.jsx`** : Export PDF avec application des styles selon le modèle
- **`src/pages/PaySlipGenerator.jsx`** : Générateur principal avec logique métier

### 2. Modèles de Contrats

#### Types de contrats disponibles

1. **Contrat CDI Standard** (`contract1`)
   - Clauses légales complètes
   - Conditions de travail détaillées
   - Clause de confidentialité

2. **Contrat CDD Standard** (`contract2`)
   - Durée déterminée avec motif
   - Conditions de renouvellement
   - Indemnité de fin de contrat

3. **Contrat Stage** (`contract3`)
   - Convention de stage
   - Encadrement pédagogique
   - Gratification et évaluation

4. **Contrat Prestation** (`contract4`)
   - Prestations définies
   - Tarification et délais
   - Conditions de paiement

5. **Contrat Manager** (`contract5`)
   - Fonctions managériales
   - Objectifs et KPIs
   - Rémunération variable

6. **Contrat Expatrié** (`contract6`)
   - Conditions d'expatriation
   - Logement et transport
   - Assurance internationale

#### Composants de rendu

- **`src/components/ContractTemplates.jsx`** : Interface de sélection
- **`src/compoments/ContractTemplate.jsx`** : Rendu avec 4 styles (default, modern, minimal, legal)
- **`src/compoments/TemplateSelector.jsx`** : Sélecteur universel pour fiches de paie et contrats

## Calculs et Conformité

### Calculs CNPS (Caisse Nationale de Prévoyance Sociale)

```javascript
const CNPS_CALCULATIONS = {
  employeeRate: 0.0625, // 6.25%
  employerRate: 0.125,  // 12.5%
  cacRate: 0.01,        // 1% (Contribution Additionnelle Camerounaise)
  cfcRate: 0.01,        // 1% (Contribution Forfaitaire Camerounaise)
  ravRate: 0.025,       // 2.5% (Retraite Additionnelle Volontaire)
  tdlRate: 0.01,        // 1% (Taxe de Développement Local)
}
```

### Catégories CNPS

12 catégories salariales de 0 à 999,999,999 FCFA avec échelons A à G.

### Calculs des heures supplémentaires

- **Heures normales** : Taux horaire × 1.2 (jusqu'à 8h)
- **Heures supplémentaires** : Taux horaire × 1.3 (8-16h)
- **Heures exceptionnelles** : Taux horaire × 1.4 (>16h)
- **Dimanche** : Taux horaire × 1.4
- **Nuit** : Taux horaire × 1.5

## Styles et Thèmes

### Fiches de Paie

1. **Classic** : Design standard professionnel
2. **Modern** : Dégradés bleus, design contemporain
3. **Premium** : Couleurs dorées, aspect haut de gamme
4. **Official** : Noir et blanc, style administratif
5. **Detailed** : Vert, mise en page détaillée

### Contrats

1. **Default** : Standard professionnel
2. **Modern** : Dégradés verts et bleus
3. **Minimal** : Épuré et simple
4. **Legal** : Format officiel avec bordures renforcées

## Fonctionnalités Avancées

### Gestion des logos
- Stockage dans localStorage
- Support PNG/JPEG
- Limite de 2 Mo par fichier
- Gestion automatique de la taille

### Export PDF
- Génération avec jsPDF
- Application automatique des styles selon le modèle
- Signatures et cachets
- Numérotation des pages

### Primes et Indemnités
- Système flexible de primes personnalisées
- Calcul automatique des totaux
- Intégration dans les calculs de charges

### Validation et Conformité
- Vérification des champs obligatoires
- Respect du SMIG camerounais (36,270 FCFA)
- Calculs fiscaux conformes (IRPP, CAC, CFC)
- Format CNPS officiel

## Problèmes Résolus

### Erreur de Parsing (Résolu)
- **Problème** : Caractère invisible (BOM) au début de `paySlipTemplates.js`
- **Solution** : Réécriture complète du fichier avec encodage UTF-8 propre
- **Impact** : Correction des erreurs d'import dans `PaySlipGenerator.jsx` et `ExportPaySlip.jsx`

## Recommandations d'Amélioration

1. **Unification des dossiers** : Harmoniser `src/components/` et `src/compoments/`
2. **Tests unitaires** : Ajouter des tests pour les calculs CNPS et fiscaux
3. **Validation renforcée** : Contrôles supplémentaires pour la conformité légale
4. **Internationalisation** : Support multilingue (français/anglais)
5. **Thèmes personnalisés** : Permettre la création de thèmes d'entreprise

## Utilisation

### Génération d'une fiche de paie
```javascript
import { generatePaySlipData } from './utils/paySlipTemplates';

const payslipData = generatePaySlipData(
  employee,      // Données employé
  companyData,   // Données entreprise
  'template1',   // ID du modèle
  '2025-01'      // Période de paie
);
```

### Sélection d'un modèle
```jsx
<PaySlipTemplates
  selectedTemplate={selectedTemplate}
  onSelectTemplate={setSelectedTemplate}
  onPreview={handlePreview}
  onDownload={handleDownload}
/>
```

Cette architecture modulaire permet une grande flexibilité dans la génération de documents RH tout en maintenant la conformité avec la législation camerounaise.