import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
const generateDemoEmployees = (count = 2) => {
  // Liste plus complète disponible en production, mais limiter à 2 pour le mode démo
  const names = [
    'Marie Nguema', 'Jean-Paul Mballa', 'Aminata Diallo', 'Pierre Kamdem', 'Sophie Owona',
    'Michel Etoa', 'Fatima Mbarga', 'Joseph Nkoulou', 'Rose Atangana', 'Antoine Abega'
  ];
  const departments = ['RH', 'Finance', 'IT', 'Marketing', 'Production'];
  const statuses = ['Actif', 'Actif', 'Actif', 'Actif', 'Actif', 'Inactif'];

  return names.slice(0, Math.max(1, count)).map((name, index) => ({
    id: `demo_${index + 1}`,
    name,
    email: name.toLowerCase().replace(' ', '.') + '@demo.com',
    poste: ['Manager RH', 'Développeur', 'Comptable', 'Designer', 'Ingénieur'][index % 5],
    department: departments[index % departments.length],
    hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: statuses[index % statuses.length],
    baseSalary: 150000 + Math.floor(Math.random() * 200000),
    cnpsNumber: `CNPS${100000 + index}`,
    professionalCategory: 'Cadre',
    matricule: `MAT${1000 + index}`,
    leaves: {
      balance: Math.floor(Math.random() * 25),
      requests: [],
      history: []
    },
    payslips: [],
    absences: [],
    createdAt: new Date().toISOString()
  }));
};

const generateDemoLeaveRequests = () => {
  const reasons = ['Congé annuel', 'Maladie', 'Formation', 'Maternité'];
  const statuses = ['En attente', 'Approuvé', 'Refusé'];
  const employees = generateDemoEmployees();

  return Array.from({ length: 5 }, (_, index) => ({
    id: `leave_${index + 1}`,
    employeeId: `demo_${(index % 10) + 1}`,
    employeeName: employees[(index % 10)].name,
    date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    days: Math.floor(Math.random() * 10) + 1,
    reason: reasons[index % reasons.length],
    status: statuses[index % statuses.length],
    createdAt: new Date().toISOString()
  }));
};

const DemoContext = createContext();

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  const [isDemoAccount, setIsDemoAccount] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Vérifier si l'utilisateur actuel est un compte démo
  const checkDemoStatus = async (user) => {
    if (!user) {
      setIsDemoAccount(false);
      setDemoData(null);
      return;
    }

    try {
      // 1) Chercher d'abord dans la collection `clients` un compte marqué `isDemo`
      const clientDemoQuery = query(
        collection(db, "clients"),
        where("adminUid", "==", user.uid),
        where("isDemo", "==", true),
        where("isActive", "==", true)
      );
      const clientSnapshot = await getDocs(clientDemoQuery);

      if (!clientSnapshot.empty) {
        const clientDoc = clientSnapshot.docs[0];
        const clientInfo = clientDoc.data();
        const expiresAt = clientInfo.licenseExpiry ? new Date(clientInfo.licenseExpiry) : null;
        const now = new Date();

        if (expiresAt && now > expiresAt) {
          // Compte démo expiré : désactiver
          await updateDoc(doc(db, "clients", clientDoc.id), { isActive: false });
          setIsExpired(true);
          setIsDemoAccount(false);
          window.location.href = '/subscription';
        } else {
          // Compte démo actif
          setIsDemoAccount(true);
          setDemoData({
            ...clientInfo,
            // Générer un petit jeu de données fictives limité (2 employés)
            employees: generateDemoEmployees(2),
            leaveRequests: generateDemoLeaveRequests(),
          });
          setIsExpired(false);
          const remaining = expiresAt ? (expiresAt - now) : null;
          setTimeRemaining(remaining);
        }
      } else {
        // 2) Fallback : vérifier l'ancienne collection `demo_accounts` si existante
        const demoQuery = query(
          collection(db, "demo_accounts"),
          where("uid", "==", user.uid),
          where("isActive", "==", true)
        );
        const querySnapshot = await getDocs(demoQuery);

        if (!querySnapshot.empty) {
          const demoDoc = querySnapshot.docs[0];
          const demoInfo = demoDoc.data();
          const expiresAt = demoInfo.expiresAt.toDate();
          const now = new Date();

          if (now > expiresAt) {
            // Compte expiré - désactiver
            await updateDoc(doc(db, "demo_accounts", demoDoc.id), {
              isActive: false
            });
            setIsExpired(true);
            setIsDemoAccount(false);
            window.location.href = '/subscription';
          } else {
            // Compte actif
            setIsDemoAccount(true);
            setDemoData({
              ...demoInfo,
              employees: generateDemoEmployees(2),
              leaveRequests: generateDemoLeaveRequests(),
            });
            setIsExpired(false);

            // Calculer le temps restant
            const remaining = expiresAt - now;
            setTimeRemaining(remaining);
          }
        } else {
          setIsDemoAccount(false);
          setDemoData(null);
          setIsExpired(false);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut démo:", error);
      setIsDemoAccount(false);
      setDemoData(null);
    }
  };

  // Mettre à jour le timer toutes les minutes
  useEffect(() => {
    if (!isDemoAccount || !timeRemaining) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = demoData?.expiresAt?.toDate();

      if (expiresAt && now > expiresAt) {
        setIsExpired(true);
        setTimeRemaining(0);
        clearInterval(interval);
        // Rediriger vers la page d'abonnement
        window.location.href = '/subscription';
      } else if (expiresAt) {
        setTimeRemaining(expiresAt - now);
      }
    }, 60000); // Vérifier chaque minute

    return () => clearInterval(interval);
  }, [isDemoAccount, demoData, timeRemaining]);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkDemoStatus(user);
    });

    return unsubscribe;
  }, []);

  // Formater le temps restant
  const formatTimeRemaining = (ms) => {
    if (!ms || ms <= 0) return "Expiré";

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const value = {
    isDemoAccount,
    demoData,
    timeRemaining,
    isExpired,
    formatTimeRemaining,
    checkDemoStatus,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};
