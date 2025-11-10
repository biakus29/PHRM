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

      setIsLoading(true);
      setErrorMessage("");

      try {
        console.log("Tentative de connexion avec email:", email);
        
        // Normaliser l'email pour la recherche (minuscules, sans espaces)
        const normalizedEmail = email.trim().toLowerCase();
        
        // Rechercher l'employé dans Firestore par email (email personnel ou email interne)
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        let employeeData = null;
        let clientId = null;
        let employeeId = null;
        let foundByInternalEmail = false;

        // Parcourir tous les clients pour trouver l'employé
        for (const clientDoc of clientsSnapshot.docs) {
          // Chercher d'abord par email personnel (recherche exacte)
          try {
            const employeeQueryByEmail = query(
              collection(db, "clients", clientDoc.id, "employees"),
              where("email", "==", normalizedEmail)
            );
            const employeeSnapshotByEmail = await getDocs(employeeQueryByEmail);
            
            if (!employeeSnapshotByEmail.empty) {
              const employeeDoc = employeeSnapshotByEmail.docs[0];
              employeeData = employeeDoc.data();
              employeeId = employeeDoc.id;
              clientId = clientDoc.id;
              foundByInternalEmail = false;
              console.log("Employé trouvé par email personnel:", { clientId, employeeId, email: employeeData.email });
              break;
            }
          } catch (error) {
            console.warn("Erreur lors de la recherche par email personnel:", error);
          }

          // Si pas trouvé par email personnel, chercher par email interne (recherche exacte)
          try {
            const employeeQueryByInternalEmail = query(
              collection(db, "clients", clientDoc.id, "employees"),
              where("internalEmail", "==", normalizedEmail)
            );
            const employeeSnapshotByInternalEmail = await getDocs(employeeQueryByInternalEmail);
            
            if (!employeeSnapshotByInternalEmail.empty) {
              const employeeDoc = employeeSnapshotByInternalEmail.docs[0];
              employeeData = employeeDoc.data();
              employeeId = employeeDoc.id;
              clientId = clientDoc.id;
              foundByInternalEmail = true;
              console.log("✅ Employé trouvé par email interne (requête where):", { clientId, employeeId, internalEmail: employeeData.internalEmail });
              break;
            } else {
              console.log(`Aucun résultat pour la requête where("internalEmail", "==", "${normalizedEmail}") dans le client ${clientDoc.id}`);
            }
          } catch (error) {
            console.warn("⚠️ Erreur lors de la recherche par email interne (requête where):", error);
            console.warn("Détails:", error.code, error.message);
            // Si c'est une erreur d'index, on continuera avec la recherche manuelle
            if (error.code === 'failed-precondition') {
              console.log("Index Firestore manquant pour internalEmail, utilisation de la recherche manuelle...");
            }
          }

          // Si toujours pas trouvé, faire une recherche manuelle dans tous les employés (fallback)
          // pour gérer les cas où il y a des différences de casse ou d'espaces
          try {
            const allEmployeesQuery = query(
              collection(db, "clients", clientDoc.id, "employees")
            );
            const allEmployeesSnapshot = await getDocs(allEmployeesQuery);
            
            console.log(`Recherche manuelle dans ${allEmployeesSnapshot.docs.length} employés pour le client ${clientDoc.id}`);
            
            for (const empDoc of allEmployeesSnapshot.docs) {
              const empData = empDoc.data();
              const empEmail = (empData.email || "").trim().toLowerCase();
              const empInternalEmail = (empData.internalEmail || "").trim().toLowerCase();
              
              // Log pour déboguer
              if (empInternalEmail || empEmail) {
                console.log(`Vérification employé ${empData.name}: email="${empEmail}", internalEmail="${empInternalEmail}" vs recherché="${normalizedEmail}"`);
              }
              
              if (empEmail === normalizedEmail || empInternalEmail === normalizedEmail) {
                employeeData = empData;
                employeeId = empDoc.id;
                clientId = clientDoc.id;
                foundByInternalEmail = empInternalEmail === normalizedEmail;
                console.log("✅ Employé trouvé par recherche manuelle:", { 
                  clientId, 
                  employeeId, 
                  name: empData.name,
                  email: empData.email,
                  internalEmail: empData.internalEmail,
                  foundByInternalEmail 
                });
                break;
              }
            }
            
            if (employeeData) {
              break;
            } else {
              console.log(`Aucun employé trouvé dans le client ${clientDoc.id} avec l'email ${normalizedEmail}`);
            }
          } catch (error) {
            console.error("Erreur lors de la recherche manuelle:", error);
            console.error("Détails de l'erreur:", error.code, error.message);
          }
        }

        // Vérifier si l'employé a été trouvé
        if (!employeeData || !clientId || !employeeId) {
          console.error("❌ Aucun employé trouvé pour email:", normalizedEmail);
          console.log("Recherche effectuée dans tous les clients");
          console.log("Nombre total de clients vérifiés:", (await getDocs(collection(db, "clients"))).docs.length);
          
          // Afficher un message d'erreur plus informatif
          setErrorMessage(
            `Aucun compte employé trouvé avec l'email "${email}". ` +
            `Vérifiez que l'email interne a été généré pour cet employé dans le tableau de bord administrateur.`
          );
          toast.error("Aucun compte employé trouvé avec cet email.");
          setIsLoading(false);
          return;
        }
        
        console.log("✅ Employé trouvé:", {
          name: employeeData.name,
          email: employeeData.email,
          internalEmail: employeeData.internalEmail,
          clientId,
          employeeId
        });

        // Vérifier que l'email correspond exactement (case-insensitive)
        const employeeEmail = employeeData.email || "";
        const employeeInternalEmail = employeeData.internalEmail || "";
        const emailLower = email.toLowerCase();
        
        const emailMatches = employeeEmail.toLowerCase() === emailLower;
        const internalEmailMatches = employeeInternalEmail.toLowerCase() === emailLower;
        
        if (!emailMatches && !internalEmailMatches) {
          setErrorMessage("Email incorrect.");
          toast.error("Email incorrect.");
          setIsLoading(false);
          return;
        }

        // Vérifier le mot de passe
        const currentPassword = employeeData.currentPassword || employeeData.initialPassword || "123456";
        
        if (password !== currentPassword) {
          setErrorMessage("Mot de passe incorrect.");
          toast.error("Mot de passe incorrect.");
          setIsLoading(false);
          return;
        }

        // Connexion réussie
        const loginEmail = foundByInternalEmail ? employeeData.internalEmail : employeeData.email;
        console.log("Connexion réussie:", { clientId, employeeId, email: loginEmail, foundByInternalEmail });
        
        if (foundByInternalEmail) {
          toast.success(`Connexion réussie avec l'email interne ! Redirection...`);
        } else {
          toast.success("Connexion réussie ! Redirection...");
        }
        
        setTimeout(() => {
          navigate("/employee-dashboard", {
            state: { clientId, employeeId, email: loginEmail },
          });
        }, 1500);
        
      } catch (error) {
        console.error("Erreur connexion :", error.code, error.message);
        
        // Gérer spécifiquement les erreurs de permissions
        if (error.code === 'permission-denied') {
          setErrorMessage("Accès refusé. Les règles de sécurité Firestore ne permettent pas la connexion. Veuillez contacter votre administrateur.");
          toast.error("Accès refusé. Contactez votre administrateur.");
        } else {
          setErrorMessage("Erreur de connexion : " + error.message);
          toast.error("Erreur : " + error.message);
        }
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
              placeholder="email@entreprise.com ou email.interne@entreprise.com"
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