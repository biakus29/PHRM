import React, { memo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import UserInfoDisplay from "../compoments/UserInfoDisplay";
import BadgeStudio from "./BadgeStudio";
import { generateQRCodeUrl, generateUserInfoQRCode, generateVCardQRCode } from "../utils/qrCodeUtils";

const QRSection = ({
  employees = [],
  companyData,
  selectedBadgeModel,
  setSelectedBadgeModel,
  selectedQRType,
  setSelectedQRType,
  onSaveBadgeImage,
  onOpenScanner,
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <label className="font-semibold">Modèle de badge :</label>
        <select
          value={selectedBadgeModel}
          onChange={(e) => setSelectedBadgeModel(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="BadgeModel1">Moderne</option>
          <option value="BadgeModel2">Bandeau coloré</option>
          <option value="BadgeModel3">Minimaliste</option>
          <option value="BadgeModel4">Vertical coloré</option>
          <option value="BadgeModel5">Photo fond</option>
        </select>

        <label className="font-semibold">Type de QR code :</label>
        <select
          value={selectedQRType}
          onChange={(e) => setSelectedQRType(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="userInfo">Informations utilisateur</option>
          <option value="vCard">Carte de contact (vCard)</option>
          <option value="url">URL simple</option>
        </select>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test QR Code</h3>
        <p className="text-sm text-gray-600 mb-3">
          Scannez ce QR code avec votre téléphone pour tester la fonctionnalité :
        </p>
        <div className="flex items-center gap-4">
          {employees.length > 0 && (
            <>
              <div className="bg-white p-2 rounded">
                <QRCodeCanvas
                  value={(() => {
                    switch (selectedQRType) {
                      case "userInfo":
                        return generateUserInfoQRCode(employees[0], companyData);
                      case "vCard":
                        return generateVCardQRCode(employees[0], companyData);
                      case "url":
                        return generateQRCodeUrl(employees[0], companyData);
                      default:
                        return generateUserInfoQRCode(employees[0], companyData);
                    }
                  })()}
                  size={120}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <div className="text-sm">
                <p>
                  <strong>Employé test :</strong> {employees[0].name}
                </p>
                <p>
                  <strong>Matricule :</strong> {employees[0].matricule || employees[0].id}
                </p>
                <p>
                  <strong>Poste :</strong> {employees[0].poste}
                </p>
                <p>
                  <strong>Type QR :</strong>{" "}
                  {selectedQRType === "userInfo"
                    ? "Informations utilisateur"
                    : selectedQRType === "vCard"
                    ? "Carte de contact"
                    : "URL simple"}
                </p>
                <div className="mt-2">
                  <UserInfoDisplay
                    userData={(() => {
                      switch (selectedQRType) {
                        case "userInfo":
                          return {
                            nom: employees[0].name,
                            matricule: employees[0].matricule || employees[0].id,
                            poste: employees[0].poste,
                            entreprise: companyData?.name,
                            email: employees[0].email,
                            telephone: employees[0].phone,
                            departement: employees[0].department,
                            dateEmbauche: employees[0].hireDate,
                            statut: employees[0].status || "Actif",
                          };
                        default:
                          return null;
                      }
                    })()}
                    qrType={selectedQRType}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={onOpenScanner}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Tester le Scanner QR Code
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {employees.map((emp) => (
          <BadgeStudio
            key={emp.id}
            employee={emp}
            companyData={companyData}
            qrType={selectedQRType}
            initialModel={selectedBadgeModel}
            onSaveBadgeImage={(employeeId, dataUrl) => onSaveBadgeImage(employeeId, dataUrl)}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(QRSection);
