import React from "react";
import { QrCode, User, BadgeCheck, Building2, AtSign } from "lucide-react";

// Utilitaire pour récupérer le logo comme pour les fiches de paie/contrats
const getCompanyLogo = (companyData) => {
  if (companyData?.id) {
    const localLogo = localStorage.getItem(`logo_${companyData.id}`);
    if (localLogo) return localLogo;
  }
  return companyData?.logo || null;
};

// Utilitaire pour le logo
const LogoCircle = ({ companyData, color }) => {
  const logo = getCompanyLogo(companyData);
  const companyName = companyData?.name;
  return (
    <div className="flex items-center justify-center">
      {logo ? (
        <img
          src={logo}
          alt={companyName + ' logo'}
          className="h-12 w-12 rounded-full bg-white shadow-lg border-2"
          style={{ borderColor: color || '#3B82F6' }}
        />
      ) : (
        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-white text-gray-400 font-bold text-xl shadow-lg border-2" style={{ borderColor: color || '#3B82F6' }}>
          {companyName?.[0] || 'L'}
        </div>
      )}
    </div>
  );
};

// Modèle 1 : Moderne (correction QR code)
export const BadgeModel1 = ({ employee, companyData, qrCodeUrl, color = '#3B82F6', showPoste = true, customText = '' }) => (
  <div className="w-80 h-52 rounded-2xl shadow-2xl flex flex-row overflow-hidden">
    {/* Bandeau vertical gauche */}
    <div className="w-16 flex flex-col items-center justify-start py-4 bg-gradient-to-b" style={{ background: `linear-gradient(to bottom, ${color}, #fff)` }}>
      <div className="mb-2"><LogoCircle companyData={companyData} color={color} /></div>
      <QrCode className="w-10 h-10 mt-2" style={{ color }} />
    </div>
    {/* Contenu principal */}
    <div className="flex-1 bg-white flex flex-col items-center justify-between p-4 rounded-r-2xl min-w-0 pb-2">
      <div className="flex flex-col items-center w-full min-w-0 gap-2 pt-1">
        <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`} alt={employee.name} className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover mb-1 shrink-0" />
        <h3 className="text-xl font-bold max-w-[170px] truncate text-center" style={{ color }}>{employee.name}</h3>
        {showPoste && <p className="font-semibold text-base max-w-[150px] truncate text-center" style={{ color }}>{employee.poste}</p>}
        <p className="text-xs text-gray-600 max-w-[140px] truncate text-center">Matricule : {employee.matricule}</p>
        {customText && <p className="text-xs text-gray-700 mt-1 font-semibold max-w-[140px] truncate text-center">{customText}</p>}
      </div>
      {/* Nom de l'entreprise en bas, discret */}
      <div className="w-full text-xs text-gray-400 text-center mt-1 truncate">{companyData.name}</div>
    </div>
  </div>
);

// Modèle 2 : Carte blanche avec bandeau coloré
export const BadgeModel2 = ({ employee, companyData, qrCodeUrl, color = '#3B82F6', showPoste = true, customText = '' }) => (
  <div className="w-80 h-52 rounded-xl shadow-lg bg-white border border-blue-200 flex flex-col overflow-hidden">
    {/* Bandeau supérieur */}
    <div className="rounded-t-xl h-14 flex items-center px-4 justify-between min-w-0" style={{ background: color, minHeight: '3.5rem' }}>
      <div className="shrink-0 bg-white rounded-full"><LogoCircle companyData={companyData} color={color} /></div>
      <span className="text-white font-bold text-lg flex-1 text-center truncate whitespace-nowrap">{companyData.name}</span>
      <QrCode className="w-6 h-6 text-white shrink-0" />
    </div>
    {/* Contenu principal */}
    <div className="flex flex-1 flex-row items-center px-4 py-2 gap-4 overflow-hidden min-w-0 md:flex-row flex-col md:items-center md:justify-start">
      <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`} alt={employee.name} className="w-16 h-16 rounded-full border-2 border-blue-400 object-cover shrink-0 mb-2 md:mb-0" />
      <div className="flex flex-col gap-1 min-w-0 items-start w-full">
        <h3 className="text-blue-900 font-semibold text-lg max-w-[120px] truncate whitespace-nowrap" style={{ color }}>{employee.name}</h3>
        {showPoste && <p className="text-blue-700 text-sm flex items-center gap-1 max-w-[120px] truncate whitespace-nowrap" style={{ color }}><BadgeCheck className="w-4 h-4 shrink-0" />{employee.poste}</p>}
        <p className="text-blue-500 text-xs max-w-[120px] truncate whitespace-nowrap">Matricule : {employee.matricule}</p>
        {customText && <p className="text-xs text-blue-700 mt-1 font-semibold max-w-[120px] truncate whitespace-nowrap" style={{ color }}>{customText}</p>}
      </div>
    </div>
    <div className="flex justify-end items-center px-4 pb-2">
      <span className="text-xs text-blue-400 max-w-[100px] truncate whitespace-nowrap">{employee.email}</span>
    </div>
  </div>
);

