// FICHIER OBSOLÈTE - Remplacé par exportContractPDF.js
// Ce fichier est conservé temporairement pour éviter les erreurs de build
// Tous les exports de contrat utilisent maintenant la fonction unifiée exportContractPDF()

import React from 'react';

const ExportContrat = () => {
  console.warn('ExportContrat.jsx est obsolète. Utilisez exportContractPDF() à la place.');
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-800">
        ⚠️ Ce composant est obsolète. L'export de contrat utilise maintenant une fonction unifiée.
      </p>
    </div>
  );
};

export default ExportContrat; 