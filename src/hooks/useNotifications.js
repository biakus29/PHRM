// Hook React pour utiliser le service de notifications
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { EMAIL_TYPES } from '../config/emailConfig';
import { auth } from '../firebase';
import { toast } from 'react-toastify';

export const useNotifications = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const notificationStats = await notificationService.getStats();
      setStats(notificationStats);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les stats au montage du composant
  useEffect(() => {
    loadStats();
    
    // Recharger les stats toutes les 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadStats]);

  // Envoyer une notification générique
  const sendNotification = useCallback(async (type, recipients, data, options = {}) => {
    try {
      const result = await notificationService.sendNotification(type, recipients, data, options);
      
      if (result.success) {
        toast.success(`📧 ${result.sent} notification(s) envoyée(s)`);
      }
      
      // Recharger les stats après envoi
      setTimeout(loadStats, 1000);
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
      throw error;
    }
  }, [loadStats]);

  // Méthodes spécialisées pour chaque type de notification
  const notifyEmployeeAdded = useCallback(async (employee, recipients) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    return sendNotification(EMAIL_TYPES.EMPLOYEE_ADDED, recipients, {
      employeeName: employee.name,
      employeePosition: employee.poste,
      employeeEmail: employee.email,
      employeeDepartment: employee.department || 'Non spécifié',
      hireDate: new Date(employee.hireDate).toLocaleDateString('fr-FR'),
      addedBy: currentUser.displayName || currentUser.email,
      addedDate: new Date().toLocaleDateString('fr-FR'),
      employeeUrl: `${window.location.origin}/employees/${employee.id}`
    });
  }, [sendNotification]);

  const notifyEmployeeUpdated = useCallback(async (employee, changes, recipients) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Formater les changements
    const changesDetails = Object.entries(changes)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('<br>');

    return sendNotification(EMAIL_TYPES.EMPLOYEE_UPDATED, recipients, {
      employeeName: employee.name,
      changesDetails,
      modifiedBy: currentUser.displayName || currentUser.email,
      modifiedDate: new Date().toLocaleDateString('fr-FR'),
      employeeUrl: `${window.location.origin}/employees/${employee.id}`
    });
  }, [sendNotification]);

  const notifyLeaveRequest = useCallback(async (request, employee, approvers) => {
    return sendNotification(EMAIL_TYPES.LEAVE_REQUEST_SUBMITTED, approvers, {
      employeeName: employee.name,
      startDate: new Date(request.startDate).toLocaleDateString('fr-FR'),
      endDate: new Date(request.endDate).toLocaleDateString('fr-FR'),
      duration: request.duration,
      reason: request.reason,
      comment: request.comment || 'Aucun commentaire',
      approveUrl: `${window.location.origin}/leaves/approve/${request.id}`,
      rejectUrl: `${window.location.origin}/leaves/reject/${request.id}`
    });
  }, [sendNotification]);

  const notifyLeaveApproved = useCallback(async (request, employee, approver) => {
    return sendNotification(EMAIL_TYPES.LEAVE_REQUEST_APPROVED, [employee], {
      employeeName: employee.name,
      startDate: new Date(request.startDate).toLocaleDateString('fr-FR'),
      endDate: new Date(request.endDate).toLocaleDateString('fr-FR'),
      duration: request.duration,
      approvedBy: approver.name || approver.email,
      approverComment: request.approverComment || 'Aucun commentaire',
      leaveUrl: `${window.location.origin}/leaves/${request.id}`
    });
  }, [sendNotification]);

  const notifyLeaveRejected = useCallback(async (request, employee, approver) => {
    return sendNotification(EMAIL_TYPES.LEAVE_REQUEST_REJECTED, [employee], {
      employeeName: employee.name,
      startDate: new Date(request.startDate).toLocaleDateString('fr-FR'),
      endDate: new Date(request.endDate).toLocaleDateString('fr-FR'),
      duration: request.duration,
      rejectedBy: approver.name || approver.email,
      rejectionReason: request.rejectionReason || 'Aucune raison spécifiée',
      leaveUrl: `${window.location.origin}/leaves/${request.id}`
    });
  }, [sendNotification]);

  const notifyPayslipGenerated = useCallback(async (payslip, employee) => {
    return sendNotification(EMAIL_TYPES.PAYSLIP_GENERATED, [employee], {
      employeeName: employee.name,
      month: payslip.month,
      year: payslip.year,
      grossSalary: payslip.grossSalary?.toLocaleString() || '0',
      deductions: payslip.deductions?.toLocaleString() || '0',
      netSalary: payslip.netSalary?.toLocaleString() || '0',
      paymentDate: new Date(payslip.paymentDate).toLocaleDateString('fr-FR'),
      payslipUrl: `${window.location.origin}/payslips/${payslip.id}`
    });
  }, [sendNotification]);

  const notifyContractExpiring = useCallback(async (contract, employee, managers) => {
    const expirationDate = new Date(contract.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

    return sendNotification(EMAIL_TYPES.CONTRACT_EXPIRING, managers, {
      employeeName: employee.name,
      position: employee.poste,
      expirationDate: expirationDate.toLocaleDateString('fr-FR'),
      daysRemaining,
      contractUrl: `${window.location.origin}/contracts/${contract.id}`
    });
  }, [sendNotification]);

  const notifyTrialExpiring = useCallback(async (user, timeRemaining, stats) => {
    return sendNotification(EMAIL_TYPES.TRIAL_EXPIRING, [user], {
      timeRemaining,
      employeeCount: stats?.employeeCount || 0,
      documentsCount: stats?.documentsCount || 0,
      actionsCount: stats?.actionsCount || 0,
      subscriptionUrl: `${window.location.origin}/subscription`
    });
  }, [sendNotification]);

  const notifyTrialExpired = useCallback(async (user) => {
    return sendNotification(EMAIL_TYPES.TRIAL_EXPIRED, [user], {
      subscriptionUrl: `${window.location.origin}/subscription`,
      supportEmail: 'support@phrm.com'
    });
  }, [sendNotification]);

  const notifySubscriptionActivated = useCallback(async (user, subscription) => {
    const features = subscription.features?.map(f => `<li>✅ ${f}</li>`).join('') || '';
    
    return sendNotification(EMAIL_TYPES.SUBSCRIPTION_ACTIVATED, [user], {
      planName: subscription.planName,
      amount: subscription.amount?.toLocaleString() || '0',
      maxEmployees: subscription.maxEmployees === -1 ? 'Illimité' : subscription.maxEmployees,
      nextBilling: new Date(subscription.nextBilling).toLocaleDateString('fr-FR'),
      featuresList: features,
      dashboardUrl: `${window.location.origin}/client-admin-dashboard`
    });
  }, [sendNotification]);

  const notifySecurityAlert = useCallback(async (user, alertData) => {
    return sendNotification(EMAIL_TYPES.SECURITY_ALERT, [user], {
      alertDateTime: new Date(alertData.timestamp).toLocaleString('fr-FR'),
      ipAddress: alertData.ipAddress,
      location: alertData.location || 'Inconnue',
      activityType: alertData.activityType,
      securityUrl: `${window.location.origin}/security-settings`
    }, { priority: 'urgent' });
  }, [sendNotification]);

  const notifyPasswordReset = useCallback(async (user, resetToken) => {
    return sendNotification(EMAIL_TYPES.PASSWORD_RESET, [user], {
      resetUrl: `${window.location.origin}/reset-password?token=${resetToken}`,
      expirationTime: '1 heure',
      supportEmail: 'support@phrm.com'
    }, { priority: 'high' });
  }, [sendNotification]);

  // Notifications pour les administrateurs système
  const notifySystemMaintenance = useCallback(async (users, maintenanceData) => {
    return sendNotification(EMAIL_TYPES.SYSTEM_MAINTENANCE, users, {
      maintenanceDate: new Date(maintenanceData.scheduledDate).toLocaleDateString('fr-FR'),
      maintenanceTime: new Date(maintenanceData.scheduledDate).toLocaleTimeString('fr-FR'),
      duration: maintenanceData.estimatedDuration,
      description: maintenanceData.description,
      affectedServices: maintenanceData.affectedServices?.join(', ') || 'Tous les services'
    });
  }, [sendNotification]);

  const notifyBackupCompleted = useCallback(async (admins, backupData) => {
    return sendNotification(EMAIL_TYPES.BACKUP_COMPLETED, admins, {
      backupDate: new Date(backupData.completedAt).toLocaleDateString('fr-FR'),
      backupTime: new Date(backupData.completedAt).toLocaleTimeString('fr-FR'),
      backupSize: backupData.size,
      backupLocation: backupData.location,
      duration: backupData.duration
    }, { priority: 'low' });
  }, [sendNotification]);

  return {
    // État
    stats,
    loading,
    
    // Actions génériques
    sendNotification,
    loadStats,
    
    // Notifications spécialisées - Employés
    notifyEmployeeAdded,
    notifyEmployeeUpdated,
    
    // Notifications spécialisées - Congés
    notifyLeaveRequest,
    notifyLeaveApproved,
    notifyLeaveRejected,
    
    // Notifications spécialisées - Paie
    notifyPayslipGenerated,
    
    // Notifications spécialisées - Contrats
    notifyContractExpiring,
    
    // Notifications spécialisées - Système
    notifyTrialExpiring,
    notifyTrialExpired,
    notifySubscriptionActivated,
    notifySecurityAlert,
    notifyPasswordReset,
    notifySystemMaintenance,
    notifyBackupCompleted
  };
};

export default useNotifications;
