import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CheckCircle, X } from "lucide-react";

const DemoSignup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setErrorMessage("Le prénom est requis.");
      return false;
    }
    if (!formData.lastName.trim()) {
      setErrorMessage("Le nom est requis.");
      return false;
    }
    if (!formData.companyName.trim()) {
      setErrorMessage("Le nom de l'entreprise est requis.");
      return false;
    }
    if (!formData.email.includes("@")) {
      setErrorMessage("Veuillez entrer une adresse email valide.");
      return false;
    }
    if (formData.password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return false;
    }
    return true;
  };

  const handleDemoSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Créer un email temporaire unique pour la démo
      const demoEmail = `demo_${Date.now()}@${formData.email.split('@')[1]}`;
      const demoPassword = formData.password;

      // Créer l'utilisateur Firebase avec l'email temporaire
      const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
      const user = userCredential.user;

      // Mettre à jour le profil utilisateur
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // Calculer la date d'expiration (30 jours à partir de maintenant)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Créer le document démo dans la collection `clients` (compte limité)
      // Le document est un client avec `isDemo: true` pour permettre un basculement
      await addDoc(collection(db, "clients"), {
        adminUid: user.uid,
        name: formData.companyName,
        originalAdminEmail: formData.email,
        contactEmail: formData.email,
        contactPhone: "",
        address: "",
        sector: "Démonstration",
        createdAt: serverTimestamp(),
        // Licence démo : 30 jours
        licenseExpiry: expirationDate,
        // Limitation : 2 utilisateurs/employés
        licenseMaxUsers: 2,
        currentUsers: 1,
        isActive: true,
        // Flag demo pour distinguer d'un vrai client
        isDemo: true,
        // Fonctionnalités restreintes en mode démo (ex: export PDF désactivé)
        restrictedFeatures: ['export_pdf', 'export_documents', 'external_backup'],
        // Petites métriques fictives pour l'affichage
        demoMetrics: {
          employeeCount: 2,
          payrollGenerated: 0,
          complianceRate: 100,
          lastPayrollDate: null,
        }
      });

      setSuccessMessage("Compte démo créé avec succès ! Vous allez être redirigé...");

      // Rediriger vers le dashboard client après 2 secondes
      setTimeout(() => {
        navigate("/client-admin-dashboard");
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de la création du compte démo:", error);

      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("Cet email est déjà utilisé. Veuillez en choisir un autre.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Le mot de passe est trop faible.");
      } else {
        setErrorMessage("Erreur lors de la création du compte : " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Essai Gratuit 30 Jours
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Créez votre compte démo et explorez PRHM gratuitement pendant 30 jours
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleDemoSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Nom de l'entreprise
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre entreprise"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Minimum 8 caractères"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Répétez le mot de passe"
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                J'accepte les{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  conditions d'utilisation
                </button>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Création du compte...
                </div>
              ) : (
                "Commencer l'essai gratuit"
              )}
            </button>
          </form>

          {/* Terms Modal */}
          {showTerms && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Conditions d'utilisation - Compte Démo
                    </h3>
                    <button
                      onClick={() => setShowTerms(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-3">
                    <p>• Ce compte démo est valide pendant 30 jours à compter de sa création.</p>
                    <p>• Toutes les données sont fictives et seront supprimées automatiquement à l'expiration.</p>
                    <p>• L'accès est limité aux fonctionnalités de démonstration.</p>
                    <p>• Vous ne pouvez pas exporter ou sauvegarder des données réelles.</p>
                    <p>• PHRM se réserve le droit de suspendre l'accès à tout moment.</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setShowTerms(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      J'ai compris
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoSignup;
