// Firestore Job services for submission/approval workflow
import { db } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export const createJob = async (companyId, payload, submittedByUserId) => {
  const ref = await addDoc(collection(db, 'jobs'), {
    companyId,
    status: 'submitted',
    source: 'documents',
    workflowType: payload.workflowType || 'partial',
    title: payload.title,
    description: payload.description || '',
    location: payload.location || '',
    contractType: payload.contractType || '',
    salaryRange: payload.salaryRange || '',
    skills: payload.skills || [],
    experienceMin: payload.experienceMin ?? null,
    languages: payload.languages || [],
    deadline: payload.deadline || null,
    // workflow-specific
    partial: payload.workflowType === 'partial' ? {
      contactsEntretiens: payload.contactsEntretiens || [],
      processusEntreprise: payload.processusEntreprise || ''
    } : null,
    full: payload.workflowType === 'full' ? {
      volumeCandidats: payload.volumeCandidats || 0,
      delaiLivraison: payload.delaiLivraison || '',
      criteresSelection: payload.criteresSelection || [],
      emailsReceptionProfils: payload.emailsReceptionProfils || []
    } : null,
    submittedBy: submittedByUserId || null,
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const publishJob = async (jobId) => {
  await updateDoc(doc(db, 'jobs', jobId), {
    status: 'published',
    publishedAt: serverTimestamp()
  });
};

export const rejectJob = async (jobId, reason) => {
  await updateDoc(doc(db, 'jobs', jobId), {
    status: 'rejected',
    rejectReason: reason || ''
  });
};

export const listSubmittedJobs = async () => {
  // Avoid requiring a composite index: filter only, then sort locally by createdAt desc
  const qRef = query(collection(db, 'jobs'), where('status', '==', 'submitted'));
  const snap = await getDocs(qRef);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => {
    const ta = a?.createdAt?.seconds ?? 0;
    const tb = b?.createdAt?.seconds ?? 0;
    return tb - ta;
  });
};

export const getJob = async (jobId) => {
  const snap = await getDoc(doc(db, 'jobs', jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
