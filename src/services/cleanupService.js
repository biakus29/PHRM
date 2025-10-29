import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

/**
 * Service pour nettoyer les données temporaires expirées
 */
export const cleanupService = {
  /**
   * Nettoie les employés temporaires expirés des comptes démo
   */
  async cleanupExpiredTemporaryEmployees() {
    try {
      // Trouver tous les comptes démo
      const demoClientsQuery = query(
        collection(db, 'clients'),
        where('isDemo', '==', true)
      );
      
      const demoClients = await getDocs(demoClientsQuery);
      const now = new Date();

      // Pour chaque compte démo
      for (const demoClient of demoClients.docs) {
        // Trouver les employés temporaires expirés
        const expiredEmployeesQuery = query(
          collection(db, 'clients', demoClient.id, 'employees'),
          where('isTemporary', '==', true),
          where('demoExpiry', '<=', now)
        );
        
        const expiredEmployees = await getDocs(expiredEmployeesQuery);
        
        // Supprimer les employés expirés
        for (const employee of expiredEmployees.docs) {
          await deleteDoc(employee.ref);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des employés temporaires:', error);
    }
  }
};