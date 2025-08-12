// src/components/EmployeeBadge.jsx
import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";
import { FiDownload } from "react-icons/fi";
import { cacheLogo } from "../utils/logoUtils";
import { generateBadgePDF } from "../utils/pdfUtils";
import Button from "./Button";

const EmployeeBadge = ({ employee, companyData, animationDelay, actionLoading }) => {
  const qrCodeUrl = `https://yourapp.com/employee/${employee.matricule || employee.id}`;
  const [logoData] = useState(cacheLogo(companyData.id));

  return (
    <div
      className="w-[340px] h-[216px] bg-white border-2 border-blue-500 rounded-lg shadow-md p-4 flex flex-col justify-between animate-scale-in"
      style={{ animationDelay }}
    >
      <div className="flex justify-center">
        {logoData ? (
          <img
            src={logoData}
            alt={`Logo de ${companyData.name}`}
            className="h-10"
            onError={() => {
              console.error("[EmployeeBadge] Erreur chargement logo");
              toast.error("Erreur de chargement du logo. Vérifiez ou re-téléchargez.");
            }}
          />
        ) : (
          <span className="text-lg font-bold">{companyData.name}</span>
        )}
      </div>
      <div className="flex">
        <div className="w-1/3">
          <img
            src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff`}
            alt={employee.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
          />
        </div>
        <div className="w-2/3 pl-4">
          <h3 className="text-lg font-semibold">{employee.name}</h3>
          <p className="text-sm text-gray-600">{employee.poste}</p>
          <p className="text-sm text-gray-600">{employee.department || "N/A"}</p>
          <p className="text-xs text-gray-500">Matricule: {employee.matricule || "N/A"}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <QRCodeCanvas id={`qr-${employee.matricule || employee.id}`} value={qrCodeUrl} size={80} />
      </div>
      <Button
        onClick={() => generateBadgePDF(employee, companyData)}
        icon={FiDownload}
        aria-label={`Télécharger le badge de ${employee.name}`}
        disabled={actionLoading}
      >
        Télécharger
      </Button>
    </div>
  );
};

export default EmployeeBadge;