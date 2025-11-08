import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiEdit, FiTrash2, FiPlus, FiSave, FiX, FiUpload, FiUser, FiImage } from "react-icons/fi";
import { BookOpen, User as UserIcon, Image as ImageIcon, Settings, Save } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

const BlogManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "Super Admin",
  });
  const [superAdminInfo, setSuperAdminInfo] = useState({
    name: "Super Admin",
    photo: "/directeur.jpg",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Récupérer les informations du super admin
    const fetchSuperAdminInfo = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.blogSettings) {
              setSuperAdminInfo({
                name: userData.blogSettings.name || "Super Admin",
                photo: userData.blogSettings.photo || "/directeur.jpg",
              });
              setFormData((prev) => ({
                ...prev,
                author: userData.blogSettings.name || "Super Admin",
              }));
            } else {
              setSuperAdminInfo({
                name: userData.name || userData.displayName || "Super Admin",
                photo: userData.photoURL || userData.photo || "/directeur.jpg",
              });
            }
          }
        }
      } catch (error) {
        // Ne pas afficher l'erreur si c'est juste une question de permissions
        if (error.code !== 'permission-denied') {
          console.error("Erreur lors du chargement des infos admin:", error);
        }
      }
    };

    fetchSuperAdminInfo();

    const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        // Ne pas afficher l'erreur si c'est juste une question de permissions
        if (error.code !== 'permission-denied') {
          console.error("Erreur lors du chargement des articles:", error);
        }
        // Si c'est une erreur de permissions, afficher un message approprié
        if (error.code === 'permission-denied') {
          setErrorMessage("Vous n'avez pas les permissions nécessaires pour gérer le blog.");
        } else {
          setErrorMessage("Erreur lors du chargement des articles");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author: superAdminInfo.name || "Super Admin",
    });
    setEditingPost(null);
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner une image valide");
      return;
    }

    setUploadingPhoto(true);
    resetMessages();

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      // Upload de la photo
      const photoRef = ref(storage, `blog/admin-photo-${currentUser.uid}-${Date.now()}`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);

      // Mettre à jour les informations du super admin
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentData = userDoc.data();
        await updateDoc(userRef, {
          blogSettings: {
            name: currentData.blogSettings?.name || superAdminInfo.name,
            photo: photoURL,
          },
        });
        setSuperAdminInfo((prev) => ({ ...prev, photo: photoURL }));
        setSuccessMessage("Photo mise à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      setErrorMessage("Erreur lors de l'upload de la photo: " + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAdminInfo = async () => {
    resetMessages();
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          blogSettings: {
            name: superAdminInfo.name,
            photo: superAdminInfo.photo,
          },
        });
        setFormData((prev) => ({
          ...prev,
          author: superAdminInfo.name,
        }));
        setSuccessMessage("Informations mises à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setErrorMessage("Erreur lors de la sauvegarde: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage("Le titre et le contenu sont requis");
      return;
    }

    try {
      if (editingPost) {
        // Mettre à jour un article existant
        const postRef = doc(db, "blogPosts", editingPost.id);
        await updateDoc(postRef, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          author: formData.author.trim() || superAdminInfo.name,
          updatedAt: new Date(),
        });
        setSuccessMessage("Article mis à jour avec succès");
      } else {
        // Créer un nouvel article
        await addDoc(collection(db, "blogPosts"), {
          title: formData.title.trim(),
          content: formData.content.trim(),
          author: formData.author.trim() || superAdminInfo.name,
          likes: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setSuccessMessage("Article créé avec succès");
      }
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setErrorMessage("Erreur lors de la sauvegarde: " + error.message);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      author: post.author || superAdminInfo.name,
    });
    setIsEditing(true);
    resetMessages();
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "blogPosts", postId));
      setSuccessMessage("Article supprimé avec succès");
      if (editingPost?.id === postId) {
        resetForm();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setErrorMessage("Erreur lors de la suppression: " + error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-100 text-red-600 rounded-lg border border-red-200 animate-fade-in">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-100 text-green-600 rounded-lg border border-green-200 animate-fade-in">
          <p className="font-medium">Succès</p>
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {/* Paramètres du Super Admin */}
      <Card className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Paramètres du Blog
          </h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Photo */}
            <div className="flex flex-col items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="relative">
                <img
                  src={superAdminInfo.photo}
                  onError={(e) => { 
                    e.target.src = '/logophrm.png'; 
                  }}
                  alt={superAdminInfo.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-blue-200 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white"></div>
              </div>
              <label className="cursor-pointer w-full sm:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm w-full sm:w-auto">
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">
                    {uploadingPhoto ? "Upload en cours..." : "Changer la photo"}
                  </span>
                </div>
              </label>
            </div>

            {/* Nom */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'auteur
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={superAdminInfo.name}
                  onChange={(e) =>
                    setSuperAdminInfo({ ...superAdminInfo, name: e.target.value })
                  }
                  className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                  placeholder="Nom du super admin"
                />
                <Button
                  onClick={handleSaveAdminInfo}
                  icon={Save}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Formulaire */}
      <Card className="hover:shadow-xl transition-shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {isEditing ? "Modifier l'article" : "Créer un nouvel article"}
            </h2>
          </div>
          {isEditing && (
            <Button
              onClick={resetForm}
              variant="outline"
              icon={FiX}
              size="sm"
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm sm:text-base"
              required
              placeholder="Titre de l'article"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auteur
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm sm:text-base"
              placeholder="Nom de l'auteur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm sm:text-base resize-y"
              rows="10"
              required
              placeholder="Contenu de l'article (HTML supporté)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous pouvez utiliser du HTML pour formater le contenu
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              icon={isEditing ? FiSave : FiPlus}
              className="flex-1 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {isEditing ? "Mettre à jour" : "Publier"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Liste des articles */}
      <Card>
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Articles publiés ({posts.length})
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg font-medium">
              Aucun article publié pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors break-words">
                      {post.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-500 mb-2">
                      <span className="bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
                        {formatDate(post.createdAt)}
                      </span>
                      {post.author && (
                        <span className="bg-green-50 px-2 py-1 rounded truncate max-w-[200px]">
                          Par {post.author}
                        </span>
                      )}
                      <span className="bg-red-50 px-2 py-1 rounded whitespace-nowrap">
                        {post.likes || 0} likes
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">
                      {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}
                      ...
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => handleEdit(post)}
                      variant="outline"
                      size="sm"
                      icon={FiEdit}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline">Modifier</span>
                      <span className="sm:hidden">Mod.</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(post.id)}
                      variant="danger"
                      size="sm"
                      icon={FiTrash2}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline">Supprimer</span>
                      <span className="sm:hidden">Supp.</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BlogManagement;
