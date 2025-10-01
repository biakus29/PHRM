import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Valeurs par défaut (fallback si Firestore n'a pas de données)
const DEFAULT_SETTINGS = {
  cnps: {
    pvidSalarie: 4.2,
    pvidEmployeur: 4.2,
    prestationsFamiliales: 7.0,
    risquesPro: {
      A: 1.75,
      B: 2.5,
      C: 5.0
    },
    plafond: 750000
  },
  taxes: {
    cfc: 1.0,
    fne: 1.0,
    cac: 10.0,
    abattementMensuel: 41666.67
  },
  exonerations: {
    primeTransport: 30000,
    primePanier: 20000
  },
  irpp: [
    { min: 0, max: 2000000, taux: 10 },
    { min: 2000001, max: 3000000, taux: 15 },
    { min: 3000001, max: 5000000, taux: 25 },
    { min: 5000001, max: Infinity, taux: 35 }
  ],
  tdl: [
    { min: 0, max: 62000, montant: 0 },
    { min: 62001, max: 100000, montant: 500 },
    { min: 100001, max: 200000, montant: 1000 },
    { min: 200001, max: 250000, montant: 1500 },
    { min: 250001, max: 500000, montant: 2000 },
    { min: 500001, max: Infinity, montant: 2500 }
  ],
  rav: [
    { min: 0, max: 100000, montant: 1950 },
    { min: 100001, max: 250000, montant: 3250 },
    { min: 250001, max: 500000, montant: 4550 },
    { min: 500001, max: Infinity, montant: 5000 }
  ]
};

/**
 * Hook pour charger les paramètres fiscaux depuis Firestore
 * Les paramètres sont mis à jour en temps réel
 */
export const useFiscalSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const settingsRef = doc(db, 'systemSettings', 'fiscalConfig');

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data());
        } else {
          // Si pas de données, utiliser les valeurs par défaut
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Erreur chargement paramètres fiscaux:', err);
        setError(err);
        setSettings(DEFAULT_SETTINGS); // Utiliser les valeurs par défaut en cas d'erreur
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { settings, loading, error };
};

/**
 * Fonction pour charger les paramètres fiscaux une seule fois (sans écoute temps réel)
 * Utile pour les calculs ponctuels
 */
export const loadFiscalSettings = async () => {
  try {
    const settingsRef = doc(db, 'systemSettings', 'fiscalConfig');
    const snapshot = await getDoc(settingsRef);
    
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Erreur chargement paramètres fiscaux:', error);
    return DEFAULT_SETTINGS;
  }
};

export default useFiscalSettings;
