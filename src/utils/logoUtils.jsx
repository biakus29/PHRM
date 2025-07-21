// src/utils/logoUtils.js
import { toast } from "react-toastify";

// Calcule la taille totale du localStorage en Mo
export const getLocalStorageSize = () => {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += ((localStorage[key].length + key.length) * 2);
    }
  }
  const sizeInMB = total / 1024 / 1024;
  console.log(`[logoUtils] Taille actuelle du localStorage : ${sizeInMB.toFixed(2)} Mo`);
  return sizeInMB;
};

// Charge et met en cache le logo dans le localStorage
export const handleLogoUpload = (file, companyId, callback) => {
  console.log(`[handleLogoUpload] Début téléchargement logo pour companyId: ${companyId}`);
  if (!file) {
    console.warn("[handleLogoUpload] Aucun fichier sélectionné");
    toast.error("Veuillez sélectionner un fichier image.");
    return;
  }

  // Vérification du type de fichier
  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    console.warn(`[handleLogoUpload] Type de fichier non supporté: ${file.type}`);
    toast.error("Seuls les formats JPEG et PNG sont supportés.");
    return;
  }

  // Vérification de la taille du fichier (limite à 2 Mo)
  const maxSizeMB = 2;
  if (file.size / 1024 / 1024 > maxSizeMB) {
    console.warn(`[handleLogoUpload] Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)} Mo`);
    toast.error(`L'image ne doit pas dépasser ${maxSizeMB} Mo.`);
    return;
  }

  // Vérification de l'espace restant dans localStorage
  const currentStorageSize = getLocalStorageSize();
  const maxStorageSize = 5; // Limite typique du localStorage
  if (currentStorageSize + file.size / 1024 / 1024 > maxStorageSize) {
    console.warn(`[handleLogoUpload] Espace localStorage insuffisant: ${currentStorageSize.toFixed(2)} Mo utilisés`);
    toast.error("Espace de stockage local insuffisant. Supprimez des données ou réduisez la taille de l'image.");
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      localStorage.setItem(`logo_${companyId}`, dataUrl);
      console.log(`[handleLogoUpload] Logo enregistré dans localStorage pour companyId: ${companyId}`);
      callback(dataUrl);
    };
    reader.onerror = () => {
      console.error("[handleLogoUpload] Erreur lecture fichier");
      toast.error("Erreur lors de la lecture du fichier image.");
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error(`[handleLogoUpload] Erreur: ${error.message}`);
    toast.error(`Erreur téléchargement logo: ${error.message}`);
  }
};

// Récupère le logo depuis le localStorage
export const cacheLogo = (companyId) => {
  console.log(`[cacheLogo] Récupération logo pour companyId: ${companyId}`);
  const logo = localStorage.getItem(`logo_${companyId}`);
  if (logo) {
    console.log("[cacheLogo] Logo trouvé dans localStorage");
    return logo;
  }
  console.warn("[cacheLogo] Aucun logo trouvé dans localStorage");
  return null;
};

// Supprime le logo du localStorage
export const removeLogo = (companyId) => {
  console.log(`[removeLogo] Suppression logo pour companyId: ${companyId}`);
  try {
    localStorage.removeItem(`logo_${companyId}`);
    console.log("[removeLogo] Logo supprimé avec succès");
    toast.success("Logo supprimé du stockage local.");
  } catch (error) {
    console.error(`[removeLogo] Erreur: ${error.message}`);
    toast.error(`Erreur suppression logo: ${error.message}`);
  }
};