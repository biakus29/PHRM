import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Subscribe to a single company document under clients/{companyId}
export default function useCompanyData(companyId) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(!!companyId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId) {
      setCompany(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "clients", companyId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setCompany({ id: snap.id, ...snap.data() });
        else setCompany(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [companyId]);

  return { company, loading, error };
}
