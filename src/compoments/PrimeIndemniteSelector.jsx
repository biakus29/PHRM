import React from 'react';

/**
 * Composant pour sélectionner et éditer les primes et indemnités.
 * @param {Array} primes - Liste des primes [{ label, value }]
 * @param {Array} indemnites - Liste des indemnités [{ label, value }]
 * @param {Function} onChange - Callback (primes, indemnites)
 */
const PrimeIndemniteSelector = ({ primes = [], indemnites = [], onChange }) => {
  // Gestion locale des champs
  const [localPrimes, setLocalPrimes] = React.useState(primes.map(p => ({ ...p, montant: p.montant ?? p.value ?? 0 })));
  const [localIndemnites, setLocalIndemnites] = React.useState(indemnites.map(i => ({ ...i, montant: i.montant ?? i.value ?? 0 })));

  // Synchronisation si props changent
  React.useEffect(() => { setLocalPrimes(primes.map(p => ({ ...p, montant: p.montant ?? p.value ?? 0 }))); }, [primes]);
  React.useEffect(() => { setLocalIndemnites(indemnites.map(i => ({ ...i, montant: i.montant ?? i.value ?? 0 }))); }, [indemnites]);

  // Ajout d'une prime
  const addPrime = () => {
    setLocalPrimes([...localPrimes, { label: '', montant: 0 }]);
  };
  // Ajout d'une indemnité
  const addIndemnite = () => {
    setLocalIndemnites([...localIndemnites, { label: '', montant: 0 }]);
  };
  // Modification d'une prime
  const updatePrime = (idx, field, val) => {
    const updated = localPrimes.map((p, i) => i === idx ? { ...p, [field]: field === 'montant' ? parseFloat(val) || 0 : val } : p);
    setLocalPrimes(updated);
    onChange && onChange(updated, localIndemnites);
  };
  // Modification d'une indemnité
  const updateIndemnite = (idx, field, val) => {
    const updated = localIndemnites.map((p, i) => i === idx ? { ...p, [field]: field === 'montant' ? parseFloat(val) || 0 : val } : p);
    setLocalIndemnites(updated);
    onChange && onChange(localPrimes, updated);
  };
  // Suppression
  const removePrime = idx => {
    const updated = localPrimes.filter((_, i) => i !== idx);
    setLocalPrimes(updated);
    onChange && onChange(updated, localIndemnites);
  };
  const removeIndemnite = idx => {
    const updated = localIndemnites.filter((_, i) => i !== idx);
    setLocalIndemnites(updated);
    onChange && onChange(localPrimes, updated);
  };

  const PRIME_TYPES = [
    "Prime d'ancienneté",
    "Prime de rendement",
    "Prime de panier",
    "Prime de transport",
    "Prime exceptionnelle",
  ];

  const INDEMNITE_TYPES = [
    "Indemnité logement",
    "Indemnité de déplacement",
    "Indemnité de caisse",
    "Indemnité de fonction",
    "Indemnité exceptionnelle",
     "13e mois", 
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-sm">Primes</span>
          <button type="button" className="text-blue-600 text-xs" onClick={addPrime}>+ Ajouter</button>
        </div>
        {localPrimes.length === 0 && <div className="text-xs text-gray-400">Aucune prime</div>}
        {localPrimes.map((prime, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <select
              className="border rounded px-2 py-1 text-xs flex-1"
              value={prime.label}
              onChange={e => updatePrime(idx, 'label', e.target.value)}
            >
              <option value="">Sélectionner un type</option>
              {PRIME_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="number"
              className="border rounded px-2 py-1 text-xs w-20"
              placeholder="Montant"
              value={prime.montant}
              onChange={e => updatePrime(idx, 'montant', e.target.value)}
            />
            <button type="button" className="text-red-500 text-xs" onClick={() => removePrime(idx)}>Suppr</button>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-sm">Indemnités</span>
          <button type="button" className="text-blue-600 text-xs" onClick={addIndemnite}>+ Ajouter</button>
        </div>
        {localIndemnites.length === 0 && <div className="text-xs text-gray-400">Aucune indemnité</div>}
        {localIndemnites.map((indem, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <select
              className="border rounded px-2 py-1 text-xs flex-1"
              value={indem.label}
              onChange={e => updateIndemnite(idx, 'label', e.target.value)}
            >
              <option value="">Sélectionner un type</option>
              {INDEMNITE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="number"
              className="border rounded px-2 py-1 text-xs w-20"
              placeholder="Montant"
              value={indem.montant}
              onChange={e => updateIndemnite(idx, 'montant', e.target.value)}
            />
            <button type="button" className="text-red-500 text-xs" onClick={() => removeIndemnite(idx)}>Suppr</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrimeIndemniteSelector; 