import { useEffect, useState } from "react";
import { db } from "../firebase";
import { subscribeEmployees } from "../services/employees";

// Subscribe to employees under clients/{companyId}/employees
export default function useEmployeesData(companyId) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(!!companyId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeEmployees(
      db,
      companyId,
      (data) => {
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, [companyId]);

  return { employees, loading, error };
}
