import React, { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import { BadgeModel1, BadgeModel2, BadgeModel3, BadgeModel4, BadgeModel5 } from "./EmployeeBadgePinterest";

const BadgeModels = {
  BadgeModel1,
  BadgeModel2,
  BadgeModel3,
  BadgeModel4,
  BadgeModel5,
};

const badgeModelLabels = [
  { key: "BadgeModel1", label: "Moderne" },
  { key: "BadgeModel2", label: "Bandeau coloré" },
  { key: "BadgeModel3", label: "Minimaliste" },
  { key: "BadgeModel4", label: "Vertical coloré" },
  { key: "BadgeModel5", label: "Photo fond" },
];

function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    if (!url) return resolve("");
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const ExportBadgePDF = ({ employee, companyData, qrCodeUrl, onSaveBadgeImage, initialModel = "BadgeModel1" }) => {
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [loading, setLoading] = useState(false);
  const badgeRef = useRef();
  const [localPhoto, setLocalPhoto] = useState("");
  const [localLogo, setLocalLogo] = useState("");

  useEffect(() => {
    loadImageAsBase64(employee.profilePicture).then(setLocalPhoto);
    loadImageAsBase64(companyData.logo).then(setLocalLogo);
  }, [employee.profilePicture, companyData.logo]);

  // Capture le badge visible à l'écran
  const generatePng = async () => {
    const element = badgeRef.current;
    if (!element) {
      toast.error("Aperçu du badge introuvable.");
      return null;
    }
    await new Promise(res => setTimeout(res, 200));
    try {
      setLoading(true);
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      return dataUrl;
    } catch (error) {
      console.error("Erreur lors de la génération du PNG :", error);
      toast.error("Échec de la génération du badge PNG.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBadge = async () => {
    const dataUrl = await generatePng();
    if (dataUrl && onSaveBadgeImage) {
      try {
        setLoading(true);
        await onSaveBadgeImage(employee.id, dataUrl);
        toast.success("Badge enregistré dans Firestore !");
      } catch (error) {
        console.error("Erreur Firestore :", error);
        toast.error("Erreur lors de l'enregistrement dans Firestore.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportPDF = async () => {
    const dataUrl = await generatePng();
    if (!dataUrl) return;
    try {
      setLoading(true);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [320, 210],
      });
      // Centrage de l'image plus petite dans le PDF
      const imgWidth = 280;
      const imgHeight = 184;
      const x = (320 - imgWidth) / 2;
      const y = (210 - imgHeight) / 2;
      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`badge_${employee.name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Badge PDF généré avec succès !");
    } catch (error) {
      console.error("Erreur PDF :", error);
      toast.error("Erreur lors de l'export PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPNG = async () => {
    const dataUrl = await generatePng();
    if (!dataUrl) return;
    // Centrage de l'image plus petite dans le PNG final
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 210;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 320, 210);
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = function () {
      const imgWidth = 280;
      const imgHeight = 184;
      const x = (320 - imgWidth) / 2;
      const y = (210 - imgHeight) / 2;
      ctx.drawImage(img, x, y, imgWidth, imgHeight);
      const finalDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = finalDataUrl;
      link.download = `badge_${employee.name.replace(/\s+/g, "_")}.png`;
      link.click();
    };
  };

  const BadgeComponent = BadgeModels[selectedModel];

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded shadow space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <label className="font-semibold">Modèle de badge :</label>
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="border rounded px-2 py-1"
          disabled={loading}
        >
          {badgeModelLabels.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      {/* Aperçu et export : badge unique, centré, même rendu à l'écran et à l'export */}
      <div className="flex justify-center">
        <div
          ref={badgeRef}
          style={{
            width: 400,
            height: 262,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            boxShadow: '0 0 8px 0 rgba(0,0,0,0.04)'
          }}
        >
          <BadgeComponent employee={{ ...employee, profilePicture: localPhoto }} companyData={{ ...companyData, logo: localLogo }} qrCodeUrl={qrCodeUrl} />
        </div>
      </div>
      <div className="flex gap-4 justify-center">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          onClick={handleSaveBadge}
          disabled={loading}
        >
          {loading ? "Enregistrement..." : "Enregistrer ce badge"}
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleExportPDF}
          disabled={loading}
        >
          {loading ? "Export..." : "Exporter en PDF"}
        </button>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          onClick={handleExportPNG}
          disabled={loading}
        >
          {loading ? "Export..." : "Exporter en PNG"}
        </button>
      </div>
    </div>
  );
};

export default ExportBadgePDF; 