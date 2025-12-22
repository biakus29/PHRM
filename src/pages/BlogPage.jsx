import React, { useState, useEffect, useRef } from "react";
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
import { Heart, Calendar, User, BookOpen, TrendingUp, Sparkles } from "lucide-react";

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [visiblePosts, setVisiblePosts] = useState(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const [superAdminInfo, setSuperAdminInfo] = useState({
    name: "Super Admin",
    photo: "/directeur.jpg",
  });

  // Animation au scroll pour les articles
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisiblePosts((prev) => new Set([...prev, entry.target.id]));
        }
      });
    }, observerOptions);

    // Observer tous les articles
    const articleElements = document.querySelectorAll('[data-article-id]');
    articleElements.forEach((el) => observer.observe(el));

    return () => {
      articleElements.forEach((el) => observer.unobserve(el));
    };
  }, [posts]);

  // Suivre la position de la souris pour les effets parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
        // Ne pas afficher l'erreur si c'est juste une question de permissions
        if (error.code !== 'permission-denied') {
          console.error("Erreur lors du chargement des infos admin:", error);
        }
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
      // Récupérer tous les articles (publics par défaut)
      const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
      
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const postsData = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              // Filtrer les articles publiés (si le champ published existe, il doit être true)
              // Sinon, afficher tous les articles
              .filter((post) => post.published !== false);
            
            console.log(`Articles chargés: ${postsData.length} sur ${snapshot.docs.length}`);
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
          // Afficher un message d'erreur plus informatif
          if (error.code === 'permission-denied') {
            setError("Les articles ne sont pas accessibles. Veuillez vérifier les règles de sécurité Firestore.");
            setPosts([]);
          } else if (error.code === 'failed-precondition') {
            // Erreur d'index manquant
            setError("Index Firestore manquant. Veuillez créer un index pour 'createdAt' sur la collection 'blogPosts'.");
            setPosts([]);
          } else {
            setError("Impossible de charger les articles. Veuillez réessayer plus tard.");
          }
        }
      );
    } catch (error) {
      // Ne pas afficher l'erreur si c'est juste une question de permissions
      if (error.code !== 'permission-denied') {
        console.error("Erreur lors de l'initialisation de la requête:", error);
      }
      setLoading(false);
      // Si c'est une erreur de permissions, ne pas afficher de message d'erreur
      if (error.code === 'permission-denied') {
        setError(null);
        setPosts([]);
      } else {
        setError("Erreur de connexion. Veuillez réessayer plus tard.");
      }
    }

    fetchSuperAdminInfo();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLike = async (postId, event) => {
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
        
        // Animation de confetti pour le like
        if (event) {
          createLikeAnimation(event);
        }
      }
      
      setLikedPosts(newLikedPosts);
      localStorage.setItem("blogLikes", JSON.stringify(Array.from(newLikedPosts)));
    } catch (error) {
      console.error("Erreur lors du like:", error);
    }
  };

  // Animation de confetti pour les likes
  const createLikeAnimation = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180); // Convertir en radians
      const distance = 100;
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;

      const translateX = endX - x;
      const translateY = endY - y;
      
      const particle = document.createElement('div');
      particle.className = 'like-particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.setProperty('--translate-x', translateX + 'px');
      particle.style.setProperty('--translate-y', translateY + 'px');
      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1000);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 blog-container" style={{ minHeight: '100vh', backgroundColor: '#eff6ff' }}>
      {/* Hero Section avec informations du super admin */}
      <section 
        ref={heroRef}
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden hero-section"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Background Elements animés */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 animated-bg" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="floating-particle"
              style={{
                left: `${(i * 15) % 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i % 3)}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <div className="flex items-center justify-center mb-4 sm:mb-6 relative">
              
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white relative z-10 animate-bounce-gentle" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 animate-slide-in-left px-2 relative">
              Blog <span className="text-blue-200 relative inline-block animate-gradient-text">PHRM</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 animate-fade-in-up animation-delay-200 px-2">
              Découvrez nos dernières actualités et articles
            </p>
          </div>

          {/* Carte du super admin */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up animation-delay-300 border border-white/20 admin-card group">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 animate-pulse-ring"></div>
                <img
                  src={superAdminInfo.photo}
                  onError={(e) => { 
                    e.target.src = '/logophrm.png'; 
                  }}
                  alt={superAdminInfo.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-white/30 shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white animate-pulse-glow"></div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-blue-200 text-xs sm:text-sm mb-1 font-semibold animate-fade-in-up animation-delay-400">Paul Valentin Ndoko</p>
                <h3>Directeur Exécutif</h3>
                <p className="text-blue-100 text-sm sm:text-base animate-fade-in-up animation-delay-500">
                  Partage son expertise et ses connaissances en gestion des ressources humaines
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
              {posts.map((post, index) => {
                const isVisible = visiblePosts.has(post.id);
                return (
                <article
                  key={post.id}
                  id={post.id}
                  data-article-id={post.id}
                  className={`bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden article-card group ${
                    isVisible ? 'article-visible' : 'article-hidden'
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
                    opacity: isVisible ? 1 : 0
                  }}
                >
                  <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                    {/* En-tête de l'article */}
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 hover:text-blue-600 transition-all duration-300 leading-tight group-hover:translate-x-2">
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
                        onClick={(e) => handleLike(post.id, e)}
                        className={`like-button flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 relative overflow-hidden ${
                          likedPosts.has(post.id)
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-red-300"
                        }`}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></span>
                        <Heart
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 flex-shrink-0 relative z-10 ${
                            likedPosts.has(post.id) 
                              ? "fill-current animate-heart-beat" 
                              : "group-hover:scale-125"
                          }`}
                        />
                        <span className="font-semibold text-sm sm:text-base relative z-10 transition-all duration-300">
                          {post.likes || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
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
