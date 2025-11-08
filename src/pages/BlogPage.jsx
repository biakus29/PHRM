import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  getDocs,
  where
} from "firebase/firestore";
import { Heart, Calendar, User, BookOpen, TrendingUp } from "lucide-react";

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [superAdminInfo, setSuperAdminInfo] = useState({
    name: "Super Admin",
    photo: "/directeur.jpg",
  });

  // S'assurer que loading passe à false après un délai maximum
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        if (posts.length === 0 && !error) {
          setError(null); // Pas d'erreur, juste pas d'articles
        }
      }
    }, 10000); // 10 secondes maximum

    return () => clearTimeout(timeout);
  }, [loading, posts.length, error]);

  useEffect(() => {
    let unsubscribe = null;
    
    // Récupérer les informations du super admin
    const fetchSuperAdminInfo = async () => {
      try {
        const adminQuery = query(
          collection(db, "users"),
          where("role", "==", "superAdmin")
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminData = adminSnapshot.docs[0].data();
          if (adminData.blogSettings) {
            setSuperAdminInfo({
              name: adminData.blogSettings.name || "Super Admin",
              photo: adminData.blogSettings.photo || "/directeur.jpg",
            });
          } else {
            // Utiliser les infos par défaut depuis le document utilisateur
            setSuperAdminInfo({
              name: adminData.name || adminData.displayName || "Super Admin",
              photo: adminData.photoURL || adminData.photo || "/directeur.jpg",
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des infos admin:", error);
        // Ne pas bloquer l'affichage si les infos admin échouent
      }
    };

    // Récupérer les likes de l'utilisateur (stockés dans localStorage)
    try {
      const savedLikes = localStorage.getItem("blogLikes");
      if (savedLikes) {
        setLikedPosts(new Set(JSON.parse(savedLikes)));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des likes:", error);
    }

    // Récupérer les articles depuis Firestore
    try {
      const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
      
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const postsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPosts(postsData);
            setLoading(false);
            setError(null);
          } catch (error) {
            console.error("Erreur lors du traitement des articles:", error);
            setLoading(false);
            setError("Erreur lors du chargement des articles");
          }
        },
        (error) => {
          console.error("Erreur lors du chargement des articles:", error);
          setLoading(false);
          setError("Impossible de charger les articles. Veuillez réessayer plus tard.");
        }
      );
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la requête:", error);
      setLoading(false);
      setError("Erreur de connexion. Veuillez réessayer plus tard.");
    }

    fetchSuperAdminInfo();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, "blogPosts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) return;

      const currentLikes = postDoc.data().likes || 0;
      const isLiked = likedPosts.has(postId);

      // Mettre à jour le localStorage
      const newLikedPosts = new Set(likedPosts);
      if (isLiked) {
        newLikedPosts.delete(postId);
        await updateDoc(postRef, {
          likes: Math.max(0, currentLikes - 1),
        });
      } else {
        newLikedPosts.add(postId);
        await updateDoc(postRef, {
          likes: currentLikes + 1,
        });
      }
      
      setLikedPosts(newLikedPosts);
      localStorage.setItem("blogLikes", JSON.stringify(Array.from(newLikedPosts)));
    } catch (error) {
      console.error("Erreur lors du like:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du blog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur de chargement</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50" style={{ minHeight: '100vh', backgroundColor: '#eff6ff' }}>
      {/* Hero Section avec informations du super admin */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white animate-bounce" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 animate-slide-in-left px-2">
              Blog <span className="text-blue-200">PHRM</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 animate-fade-in-up animation-delay-200 px-2">
              Découvrez nos dernières actualités et articles
            </p>
          </div>

          {/* Carte du super admin */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] animate-fade-in-up animation-delay-300 border border-white/20">
              <div className="relative flex-shrink-0">
                <img
                  src={superAdminInfo.photo}
                  onError={(e) => { 
                    e.target.src = '/logophrm.png'; 
                  }}
                  alt={superAdminInfo.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-blue-200 text-xs sm:text-sm mb-1">Auteur Principal</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                  {superAdminInfo.name}
                </h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  Partageant son expertise et ses connaissances en gestion des ressources humaines
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des articles */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-100 animate-fade-in-up">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg font-medium">
                Aucun article disponible pour le moment.
              </p>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Revenez bientôt pour découvrir nos nouveaux contenus
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] border border-gray-100 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                    {/* En-tête de l'article */}
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 hover:text-blue-600 transition-colors duration-300 leading-tight">
                        {post.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-blue-700 font-medium whitespace-nowrap">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          <span className="text-green-700 font-medium truncate max-w-[150px] sm:max-w-none">
                            {post.author || superAdminInfo.name}
                          </span>
                        </div>
                        {post.likes > 0 && (
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                            <span className="text-red-700 font-medium whitespace-nowrap">
                              {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
                      <div
                        className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: post.content.replace(/\n/g, '<br />') 
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-200">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                          likedPosts.has(post.id)
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 flex-shrink-0 ${
                            likedPosts.has(post.id) 
                              ? "fill-current animate-pulse" 
                              : ""
                          }`}
                        />
                        <span className="font-semibold text-sm sm:text-base">
                          {post.likes || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer du blog */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            {/* Logo PHRM */}
            <div className="flex items-center justify-center gap-3">
              <img 
                src="/logophrm.png" 
                alt="PHRM Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
              />
              <span className="text-lg sm:text-xl md:text-2xl font-bold">PHRM Blog</span>
            </div>
            
            {/* Texte du footer */}
            <p className="text-gray-400 text-xs sm:text-sm md:text-base text-center">
              &copy; {new Date().getFullYear()} PHRM. Tous droits réservés.
            </p>
            
            {/* Description optionnelle */}
            <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
              Plateforme de gestion des ressources humaines - Blog officiel
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
