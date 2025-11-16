import { Users, TrendingUp, CheckCircle, BarChart3, CreditCard, UserCheck, Scale, Smartphone, Mail, Phone, MapPin, Clock, Facebook, Twitter, Linkedin, MessageCircle, Shield, Zap, Target, Award, Globe, Download, LogOut, Headphones, BookOpen, ArrowRight, Calendar, Heart } from 'lucide-react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAw5fhcY5rm0glQW61AR6nbHQLDIRcm_Mw",
  authDomain: "phrm-399e5.firebaseapp.com",
  projectId: "phrm-399e5",
  storageBucket: "phrm-399e5.firebasestorage.app",
  messagingSenderId: "141528249149",
  appId: "1:141528249149:web:c8f40952d8cc995dfe0b54",
  measurementId: "G-LHPZ61T63E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type TruncatedTextProps = {
  text: string;
  maxChars?: number;
};

const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxChars = 380 }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxChars;
  const displayText = expanded || !isLong ? text : text.slice(0, maxChars) + '…';
  return (
    <div>
      <p className="text-gray-700 leading-relaxed">{displayText}</p>
      {isLong && (
        <button
          className="mt-3 text-phrm-dark font-semibold hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Voir moins' : 'Lire plus'}
        </button>
      )}
    </div>
  );
};

