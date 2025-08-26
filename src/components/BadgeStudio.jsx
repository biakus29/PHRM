import React, { useMemo } from "react";
import ExportBadgePDF from "../compoments/ExportBadgePDF";
import { generateQRCodeUrl, generateUserInfoQRCode, generateVCardQRCode } from "../utils/qrCodeUtils";

/*
  Props:
  - employee
  - companyData
  - qrType: "userInfo" | "vCard" | "url"
  - initialModel (badge template key)
  - onSaveBadgeImage(employeeId, dataUrl): Promise<void>
*/
export default function BadgeStudio({ employee, companyData, qrType = "userInfo", initialModel, onSaveBadgeImage }) {
  const qrCodeUrl = useMemo(() => {
    switch (qrType) {
      case "userInfo":
        return generateUserInfoQRCode(employee, companyData);
      case "vCard":
        return generateVCardQRCode(employee, companyData);
      case "url":
        return generateQRCodeUrl(employee, companyData);
      default:
        return generateUserInfoQRCode(employee, companyData);
    }
  }, [qrType, employee, companyData]);

  return (
    <ExportBadgePDF
      key={employee.id}
      employee={employee}
      companyData={companyData}
      qrCodeUrl={qrCodeUrl}
      initialModel={initialModel}
      onSaveBadgeImage={onSaveBadgeImage}
    />
  );
}
