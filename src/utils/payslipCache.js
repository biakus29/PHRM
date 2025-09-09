// Utilities to unify payslip cache keys across modules
// Source of truth: prefer matricule, then CNPS number, then name

export function getPayslipCacheKeyFromEmployee(emp = {}) {
  return String(emp.matricule || emp.cnpsNumber || emp.name || '').trim();
}

export function getPayslipCacheKeyFromCNPSRow(row = {}) {
  return String(row.matriculeInterne || row.cnps || row.nom || '').trim();
}

export function getLastPayslipCache(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(`lastPayslip_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLastPayslipCache(key, payload) {
  if (!key) return;
  try {
    localStorage.setItem(`lastPayslip_${key}`, JSON.stringify(payload || {}));
  } catch {}
}
