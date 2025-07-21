import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // Assurez-vous que votre configuration Firebase est correcte
import { toast } from "react-toastify";

const BadgeCustomizationForm = ({ companyId, onConfigUpdate }) => {
  const [badgeConfig, setBadgeConfig] = useState({
    fields: {
      name: true,
      poste: true,
      department: false,
      matricule: true,
    },
    styles: {
      borderColor: "#3B82F6", // Bleu par défaut
      qrCodeSize: 80,
    },
  });

  // Charger la configuration existante depuis Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, "clients", companyId, "settings", "badgeConfig");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setBadgeConfig(configSnap.data());
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration :", error);
        toast.error("Erreur de chargement de la configuration.");
      }
    };
    fetchConfig();
  }, [companyId]);

  // Mettre à jour la configuration localement
  const handleFieldChange = (field) => {
    setBadgeConfig((prev) => ({
      ...prev,
      fields: { ...prev.fields, [field]: !prev.fields[field] },
    }));
  };

  const handleStyleChange = (style, value) => {
    setBadgeConfig((prev) => ({
      ...prev,
      styles: { ...prev.styles, [style]: value },
    }));
  };

  // Sauvegarder la configuration dans Firestore
  const saveConfig = async (e) => {
    e.preventDefault();
    try {
      const configRef = doc(db, "clients", companyId, "settings", "badgeConfig");
      await setDoc(configRef, badgeConfig);
      onConfigUpdate(badgeConfig); // Informer le parent de la mise à jour
      toast.success("Configuration du badge sauvegardée !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la configuration :", error);
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <form onSubmit={saveConfig} className="bg-white p-6 rounded-xl shadow-md space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Personnalisation du Badge</h3>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Champs à inclure</h4>
        {Object.keys(badgeConfig.fields).map((field) => (
          <label key={field} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={badgeConfig.fields[field]}
              onChange={() => handleFieldChange(field)}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">
              {field === "name" ? "Nom" : field === "poste" ? "Poste" : field === "department" ? "Département" : "Matricule"}
            </span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Styles</h4>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Couleur de la bordure :</label>
          <input
            type="color"
            value={badgeConfig.styles.borderColor}
            onChange={(e) => handleStyleChange("borderColor", e.target.value)}
            className="h-8 w-8 rounded border-gray-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Taille du QR code :</label>
          <select
            value={badgeConfig.styles.qrCodeSize}
            onChange={(e) => handleStyleChange("qrCodeSize", Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={60}>Petit (60px)</option>
            <option value={80}>Moyen (80px)</option>
            <option value={100}>Grand (100px)</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Sauvegarder la configuration
      </button>
    </form>
  );
};

export default BadgeCustomizationForm;