// Modèle 3 : Minimaliste fond gris (correction débordement)
export const BadgeModel3 = ({ employee, companyData, qrCodeUrl, color = '#3B82F6', showPoste = true, customText = '' }) => (
  <div className="w-80 h-52 rounded-2xl shadow bg-gray-100 flex flex-col items-center justify-between p-6 relative min-w-0 py-3 overflow-hidden">
    {/* Logo en haut à gauche */}
    <div className="absolute top-3 left-3 z-10">
      <div className="h-10 w-10 rounded-full bg-white shadow flex items-center justify-center border-2" style={{ borderColor: color }}>
        <LogoCircle companyData={companyData} color={color} />
      </div>
    </div>
    {/* Contenu central */}
    <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`} alt={employee.name} className="w-16 h-16 rounded-full border-2 border-gray-300 object-cover mt-2 shrink-0" />
    <div className="text-center mt-2 min-w-0">
      <h3 className="text-gray-800 font-bold text-lg max-w-[150px] truncate mx-auto" style={{ color }}>{employee.name}</h3>
      {showPoste && <p className="text-gray-500 text-sm max-w-[130px] truncate mx-auto" style={{ color }}>{employee.poste}</p>}
      <p className="text-gray-400 text-xs max-w-[120px] truncate mx-auto">Matricule : {employee.matricule}</p>
      {customText && <p className="text-xs text-gray-700 mt-1 font-semibold max-w-[120px] truncate mx-auto" style={{ color }}>{customText}</p>}
    </div>
    {/* QR code en bas à droite */}
    <div className="absolute bottom-3 right-3 z-10">
      <QrCode className="w-8 h-8" style={{ color }} />
    </div>
  </div>
);

// Modèle 4 : Bandeau vertical coloré
export const BadgeModel4 = ({ employee, companyData, qrCodeUrl, color = '#A21CAF', showPoste = true, customText = '' }) => (
  <div className="w-80 h-52 rounded-xl shadow-lg flex flex-row overflow-hidden">
    <div className="bg-gradient-to-b from-purple-600 to-pink-400 w-20 flex flex-col items-center justify-between py-4" style={{ background: color }}>
      <LogoCircle companyData={companyData} color={color} />
      <QrCode className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 bg-white flex flex-col justify-center items-center p-4">
      <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`} alt={employee.name} className="w-16 h-16 rounded-full border-2 border-purple-400 object-cover" />
      <h3 className="text-purple-700 font-bold text-lg mt-2" style={{ color }}>{employee.name}</h3>
      {showPoste && <p className="text-purple-500 text-sm" style={{ color }}>{employee.poste}</p>}
      <p className="text-purple-400 text-xs">Matricule : {employee.matricule}</p>
      {customText && <p className="text-xs text-purple-700 mt-1 font-semibold" style={{ color }}>{customText}</p>}
    </div>
  </div>
);

// Modèle 5 : Carte colorée avec photo en fond
export const BadgeModel5 = ({ employee, companyData, qrCodeUrl, color = '#059669', showPoste = true, customText = '' }) => (
  <div className="w-80 h-52 rounded-2xl shadow-xl relative overflow-hidden bg-gradient-to-tr from-emerald-400 to-cyan-400">
    <div className="absolute top-4 left-4 z-20">
      <LogoCircle companyData={companyData} color={color} />
    </div>
    <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`} alt={employee.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
    <div className="relative z-10 flex flex-col h-full justify-between p-4">
      <div className="flex justify-between items-center">
        <div />
        <QrCode className="w-6 h-6 text-white" />
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-white font-bold text-xl drop-shadow" style={{ color }}>{employee.name}</h3>
        {showPoste && <p className="text-white text-sm drop-shadow" style={{ color }}>{employee.poste}</p>}
        <p className="text-white text-xs drop-shadow">Matricule : {employee.matricule}</p>
        {customText && <p className="text-xs text-white mt-1 font-semibold drop-shadow" style={{ color }}>{customText}</p>}
      </div>
      <div className="flex justify-end text-xs text-white opacity-80">
        {companyData.name}
      </div>
    </div>
  </div>
);

const BadgeModels = {
  BadgeModel1,
  BadgeModel2,
  BadgeModel3,
  BadgeModel4,
  BadgeModel5,
};
