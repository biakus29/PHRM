import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { query, collection, where, getDocs } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmployeeLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Connexion
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      if (!email || !password) {
        setErrorMessage("Veuillez remplir tous les champs.");
        toast.error("Veuillez remplir tous les champs.");
        return;
      }

      // Vérifier si le mot de passe est correct
      if (password !== "123456") {
        setErrorMessage("Mot de passe incorrect.");
        toast.error("Mot de passe incorrect.");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        console.log("Tentative de connexion avec email:", email);
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        let employeeData = null;
        let clientId = null;
        let employeeId = null;

        for (const clientDoc of clientsSnapshot.docs) {
          const employeeQuery = query(
            collection(db, "clients", clientDoc.id, "employees"),
            where("email", "==", email)
          );
          const employeeSnapshot = await getDocs(employeeQuery);
          if (!employeeSnapshot.empty) {
            employeeData = employeeSnapshot.docs[0].data();
            employeeId = employeeSnapshot.docs[0].id;
            clientId = clientDoc.id;
            break;
          }
        }

        if (employeeData && clientId && employeeId) {
          console.log("Employé trouvé:", { clientId, employeeId, email });
          toast.success("Connexion réussie ! Redirection...");
          setTimeout(() => {
            navigate("/employee-dashboard", {
              state: { clientId, employeeId, email },
            });
          }, 1500);
        } else {
          setErrorMessage("Aucun compte employé trouvé avec cet email.");
          toast.error("Aucun compte employé trouvé.");
          console.error("Aucun employé trouvé pour email:", email);
        }
      } catch (error) {
        console.error("Erreur connexion :", error.code, error.message);
        setErrorMessage("Erreur de connexion : " + error.message);
        toast.error("Erreur : " + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md sm:p-8 animate-scale-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center sm:text-3xl">
          Connexion Employé
        </h2>

        {errorMessage && (
          <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm sm:text-base">
            {errorMessage}
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
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              required
              disabled={isLoading}
              placeholder="votre.email@example.com"
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
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              required
              disabled={isLoading}
              placeholder="••••••"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 text-sm sm:text-base"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;