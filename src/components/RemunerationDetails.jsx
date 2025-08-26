import React from 'react';
import { LABELS, INDEMNITIES, BONUSES, computeGrossTotal } from '../utils/payrollLabels';

function formatCFA(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('fr-FR');
}

// Reusable remuneration details block to ensure uniform display across UI (reports, previews, dashboards)
// Props: {
//   amounts: {
//     baseSalary, transportAllowance, housingAllowance, representationAllowance, dirtAllowance, mealAllowance,
//     overtime, bonus
//   },
//   showEmptyLines?: boolean (default true) -> if false, hides zero rows
// }
export default function RemunerationDetails({ amounts = {}, showEmptyLines = false }) {
  const baseSalary = Number(amounts.baseSalary) || 0;
  const grossTotal = computeGrossTotal(amounts);

  const renderRows = (items) => (
    <div className="space-y-1">
      {items.map(({ key, label }) => {
        const val = Number(amounts?.[key]) || 0;
        if (!showEmptyLines && val === 0) return null;
        return (
          <div key={key} className="flex justify-between">
            <span>{label}</span>
            <span className="font-medium">{formatCFA(val)} {LABELS.currency}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">{LABELS.remuneration}</h3>

      {/* Salaire de base */}
      <div className="flex justify-between text-sm mb-4">
        <span className="text-gray-700">{LABELS.baseSalary}</span>
        <span className="font-medium">{formatCFA(baseSalary)} {LABELS.currency}</span>
      </div>

      {/* Indemnités */}
      <div className="mb-4">
        <h4 className="text-gray-800 font-medium mb-2">{LABELS.allowances}</h4>
        {renderRows(INDEMNITIES)}
      </div>

      {/* Primes */}
      <div className="mb-2">
        <h4 className="text-gray-800 font-medium mb-2">{LABELS.bonuses}</h4>
        {renderRows(BONUSES)}
      </div>

      {/* Total brut */}
      <div className="border-t pt-2 flex justify-between text-sm">
        <span className="font-semibold">{LABELS.grossTotal}</span>
        <span className="font-semibold">{formatCFA(grossTotal)} {LABELS.currency}</span>
      </div>
    </div>
  );
}
