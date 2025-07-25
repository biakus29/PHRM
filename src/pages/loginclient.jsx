import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const ClientAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Tentative de connexion avec:", email);

      // Tenter la connexion
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Utilisateur connecté, UID:", user.uid);

      // Chercher un document client où adminUid == user.uid
      const clientsQuery = query(
        collection(db, "clients"),
        where("adminUid", "==", user.uid)
      );
      const querySnapshot = await getDocs(clientsQuery);

      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0];
        const clientData = clientDoc.data();
        console.log("Document client trouvé:", clientData);

        if (!clientData.isActive) {
          await auth.signOut();
          console.warn("Compte client inactif, déconnexion");
          setErrorMessage("Votre compte est désactivé. Contactez l'administrateur.");
          setIsLoading(false);
          return;
        }

        // Mettre à jour les métadonnées
        await updateDoc(doc(db, "clients", clientDoc.id), {
          lastLogin: new Date().toISOString(),
          loginCount: (clientData.loginCount || 0) + 1,
        });
        console.log("Métadonnées client mises à jour, redirection vers /client-admin-dashboard");

        navigate("/client-admin-dashboard");
      } else {
        await auth.signOut();
        console.warn("Aucun document client trouvé pour adminUid:", user.uid);
        setErrorMessage(
          "Accès non autorisé. Veuillez utiliser un compte administrateur d'entreprise."
        );
      }
    } catch (error) {
      console.error("Erreur de connexion:", error.code, error.message);
      if (error.code === "auth/invalid-credential") {
        setErrorMessage("Email ou mot de passe incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Trop de tentatives. Réessayez plus tard.");
      } else {
        setErrorMessage("Erreur de connexion : " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setErrorMessage("Veuillez entrer votre email pour réinitialiser le mot de passe.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Envoi de l'email de réinitialisation pour:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("Email de réinitialisation envoyé avec succès");
      setErrorMessage(
        "Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception."
      );
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error.message);
      if (error.code === "auth/invalid-email") {
        setErrorMessage("Email invalide.");
      } else if (error.code === "auth/user-not-found") {
        setErrorMessage("Aucun compte trouvé avec cet email.");
      } else {
        setErrorMessage("Erreur : " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md sm:p-8 animate-scale-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-3xl">
          Connexion Administrateur Client
        </h2>
        {errorMessage && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm sm:text-base animate-fade-bounce">
            {errorMessage}
          </div>
        )}
        {isLoading && (
          <div className="text-center text-gray-500 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base sm:p-3 text-gray-900"
              placeholder="Entrez votre email"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base sm:p-3 text-gray-900"
              placeholder="Entrez votre mot de passe"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-300 text-sm sm:text-base sm:py-3"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={handlePasswordReset}
            className="text-blue-500 hover:text-blue-400 text-sm sm:text-base hover:underline"
            disabled={isLoading}
          >
            Mot de passe oublié ?
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center sm:text-sm">
          En vous connectant, vous acceptez notre politique de confidentialité
          conformément au RGPD.
        </p>
      </div>
    </div>
  );
};

export default ClientAdminLogin;