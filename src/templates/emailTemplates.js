// Templates d'emails pour les notifications PHRM
import { EMAIL_TYPES } from '../config/emailConfig';

// Template de base HTML
const BASE_TEMPLATE = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            overflow: hidden; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1); 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 300; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .content h2 { 
            color: #667eea; 
            margin-top: 0; 
            font-size: 20px; 
        }
        .highlight { 
            background: #f8f9ff; 
            border-left: 4px solid #667eea; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 0 5px 5px 0; 
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 20px 0; 
            font-weight: 500; 
            transition: transform 0.2s; 
        }
        .button:hover { 
            transform: translateY(-2px); 
        }
        .footer { 
            background: #f8f9fa; 
            padding: 20px 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #eee; 
        }
        .footer a { 
            color: #667eea; 
            text-decoration: none; 
        }
        .status-badge { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
            text-transform: uppercase; 
        }
        .status-success { 
            background: #d4edda; 
            color: #155724; 
        }
        .status-warning { 
            background: #fff3cd; 
            color: #856404; 
        }
        .status-danger { 
            background: #f8d7da; 
            color: #721c24; 
        }
        .status-info { 
            background: #d1ecf1; 
            color: #0c5460; 
        }
        @media (max-width: 600px) {
            .container { 
                margin: 10px; 
                border-radius: 5px; 
            }
            .header, .content { 
                padding: 20px; 
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 PHRM - Gestion RH</h1>
            <p>{{headerSubtitle}}</p>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>
                <strong>PHRM - Plateforme de Gestion des Ressources Humaines</strong><br>
                Yaoundé, Cameroun | 📞 +237 123 456 789<br>
                <a href="https://phrm.com">www.phrm.com</a> | 
                <a href="mailto:support@phrm.com">support@phrm.com</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">
                Vous recevez cet email car vous êtes inscrit sur PHRM. 
                <a href="{{unsubscribeUrl}}">Se désabonner</a> | 
                <a href="{{preferencesUrl}}">Gérer les préférences</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

// Templates spécifiques par type de notification
export const EMAIL_TEMPLATES = {
  // === EMPLOYÉS ===
  [EMAIL_TYPES.EMPLOYEE_ADDED]: {
    subject: '👥 Nouvel employé ajouté - {{employeeName}}',
    headerSubtitle: 'Notification d\'ajout d\'employé',
    content: `
      <h2>👋 Nouvel employé ajouté</h2>
      <p>Un nouvel employé a été ajouté à votre système PHRM :</p>
      
      <div class="highlight">
        <strong>👤 Nom :</strong> {{employeeName}}<br>
        <strong>💼 Poste :</strong> {{employeePosition}}<br>
        <strong>📧 Email :</strong> {{employeeEmail}}<br>
        <strong>🏢 Département :</strong> {{employeeDepartment}}<br>
        <strong>📅 Date d'embauche :</strong> {{hireDate}}
      </div>
      
      <p>L'employé a été ajouté par <strong>{{addedBy}}</strong> le {{addedDate}}.</p>
      
      <a href="{{employeeUrl}}" class="button">Voir le profil de l'employé</a>
      
      <p><small>💡 <strong>Conseil :</strong> N'oubliez pas de configurer les accès et permissions pour ce nouvel employé.</small></p>
    `
  },

  [EMAIL_TYPES.EMPLOYEE_UPDATED]: {
    subject: '✏️ Profil employé modifié - {{employeeName}}',
    headerSubtitle: 'Notification de modification',
    content: `
      <h2>✏️ Profil employé modifié</h2>
      <p>Le profil de <strong>{{employeeName}}</strong> a été mis à jour :</p>
      
      <div class="highlight">
        <strong>Modifications apportées :</strong><br>
        {{changesDetails}}
      </div>
      
      <p>Modification effectuée par <strong>{{modifiedBy}}</strong> le {{modifiedDate}}.</p>
      
      <a href="{{employeeUrl}}" class="button">Voir le profil mis à jour</a>
    `
  },

  // === CONGÉS ===
  [EMAIL_TYPES.LEAVE_REQUEST_SUBMITTED]: {
    subject: '🏖️ Nouvelle demande de congé - {{employeeName}}',
    headerSubtitle: 'Demande en attente d\'approbation',
    content: `
      <h2>🏖️ Nouvelle demande de congé</h2>
      <p><strong>{{employeeName}}</strong> a soumis une demande de congé :</p>
      
      <div class="highlight">
        <strong>📅 Période :</strong> Du {{startDate}} au {{endDate}}<br>
        <strong>⏱️ Durée :</strong> {{duration}} jour(s)<br>
        <strong>📝 Motif :</strong> {{reason}}<br>
        <strong>💬 Commentaire :</strong> {{comment}}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{approveUrl}}" class="button" style="background: #28a745; margin-right: 10px;">✅ Approuver</a>
        <a href="{{rejectUrl}}" class="button" style="background: #dc3545;">❌ Rejeter</a>
      </div>
      
      <p><small>⚠️ Cette demande nécessite votre approbation dans les plus brefs délais.</small></p>
    `
  },

  [EMAIL_TYPES.LEAVE_REQUEST_APPROVED]: {
    subject: '✅ Congé approuvé - {{employeeName}}',
    headerSubtitle: 'Bonne nouvelle !',
    content: `
      <h2>✅ Votre demande de congé a été approuvée</h2>
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <p>Nous avons le plaisir de vous informer que votre demande de congé a été <span class="status-badge status-success">Approuvée</span>.</p>
      
      <div class="highlight">
        <strong>📅 Période approuvée :</strong> Du {{startDate}} au {{endDate}}<br>
        <strong>⏱️ Durée :</strong> {{duration}} jour(s)<br>
        <strong>👤 Approuvé par :</strong> {{approvedBy}}<br>
        <strong>📝 Commentaire :</strong> {{approverComment}}
      </div>
      
      <p>Profitez bien de votre congé ! 🌴</p>
      
      <a href="{{leaveUrl}}" class="button">Voir les détails</a>
    `
  },

  // === PAIE ===
  [EMAIL_TYPES.PAYSLIP_GENERATED]: {
    subject: '💰 Fiche de paie disponible - {{month}} {{year}}',
    headerSubtitle: 'Votre fiche de paie est prête',
    content: `
      <h2>💰 Votre fiche de paie est disponible</h2>
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <p>Votre fiche de paie pour <strong>{{month}} {{year}}</strong> est maintenant disponible.</p>
      
      <div class="highlight">
        <strong>💵 Salaire brut :</strong> {{grossSalary}} FCFA<br>
        <strong>💸 Déductions :</strong> {{deductions}} FCFA<br>
        <strong>💳 Salaire net :</strong> {{netSalary}} FCFA<br>
        <strong>📅 Date de paiement :</strong> {{paymentDate}}
      </div>
      
      <a href="{{payslipUrl}}" class="button">📄 Télécharger la fiche de paie</a>
      
      <p><small>🔒 Ce document est confidentiel et personnel.</small></p>
    `
  },

  // === CONTRATS ===
  [EMAIL_TYPES.CONTRACT_EXPIRING]: {
    subject: '⚠️ Contrat arrivant à expiration - {{employeeName}}',
    headerSubtitle: 'Action requise',
    content: `
      <h2>⚠️ Contrat arrivant à expiration</h2>
      <p>Le contrat de <strong>{{employeeName}}</strong> arrive à expiration :</p>
      
      <div class="highlight">
        <strong>👤 Employé :</strong> {{employeeName}}<br>
        <strong>💼 Poste :</strong> {{position}}<br>
        <strong>📅 Date d'expiration :</strong> {{expirationDate}}<br>
        <strong>⏰ Jours restants :</strong> <span class="status-badge status-warning">{{daysRemaining}} jour(s)</span>
      </div>
      
      <p>Actions recommandées :</p>
      <ul>
        <li>📝 Préparer le renouvellement du contrat</li>
        <li>💬 Discuter avec l'employé de ses intentions</li>
        <li>📋 Mettre à jour les conditions si nécessaire</li>
      </ul>
      
      <a href="{{contractUrl}}" class="button">Gérer le contrat</a>
    `
  },

  // === SYSTÈME ===
  [EMAIL_TYPES.TRIAL_EXPIRING]: {
    subject: '⏰ Votre essai PHRM expire bientôt',
    headerSubtitle: 'Continuez avec un abonnement',
    content: `
      <h2>⏰ Votre période d'essai se termine bientôt</h2>
      <p>Bonjour,</p>
      
      <p>Votre période d'essai gratuite de 24h sur PHRM se termine dans <span class="status-badge status-warning">{{timeRemaining}}</span>.</p>
      
      <div class="highlight">
        <strong>📊 Votre utilisation :</strong><br>
        • {{employeeCount}} employé(s) ajouté(s)<br>
        • {{documentsCount}} document(s) généré(s)<br>
        • {{actionsCount}} action(s) effectuée(s)
      </div>
      
      <p>Pour continuer à utiliser PHRM sans interruption, choisissez un plan d'abonnement :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{subscriptionUrl}}" class="button">🚀 Choisir un abonnement</a>
      </div>
      
      <p><strong>Pourquoi choisir PHRM ?</strong></p>
      <ul>
        <li>🔒 Sécurité de niveau bancaire</li>
        <li>📱 Interface moderne et intuitive</li>
        <li>🎯 Support client dédié</li>
        <li>📈 Économisez 40% de temps sur la gestion RH</li>
      </ul>
    `
  },

  [EMAIL_TYPES.SUBSCRIPTION_ACTIVATED]: {
    subject: '🎉 Bienvenue dans PHRM Premium !',
    headerSubtitle: 'Votre abonnement est actif',
    content: `
      <h2>🎉 Félicitations ! Votre abonnement est actif</h2>
      <p>Merci d'avoir choisi PHRM pour votre gestion RH !</p>
      
      <div class="highlight">
        <strong>📋 Plan souscrit :</strong> {{planName}}<br>
        <strong>💰 Montant :</strong> {{amount}} FCFA/mois<br>
        <strong>👥 Employés inclus :</strong> {{maxEmployees}}<br>
        <strong>📅 Prochaine facturation :</strong> {{nextBilling}}
      </div>
      
      <p><strong>🚀 Fonctionnalités débloquées :</strong></p>
      <ul>
        {{featuresList}}
      </ul>
      
      <a href="{{dashboardUrl}}" class="button">Accéder au tableau de bord</a>
      
      <p>Notre équipe support est disponible 24/7 pour vous accompagner : <a href="mailto:support@phrm.com">support@phrm.com</a></p>
    `
  },

  // === SÉCURITÉ ===
  [EMAIL_TYPES.SECURITY_ALERT]: {
    subject: '🚨 Alerte de sécurité - Action requise',
    headerSubtitle: 'Activité suspecte détectée',
    content: `
      <h2>🚨 Alerte de sécurité</h2>
      <p>Une activité inhabituelle a été détectée sur votre compte PHRM :</p>
      
      <div class="highlight" style="border-left-color: #dc3545; background: #f8d7da;">
        <strong>🕐 Date/Heure :</strong> {{alertDateTime}}<br>
        <strong>🌐 Adresse IP :</strong> {{ipAddress}}<br>
        <strong>📍 Localisation :</strong> {{location}}<br>
        <strong>🔍 Type d'activité :</strong> {{activityType}}
      </div>
      
      <p><strong>Actions recommandées :</strong></p>
      <ul>
        <li>🔐 Changez votre mot de passe immédiatement</li>
        <li>✅ Vérifiez vos paramètres de sécurité</li>
        <li>📱 Activez l'authentification à deux facteurs</li>
        <li>📞 Contactez notre support si ce n'était pas vous</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{securityUrl}}" class="button" style="background: #dc3545;">🔒 Sécuriser mon compte</a>
      </div>
      
      <p><small>⚠️ Si vous n'êtes pas à l'origine de cette activité, contactez immédiatement notre support.</small></p>
    `
  }
};

// Fonction pour générer un email à partir d'un template
export const generateEmailFromTemplate = (type, data) => {
  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    throw new Error(`Template non trouvé pour le type: ${type}`);
  }

  let content = BASE_TEMPLATE;
  let emailContent = template.content;

  // Remplacer les variables dans le contenu
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, data[key] || '');
    emailContent = emailContent.replace(regex, data[key] || '');
  });

  // Remplacer les variables du template
  content = content.replace('{{subject}}', template.subject);
  content = content.replace('{{headerSubtitle}}', template.headerSubtitle);
  content = content.replace('{{content}}', emailContent);

  return {
    subject: template.subject,
    html: content,
    text: stripHtml(emailContent) // Version texte pour les clients qui ne supportent pas HTML
  };
};

// Fonction utilitaire pour convertir HTML en texte
const stripHtml = (html) => {
  return html
    .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
    .replace(/&nbsp;/g, ' ') // Remplacer les espaces insécables
    .replace(/&amp;/g, '&') // Remplacer les entités HTML
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim();
};

export default EMAIL_TEMPLATES;
