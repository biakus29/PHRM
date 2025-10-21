// Service de notifications par email pour PHRM
import emailjs from '@emailjs/browser';
import { 
  EMAIL_CONFIG, 
  EMAIL_TYPES, 
  EMAIL_PRIORITIES, 
  EMAIL_TYPE_PRIORITIES,
  EMAIL_SEND_DELAYS 
} from '../config/emailConfig';
import { generateEmailFromTemplate } from '../templates/emailTemplates';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

class NotificationService {
  constructor() {
    this.emailQueue = [];
    this.isProcessing = false;
    this.retryQueue = [];
    this.dailyCount = 0;
    this.hourlyCount = 0;
    
    // Initialiser EmailJS
    this.initializeEmailJS();
    
    // Démarrer le processeur de queue
    this.startQueueProcessor();
    
    // Réinitialiser les compteurs
    this.resetCounters();
  }

  // Initialiser EmailJS
  initializeEmailJS() {
    try {
      emailjs.init(EMAIL_CONFIG.emailjs.publicKey);
      console.log('EmailJS initialisé avec succès');
    } catch (error) {
      console.error('Erreur d\'initialisation EmailJS:', error);
    }
  }

  // Envoyer une notification
  async sendNotification(type, recipients, data, options = {}) {
    try {
      // Valider les paramètres
      if (!type || !EMAIL_TYPES[type]) {
        throw new Error(`Type de notification invalide: ${type}`);
      }

      if (!recipients || recipients.length === 0) {
        throw new Error('Aucun destinataire spécifié');
      }

      // Normaliser les destinataires
      const normalizedRecipients = this.normalizeRecipients(recipients);

      // Vérifier les préférences utilisateur
      const filteredRecipients = await this.filterByPreferences(normalizedRecipients, type);

      if (filteredRecipients.length === 0) {
        console.log('Aucun destinataire après filtrage des préférences');
        return { success: true, sent: 0, message: 'Aucun destinataire autorisé' };
      }

      // Générer le contenu de l'email
      const emailContent = generateEmailFromTemplate(type, {
        ...data,
        unsubscribeUrl: `${window.location.origin}/unsubscribe?token={{unsubscribeToken}}`,
        preferencesUrl: `${window.location.origin}/notification-preferences?token={{preferencesToken}}`
      });

      // Déterminer la priorité
      const priority = options.priority || EMAIL_TYPE_PRIORITIES[type] || EMAIL_PRIORITIES.MEDIUM;

      // Créer les tâches d'envoi
      const emailTasks = filteredRecipients.map(recipient => ({
        id: this.generateTaskId(),
        type,
        recipient,
        emailContent,
        priority,
        data,
        options,
        attempts: 0,
        createdAt: new Date(),
        scheduledAt: this.calculateSendTime(priority, options.delay)
      }));

      // Ajouter à la queue
      this.addToQueue(emailTasks);

      // Enregistrer dans la base de données
      await this.logNotifications(emailTasks);

      return {
        success: true,
        sent: emailTasks.length,
        message: `${emailTasks.length} notification(s) ajoutée(s) à la queue`
      };

    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
      throw error;
    }
  }

  // Normaliser les destinataires
  normalizeRecipients(recipients) {
    return recipients.map(recipient => {
      if (typeof recipient === 'string') {
        return { email: recipient, name: recipient.split('@')[0] };
      }
      return {
        email: recipient.email,
        name: recipient.name || recipient.email.split('@')[0],
        id: recipient.id,
        preferences: recipient.preferences
      };
    });
  }

  // Filtrer par préférences utilisateur
  async filterByPreferences(recipients, type) {
    const filtered = [];
    
    for (const recipient of recipients) {
      try {
        // Si pas d'ID utilisateur, envoyer par défaut
        if (!recipient.id) {
          filtered.push(recipient);
          continue;
        }

        // Vérifier les préférences en base
        const prefsQuery = query(
          collection(db, 'notification_preferences'),
          where('userId', '==', recipient.id)
        );
        
        const prefsSnapshot = await getDocs(prefsQuery);
        
        if (prefsSnapshot.empty) {
          // Pas de préférences = accepter par défaut
          filtered.push(recipient);
          continue;
        }

        const prefs = prefsSnapshot.docs[0].data();
        
        // Vérifier si ce type de notification est autorisé
        if (prefs.emailNotifications && prefs.enabledTypes?.includes(type)) {
          filtered.push(recipient);
        }
        
      } catch (error) {
        console.error('Erreur lors de la vérification des préférences:', error);
        // En cas d'erreur, inclure le destinataire
        filtered.push(recipient);
      }
    }
    
    return filtered;
  }