function App() {
  const [aboutTab, setAboutTab] = useState<'presentation' | 'role' | 'mission' | 'objectifs' | 'recrutement'>('presentation');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutAutoplay, setAboutAutoplay] = useState(true);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Données simulées pour les statistiques réelles
  const [realTimeStats, setRealTimeStats] = useState({
    totalEmployees: 1247,
    activeEmployees: 1180,
    totalCompanies: 523,
    contractsGenerated: 98.5,
    uptime: 99.9
  });

  useEffect(() => {
    if (!aboutAutoplay) return;
    const order: Array<'presentation' | 'role' | 'mission' | 'objectifs' | 'recrutement'> = [
      'presentation',
      'role',
      'mission',
      'objectifs',
      'recrutement',
    ];
    const interval = setInterval(() => {
      setAboutTab((current) => {
        const idx = order.indexOf(current);
        const next = order[(idx + 1) % order.length];
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [aboutAutoplay]);

  // Charger les articles récents du blog
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        setLoadingPosts(true);
        const q = query(
          collection(db, 'blogPosts'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentPosts(posts);
      } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchRecentPosts();
  }, []);

  // Simulation de données en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        totalEmployees: prev.totalEmployees + Math.floor(Math.random() * 3), // Croissance lente
        activeEmployees: prev.activeEmployees + Math.floor(Math.random() * 2),
        totalCompanies: prev.totalCompanies + Math.floor(Math.random() * 2),
        contractsGenerated: Math.min(99.9, prev.contractsGenerated + (Math.random() * 0.1)),
        uptime: Math.max(99.0, Math.min(99.9, prev.uptime + (Math.random() * 0.02 - 0.01)))
      }));
    }, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Fonction pour formater la date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fonction pour tronquer le texte
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-phrm-light via-white to-phrm-light">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 min-w-0">
            <img src="/logophrm.png" alt="PHRM Logo" className="w-12 h-12 md:w-14 md:h-14 aspect-square object-contain select-none" />
              <span className="text-2xl font-bold text-phrm-dark max-w-[140px] md:max-w-[180px] truncate">PHRM</span>
            </div>
            <div className="hidden lg:flex space-x-6 xl:space-x-8">
              <a href="#about" className="text-gray-700 hover:text-phrm-dark transition-colors">À propos</a>
              <a href="#features" className="text-gray-700 hover:text-phrm-dark transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-gray-700 hover:text-phrm-dark transition-colors">Tarifs</a>
            <a href="#testimonials" className="text-gray-700 hover:text-phrm-dark transition-colors">Témoignages</a>
            <a href="https://phrmapp.com/blog" className="text-gray-700 hover:text-phrm-dark transition-colors">Blog</a>
            <a href="#faq" className="text-gray-700 hover:text-phrm-dark transition-colors">FAQ</a>
              <a href="#contact" className="text-gray-700 hover:text-phrm-dark transition-colors">Contact</a>
            </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <a href="https://phrmapp.com/demo" className="hidden md:inline-flex bg-phrm-dark text-white px-4 md:px-6 py-2 rounded-lg hover:brightness-90 transition-colors">
              Essai gratuit 
            </a>
            <button
              className="lg:hidden text-gray-700 hover:text-phrm-dark transition-colors"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ${mobileOpen ? 'max-h-96' : 'max-h-0'}`}
        >
          <div className="px-4 sm:px-6 lg:px-8 pb-4 bg-white/95 backdrop-blur-md shadow">
            <div className="flex flex-col space-y-3">
              {[
                { href: '#about', label: 'À propos' },
                { href: '#features', label: 'Fonctionnalités' },
                { href: '#testimonials', label: 'Témoignages' },
                { href: 'https://phrmapp.com/blog', label: 'Blog' },
                { href: '#faq', label: 'FAQ' },
                { href: '#contact', label: 'Contact' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-800 hover:text-phrm-dark py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              {/* Bouton Voir la démo pour mobile */}
              <a 
                href="https://phrmapp.com/demo"
                className="bg-phrm-dark text-white px-4 py-2 rounded-lg hover:brightness-90 transition-colors text-center mt-3 block"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  window.location.href = 'https://phrmapp.com/demo';
                }}
              >
                Voir la démo
              </a>
              
              {/* Bouton de déconnexion pour mobile/tablette */}
              <button
                onClick={() => {
                  // Logique de déconnexion ici
                  console.log('Déconnexion...');
                  // Exemple: localStorage.removeItem('authToken');
                  // window.location.href = '/login';
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center space-x-2 text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-4 rounded-lg transition-colors border border-red-200 hover:border-red-300 mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-slide-in-left">
            Gestion automatisée des <span className="text-phrm-dark animate-pulse">RH</span> 
              </h1>
            <p className="text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200">
                Solution complète RH : conformité Paie-pays; Recrutement, Background check, Conseil, Libre-service Employés.
              </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
              <a href="https://phrmapp.com/register-client" className="bg-phrm-dark text-white px-8 py-4 rounded-lg hover:brightness-90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl inline-block text-center">
                  S'inscrire 
                </a>
              <a href="https://phrmapp.com/demo" className="border-2 border-phrm-dark text-phrm-dark px-8 py-4 rounded-lg hover:bg-phrm-light transition-all transform hover:scale-105">
                  Voir la démo
                </a>
              </div>
            <div className="mt-8 flex items-center space-x-6 animate-fade-in-up animation-delay-600">
              <div className="flex items-center space-x-2 hover:scale-110 transition-transform duration-200">
                <Shield className="w-5 h-5 text-green-600 animate-bounce" />
                <span className="text-gray-600">Conforme CNPS</span>
              </div>
              <div className="flex items-center space-x-2 hover:scale-110 transition-transform duration-200">
                <Globe className="w-5 h-5 text-green-600 animate-bounce animation-delay-100" />
                <span className="text-gray-600">Multi-tenant</span>
              </div>
              <div className="flex items-center space-x-2 hover:scale-110 transition-transform duration-200">
                <Zap className="w-5 h-5 text-green-600 animate-bounce animation-delay-200" />
                <span className="text-gray-600">Temps réel</span>
              </div>
            </div>
          </div>
          <div className="relative animate-fade-in-up animation-delay-300">
            <div className="bg-phrm-dark rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="bg-white rounded-xl p-6 -rotate-3 space-y-4 hover:scale-105 transition-transform duration-300">
                    {/* En-tête avec indicateur temps réel */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500 font-medium">TABLEAU DE BORD LIVE</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center animate-pulse border border-blue-300">
                          <Users className="w-6 h-6 text-phrm-dark" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Employés actifs</p>
                          <p className="text-2xl font-bold text-gray-900 animate-count-up">
                            {realTimeStats.totalEmployees.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600 font-medium">
                            +{Math.floor(Math.random() * 5) + 1} ce mois
                          </p>
                        </div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500 animate-bounce" />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Contrats générés</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {realTimeStats.contractsGenerated.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-phrm-dark to-blue-600 h-2 rounded-full animate-progress-bar transition-all duration-1000" 
                          style={{ width: `${realTimeStats.contractsGenerated}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Nouvelle section - Statistiques supplémentaires */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {realTimeStats.totalCompanies}
                        </div>
                        <div className="text-xs text-gray-500">Entreprises</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {realTimeStats.uptime.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Disponibilité</div>
                      </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* À propos - design amélioré avec onglets et animations */}
      <section
        id="about"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden"
        onMouseEnter={() => setAboutAutoplay(false)}
        onMouseLeave={() => setAboutAutoplay(true)}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-phrm-dark/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-blue-400/10 rounded-full blur-3xl animate-pulse animation-delay-200"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">À propos de PHRM</h2>
            <p className="text-xl text-gray-600 animate-fade-in-up animation-delay-200">Découvrez notre histoire, notre rôle et notre mission</p>
          </div>

          {/* Bandeau directeur */}
          <div className="bg-gradient-to-r from-phrm-light to-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 mb-10 shadow-lg hover:shadow-2xl transition-shadow animate-fade-in-up animation-delay-300 border border-phrm-dark/10">
            <img
              src="/directeur.jpg"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logophrm.png'; }}
              alt="Directeur Exécutif"
              className="w-20 h-20 md:w-24 md:h-24  object-cover ring-4 ring-phrm-dark/10 shadow-md"
            />
            <div className="text-center md:text-left">
              <p className="text-gray-700">Paul Valentin Ndoko</p>
              <h3 className="text-2xl font-bold text-phrm-dark">Directeur Exécutif</h3>
              
            </div>
          </div>

          {/* Onglets */}
          <div className="mb-10 flex justify-center">
            <div className="inline-flex flex-nowrap gap-2 md:gap-3 bg-gray-100 rounded-xl p-2 md:p-3 shadow-inner overflow-x-auto whitespace-nowrap max-w-full snap-x snap-mandatory">
              {[
                { id: 'presentation', label: 'Présentation' },
                { id: 'role', label: 'Rôle' },
                { id: 'mission', label: 'Mission' },
                { id: 'objectifs', label: 'Objectifs' },
                { id: 'recrutement', label: 'Recrutement' },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all snap-start ${aboutTab === (t.id as any) ? 'bg-white text-phrm-dark shadow' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setAboutTab(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panneaux */}
          {aboutTab === 'presentation' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 animate-fade-in-up md:max-w-3xl md:mx-auto">
              <h3 className="text-2xl font-bold text-phrm-dark mb-3">Conseil et Audit des RH</h3>
              <TruncatedText
                text={
                  "Créé en novembre 2025, PHRM est un regroupement de Professionnels en gestion des RH dont l’objectif à l’origine était : l’Audit des RH, le Conseil en RH, le recrutement total ou partiel, la paie, le coaching linguistique individuel ou d’équipe. Pour le compte des entreprises et autres acteurs économiques, nous aidons à aligner leur politique de recrutement sur la stratégie globale de l’entreprise. Aujourd’hui, nous intégrons à nos activités le placement du personnel, permettant aux chercheurs d’emplois d’entrer en contact avec les secteurs d’activité de l’Économie Nationale."
                }
              />
            </div>
          )}
          {aboutTab === 'role' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 animate-fade-in-up md:max-w-3xl md:mx-auto">
              <h3 className="text-2xl font-bold text-phrm-dark mb-3">Rôle</h3>
              <TruncatedText
                text={
                  "PHRM s’intéresse à tout ce qui concerne la gestion des ressources humaines, aussi bien du côté des chercheurs d’emplois que des entreprises du secteur privé et para-public. À ce titre, PHRM s’efforce de satisfaire les besoins des entreprises qui cherchent des profils pertinents, ainsi que ceux des chercheurs d’emplois qualifiés, compétents et opérationnels capables de répondre au profil et aux exigences d’un poste en cas de vacance."
                }
              />
            </div>
          )}
          {aboutTab === 'mission' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 animate-fade-in-up md:max-w-3xl md:mx-auto">
              <h3 className="text-2xl font-bold text-phrm-dark mb-3">Mission</h3>
              <TruncatedText
                text={
                  "Notre mission est de représenter les intérêts de nos clients et de faciliter le développement professionnel de leurs employés ; mettre en contact des chercheurs d’emplois avec de potentiels employeurs ; promouvoir et développer les talents des chercheurs d’emplois afin de leur permettre de relever les défis de la compétition sur le marché de l’emploi. La réussite de nos clients est notre préoccupation. Nous ne ménageons aucun effort pour leur fournir des analyses et un service de qualité, tout en respectant leurs contraintes budgétaires."
                }
              />
            </div>
          )}
          {aboutTab === 'objectifs' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 animate-fade-in-up md:max-w-3xl md:mx-auto">
              <h3 className="text-2xl font-bold text-phrm-dark mb-3">Objectifs</h3>
              <TruncatedText
                text={
                  "Mettre en place un cadre pour faciliter l’accès de tous les acteurs économiques au sein du marché de l’emploi : les chercheurs d’emplois pourront l’exploiter pour améliorer leurs connaissances, leurs habiletés et leurs talents ; les employeurs pour vivier à talents. Offrir des solutions pratiques pour l’emploi, vendre du conseil RH aux entreprises et autres acteurs ; permettre un meilleur accès à l’information sur le marché de l’emploi au Cameroun ; aider au recrutement des candidats en adéquation avec les profils de postes vacants ; créer des opportunités de formation et de développement des compétences ; organiser des séminaires d’information et de recrutement ; fournir des conseils pratiques aux employeurs et aux employés ; assistance en relations avec l’administration du travail ; information sur la classification salariale nationale ; salaire minimum d’embauche ; secteurs d’activité en expansion ; examens médicaux d’embauche indispensables."
                }
              />
            </div>
          )}
          {aboutTab === 'recrutement' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Recrutement</h3>
              <div className="prose prose-phrm max-w-none">
                <p>Notre plateforme facilite l'intégration des nouveaux employés avec des processus de recrutement automatisés et personnalisables. Nous aidons les entreprises à attirer, évaluer et intégrer les meilleurs talents.</p>
                <ul className="space-y-2">
                  <li>Gestion des offres d'emploi et des candidatures</li>
                  <li>Suivi des entretiens et évaluations</li>
                  <li>Intégration des nouveaux employés</li>
                  <li>Automatisation des processus RH</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section - Données Temps Réel */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre de section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Statistiques en Temps Réel
            </h2>
            <p className="text-xl text-gray-600">
              Données actualisées automatiquement toutes les 30 secondes
            </p>
          </div>

          {/* Grille des statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group hover:scale-110 transition-all duration-300 animate-fade-in-up">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg transition-all duration-300 border border-blue-200">
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 mb-1" />
                  <p className="text-2xl font-bold text-blue-600 animate-count-up">
                    {realTimeStats.totalCompanies}+
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mt-2 group-hover:text-blue-600 transition-colors duration-300 font-medium">Entreprises</p>
              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Clients actifs
              </p>
            </div>

            <div className="text-center group hover:scale-110 transition-all duration-300 animate-fade-in-up animation-delay-100">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg transition-all duration-300 border border-green-200">
                <div className="flex flex-col items-center">
                  <Users className="w-5 h-5 text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-600 animate-count-up">
                    {realTimeStats.totalEmployees >= 1000 ? `${Math.floor(realTimeStats.totalEmployees / 1000)}K+` : realTimeStats.totalEmployees}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mt-2 group-hover:text-green-600 transition-colors duration-300 font-medium">Employés gérés</p>
              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {realTimeStats.activeEmployees} actifs
              </p>
            </div>

            <div className="text-center group hover:scale-110 transition-all duration-300 animate-fade-in-up animation-delay-200">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg transition-all duration-300 border border-purple-200">
                <div className="flex flex-col items-center">
                  <Clock className="w-5 h-5 text-purple-600 mb-1" />
                  <p className="text-2xl font-bold text-purple-600 animate-count-up">
                    {realTimeStats.uptime.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mt-2 group-hover:text-purple-600 transition-colors duration-300 font-medium">Disponibilité</p>
              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Temps de fonctionnement
              </p>
            </div>

            <div className="text-center group hover:scale-110 transition-all duration-300 animate-fade-in-up animation-delay-300">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg transition-all duration-300 border border-orange-200">
                <div className="flex flex-col items-center">
                  <Headphones className="w-5 h-5 text-orange-600 mb-1" />
                  <p className="text-2xl font-bold text-orange-600 animate-count-up">24/7</p>
                </div>
              </div>
              <p className="text-gray-600 mt-2 group-hover:text-orange-600 transition-colors duration-300 font-medium">Support</p>
              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Assistance continue
              </p>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Indicateurs de Performance RH
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{realTimeStats.contractsGenerated.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Contrats générés</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                <div className="text-2xl font-bold text-green-600">{Math.round((realTimeStats.activeEmployees / realTimeStats.totalEmployees) * 100)}%</div>
                <div className="text-sm text-gray-600">Employés actifs</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 md:col-span-1 col-span-2">
                <div className="text-2xl font-bold text-purple-600">
                  <span className="animate-pulse">●</span> LIVE
                </div>
                <div className="text-sm text-gray-600">Mise à jour automatique</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nos Services
            </h2>
            <p className="text-xl text-gray-600">
              Une gamme complète de solutions RH pour votre entreprise
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up">
              <div className="w-12 h-12 bg-phrm-light rounded-lg flex items-center justify-center mb-4 group-hover:bg-phrm-light transition-colors duration-300 group-hover:scale-110">
                <CreditCard className="w-6 h-6 text-phrm-dark group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-phrm-dark transition-colors duration-300">Gestion de la Paie</h3>
              <p className="text-gray-600 mb-4">
                Calculs automatisés conformes à la réglementation CNPS .
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse" />
                  Barème IRPP officiel
                </li>
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse animation-delay-100" />
                  Cotisations CNPS automatiques
                </li>
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse animation-delay-200" />
                  Fiches de paie PDF
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-100">
              <div className="w-12 h-12 bg-phrm-light rounded-lg flex items-center justify-center mb-4 group-hover:bg-phrm-light transition-colors duration-300 group-hover:scale-110">
                <Users className="w-6 h-6 text-phrm-dark group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-phrm-dark transition-colors duration-300">Recrutement</h3>
              <p className="text-gray-600 mb-4">
                Solution complète de gestion du processus de recrutement de vos talents.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse" />
                  Gestion des candidatures
                </li>
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse animation-delay-100" />
                  Suivi des entretiens
                </li>
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse animation-delay-200" />
                  Base de données candidats
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-200">
              <div className="w-12 h-12 bg-phrm-light rounded-lg flex items-center justify-center mb-4 group-hover:bg-phrm-light transition-colors duration-300 group-hover:scale-110">
                <UserCheck className="w-6 h-6 text-phrm-dark group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-phrm-dark transition-colors duration-300">Background Check</h3>
              <p className="text-gray-600 mb-4">
                Vérification approfondie des antécédents de vos candidats et employés.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse" />
                  Vérification d'identité
                </li>
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse animation-delay-100" />
                  Vérification des diplômes
                </li>
                <li className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 group-hover:animate-pulse animation-delay-200" />
                  Références professionnelles
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-phrm-light rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-phrm-dark" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Conseils</h3>
              <p className="text-gray-600 mb-4">
                Expertise complète en conseil RH, droit du travail et ingénierie salariale.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Classification Nationale des Professions
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Ingénierie salariale
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Prétentions salariales
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-phrm-light rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-phrm-dark" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Libre-service Employés</h3>
              <p className="text-gray-600 mb-4">
                Portail employé pour accéder à toutes leurs informations RH en toute autonomie.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Consultation des fiches de paie
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Gestion des données personnelles
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Demandes de congés
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-phrm-light rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-phrm-dark" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tableaux de Bord</h3>
              <p className="text-gray-600 mb-4">
                Visualisations en temps réel pour un pilotage optimal de vos RH.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Statistiques en temps réel
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Graphiques interactifs
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Rapports personnalisés
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interface Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-up">
              Découvrez l'Interface PHRM
            </h2>
            <p className="text-xl text-blue-200 animate-fade-in-up animation-delay-200">
              Une expérience utilisateur moderne et intuitive
            </p>
          </div>

          {/* Main Interface Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Dashboard Mockup */}
            <div className="relative animate-fade-in-up animation-delay-300">
              <div className="relative">
                {/* Main Dashboard */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-phrm-dark rounded-lg"></div>
                      <span className="font-bold text-gray-900">PHRM Dashboard</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">1,247</div>
                        <div className="text-sm text-gray-600">Employés</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">98.5%</div>
                        <div className="text-sm text-gray-600">Conformité</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">24/7</div>
                        <div className="text-sm text-gray-600">Support</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Fiches de paie du mois</span>
                        <span className="text-sm text-gray-500">1,200 / 1,247</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-phrm-dark h-2 rounded-full animate-progress-bar" style={{width: '96%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-float flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Conforme CNPS</span>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-float animation-delay-200 flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Temps réel</span>
                </div>
              </div>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="space-y-6 animate-fade-in-up animation-delay-400">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-phrm-dark rounded-lg flex items-center justify-center group-hover:animate-bounce">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Gestion de Paie</h3>
                    <p className="text-blue-200">Interface intuitive et moderne</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Calculs CNPS</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Automatique</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Fiches de paie</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>PDF Export</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Conformité</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>100%</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:animate-bounce">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white"> Libre-service Employés</h3>
                    <p className="text-blue-200">Portail employé autonome</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Consultation</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>24/7</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Données personnelles</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <UserCheck className="w-4 h-4" />
                        <span>Modifiable</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Demandes</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>Simplifiées</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:animate-bounce">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Analytics & Rapports</h3>
                    <p className="text-blue-200">Données en temps réel</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Statistiques</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>Temps réel</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Graphiques</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>Interactifs</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Exports</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>Multi-format</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Mobile Preview */}
          <div className="mt-16 text-center animate-fade-in-up animation-delay-500">
            <h3 className="text-2xl font-bold text-white mb-8">Disponible sur tous vos appareils</h3>
            <div className="flex justify-center space-x-8">
              {/* Mobile Mockup */}
              <div className="relative">
                <div className="w-64 h-96 bg-gray-800 rounded-3xl p-2 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105">
                  <div className="w-full h-full bg-white rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-6 h-6 bg-phrm-dark rounded"></div>
                      <span className="text-sm font-bold text-gray-900">PHRM Mobile</span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-blue-600">1,247</div>
                        <div className="text-xs text-gray-600">Employés actifs</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-green-600">98.5%</div>
                        <div className="text-xs text-gray-600">Conformité CNPS</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-purple-600">24/7</div>
                        <div className="text-xs text-gray-600">Support</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-bounce">
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  Mobile
                </div>
              </div>

              {/* Tablet Mockup */}
              <div className="relative">
                <div className="w-80 h-56 bg-gray-800 rounded-2xl p-2 shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
                  <div className="w-full h-full bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-phrm-dark rounded"></div>
                        <span className="font-bold text-gray-900">PHRM</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 rounded p-2 text-center">
                        <div className="text-sm font-bold text-blue-600">1,247</div>
                        <div className="text-xs text-gray-600">Employés</div>
                      </div>
                      <div className="bg-green-50 rounded p-2 text-center">
                        <div className="text-sm font-bold text-green-600">98.5%</div>
                        <div className="text-xs text-gray-600">Conformité</div>
                      </div>
                      <div className="bg-purple-50 rounded p-2 text-center">
                        <div className="text-sm font-bold text-purple-600">24/7</div>
                        <div className="text-xs text-gray-600">Support</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 -left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-bounce animation-delay-200">
                  💻 Tablet
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="particle" style={{top: '10%', left: '10%'}}></div>
          <div className="particle" style={{top: '20%', right: '20%'}}></div>
          <div className="particle" style={{bottom: '30%', left: '30%'}}></div>
          <div className="particle" style={{bottom: '20%', right: '10%'}}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Démonstration Interactive
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in-up animation-delay-200">
              Explorez les fonctionnalités PHRM en temps réel
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Feature Tabs */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-phrm-dark rounded-2xl flex items-center justify-center group-hover:animate-bounce">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-phrm-dark transition-colors duration-300">Module de Paie</h3>
                    <p className="text-gray-600">Interface de gestion des salaires</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Calculs CNPS</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-semibold">Actif</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-phrm-dark h-2 rounded-full animate-progress-bar" style={{width: '100%'}}></div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Barème IRPP automatique</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Cotisations CNPS calculées</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Fiches de paie générées</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center group-hover:animate-bounce">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">Gestion Employés</h3>
                    <p className="text-gray-600">Base de données complète</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Employés actifs</span>
                      <span className="text-2xl font-bold text-green-600">1,247</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">850</div>
                        <div className="text-gray-600">Temps plein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">397</div>
                        <div className="text-gray-600">Temps partiel</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - 3D Interface Mockup */}
            <div className="relative perspective-3d">
              <div className="transform-3d">
                {/* Main Interface */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-y-15 hover:rotate-y-0 transition-all duration-700 hover:scale-110 hover-lift-3d">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-phrm-dark rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">PHRM Dashboard</h4>
                        <p className="text-sm text-gray-600">Tableau de bord principal</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Dashboard Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                      <div className="text-sm text-gray-600">Employés</div>
                      <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                        <div className="bg-phrm-dark h-1 rounded-full animate-progress-bar" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold text-green-600 mb-2">98.5%</div>
                      <div className="text-sm text-gray-600">Conformité</div>
                      <div className="w-full bg-green-200 rounded-full h-1 mt-2">
                        <div className="bg-green-600 h-1 rounded-full animate-progress-bar" style={{width: '98.5%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h5 className="font-semibold text-gray-900 mb-4">Activité récente</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-700">1,200 fiches de paie générées</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-100"></div>
                        <span className="text-sm text-gray-700">47 nouveaux employés ajoutés</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-200"></div>
                        <span className="text-sm text-gray-700">12 demandes de congés traitées</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute -top-6 -right-6 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-float flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Conforme CNPS</span>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-float animation-delay-200 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Temps réel</span>
                </div>
                <div className="absolute top-1/2 -right-8 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-float animation-delay-400 flex items-center space-x-1">
                  <BarChart3 className="w-3 h-3" />
                  <span>Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16 animate-fade-in-up animation-delay-500">
            <div className="bg-gradient-to-r from-phrm-dark to-phrm-dark rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Prêt à découvrir PHRM ?</h3>
              <p className="text-blue-100 mb-6">Testez toutes ces fonctionnalités gratuitement pendant 30 jours</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://phrmapp.com/demo" className="bg-white text-phrm-dark px-8 py-4 rounded-lg hover:bg-phrm-light transition-all transform hover:scale-105 shadow-lg font-semibold inline-block text-center">
                  Démo interactive
                </a>
                <a href="#pricing" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors font-semibold inline-block text-center">
                  Voir les tarifs
                </a>
                <a href="https://phrmapp.com/demo-signup" className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg font-semibold inline-block text-center">
                  Essai gratuit 30 jours
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employee Self-Service Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-phrm-dark rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-6">
            Qu'est-ce que le libre-service employés ?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-8 leading-relaxed">
          <span className="font-semibold text-phrm-dark">Libre-service employés </span> donne aux employés l'accès à leurs informations RH personnelles, en toute autonomie et à tout moment.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-phrm-dark mr-2" />
                Avantages pour les employés
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start text-gray-700">
                  <span className="text-phrm-dark mr-2">•</span>
                  <span>Consultation des fiches de paie en ligne 24/7</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-phrm-dark mr-2">•</span>
                  <span>Mise à jour des données personnelles</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-phrm-dark mr-2">•</span>
                  <span>Demandes de congés simplifiées</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-phrm-dark mr-2">•</span>
                  <span>Accès à l'historique complet</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-phrm-dark mr-2" />
                Avantages pour l'entreprise
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Réduction des tâches administratives RH</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Gain de temps pour les équipes RH</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Moins de sollicitations répétitives</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Employés plus autonomes et satisfaits</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 p-6 bg-gradient-to-r from-phrm-dark to-phrm-dark rounded-xl text-white">
            <p className="text-lg text-center leading-relaxed">
              Avec PHRM, vos employés accèdent à toutes leurs informations salariales et données personnelles de manière numérique, <span className="font-semibold">sans avoir besoin de contacter le service RH</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez comment PHRM transforme la gestion RH de nos clients
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-lg group animate-fade-in-up">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-phrm-dark rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:bg-phrm-dark transition-colors duration-300 group-hover:scale-110">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 group-hover:text-phrm-dark transition-colors duration-300">Marie Nguema</h4>
                  <p className="text-sm text-gray-600">DRH, Banque Commerciale</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4 group-hover:text-gray-800 transition-colors duration-300">
                "PHRM a révolutionné notre gestion de paie. Nous avons réduit de 80% le temps consacré aux calculs CNPS. La conformité est garantie et nos employés sont ravis de l'ESS."
              </p>
              <div className="flex text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                ★★★★★
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-lg group animate-fade-in-up animation-delay-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:bg-green-600 transition-colors duration-300 group-hover:scale-110">
                  J
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">Jean-Paul Mballa</h4>
                  <p className="text-sm text-gray-600">Directeur, PME Services</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4 group-hover:text-gray-800 transition-colors duration-300">
                "En tant que PME, nous avions besoin d'une solution simple et efficace. PHRM nous a permis d'automatiser complètement notre RH avec un ROI en 2 mois seulement."
              </p>
              <div className="flex text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                ★★★★★
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-lg group animate-fade-in-up animation-delay-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:bg-purple-600 transition-colors duration-300 group-hover:scale-110">
                  A
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">Aminata Diallo</h4>
                  <p className="text-sm text-gray-600">Comptable, Cabinet d'Expertise</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-4 group-hover:text-gray-800 transition-colors duration-300">
                "La conformité CNPS était notre cauchemar. Avec PHRM, tout est automatique et à jour. Plus d'erreurs, plus de stress. Je recommande vivement !"
              </p>
              <div className="flex text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                ★★★★★
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section - Toujours visible */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-phrm-dark/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-blue-400/10 rounded-full blur-3xl animate-pulse animation-delay-200"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-12 h-12 text-phrm-dark animate-bounce" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Blog PHRM
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in-up animation-delay-200">
              Découvrez nos dernières actualités et articles sur la gestion RH
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Carte Blog 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:animate-bounce">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-phrm-dark transition-colors duration-300">
                Actualités RH
              </h3>
              <p className="text-gray-600 mb-6">
                Restez informé des dernières tendances et actualités dans le domaine des ressources humaines au Cameroun.
              </p>
              <a 
                href="https://phrmapp.com/blog" 
                className="inline-flex items-center gap-2 text-phrm-dark font-semibold hover:gap-3 transition-all duration-300 group-hover:text-blue-700"
              >
                Lire les articles
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Carte Blog 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:animate-bounce">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-phrm-dark transition-colors duration-300">
                Conseils & Astuces
              </h3>
              <p className="text-gray-600 mb-6">
                Des conseils pratiques et des astuces pour optimiser votre gestion des ressources humaines.
              </p>
              <a 
                href="https://phrmapp.com/blog" 
                className="inline-flex items-center gap-2 text-phrm-dark font-semibold hover:gap-3 transition-all duration-300 group-hover:text-green-700"
              >
                Découvrir
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Carte Blog 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-200 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:animate-bounce">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-phrm-dark transition-colors duration-300">
                Expertise PHRM
              </h3>
              <p className="text-gray-600 mb-6">
                Partage d'expertise et de connaissances par notre équipe de spécialistes en gestion RH.
              </p>
              <a 
                href="https://phrmapp.com/blog" 
                className="inline-flex items-center gap-2 text-phrm-dark font-semibold hover:gap-3 transition-all duration-300 group-hover:text-purple-700"
              >
                En savoir plus
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="text-center animate-fade-in-up animation-delay-300">
            <div className="bg-gradient-to-r from-phrm-dark to-blue-700 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Explorez notre blog
              </h3>
              <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
                Découvrez des articles régulièrement mis à jour sur la gestion des ressources humaines, 
                la conformité CNPS, et bien plus encore.
              </p>
              <a 
                href="https://phrmapp.com/blog"
                className="inline-flex items-center gap-2 bg-white text-phrm-dark px-8 py-4 rounded-lg hover:bg-phrm-light transition-all transform hover:scale-105 shadow-lg font-semibold text-lg"
              >
                <BookOpen className="w-5 h-5" />
                Accéder au blog
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Récents Section */}
      {recentPosts.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="w-12 h-12 text-phrm-dark animate-bounce" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
                Articles Récents
              </h2>
              <p className="text-xl text-gray-600 animate-fade-in-up animation-delay-200">
                Découvrez nos dernières publications sur la gestion RH
              </p>
            </div>

            {loadingPosts ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phrm-dark"></div>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {recentPosts.slice(0, 6).map((post, index) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 overflow-hidden group animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-700 font-medium">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          {post.likes > 0 && (
                            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full">
                              <Heart className="w-3 h-3 text-red-600 fill-current" />
                              <span className="text-red-700 font-medium">
                                {post.likes}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-phrm-dark transition-colors duration-300 line-clamp-2">
                          {post.title}
                        </h3>
                        
                        <div 
                          className="text-gray-600 text-sm leading-relaxed line-clamp-3"
                          dangerouslySetInnerHTML={{ 
                            __html: truncateText(post.content?.replace(/\n/g, ' ') || '', 150)
                          }}
                        />
                        
                        <a
                          href="https://phrmapp.com/blog"
                          className="inline-flex items-center gap-2 text-phrm-dark font-semibold hover:gap-3 transition-all duration-300 group-hover:text-blue-700"
                        >
                          Lire la suite
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="text-center animate-fade-in-up animation-delay-300">
                  <a
                    href="https://phrmapp.com/blog"
                    className="inline-flex items-center gap-2 bg-phrm-dark text-white px-8 py-4 rounded-lg hover:bg-phrm-dark/90 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg"
                  >
                    <BookOpen className="w-5 h-5" />
                    Voir tous les articles
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {/* <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tarifs Transparents
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez le plan qui correspond à votre entreprise
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-phrm-dark transition-colors duration-300">Starter</h3>
                <p className="text-gray-600 mb-4">Parfait pour les PME</p>
                <div className="text-4xl font-bold text-phrm-dark mb-2 group-hover:scale-110 transition-transform duration-300">25,000 FCFA</div>
                <p className="text-gray-600">/mois par employé</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Jusqu'à 25 employés</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Gestion de paie CNPS</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Employee Self-Service</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Support email</span>
                </li>
              </ul>
              <a href="https://phrmapp.com/demo-signup" className="w-full bg-phrm-dark text-white py-3 rounded-lg hover:bg-phrm-dark/90 transition-colors inline-block text-center">
                Commencer l'essai
              </a>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-phrm-dark relative hover:shadow-2xl transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-100">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 animate-bounce">
                <span className="bg-phrm-dark text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Populaire
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-phrm-dark transition-colors duration-300">Professional</h3>
                <p className="text-gray-600 mb-4">Pour les entreprises en croissance</p>
                <div className="text-4xl font-bold text-phrm-dark mb-2 group-hover:scale-110 transition-transform duration-300">20,000 FCFA</div>
                <p className="text-gray-600">/mois par employé</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Jusqu'à 100 employés</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Tous les modules RH</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Background Check</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Support prioritaire</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Formation incluse</span>
                </li>
              </ul>
              <a href="https://phrmapp.com/demo-signup" className="w-full bg-phrm-dark text-white py-3 rounded-lg hover:bg-phrm-dark/90 transition-colors inline-block text-center">
                Commencer l'essai
              </a>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-4">Pour les grandes entreprises</p>
                <div className="text-4xl font-bold text-phrm-dark mb-2">15,000 FCFA</div>
                <p className="text-gray-600">/mois par employé</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Employés illimités</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Multi-tenant</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">API personnalisée</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Support dédié 24/7</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Conseil juridique inclus</span>
                </li>
              </ul>
              <button className="w-full bg-phrm-dark text-white py-3 rounded-lg hover:bg-phrm-dark/90 transition-colors">
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section> */}

      {/* Why PHRM Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir PHRM ?
            </h2>
            <p className="text-xl text-gray-600">
              La seule solution RH 100% adaptée au marché camerounais
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Conformité garantie</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Calculs automatisés
</h4>
                    <p className="text-gray-600">Toutes les retenues salariales et patronales respectent la réglementation en vigueur</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Mise à jour règlementaire de l'application</h4>
                    <p className="text-gray-600">Lorsque le régime fiscal change en matière salariale possibilité d'intégrer les changements.
</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Évitez les pénalités</h4>
                    <p className="text-gray-600">Tranquillité d'esprit, toutes vos déclarations sont faites dans les délais vous évitant des frais supplémentaires.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Économies réalisées</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Temps de paie</span>
                  <span className="text-2xl font-bold text-green-600">-80%</span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Erreurs de calcul</span>
                  <span className="text-2xl font-bold text-green-600">-95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Coût administratif</span>
                  <span className="text-2xl font-bold text-green-600">-60%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ROI moyen</span>
                  <span className="text-2xl font-bold text-blue-600">300%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Questions Fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur PHRM
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">PHRM est-il en conformité avec les différentes réglementations?</h3>
              <p className="text-gray-600">Oui, Nous avons développé l'application en tenant compte dans tous les calculs à la législation en vigueur en la matière.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Combien de temps faut-il pour migrer nos données ?</h3>
              <p className="text-gray-600">La migration dépend de la taille de votre entreprise. Pour une PME de 50 employés, comptez 1-2 semaines. Nous vous accompagnons tout au long du processus avec notre équipe de migration dédiée.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mes données sont-elles sécurisées ?</h3>
              <p className="text-gray-600">Absolument. PHRM utilise les dernières technologies de sécurité avec chiffrement AES-256, sauvegardes quotidiennes et conformité RGPD. Vos données sont hébergées sur des serveurs sécurisés au Cameroun.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Puis-je essayer PHRM avant de m'engager ?</h3>
              <p className="text-gray-600">Bien sûr ! Nous offrons un essai gratuit de 30 jours sans engagement. Vous pouvez tester toutes les fonctionnalités avec vos vraies données. Notre équipe vous accompagne pendant cette période.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quel support technique proposez-vous ?</h3>
              <p className="text-gray-600">Nous offrons un support technique en français 24/7 par email, chat et téléphone. Les clients Professional et Enterprise bénéficient d'un support prioritaire avec un temps de réponse garanti de moins de 2 heures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-phrm-dark to-phrm-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6 animate-fade-in-up">
              Prêt à moderniser votre gestion RH ?
            </h2>
            <p className="text-xl text-blue-100 mb-8 animate-fade-in-up animation-delay-200">
              Rejoignez les centaines d'entreprises camerounaises qui nous font confiance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105 group animate-fade-in-up">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Email</h3>
              <p className="text-blue-400 mb-4">sarphrm17@gmail.com</p>
              <p className="text-sm text-blue-300">Réponse sous 24h</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-100">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Téléphone</h3>
              <p className="text-blue-400 mb-4">+237 6 91313674</p>
              <p className="text-sm text-blue-300">Lun - Ven: 8h00 - 18h00</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105 group animate-fade-in-up animation-delay-200">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Adresse</h3>
              <p className="text-blue-400 mb-4">YaoundéCameroun</p>
              <p className="text-sm text-blue-300">Bureau principal</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="text-center animate-fade-in-up animation-delay-300">
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              {/* <a href="https://phrmapp.com/demo" className="bg-white text-phrm-dark px-8 py-4 rounded-lg hover:bg-phrm-light transition-all transform hover:scale-105 shadow-lg font-semibold inline-block text-center">
                Demander une démo
              </a>
              <a href="#pricing" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors font-semibold inline-block text-center">
                Voir les tarifs
              </a>
              <a href="https://phrmapp.com/demo-signup" className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg font-semibold inline-block text-center">
                Essai gratuit 30 jours
              </a> */}
            </div>

            {/* Social Media */}
            <div className="flex justify-center space-x-6">
              <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110">
                <Facebook className="w-6 h-6 text-white" />
              </a>
              <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110">
                <Twitter className="w-6 h-6 text-white" />
              </a>
              <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110">
                <Linkedin className="w-6 h-6 text-white" />
              </a>
              <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110">
                <MessageCircle className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logophrm.png" alt="PHRM Logo" className="w-7 h-7 aspect-square object-contain" />
                <span className="text-xl font-bold text-phrm-dark">PHRM</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plateforme de gestion RH conforme à la réglementation camerounaise
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="https://phrmapp.com/blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Statut</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 PHRM. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
