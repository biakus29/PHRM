// Firestore Employee service: centralizes all CRUD and subscription logic for employees
// Callers must pass the Firestore `db` instance.

import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch, getDoc } from "firebase/firestore";

const employeesCollectionRef = (db, companyId) => collection(db, "clients", companyId, "employees");
const employeeDocRef = (db, companyId, employeeId) => doc(db, "clients", companyId, "employees", employeeId);

// Subscribe to employees for a company. Returns the unsubscribe function.
export function subscribeEmployees(db, companyId, onData, onError) {
  const colRef = employeesCollectionRef(db, companyId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const employees = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(employees);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function addEmployee(db, companyId, data) {
  const colRef = employeesCollectionRef(db, companyId);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function updateEmployee(db, companyId, employeeId, data) {
  const ref = employeeDocRef(db, companyId, employeeId);
  // Optional existence check
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const err = new Error("Employee not found");
    err.code = "not-found";
    throw err;
  }
  await updateDoc(ref, data);
}

export async function deleteEmployee(db, companyId, employeeId) {
  const ref = employeeDocRef(db, companyId, employeeId);
  await deleteDoc(ref);
}

// Batch update: updates is an array of { id, data }
export async function batchUpdateEmployees(db, companyId, updates) {
  const batch = writeBatch(db);
  updates.forEach(({ id, data }) => {
    const ref = employeeDocRef(db, companyId, id);
    batch.update(ref, data);
  });
  await batch.commit();
}

// Update only the contract-related fields for an employee
export async function updateEmployeeContract(db, companyId, employeeId, contractData) {
  const ref = employeeDocRef(db, companyId, employeeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const err = new Error("Employee not found");
    err.code = "not-found";
    throw err;
  }
  await updateDoc(ref, contractData);
}

// Update only the payslips array for an employee
export async function updateEmployeePayslips(db, companyId, employeeId, payslips) {
  const ref = employeeDocRef(db, companyId, employeeId);
  await updateDoc(ref, { payslips });
}

// Update base salary for an employee
export async function updateEmployeeBaseSalary(db, companyId, employeeId, baseSalary) {
  const ref = employeeDocRef(db, companyId, employeeId);
  await updateDoc(ref, { baseSalary });
}

// Update badge data for an employee
export async function updateEmployeeBadge(db, companyId, employeeId, badgeData) {
  const ref = employeeDocRef(db, companyId, employeeId);
  await updateDoc(ref, badgeData);
}
