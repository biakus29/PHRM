import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ContractTemplate = ({ 
  employer, 
  contract, 
  template = "default" // "default", "modern", "minimal", "legal"
}) => {
  
  const formatAmount = (amount) => {
    const n = Number(amount) || 0;
    return `${n.toLocaleString('fr-FR')} XAF`;
  };


  const templates = {
    default: {
      containerClass: "bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-4xl mx-auto",
      headerClass: "border-b border-gray-200 pb-6 mb-8",
      titleClass: "text-3xl font-bold text-gray-800 mb-4 text-center",
      subtitleClass: "text-gray-600 text-center",
      sectionClass: "mb-8",
      sectionTitleClass: "text-xl font-semibold text-gray-700 mb-4",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-6",
      itemClass: "flex justify-between items-start py-3 border-b border-gray-100",
      labelClass: "text-gray-600 font-medium",
      valueClass: "font-medium text-gray-800 text-right",
      highlightClass: "bg-blue-50 p-6 rounded-lg border border-blue-200",
      clauseClass: "mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
    },
    modern: {
      containerClass: "bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-lg p-10 max-w-4xl mx-auto",
      headerClass: "border-b border-green-200 pb-8 mb-10",
      titleClass: "text-4xl font-bold text-green-900 mb-4 text-center",
      subtitleClass: "text-green-600 text-center text-lg",
      sectionClass: "mb-10",
      sectionTitleClass: "text-2xl font-semibold text-green-800 mb-6",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-8",
      itemClass: "flex justify-between items-start py-4 border-b border-green-100",
      labelClass: "text-green-600 font-semibold",
      valueClass: "font-semibold text-green-900 text-right",
      highlightClass: "bg-white p-8 rounded-lg border border-green-200 shadow-sm",
      clauseClass: "mb-6 p-6 bg-white rounded-lg border border-green-200 shadow-sm"
    },
    minimal: {
      containerClass: "bg-white border border-gray-300 rounded-lg p-10 max-w-4xl mx-auto",
      headerClass: "border-b border-gray-300 pb-6 mb-8",
      titleClass: "text-2xl font-semibold text-gray-900 mb-2 text-center",
      subtitleClass: "text-gray-500 text-sm text-center",
      sectionClass: "mb-8",
      sectionTitleClass: "text-lg font-medium text-gray-700 mb-4",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      itemClass: "flex justify-between items-start py-2",
      labelClass: "text-gray-600 text-sm",
      valueClass: "font-medium text-gray-900 text-sm text-right",
      highlightClass: "bg-gray-50 p-6 rounded border border-gray-200",
      clauseClass: "mb-4 p-4 bg-gray-50 rounded border border-gray-200"
    },
    legal: {
      containerClass: "bg-white border-2 border-gray-400 rounded-lg shadow-md p-10 max-w-5xl mx-auto",
      headerClass: "border-b-2 border-gray-400 pb-8 mb-10",
      titleClass: "text-3xl font-bold text-gray-900 mb-4 text-center",
      subtitleClass: "text-gray-600 text-center",
      sectionClass: "mb-10",
      sectionTitleClass: "text-xl font-bold text-gray-800 mb-6 border-b border-gray-300 pb-2",
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-6",
      itemClass: "flex justify-between items-start py-3 border-b border-gray-200",
      labelClass: "text-gray-700 font-semibold",
      valueClass: "font-semibold text-gray-900 text-right",
      highlightClass: "bg-yellow-50 p-8 rounded-lg border-2 border-yellow-300",
      clauseClass: "mb-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-300"
    }
  };

  const style = templates[template] || templates.default;

  return (
    <div className={style.containerClass}>
      {/* En-tête */}
      <div className={style.headerClass}>
        <h1 className={style.titleClass}>CONTRAT DE TRAVAIL</h1>
        <p className={style.subtitleClass}>
          Entre {employer.companyName} et {employee.name}
        </p>
        <p className={style.subtitleClass}>
          Signé le {formatDate(contract.startDate)}
        </p>
      </div>

      {/* Informations des parties */}
      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>1. Informations des parties</h2>
        
        <div className={style.highlightClass}>
          <h3 className="text-lg font-semibold mb-4">Employeur</h3>
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

        <div className={style.highlightClass}>
          <h3 className="text-lg font-semibold mb-4">Employé</h3>
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
              <span className={style.labelClass}>Date de naissance :</span>
              <span className={style.valueClass}>{formatDate(employee.dateOfBirth)}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Lieu de naissance :</span>
              <span className={style.valueClass}>{employee.lieuNaissance}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Adresse :</span>
              <span className={style.valueClass}>{employee.residence}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Numéro CNPS :</span>
              <span className={style.valueClass}>{employee.cnpsNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions du contrat */}
      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>2. Conditions du contrat</h2>
        
        <div className={style.highlightClass}>
          <div className={style.gridClass}>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Type de contrat :</span>
              <span className={style.valueClass}>{contract.type}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Poste :</span>
              <span className={style.valueClass}>{contract.position}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Département :</span>
              <span className={style.valueClass}>{employee.department}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Date de début :</span>
              <span className={style.valueClass}>{formatDate(contract.startDate)}</span>
            </div>
            {contract.endDate && (
              <div className={style.itemClass}>
                <span className={style.labelClass}>Date de fin :</span>
                <span className={style.valueClass}>{formatDate(contract.endDate)}</span>
              </div>
            )}
            <div className={style.itemClass}>
              <span className={style.labelClass}>Durée :</span>
              <span className={style.valueClass}>{contract.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rémunération */}
      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>3. Rémunération</h2>
        
        <div className={style.highlightClass}>
          <div className={style.gridClass}>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Salaire de base :</span>
              <span className={style.valueClass}>{formatAmount(contract.salary)}</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Mode de paiement :</span>
              <span className={style.valueClass}>Virement bancaire</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Période de paie :</span>
              <span className={style.valueClass}>Mensuelle</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Date de paiement :</span>
              <span className={style.valueClass}>25 de chaque mois</span>
            </div>
          </div>
        </div>
      </div>

      {/* Période d'essai */}
      {contract.trialPeriod && (
        <div className={style.sectionClass}>
          <h2 className={style.sectionTitleClass}>4. Période d'essai</h2>
          
          <div className={style.clauseClass}>
            <p className="text-gray-700">
              Une période d'essai de <strong>{contract.trialPeriod}</strong> est prévue.
              Pendant cette période, chaque partie peut mettre fin au contrat sans préavis.
            </p>
          </div>
        </div>
      )}

      {/* Horaires de travail */}
      <div className={style.sectionClass}>
        <h2 className={style.sectionTitleClass}>5. Horaires de travail</h2>
        
        <div className={style.highlightClass}>
          <div className={style.gridClass}>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Heures par semaine :</span>
              <span className={style.valueClass}>40 heures</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Heures par mois :</span>
              <span className={style.valueClass}>{employee.hoursPerMonth || 160} heures</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Jours de travail :</span>
              <span className={style.valueClass}>Lundi - Vendredi</span>
            </div>
            <div className={style.itemClass}>
              <span className={style.labelClass}>Horaires :</span>
              <span className={style.valueClass}>8h00 - 17h00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clauses spéciales */}
      {contract.clauses && (
        <div className={style.sectionClass}>
          <h2 className={style.sectionTitleClass}>6. Clauses spéciales</h2>
          
          <div className={style.clauseClass}>
            <p className="text-gray-700 whitespace-pre-line">{contract.clauses}</p>
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-40 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 mb-2">Signature employé</p>
            <p className="text-xs text-gray-500">{employee.name}</p>
            <p className="text-xs text-gray-500">Date : {formatDate(contract.startDate)}</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-40 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 mb-2">Signature employeur</p>
            <p className="text-xs text-gray-500">{employer.representant}</p>
            <p className="text-xs text-gray-500">Date : {formatDate(contract.startDate)}</p>
          </div>
        </div>
      </div>

      {/* Cachet de l'entreprise */}
      <div className="mt-8 text-center">
        <div className="inline-block border-2 border-gray-300 rounded-lg p-4">
          <p className="text-sm text-gray-600">Cachet de l'entreprise</p>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplate; 