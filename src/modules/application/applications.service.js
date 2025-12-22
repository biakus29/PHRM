// Service Applications - Version refactorée et sécurisée

import { db } from '../../firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDocs, query, orderBy, where, getDoc } from 'firebase/firestore';
import { isValidTransition, getStatusMessage } from './application.workflow';
import { sendCandidateEmail } from '../notifications/email.service';

export const createApplication = async (applicationData) => {
  try {
    const application = {
      ...applicationData,
      status: 'applied',
      source: 'public',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'applications'), application);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Erreur création candidature:', error);
    return { success: false, error: error.message };
  }
};

export const updateApplicationStatus = async (application, newStatus) => {
  try {
    // Valider la transition
    if (!isValidTransition(application.status, newStatus)) {
      throw new Error(`Transition invalide: ${application.status} → ${newStatus}`);
    }

    // Mettre à jour dans Firestore
    await updateDoc(doc(db, 'applications', application.id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // Envoyer l'email au candidat
    const emailResult = await sendCandidateEmail({
      to_email: application.candidateSnapshot.email,
      to_name: application.candidateSnapshot.fullname,
      subject: `Mise à jour de votre candidature - ${application._job?.title || 'Poste'}`,
      message: getStatusMessage(newStatus),
      job_title: application._job?.title || 'Poste',
      status: newStatus
    });

    if (!emailResult.success) {
      console.warn('Email non envoyé:', emailResult.error);
    }

    return { success: true, emailSent: emailResult.success };
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return { success: false, error: error.message };
  }
};

export const getApplications = async (filters = {}) => {
  try {
    const baseQuery = [orderBy('createdAt', 'desc')];
    const queryFilters = [];

    if (filters.jobId) {
      queryFilters.push(where('jobId', '==', filters.jobId));
    }
    if (filters.status) {
      queryFilters.push(where('status', '==', filters.status));
    }
    if (filters.companyId) {
      queryFilters.push(where('companyId', '==', filters.companyId));
    }

    const q = query(
      collection(db, 'applications'),
      ...queryFilters,
      ...baseQuery
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur récupération candidatures:', error);
    return [];
  }
};

export const enrichApplications = async (applications) => {
  const enriched = [];
  
  for (const app of applications) {
    let _job = null;
    let _company = null;

    // Enrichir avec les données du job
    if (app.jobId) {
      try {
        const jobSnap = await getDoc(doc(db, 'jobs', app.jobId));
        if (jobSnap.exists()) {
          _job = { id: jobSnap.id, ...jobSnap.data() };
        }
      } catch (err) {
        console.warn('Erreur chargement job:', err);
      }
    }

    enriched.push({
      ...app,
      _job,
      _company
    });
  }

  return enriched;
};
