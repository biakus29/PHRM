import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PaySlipTemplate = ({ 
  employee, 
  employer, 
  salaryDetails, 
  remuneration, 
  deductions, 
  payPeriod, 
  generatedAt, 
  primes = [], 
  indemnites = [],
  template = "default"
}) => {
  
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  const netToPay = remuneration.total - deductions.total;

  const templates = {
    default: {
      containerClass: "bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-4xl mx-auto",
      headerClass: "border-b border-gray-200 pb-4 mb-6",
      titleClass: "text-2xl font-bold text-gray-800 mb-2",
      subtitleClass: "text-gray-600",
      sectionClass: "mb-6",
      sectionTitleClass: "text-lg font-semibold text-gray-700 mb-3",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      itemClass: "flex justify-between items-center py-2 border-b border-gray-100",
      labelClass: "text-gray-600",
      valueClass: "font-medium text-gray-800",
      totalClass: "text-lg font-bold text-blue-600",
      highlightClass: "bg-blue-50 p-4 rounded-lg border border-blue-200"
    },
    modern: {
      containerClass: "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-8 max-w-4xl mx-auto",
      headerClass: "border-b border-blue-200 pb-6 mb-8",
      titleClass: "text-3xl font-bold text-blue-900 mb-3",
      subtitleClass: "text-blue-600",
      sectionClass: "mb-8",
      sectionTitleClass: "text-xl font-semibold text-blue-800 mb-4",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-6",
      itemClass: "flex justify-between items-center py-3 border-b border-blue-100",
      labelClass: "text-blue-600",
      valueClass: "font-semibold text-blue-900",
      totalClass: "text-xl font-bold text-indigo-600",
      highlightClass: "bg-white p-6 rounded-lg border border-blue-200 shadow-sm"
    },
    minimal: {
      containerClass: "bg-white border border-gray-300 rounded-lg p-8 max-w-4xl mx-auto",
      headerClass: "border-b border-gray-300 pb-4 mb-6",
      titleClass: "text-xl font-semibold text-gray-900 mb-1",
      subtitleClass: "text-gray-500 text-sm",
      sectionClass: "mb-6",
      sectionTitleClass: "text-base font-medium text-gray-700 mb-3",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-3",
      itemClass: "flex justify-between items-center py-1",
      labelClass: "text-gray-600 text-sm",
      valueClass: "font-medium text-gray-900",
      totalClass: "text-lg font-semibold text-gray-900",
      highlightClass: "bg-gray-50 p-4 rounded border border-gray-200"
    }
  };

  const style = templates[template] || templates.default;

  return (
    <div className={style.containerClass}>
      <div className={style.headerClass}>
        <h1 className={style.titleClass}>FICHE DE PAIE</h1>
        <p className={style.subtitleClass}>
          Période : {formatDate(payPeriod.start)} - {formatDate(payPeriod.end)}
        </p>
        <p className={style.subtitleClass}>
          Générée le : {formatDate(generatedAt)}
        </p>
      </div>

      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>Informations employeur</h2>
        <div className={style.gridClass}>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Raison sociale :</span>
            <span className={style.valueClass}>{employer.companyName}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Adresse :</span>
            <span className={style.valueClass}>{employer.address}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Numéro CNPS :</span>
            <span className={style.valueClass}>{employer.cnpsNumber}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Représentant :</span>
            <span className={style.valueClass}>{employer.representant}</span>
          </div>
        </div>
      </div>

      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>Informations employé</h2>
        <div className={style.gridClass}>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Nom et prénoms :</span>
            <span className={style.valueClass}>{employee.name}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Matricule :</span>
            <span className={style.valueClass}>{employee.matricule}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Poste :</span>
            <span className={style.valueClass}>{employee.poste}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Département :</span>
            <span className={style.valueClass}>{employee.department}</span>
          </div>
        </div>
      </div>

      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>Récapitulatif</h2>
        <div className={style.highlightClass}>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Total rémunération :</span>
            <span className={style.valueClass}>{formatAmount(remuneration.total)}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.labelClass}>Total déductions :</span>
            <span className={style.valueClass}>{formatAmount(deductions.total)}</span>
          </div>
          <div className={style.itemClass}>
            <span className={style.totalClass}>Net à payer :</span>
            <span className={style.totalClass}>{formatAmount(netToPay)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-32 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Signature employé</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-32 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Signature employeur</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaySlipTemplate; 