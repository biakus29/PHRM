import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiUsers,
  FiShield,
  FiBarChart2,
  FiHome,
  FiLogOut,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiAlertTriangle,
  FiPlus,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiBook,
  FiBookOpen,
  FiList,
} from "react-icons/fi";
import { buildCommonOptions } from "../utils/chartConfig";
import SuperadminJobsPanel from "../components/SuperadminJobsPanel";
import SuperadminApplicationsPanel from "../components/SuperadminApplicationsPanel";
import FiscalSettings from "../components/FiscalSettings";
import BlogManagement from "../components/BlogManagement";
import Modal from "../components/Modal";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SuperAdminDashboard = () => {
  const [clients, setClients] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard"); // Remplace activeTab
  const [clientToEdit, setClientToEdit] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formations, setFormations] = useState([]);
  const [newFormation, setNewFormation] = useState({
    title: "",
    description: "",
    type: "initiale", // 'initiale' ou 'continue'
    duree: "",
    prerequis: [],
    contenu: [],
    isActive: true
  });
  const [editingFormationId, setEditingFormationId] = useState(null);
  // Filtres & recherche formations
  const [formationSearch, setFormationSearch] = useState("");
  const [formationTypeFilter, setFormationTypeFilter] = useState("Tous"); // Tous | initiale | continue
  const [formationStatusFilter, setFormationStatusFilter] = useState("Tous"); // Tous | Actives | Inactives
  const [formationSort, setFormationSort] = useState("recent"); // recent | titre
  const [showFormationModal, setShowFormationModal] = useState(false);
  const navigate = useNavigate();

  // Charger les formations
  useEffect(() => {
    if (!isSuperAdmin) return;
    
    const formationsRef = collection(db, "formations");
    const unsubscribe = onSnapshot(formationsRef, (snapshot) => {
      const formationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFormations(formationsData);
    });
    
    return () => unsubscribe();
  }, [isSuperAdmin]);

  // Dérivés UI pour formations: recherche, filtres, tri et stats
  const filteredFormations = useMemo(() => {
    const q = (formationSearch || "").toLowerCase().trim();
    let list = Array.isArray(formations) ? [...formations] : [];
    if (q) {
      list = list.filter(f =>
        (f.title || "").toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q)
      );
    }
    if (formationTypeFilter !== "Tous") {
      list = list.filter(f => (f.type || "").toLowerCase() === formationTypeFilter.toLowerCase());
    }
    if (formationStatusFilter !== "Tous") {
      const active = formationStatusFilter === "Actives";
      list = list.filter(f => !!f.isActive === active);
    }
    if (formationSort === "titre") {
      list.sort((a,b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      // recent
      const getDate = (f) => new Date(f.updatedAt || f.createdAt || 0).getTime();
      list.sort((a,b) => getDate(b) - getDate(a));
    }
    return list;
  }, [formations, formationSearch, formationTypeFilter, formationStatusFilter, formationSort]);

  const formationStats = useMemo(() => {
    const total = formations.length || 0;
    const actives = formations.filter(f => f.isActive).length;
    const inactives = total - actives;
    const initiale = formations.filter(f => (f.type || "").toLowerCase() === "initiale").length;
    const continueCnt = formations.filter(f => (f.type || "").toLowerCase() === "continue").length;
    return { total, actives, inactives, initiale, continueCnt };
  }, [formations]);

  // Vérification de l'authentification et du rôle
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        console.log("Aucun utilisateur connecté, redirection vers /super-admin-login");
        setIsLoading(false);
        navigate("/super-admin-login");
        return;
      }

      setUser(currentUser);
      console.log("Utilisateur connecté:", currentUser.uid);

      try {
        // Vérifier si l'utilisateur est superAdmin
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === "superAdmin") {
          setIsSuperAdmin(true);
          console.log("SuperAdmin confirmé, chargement des clients");
          const unsubscribeSnapshot = onSnapshot(
            collection(db, "clients"),
            async (snapshot) => {
              const clientsData = await Promise.all(
                snapshot.docs.map(async (clientDoc) => {
                  const clientData = { id: clientDoc.id, ...clientDoc.data() };
                  
                  // Compter le nombre d'employés pour ce client
                  try {
                    console.log(`🔍 Recherche employés pour client ${clientData.name} (clientId: ${clientDoc.id})`);
                    
                    // Les employés sont dans la sous-collection: clients/{clientId}/employees
                    const employeesSnapshot = await getDocs(
                      collection(db, "clients", clientDoc.id, "employees")
                    );
                    
                    clientData.currentUsers = employeesSnapshot.size;
                    
                    console.log(`✅ Client ${clientData.name}: ${clientData.currentUsers} employés trouvés`);
                    
                    if (employeesSnapshot.size > 0) {
                      const employeeNames = employeesSnapshot.docs.map(doc => doc.data().name || doc.id);
                      console.log(`   Employés: ${employeeNames.join(', ')}`);
                    }
                    
                    // Mettre à jour le document client avec le nombre réel d'employés
                    if (clientData.currentUsers !== clientDoc.data().currentUsers) {
                      console.log(`📝 Mise à jour de ${clientData.name}: ${clientDoc.data().currentUsers} → ${clientData.currentUsers}`);
                      await updateDoc(doc(db, "clients", clientDoc.id), {
                        currentUsers: clientData.currentUsers
                      });
                    }
                  } catch (error) {
                    console.error(`❌ Erreur comptage employés pour ${clientData.name}:`, error);
                    clientData.currentUsers = clientDoc.data().currentUsers || 0;
                  }
                  
                  return clientData;
                })
              );
              setClients(clientsData);
              setIsLoading(false);
            },
            (error) => {
              console.error("Erreur de chargement des clients:", error);
              setErrorMessage("Erreur de chargement des clients : " + error.message);
              setIsLoading(false);
            }
          );
          return () => unsubscribeSnapshot();
        } else {
          console.warn("Accès non autorisé pour UID:", currentUser.uid);
          setErrorMessage("Accès réservé aux super administrateurs.");
          setIsLoading(false);
          navigate("/super-admin-login");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle:", error);
        setErrorMessage("Erreur d'authentification : " + error.message);
        setIsLoading(false);
        navigate("/super-admin-login");
      }
    }, (error) => {
      console.error("Erreur d'authentification:", error);
      setErrorMessage("Erreur d'authentification : " + error.message);
      setIsLoading(false);
      navigate("/super-admin-login");
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Déconnexion
  // Gestion des formations
  const handleAddFormation = async (e) => {
    e.preventDefault();
    try {
      const formationData = {
        ...newFormation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (editingFormationId) {
        // Mise à jour d'une formation existante
        await updateDoc(doc(db, "formations", editingFormationId), formationData);
        setSuccessMessage("Formation mise à jour avec succès !");
        setEditingFormationId(null);
      } else {
        // Création d'une nouvelle formation
        await addDoc(collection(db, "formations"), formationData);
        setSuccessMessage("Formation ajoutée avec succès !");
      }
      
      // Réinitialiser le formulaire
      setNewFormation({
        title: "",
        description: "",
        type: "initiale",
        duree: "",
        prerequis: [],
        contenu: [],
        isActive: true
      });
      setShowFormationModal(false);
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la formation :", error);
      setErrorMessage("Erreur lors de l'enregistrement de la formation : " + error.message);
    }
  };
  
  const handleEditFormation = (formation) => {
    setNewFormation({
      title: formation.title,
      description: formation.description,
      type: formation.type,
      duree: formation.duree,
      prerequis: [...formation.prerequis],
      contenu: [...formation.contenu],
      isActive: formation.isActive
    });
    setEditingFormationId(formation.id);
    setShowFormationModal(true);
  };
  
  const handleDeleteFormation = async (formationId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) {
      try {
        await deleteDoc(doc(db, "formations", formationId));
        setSuccessMessage("Formation supprimée avec succès !");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de la formation :", error);
        setErrorMessage("Erreur lors de la suppression de la formation : " + error.message);
      }
    }
  };
  
  const toggleFormationStatus = async (formation) => {
    try {
      await updateDoc(doc(db, "formations", formation.id), {
        isActive: !formation.isActive,
        updatedAt: new Date().toISOString()
      });
      setSuccessMessage(`Formation ${formation.isActive ? "désactivée" : "activée"} avec succès !`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la formation :", error);
      setErrorMessage("Erreur lors de la mise à jour du statut : " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/super-admin-login");
    } catch (error) {
      setErrorMessage("Erreur lors de la déconnexion : " + error.message);
    }
  };

  // Générer un mot de passe sécurisé
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Valider l'email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Filtrage des clients
  const filteredClients = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [clients, searchQuery]
  );

  // Statistiques
  const { activeClients, inactiveClients, totalUsers, expiringLicenses } = useMemo(
    () => ({
      activeClients: clients.filter(
        (c) => c.isActive && new Date(c.licenseExpiry) > new Date()
      ).length,
      inactiveClients: clients.filter(
        (c) => !c.isActive || new Date(c.licenseExpiry) <= new Date()
      ).length,
      totalUsers: clients.reduce((sum, c) => sum + (c.currentUsers || 0), 0),
      expiringLicenses: clients.filter((c) => {
        const daysLeft = Math.ceil(
          (new Date(c.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 30 && daysLeft >= 0 && c.isActive;
      }),
    }),
    [clients]
  );

  // Gestion des clients
  const addClient = async (clientData) => {
    setIsLoading(true);
    resetMessages();
    try {
      // Validation des entrées
      if (!isValidEmail(clientData.email)) {
        throw new Error("Veuillez entrer un email valide.");
      }
      if (clientData.licenseMaxUsers < 1) {
        throw new Error("Le nombre maximum d'employés doit être supérieur à 0.");
      }
      const expiryDate = new Date(clientData.licenseExpiry);
      if (expiryDate <= new Date()) {
        throw new Error("La date d'expiration doit être dans le futur.");
      }

      // Générer un mot de passe si non fourni
      const password = clientData.password || generatePassword();
      if (password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
      }

      console.log("Tentative de création du client avec email:", clientData.email, "Mot de passe:", password);

      // Créer l'utilisateur
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          clientData.email,
          password
        );
        console.log("Utilisateur créé, UID:", userCredential.user.uid);
      } catch (authError) {
        console.error("Erreur Firebase Auth:", authError.code, authError.message);
        if (authError.code === "auth/email-already-in-use") {
          throw new Error("Cet email est déjà utilisé.");
        } else if (authError.code === "auth/weak-password") {
          throw new Error("Le mot de passe est trop faible (minimum 6 caractères).");
        } else if (authError.code === "auth/invalid-email") {
          throw new Error("L'email fourni est invalide.");
        }
        throw new Error("Erreur d'authentification : " + authError.message);
      }

      // Ajouter le document client
      const clientRef = doc(collection(db, "clients"));
      try {
        await setDoc(clientRef, {
          id: clientRef.id,
          name: clientData.name,
          email: clientData.email,
          adminUid: userCredential.user.uid,
          licenseMaxUsers: Number(clientData.licenseMaxUsers),
          licenseExpiry: clientData.licenseExpiry,
          currentUsers: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          loginCount: 0,
        });
        console.log("Document client créé, ID:", clientRef.id);
      } catch (firestoreError) {
        console.error("Erreur Firestore:", firestoreError.code, firestoreError.message);
        throw new Error("Erreur lors de la création du document client : " + firestoreError.message);
      }

      // Envoyer l'email avec les informations de connexion
      try {
        const response = await fetch("http://localhost:3001/send-client-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: clientData.email,
            password,
            name: clientData.name,
          }),
        });

        if (!response.ok) {
          console.warn("Échec de l'envoi de l'email:", response.statusText);
          setSuccessMessage("Client créé, mais échec de l'envoi de l'email.");
          setIsLoading(false);
          return;
        }
        console.log("Email de connexion envoyé à:", clientData.email);
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError.message);
        setSuccessMessage("Client créé, mais échec de l'envoi de l'email : " + emailError.message);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Client créé et informations de connexion envoyées par email.");
      setActiveSection("dashboard");
    } catch (error) {
      console.error("Erreur lors de la création du client:", error.message);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (clientData) => {
    setIsLoading(true);
    resetMessages();
    try {
      if (!isValidEmail(clientData.email)) {
        throw new Error("Veuillez entrer un email valide.");
      }
      if (clientData.licenseMaxUsers < 1) {
        throw new Error("Le nombre maximum d'employés doit être supérieur à 0.");
      }
      const expiryDate = new Date(clientData.licenseExpiry);
      if (expiryDate <= new Date()) {
        throw new Error("La date d'expiration doit être dans le futur.");
      }

      const clientRef = doc(db, "clients", clientToEdit.id);
      await updateDoc(clientRef, {
        name: clientData.name,
        email: clientData.email,
        licenseMaxUsers: Number(clientData.licenseMaxUsers),
        licenseExpiry: clientData.licenseExpiry,
        isActive: new Date(clientData.licenseExpiry) > new Date(),
      });

      setSuccessMessage("Client mis à jour avec succès");
      setClientToEdit(null);
      setActiveSection("dashboard");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error.message);
      setErrorMessage("Erreur : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClientStatus = async (clientId, currentStatus) => {
    setIsLoading(true);
    resetMessages();
    try {
      const clientRef = doc(db, "clients", clientId);
      await updateDoc(clientRef, { isActive: !currentStatus });
      setSuccessMessage(`Client ${!currentStatus ? "activé" : "désactivé"} avec succès`);
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error.message);
      setErrorMessage("Erreur : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (id, adminUid) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;
    setIsLoading(true);
    resetMessages();
    try {
      await deleteDoc(doc(db, "clients", id));
      try {
        const response = await fetch("http://localhost:3001/delete-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: adminUid }),
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression du compte utilisateur");
      } catch (error) {
        console.warn("Échec de la suppression de l'utilisateur auth:", error.message);
        setErrorMessage("Client supprimé, mais échec de la suppression du compte utilisateur.");
        return;
      }
      setSuccessMessage("Client et compte supprimés avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error.message);
      setErrorMessage("Erreur : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClient = (client) => {
    resetMessages();
    setClientToEdit(client);
    setActiveSection("licenses");
  };

  // Données pour les graphiques
  const statsData = useMemo(
    () => ({
      labels: filteredClients.map((c) => c.name),
      datasets: [
        {
          label: "Utilisation des licences (%)",
          data: filteredClients.map(
            (c) => ((c.currentUsers || 0) / c.licenseMaxUsers) * 100
          ),
          backgroundColor: "rgba(59, 130, 246, 0.4)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
        {
          label: "Connexions",
          data: filteredClients.map((c) => c.loginCount || 0),
          backgroundColor: "rgba(16, 185, 129, 0.4)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 1,
        },
      ],
    }),
    [filteredClients]
  );

  // Gestion du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      licenseMaxUsers: Number(e.target.maxUsers.value),
      licenseExpiry: e.target.expiry.value,
      ...(!clientToEdit && { password: e.target.password.value }),
    };

    if (clientToEdit) {
      updateClient(formData);
    } else {
      addClient(formData);
    }
  };

  // Afficher uniquement le chargement ou le tableau de bord
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  // Rendu du formulaire d'ajout/édition de formation
  const renderFormationForm = () => (
    <Card title={editingFormationId ? "Modifier la formation" : "Ajouter une formation"}>
      <form onSubmit={handleAddFormation} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ex: Initiation à la Paie"
              value={newFormation.title}
              onChange={(e) => setNewFormation({...newFormation, title: e.target.value})}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Nom court et clair, visible dans la liste.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
            <select
              className="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={newFormation.type}
              onChange={(e) => setNewFormation({...newFormation, type: e.target.value})}
              required
            >
              <option value="initiale">Formation initiale</option>
              <option value="continue">Formation continue</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="4"
            placeholder="Objectifs, public cible, résultats attendus..."
            value={newFormation.description}
            onChange={(e) => setNewFormation({...newFormation, description: e.target.value})}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Décrivez brièvement le contenu et les objectifs de la formation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ex: 2 jours, 1 semaine"
              value={newFormation.duree}
              onChange={(e) => setNewFormation({...newFormation, duree: e.target.value})}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={newFormation.isActive}
              onChange={(e) => setNewFormation({...newFormation, isActive: e.target.checked})}
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Formation active (visible)</label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prérequis</label>
            <textarea
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="4"
              placeholder="Un prérequis par ligne (ex: Notions de paie)"
              value={newFormation.prerequis.join('\n')}
              onChange={(e) => setNewFormation({
                ...newFormation,
                prerequis: e.target.value.split('\n').filter(p => p.trim() !== '')
              })}
            />
            {newFormation.prerequis.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {newFormation.prerequis.map((p, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{p}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (un point par ligne) <span className="text-red-500">*</span></label>
            <textarea
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="6"
              placeholder="Ex: Introduction\nRéglementation\nCas pratiques"
              value={newFormation.contenu.join('\n')}
              onChange={(e) => setNewFormation({
                ...newFormation,
                contenu: e.target.value.split('\n').filter(c => c.trim() !== '')
              })}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setEditingFormationId(null);
              setNewFormation({
                title: "",
                description: "",
                type: "initiale",
                duree: "",
                prerequis: [],
                contenu: [],
                isActive: true
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editingFormationId ? "Mettre à jour" : "Ajouter"} la formation
          </button>
        </div>
      </form>
    </Card>
  );

  // Rendu de la liste des formations
  const renderFormationsList = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Gestion des formations</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={formationSearch}
              onChange={(e) => setFormationSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full transition-colors"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <select
            value={formationTypeFilter}
            onChange={(e) => setFormationTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Tous">Tous les types</option>
            <option value="initiale">Initiale</option>
            <option value="continue">Continue</option>
          </select>
          <select
            value={formationStatusFilter}
            onChange={(e) => setFormationStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Actives">Actives</option>
            <option value="Inactives">Inactives</option>
          </select>
          <select
            value={formationSort}
            onChange={(e) => setFormationSort(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="recent">Plus récentes</option>
            <option value="titre">Par titre (A→Z)</option>
          </select>
          <button
            onClick={() => {
              setEditingFormationId(null);
              setNewFormation({
                title: "",
                description: "",
                type: "initiale",
                duree: "",
                prerequis: [],
                contenu: [],
                isActive: true
              });
              setShowFormationModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Nouvelle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-blue-600">{formationStats.total}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Actives</p>
          <p className="text-2xl font-bold text-green-600">{formationStats.actives}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Inactives</p>
          <p className="text-2xl font-bold text-red-600">{formationStats.inactives}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Types</p>
          <p className="text-sm text-gray-700">Initiale: {formationStats.initiale} • Continue: {formationStats.continueCnt}</p>
        </Card>
      </div>

      {formations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FiBookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune formation disponible</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par ajouter votre première formation.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setEditingFormationId(null);
                setNewFormation({
                  title: "",
                  description: "",
                  type: "initiale",
                  duree: "",
                  prerequis: [],
                  contenu: [],
                  isActive: true
                });
                setShowFormationModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              Ajouter une formation
            </button>
          </div>
        </div>
      ) : filteredFormations.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border">
          <p className="text-sm text-gray-600">Aucun résultat pour vos filtres/recherche.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredFormations.map((formation) => (
              <li key={formation.id} className={!formation.isActive ? "bg-gray-50" : ""}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="truncate">
                      <div className="flex items-center gap-2 text-sm">
                        <p className="font-medium text-blue-600 truncate">{formation.title}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${formation.type === 'initiale' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                          {formation.type === 'initiale' ? 'Initiale' : 'Continue'}
                        </span>
                        {!formation.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{formation.duree}</p>
                        </div>
                        {(formation.updatedAt || formation.createdAt) && (
                          <p>MAJ: {new Date(formation.updatedAt || formation.createdAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditFormation(formation)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiEdit className="-ml-0.5 mr-2 h-4 w-4" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFormationStatus(formation)}
                          className={`inline-flex items-center px-3 py-1.5 border ${
                            formation.isActive 
                              ? 'border-red-300 text-red-700 bg-white hover:bg-red-50' 
                              : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                          } shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          {formation.isActive ? (
                            <>
                              <FiX className="-ml-0.5 mr-2 h-4 w-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <FiCheck className="-ml-0.5 mr-2 h-4 w-4" />
                              Activer
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFormation(formation.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FiTrash2 className="-ml-0.5 mr-2 h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Rendu du tableau de bord
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 transition-colors duration-300">
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out w-64 lg:translate-x-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <FiShield className="h-5 w-5" />
            PHRM Admin
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-blue-500 lg:hidden"
            aria-label="Fermer la barre latérale"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { id: "dashboard", label: "Tableau de bord", icon: FiHome },
              { id: "gestion-clients", label: "Gestion des clients", icon: FiUsers },
              { id: "gestion-utilisateurs", label: "Utilisateurs", icon: FiUsers },
              { id: "gestion-roles", label: "Rôles et permissions", icon: FiShield },
              { id: "gestion-formations", label: "Formations", icon: FiBookOpen },
              { id: "statistiques", label: "Statistiques", icon: FiBarChart2 },
              { id: "parametres-fiscaux", label: "Paramètres fiscaux", icon: FiSettings },
              { id: "gestion-blog", label: "Gestion du blog", icon: FiBook },
            ].map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => {
                    setActiveSection(section.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors transform hover:scale-105 ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label={`Naviguer vers ${section.label}`}
                >
                  <section.icon className="h-5 w-5" />
                  <span>{section.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-600 hover:bg-gray-100 transition-colors transform hover:scale-105"
              aria-label="Déconnexion"
            >
              <FiLogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 animate-scale-in">
              {activeSection === "dashboard" && "Tableau de bord"}
              {activeSection === "gestion-clients" && "Gestion des clients"}
              {activeSection === "gestion-utilisateurs" && "Utilisateurs"}
              {activeSection === "gestion-roles" && "Rôles et permissions"}
              {activeSection === "gestion-formations" && "Gestion des formations"}
              {activeSection === "statistiques" && "Statistiques"}
              {activeSection === "parametres-fiscaux" && "Paramètres fiscaux"}
              {activeSection === "gestion-blog" && "Gestion du blog"}
            </h1>
            <p className="text-gray-600 text-sm animate-scale-in">
              {activeSection === "dashboard" && "Aperçu global de votre administration"}
              {activeSection === "gestion-clients" && "Liste complète de vos clients"}
              {activeSection === "gestion-utilisateurs" && "Liste des utilisateurs"}
              {activeSection === "gestion-roles" && "Gestion des rôles et permissions"}
              {activeSection === "gestion-formations" && "Gestion des formations"}
              {activeSection === "statistiques" && "Analyse des données d'utilisation"}
              {activeSection === "parametres-fiscaux" && "Configuration des taux CNPS, fiscaux et barèmes"}
              {activeSection === "gestion-blog" && "Créez et gérez les articles du blog"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block max-w-xs">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full transition-colors"
                aria-label="Rechercher des clients"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              icon={FiRefreshCw}
              aria-label="Rafraîchir la page"
            />
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-blue-500 lg:hidden"
              aria-label="Ouvrir la barre latérale"
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-lg border border-red-200 flex items-start gap-3 animate-fade-bounce">
            <FiAlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erreur</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-600 rounded-lg border border-green-200 flex items-start gap-3 animate-fade-bounce">
            <FiCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Succès</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {activeSection === "gestion-formations" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des formations</h1>
            <div className="grid grid-cols-1 gap-6">
              <div>
                {renderFormationsList()}
              </div>
            </div>
            <Modal isOpen={showFormationModal} onClose={() => { setShowFormationModal(false); setEditingFormationId(null); }}>
              {renderFormationForm()}
            </Modal>
          </div>
        )}

        {activeSection === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  title: "Clients actifs",
                  value: activeClients,
                  subtext: `+${Math.round((activeClients / (clients.length || 1)) * 100)}% du total`,
                  color: "blue-500",
                  icon: FiUsers,
                },
                {
                  title: "Clients inactifs",
                  value: inactiveClients,
                  subtext: inactiveClients > 0 ? "À vérifier" : "Aucun problème",
                  color: "red-500",
                  icon: FiUsers,
                },
                {
                  title: "Total employés",
                  value: totalUsers,
                  subtext: `~${Math.round(totalUsers / (activeClients || 1))} par client`,
                  color: "green-500",
                  icon: FiUsers,
                },
                {
                  title: "Licences expirant",
                  value: expiringLicenses.length,
                  subtext: expiringLicenses.length > 0 ? "Action requise" : "Tout est bon",
                  color: "yellow-500",
                  icon: FiShield,
                },
              ].map((stat, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className={`text-2xl font-bold text-${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className={`text-xs text-${stat.color.replace("500", "400")} mt-1`}>
                        {stat.subtext}
                      </p>
                    </div>
                    <div className={`p-2 bg-${stat.color.replace("500", "100")} text-${stat.color} rounded-lg`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {expiringLicenses.length > 0 && (
              <Card title="Alertes de licence" className="mb-6">
                <div className="space-y-3">
                  {expiringLicenses.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-600">
                          Expire le {new Date(client.licenseExpiry).toLocaleDateString()} (
                          {Math.ceil(
                            (new Date(client.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24)
                          )}{" "}
                          jours)
                        </p>
                      </div>
                      <Button
                        onClick={() => handleEditClient(client)}
                        variant="outline"
                        icon={FiEdit}
                        aria-label={`Renouveler la licence de ${client.name}`}
                      >
                        Renouveler
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeSection === "licenses" && (
          <Card className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {clientToEdit ? "Modifier une licence" : "Créer une nouvelle licence"}
              </h2>
              {clientToEdit && (
                <Button
                  onClick={() => setClientToEdit(null)}
                  variant="outline"
                  aria-label="Annuler la modification"
                >
                  Annuler
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={clientToEdit?.name}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    required
                    disabled={isLoading}
                    aria-label="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={clientToEdit?.email}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    required
                    disabled={isLoading}
                    aria-label="Email"
                  />
                </div>
              </div>

              {!clientToEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe (facultatif)
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Laisser vide pour générer automatiquement"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    disabled={isLoading}
                    aria-label="Mot de passe"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre max d'employés
                  </label>
                  <input
                    type="number"
                    name="maxUsers"
                    defaultValue={clientToEdit?.licenseMaxUsers || 10}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    required
                    min="1"
                    disabled={isLoading}
                    aria-label="Nombre maximum d'employés"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'expiration
                  </label>
                  <input
                    type="date"
                    name="expiry"
                    defaultValue={clientToEdit?.licenseExpiry}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    required
                    disabled={isLoading}
                    aria-label="Date d'expiration"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  icon={clientToEdit ? FiEdit : FiPlus}
                  aria-label={clientToEdit ? "Mettre à jour la licence" : "Créer une nouvelle licence"}
                >
                  {isLoading
                    ? "Chargement..."
                    : clientToEdit
                    ? "Mettre à jour"
                    : "Créer la licence"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeSection === "jobs" && (
          <SuperadminJobsPanel />
        )}

        {activeSection === "applications" && (
          <SuperadminApplicationsPanel />
        )}

        {activeSection === "gestion-blog" && (
          <BlogManagement />
        )}

        {activeSection === "gestion-clients" && (
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Liste des clients</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-xs">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full transition-colors"
                    aria-label="Rechercher des clients"
                  />
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                </div>
                <Button
                  onClick={() => {
                    setClientToEdit(null);
                    setActiveSection("licenses");
                  }}
                  icon={FiPlus}
                  aria-label="Ajouter un nouveau client"
                >
                  Ajouter un client
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employés
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client, index) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 animate-row-enter"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {client.currentUsers || 0}/{client.licenseMaxUsers}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((client.currentUsers || 0) / client.licenseMaxUsers) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.licenseExpiry).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const isExpired = client.licenseExpiry && new Date(client.licenseExpiry) <= new Date();
                          const isActive = client.isActive !== false && !isExpired;
                          return (
                            <button
                              onClick={() => toggleClientStatus(client.id, client.isActive)}
                              className={`px-2 py-1 rounded-full text-xs transition-colors transform hover:scale-105 ${
                                isActive
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                              aria-label={`Basculer le statut de ${client.name}`}
                            >
                              {isActive ? "Actif" : isExpired ? "Expiré" : "Inactif"}
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEditClient(client)}
                            variant="outline"
                            size="sm"
                            icon={FiEdit}
                            aria-label={`Modifier ${client.name}`}
                          />
                          <Button
                            onClick={() => handleDeleteClient(client.id, client.adminUid)}
                            variant="danger"
                            size="sm"
                            icon={FiTrash2}
                            aria-label={`Supprimer ${client.name}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeSection === "statistiques" && (
          <Card>
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Statistiques d'utilisation
            </h2>
            <div className="relative min-h-[300px]">
              <Bar
                data={statsData}
                options={{
                  ...buildCommonOptions({ title: "Statistiques d'utilisation" }),
                  plugins: {
                    ...buildCommonOptions({ title: "Statistiques d'utilisation" }).plugins,
                    legend: { position: "top", labels: { color: "#6B7280" } },
                  },
                  scales: {
                    x: {
                      ...buildCommonOptions({}).scales.x,
                      ticks: { color: "#6B7280" },
                      grid: { color: "#E5E7EB" },
                    },
                    y: {
                      ...buildCommonOptions({}).scales.y,
                      ticks: {
                        callback: (value) => `${value}%`,
                        color: "#6B7280",
                      },
                      grid: { color: "#E5E7EB" },
                    },
                  },
                  animation: {
                    duration: 1000,
                    easing: "easeOutBounce",
                    y: { from: 0 },
                  },
                }}
              />
            </div>
          </Card>
        )}

        {activeSection === "parametres-fiscaux" && (
          <FiscalSettings />
        )}

        {activeSection === "gestion-utilisateurs" && (
          <Card title="Gestion des utilisateurs">
            <p className="text-gray-600">Cette section permettra de gérer les comptes administrateurs et super-admins. (WIP)</p>
          </Card>
        )}

        {activeSection === "gestion-roles" && (
          <Card title="Rôles et permissions">
            <p className="text-gray-600">Cette section permettra de configurer les rôles et permissions. (WIP)</p>
          </Card>
        )}
      </main>
    </div>
  );
};

// Composant Card
const Card = ({ children, title, className = "", actions }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-200 animate-scale-in ${className}`}
  >
    {(title || actions) && (
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

// Composant Button
const Button = ({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  className = "",
  disabled = false,
  size = "md",
}) => {
  const variantClasses = {
    primary: `bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600`,
    secondary: `bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600`,
    success: `bg-gradient-to-r from-green-400 to-green-500 text-white hover:from-green-500 hover:to-green-600`,
    danger: `bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600`,
    outline: `border border-blue-500 text-blue-500 hover:bg-blue-50`,
    ghost: `text-gray-600 hover:bg-gray-100`,
  };

  const sizeClasses = {
    sm: `px-2 py-1 text-sm`,
    md: `px-4 py-2`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105 hover:shadow-md ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      aria-disabled={disabled}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default SuperAdminDashboard;