import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Lock, Eye, EyeOff, Chrome, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const CandidateAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    location: ''
  });
  const [errors, setErrors] = useState({});

  const themeGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600';

  const validate = () => {
    const e = {};
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Email invalide";
    }
    if (!formData.password || formData.password.length < 6) {
      e.password = "Mot de passe requis (min 6 caractères)";
    }
    if (!isLogin && !formData.fullName.trim()) {
      e.fullName = "Nom complet requis";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGoogleAuth = async (isSignUp = false) => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Si c'est une inscription, créer le profil candidat
      if (isSignUp) {
        await setDoc(doc(db, 'candidates', user.uid), {
          userId: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          phone: formData.phone || '',
          location: formData.location || '',
          resumes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      navigate('/candidat/profil');
    } catch (error) {
      console.error('Erreur auth Google:', error);
      alert('Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      let userCredential;
      
      if (isLogin) {
        // Connexion
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        // Inscription
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Mettre à jour le profil avec le nom
        await updateProfile(userCredential.user, {
          displayName: formData.fullName
        });

        // Créer le profil candidat
        await setDoc(doc(db, 'candidates', userCredential.user.uid), {
          userId: userCredential.user.uid,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone || '',
          location: formData.location || '',
          resumes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      navigate('/candidat/profil');
    } catch (error) {
      console.error('Erreur auth email:', error);
      let message = 'Erreur lors de l\'authentification';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Email ou mot de passe incorrect';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/weak-password') {
        message = 'Le mot de passe est trop faible';
      }
      
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`${themeGradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              {isLogin ? 'Connexion Candidat' : 'Inscription Candidat'}
            </h1>
            <p className="text-white/90 text-lg">
              {isLogin 
                ? 'Accédez à votre espace pour gérer vos candidatures' 
                : 'Créez votre compte et postulez aux offres d\'emploi'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Google Auth Button */}
          <button
            onClick={() => handleGoogleAuth(!isLogin)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-semibold text-gray-700 transition-colors duration-200 disabled:opacity-60 mb-6"
          >
            <Chrome className="w-5 h-5" />
            {isLogin ? 'Se connecter avec Google' : "S'inscrire avec Google"}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou avec votre email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nom complet</label>
                <div className={`flex items-center px-3 py-2 rounded-lg border ${errors.fullName ? 'border-red-300' : 'border-gray-300'}`}>
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full outline-none"
                    placeholder="Votre nom complet"
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <div className={`flex items-center px-3 py-2 rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-300'}`}>
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full outline-none"
                  placeholder="vous@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Mot de passe</label>
              <div className={`flex items-center px-3 py-2 rounded-lg border ${errors.password ? 'border-red-300' : 'border-gray-300'}`}>
                <Lock className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full outline-none"
                  placeholder="Min 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Téléphone (optionnel)</label>
                  <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full outline-none"
                      placeholder="+237 6 XX XX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Localisation (optionnel)</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                    placeholder="Ville / Pays"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? 'Connexion...' : 'Inscription...'}
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isLogin ? "S'inscrire" : 'Se connecter'}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/offres" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour aux offres d'emploi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateAuth;
