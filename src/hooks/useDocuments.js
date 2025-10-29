// src/hooks/useDocuments.js
// Hook personnalisé pour la gestion des documents (CRUD + Firestore)

import { useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * Hook pour gérer les opérations CRUD sur les documents
 * @param {string} companyId - ID de l'entreprise
 * @returns {Object} - Documents, loading, et fonctions CRUD
 */
export const useDocuments = (companyId) => {
  const [documents, setDocuments] = useState({
    offers: [],
    attestations: [],
    certificates: [],
    contracts: [],
    amendments: []
  });
  const [loading, setLoading] = useState(false);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState(new Set());

  /**
   * Charge les documents d'un type spécifique
   */
  const fetchDocuments = useCallback(async (documentType) => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'documents'),
        where('companyId', '==', companyId),
        where('type', '==', documentType),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setDocuments(prev => ({ ...prev, [documentType]: docs }));
      setDocumentsLoaded(true);
      setLoadedTabs(prev => new Set([...prev, documentType]));
      
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  /**
   * Crée un nouveau document
   */
  const createDocument = useCallback(async (documentType, data) => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const docData = {
        ...data,
        companyId,
        type: documentType,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(collection(db, 'documents'), docData);
      toast.success('Document créé avec succès');
      
      // Recharger automatiquement si les documents sont déjà chargés
      if (documentsLoaded) {
        await fetchDocuments(documentType);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création du document');
      return false;
    } finally {
      setLoading(false);
    }
  }, [companyId, documentsLoaded, fetchDocuments]);

  /**
   * Met à jour un document existant
   */
  const updateDocument = useCallback(async (documentType, docId, data) => {
    setLoading(true);
    try {
      const docData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'documents', docId), docData);
      toast.success('Document modifié avec succès');
      
      // Recharger automatiquement
      if (documentsLoaded) {
        await fetchDocuments(documentType);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification');
      return false;
    } finally {
      setLoading(false);
    }
  }, [documentsLoaded, fetchDocuments]);

  /**
   * Supprime un document
   */
  const deleteDocument = useCallback(async (documentType, docId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return false;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'documents', docId));
      toast.success('Document supprimé avec succès');
      
      // Recharger automatiquement
      if (documentsLoaded) {
        await fetchDocuments(documentType);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    } finally {
      setLoading(false);
    }
  }, [documentsLoaded, fetchDocuments]);

  /**
   * Réinitialise l'état de chargement
   */
  const resetLoadedState = useCallback(() => {
    setDocumentsLoaded(false);
  }, []);

  /**
   * Vérifie si un onglet a déjà été chargé
   */
  const isTabLoaded = useCallback((documentType) => {
    return loadedTabs.has(documentType);
  }, [loadedTabs]);

  return {
    documents,
    loading,
    documentsLoaded,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    resetLoadedState,
    isTabLoaded
  };
};
