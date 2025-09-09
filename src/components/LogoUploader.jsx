import React, { useState } from "react";
import { toast } from "react-toastify";

const LogoUploader = ({ companyId, onLogoUploaded }) => {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = (file, companyId, callback) => {
    console.log(`[handleLogoUpload] Début upload logo, type: ${file.type}, taille: ${(file.size / 1024).toFixed(2)} Ko`);
    if (!file.type.match(/image\/(png|jpeg)/)) {
      console.warn("[handleLogoUpload] Format d'image non supporté:", file.type);
      toast.error("Format d'image non supporté. Utilisez PNG ou JPEG.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      console.warn("[handleLogoUpload] Fichier trop volumineux:", (file.size / 1024 / 1024).toFixed(2), "MB");
      toast.error("Le fichier est trop volumineux. Maximum 5MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const logoData = e.target.result;
        localStorage.setItem(`logo_${companyId}`, logoData);
        console.log(`[handleLogoUpload] Logo sauvegardé avec succès pour l'entreprise ${companyId}`);
        toast.success("Logo téléchargé avec succès !");
        if (callback) callback(logoData);
        if (onLogoUploaded) onLogoUploaded(logoData);
      } catch (error) {
        console.error("[handleLogoUpload] Erreur lors de la sauvegarde du logo:", error);
        toast.error("Erreur lors de la sauvegarde du logo");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      console.error("[handleLogoUpload] Erreur lors de la lecture du fichier");
      toast.error("Erreur lors de la lecture du fichier");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Logo de l'entreprise</label>
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file && companyId) {
            handleLogoUpload(file, companyId);
          }
        }}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        disabled={uploading}
      />
      {uploading && (
        <div className="text-sm text-blue-600">Téléchargement en cours...</div>
      )}
    </div>
  );
};

export default LogoUploader;