  // Calculer le moment d'envoi selon la priorité
  calculateSendTime(priority, customDelay = 0) {
    const delay = customDelay || EMAIL_SEND_DELAYS[priority] || 0;
    return new Date(Date.now() + delay * 60 * 1000); // Convertir minutes en ms
  }

  // Ajouter à la queue
  addToQueue(tasks) {
    this.emailQueue.push(...tasks);
    this.emailQueue.sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  // Processeur de queue
  startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.emailQueue.length > 0) {
        this.processQueue();
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }

  // Traiter la queue
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const now = new Date();
      const tasksToProcess = this.emailQueue.filter(task => task.scheduledAt <= now);
      
      if (tasksToProcess.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Vérifier les limites
      if (this.dailyCount >= EMAIL_CONFIG.limits.dailyLimit) {
        console.log('Limite quotidienne atteinte');
        this.isProcessing = false;
        return;
      }

      if (this.hourlyCount >= EMAIL_CONFIG.limits.hourlyLimit) {
        console.log('Limite horaire atteinte');
        this.isProcessing = false;
        return;
      }

      // Traiter les tâches par batch
      const batchSize = Math.min(10, EMAIL_CONFIG.limits.hourlyLimit - this.hourlyCount);
      const batch = tasksToProcess.slice(0, batchSize);

      for (const task of batch) {
        try {
          await this.sendEmail(task);
          this.removeFromQueue(task.id);
          this.dailyCount++;
          this.hourlyCount++;
          
          // Délai entre les envois pour éviter le spam
          await this.delay(1000);
          
        } catch (error) {
          console.error('Erreur lors de l\'envoi:', error);
          await this.handleFailedTask(task, error);
        }
      }
      
    } catch (error) {
      console.error('Erreur dans le processeur de queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Envoyer un email via EmailJS
  async sendEmail(task) {
    const { recipient, emailContent, type, data } = task;
    
    const templateParams = {
      to_email: recipient.email,
      to_name: recipient.name,
      subject: emailContent.subject,
      html_content: emailContent.html,
      text_content: emailContent.text,
      from_name: EMAIL_CONFIG.defaults.from.name,
      reply_to: EMAIL_CONFIG.defaults.replyTo,
      notification_type: type,
      ...data
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.emailjs.serviceId,
      EMAIL_CONFIG.emailjs.templateId,
      templateParams
    );

    // Mettre à jour le statut en base
    await this.updateNotificationStatus(task.id, 'sent', {
      sentAt: new Date(),
      emailjsResponse: response
    });

    console.log(`Email envoyé avec succès à ${recipient.email}`);
    return response;
  }

  // Gérer les tâches échouées
  async handleFailedTask(task, error) {
    task.attempts++;
    task.lastError = error.message;
    task.lastAttempt = new Date();

    if (task.attempts < EMAIL_CONFIG.limits.retryAttempts) {
      // Reprogrammer pour plus tard
      task.scheduledAt = new Date(Date.now() + EMAIL_CONFIG.limits.retryDelay * task.attempts);
      console.log(`Reprogrammation de la tâche ${task.id} (tentative ${task.attempts})`);
    } else {
      // Marquer comme échoué définitivement
      this.removeFromQueue(task.id);
      await this.updateNotificationStatus(task.id, 'failed', {
        failedAt: new Date(),
        finalError: error.message,
        totalAttempts: task.attempts
      });
      console.error(`Tâche ${task.id} échouée définitivement après ${task.attempts} tentatives`);
    }
  }

  // Supprimer de la queue
  removeFromQueue(taskId) {
    this.emailQueue = this.emailQueue.filter(task => task.id !== taskId);
  }

  // Enregistrer les notifications en base
  async logNotifications(tasks) {
    const batch = tasks.map(task => ({
      id: task.id,
      type: task.type,
      recipient: task.recipient.email,
      recipientName: task.recipient.name,
      subject: task.emailContent.subject,
      priority: task.priority,
      status: 'queued',
      createdAt: Timestamp.fromDate(task.createdAt),
      scheduledAt: Timestamp.fromDate(task.scheduledAt),
      attempts: 0,
      data: task.data
    }));

    for (const notification of batch) {
      try {
        await addDoc(collection(db, 'email_notifications'), notification);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
      }
    }
  }

  // Mettre à jour le statut d'une notification
  async updateNotificationStatus(taskId, status, additionalData = {}) {
    try {
      const notifQuery = query(
        collection(db, 'email_notifications'),
        where('id', '==', taskId)
      );
      
      const snapshot = await getDocs(notifQuery);
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'email_notifications', snapshot.docs[0].id);
        await updateDoc(docRef, {
          status,
          updatedAt: Timestamp.now(),
          ...additionalData
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  }

  // Générer un ID unique pour les tâches
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Délai utilitaire
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Réinitialiser les compteurs
  resetCounters() {
    // Réinitialiser le compteur horaire chaque heure
    setInterval(() => {
      this.hourlyCount = 0;
    }, 60 * 60 * 1000);

    // Réinitialiser le compteur quotidien chaque jour à minuit
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.dailyCount = 0;
      // Puis réinitialiser chaque jour
      setInterval(() => {
        this.dailyCount = 0;
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  // Obtenir les statistiques
  async getStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const statsQuery = query(
        collection(db, 'email_notifications'),
        where('createdAt', '>=', Timestamp.fromDate(today)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(statsQuery);
      const notifications = snapshot.docs.map(doc => doc.data());
      
      return {
        total: notifications.length,
        sent: notifications.filter(n => n.status === 'sent').length,
        failed: notifications.filter(n => n.status === 'failed').length,
        queued: notifications.filter(n => n.status === 'queued').length,
        dailyCount: this.dailyCount,
        hourlyCount: this.hourlyCount,
        queueSize: this.emailQueue.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return null;
    }
  }

  // Méthodes de convenance pour les types de notifications courants
  async notifyEmployeeAdded(employee, addedBy, recipients) {
    return this.sendNotification(EMAIL_TYPES.EMPLOYEE_ADDED, recipients, {
      employeeName: employee.name,
      employeePosition: employee.poste,
      employeeEmail: employee.email,
      employeeDepartment: employee.department,
      hireDate: new Date(employee.hireDate).toLocaleDateString('fr-FR'),
      addedBy: addedBy.name,
      addedDate: new Date().toLocaleDateString('fr-FR'),
      employeeUrl: `${window.location.origin}/employees/${employee.id}`
    });
  }

  async notifyLeaveRequest(request, employee, approvers) {
    return this.sendNotification(EMAIL_TYPES.LEAVE_REQUEST_SUBMITTED, approvers, {
      employeeName: employee.name,
      startDate: new Date(request.startDate).toLocaleDateString('fr-FR'),
      endDate: new Date(request.endDate).toLocaleDateString('fr-FR'),
      duration: request.duration,
      reason: request.reason,
      comment: request.comment || 'Aucun commentaire',
      approveUrl: `${window.location.origin}/leaves/approve/${request.id}`,
      rejectUrl: `${window.location.origin}/leaves/reject/${request.id}`
    });
  }

  async notifyPayslipGenerated(payslip, employee) {
    return this.sendNotification(EMAIL_TYPES.PAYSLIP_GENERATED, [employee], {
      employeeName: employee.name,
      month: payslip.month,
      year: payslip.year,
      grossSalary: payslip.grossSalary.toLocaleString(),
      deductions: payslip.deductions.toLocaleString(),
      netSalary: payslip.netSalary.toLocaleString(),
      paymentDate: new Date(payslip.paymentDate).toLocaleDateString('fr-FR'),
      payslipUrl: `${window.location.origin}/payslips/${payslip.id}`
    });
  }

  async notifyTrialExpiring(user, timeRemaining) {
    return this.sendNotification(EMAIL_TYPES.TRIAL_EXPIRING, [user], {
      timeRemaining,
      employeeCount: user.stats?.employeeCount || 0,
      documentsCount: user.stats?.documentsCount || 0,
      actionsCount: user.stats?.actionsCount || 0,
      subscriptionUrl: `${window.location.origin}/subscription`
    });
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService;
export { NotificationService };
