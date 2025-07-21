import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const googleProvider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      let user;
      if (isRegisterMode) {
        console.log("Tentative d'inscription avec:", email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "superAdmin",
          createdAt: new Date().toISOString(),
        });
        console.log("Utilisateur inscrit, document créé pour UID:", user.uid);
      } else {
        console.log("Tentative de connexion avec:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log("Utilisateur connecté, UID:", user.uid);
      }
      // Vérifier le rôle
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "superAdmin") {
        console.log("Rôle superAdmin confirmé, redirection vers /super-admin");
        navigate("/super-admin");
      } else {
        console.warn("Rôle non superAdmin ou document manquant:", userDoc.data());
        setErrorMessage("Accès réservé aux super administrateurs.");
      }
    } catch (error) {
      console.error("Erreur:", error.message);
      setErrorMessage(
        isRegisterMode ? "Erreur d'inscription : " + error.message : "Erreur de connexion : " + error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      console.log("Tentative de connexion/inscription avec Google");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Utilisateur Google connecté, UID:", user.uid);
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() && isRegisterMode) {
        await setDoc(userDocRef, {
          email: user.email,
          role: "superAdmin",
          createdAt: new Date().toISOString(),
        });
        console.log("Document utilisateur créé pour Google UID:", user.uid);
      }
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists() && updatedUserDoc.data().role === "superAdmin") {
        console.log("Rôle superAdmin confirmé (Google), redirection vers /super-admin");
        navigate("/super-admin");
      } else {
        console.warn("Rôle non superAdmin ou document manquant (Google):", updatedUserDoc.data());
        setErrorMessage("Accès réservé aux super administrateurs.");
      }
    } catch (error) {
      console.error("Erreur Google:", error.message);
      setErrorMessage("Erreur Google : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md animate-scale-in">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {isRegisterMode ? "Inscription Super Admin" : "Connexion Super Admin"}
        </h2>
        {errorMessage && (
          <div className="bg-red-100/70 text-red-600 p-3 rounded-lg mb-4 text-sm animate-fade-bounce">
            {errorMessage}
          </div>
        )}
        {isLoading && (
          <div className="text-center text-gray-500 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-800 text-sm placeholder-gray-500"
              placeholder="Entrez votre email"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-800 text-sm placeholder-gray-500"
              placeholder="Entrez votre mot de passe"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 text-sm disabled:bg-gray-300 transition-all transform hover:scale-105"
            disabled={isLoading}
          >
            {isRegisterMode ? "S'inscrire" : "Se connecter"}
          </button>
        </form>
        <div className="mt-5">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 text-sm flex items-center justify-center disabled:bg-gray-300 transition-all transform hover:scale-105"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.854L12.545,10.239z" />
            </svg>
            {isRegisterMode ? "S'inscrire avec Google" : "Se connecter avec Google"}
          </button>
        </div>
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage("");
            }}
            className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
          >
            {isRegisterMode ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;