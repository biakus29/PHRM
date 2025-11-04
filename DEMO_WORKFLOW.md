# Workflow du Mode Démo PRHM

## Vue d'ensemble

Le nouveau workflow du mode démo permet aux utilisateurs de tester les fonctionnalités principales de PRHM de manière guidée, avec des limitations stratégiques qui encouragent l'upgrade vers la version complète.

## Fonctionnement du Workflow

### Étape 1: Création d'un employé
- L'utilisateur peut créer **un seul employé** dans le mode démo
- Une fois l'employé créé, cette action est trackée dans le contexte démo
- L'utilisateur ne peut plus créer d'autres employés

### Étape 2: Génération d'une fiche de paie
- Après avoir créé un employé, l'utilisateur peut générer **une seule fiche de paie**
- Cette action est également trackée
- L'utilisateur ne peut plus générer d'autres fiches de paie

### Étape 3: Exploration des documents RH
- Une fois les deux premières étapes complétées, l'utilisateur peut essayer de créer des documents RH
- **Toute tentative de création de document déclenche la modal de limitation**

### Étape 4: Proposition d'upgrade
- La modal de limitation explique les bénéfices de la version complète
- Un bouton "Passer en Pro" redirige vers le formulaire d'upgrade
- Le formulaire collecte les informations nécessaires pour le suivi commercial

## Architecture Technique

### Composants créés

#### 1. `DemoLimitModal.jsx`
- Modal qui s'affiche quand l'utilisateur atteint une limitation
- Messages personnalisés selon le type d'action bloquée
- Présentation des fonctionnalités de la version complète
- Bouton d'upgrade vers le formulaire

#### 2. `UpgradeForm.jsx`
- Formulaire complet de demande d'upgrade
- Sélection de forfait (Starter, Professional, Enterprise)
- Collecte d'informations entreprise et contact
- Validation et soumission des données

#### 3. `upgradeService.js`
- Service pour traiter les demandes d'upgrade
- Sauvegarde dans Firestore
- Notifications email (à configurer)
- Intégration CRM (à configurer)

### Modifications du contexte

#### `DemoContext.js` - Nouvelles fonctionnalités
```javascript
// État de suivi des actions
const [demoActions, setDemoActions] = useState({
  employeeCreated: false,
  payslipGenerated: false,
  documentsCreated: 0
});

// Fonctions utilitaires
- trackDemoAction(actionType) // Enregistre une action
- canPerformAction(actionType) // Vérifie si l'action est autorisée
- getDemoProgress() // Retourne le progrès de la démo
```

### Modifications du DocumentsManager

#### Intégration des limitations
- Vérification avant chaque création de document
- Affichage du progrès démo dans l'en-tête
- Indicateur visuel "DÉMO" 
- Interception des clics sur tous les boutons "Nouveau"

## Configuration

### Base de données Firestore

#### Collection `upgrade_requests`
```javascript
{
  companyName: string,
  contactName: string,
  email: string,
  phone: string,
  employeeCount: string,
  selectedPlan: string, // 'starter', 'professional', 'enterprise'
  currentSoftware: string,
  specificNeeds: string,
  preferredStartDate: date,
  status: string, // 'pending', 'contacted', 'converted', 'rejected'
  submittedAt: timestamp,
  source: 'demo_upgrade',
  priority: string, // 'high', 'medium', 'low'
  notes: string,
  followUpDate: date,
  convertedAt: date
}
```

### Intégrations à configurer

#### Service Email
```javascript
// Dans upgradeService.js
async sendNotificationEmail(upgradeData) {
  // Intégrer avec SendGrid, Mailgun, etc.
  // Exemple avec Cloud Functions
  await fetch('/api/send-upgrade-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(upgradeData)
  });
}
```

#### CRM Integration
```javascript
// Dans upgradeService.js
async createCRMLead(upgradeData) {
  // Intégrer avec HubSpot, Salesforce, etc.
  await fetch('/api/crm/create-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData)
  });
}
```

## Utilisation

### Pour les développeurs

1. **Importer le contexte démo**
```javascript
import { useDemo } from '../contexts/DemoContext';

const { isDemoAccount, canPerformAction, trackDemoAction } = useDemo();
```

2. **Vérifier les limitations avant une action**
```javascript
const handleCreateDocument = () => {
  if (!canPerformAction('document')) {
    setShowDemoLimit(true);
    return;
  }
  // Procéder avec la création
};
```

3. **Tracker une action réussie**
```javascript
const handleSuccessfulAction = () => {
  if (isDemoAccount) {
    trackDemoAction('document');
  }
};
```

### Pour les utilisateurs démo

1. **Indicateur visuel**: Badge "DÉMO" dans l'interface
2. **Progrès guidé**: Barre de progression avec étapes
3. **Limitations claires**: Messages explicatifs lors des blocages
4. **Upgrade facile**: Formulaire intégré avec sélection de forfait

## Forfaits disponibles

### Starter - 15 000 FCFA/mois
- 1-10 employés
- Fonctionnalités de base
- Support email

### Professional - 25 000 FCFA/mois (Populaire)
- 11-50 employés
- Fonctionnalités avancées
- Support prioritaire

### Enterprise - Sur devis
- 50+ employés
- Fonctionnalités complètes
- Support 24/7

## Métriques de suivi

### Données collectées
- Taux de conversion démo → upgrade
- Étapes d'abandon dans le funnel
- Forfaits les plus demandés
- Temps moyen avant upgrade

### Tableaux de bord recommandés
- Dashboard admin pour suivre les demandes d'upgrade
- Analytics du parcours démo
- Suivi des leads générés

## Maintenance

### Points d'attention
1. **Expiration des comptes démo**: Géré automatiquement par DemoContext
2. **Nettoyage des données**: Prévoir un script de nettoyage des anciennes demandes
3. **Suivi commercial**: Assurer le suivi des leads générés
4. **Mise à jour des forfaits**: Modifier les prix dans UpgradeForm.jsx

### Tests recommandés
1. Test complet du parcours démo
2. Validation du formulaire d'upgrade
3. Vérification de la sauvegarde des demandes
4. Test des notifications email

## Support

Pour toute question sur l'implémentation ou la configuration du workflow démo, consulter la documentation technique ou contacter l'équipe de développement.
