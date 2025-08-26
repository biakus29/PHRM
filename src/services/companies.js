// Firestore Company-related operations centralization
// Provides helpers to update company documents and counters

import { doc, updateDoc, getDoc } from "firebase/firestore";

function companyDocRef(db, companyId) {
  return doc(db, "clients", companyId);
}

export async function updateCompany(db, companyId, data) {
  const ref = companyDocRef(db, companyId);
  await updateDoc(ref, data);
}

export async function setCompanyUserCount(db, companyId, count) {
  const ref = companyDocRef(db, companyId);
  await updateDoc(ref, { currentUsers: count });
}

export async function getCompany(db, companyId) {
  const ref = companyDocRef(db, companyId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: companyId, ...snap.data() } : null;
}
