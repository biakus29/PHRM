import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit as fsLimit, startAfter } from 'firebase/firestore';
import { Briefcase, MapPin, Clock, Building2, Search, Filter, ChevronRight, Loader2, BadgeCheck, Users, Calendar, ArrowRight, TrendingUp, Sparkles, Target } from 'lucide-react';

const formatRelative = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  const days = Math.floor(diff/86400);
  return days === 1 ? 'hier' : `il y a ${days} j`;
};

const workflowBadge = (workflowType) => {
  if (workflowType === 'full') {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm">
        <BadgeCheck className="w-3.5 h-3.5 mr-1.5" /> Recrutement complet
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
      <Users className="w-3.5 h-3.5 mr-1.5" /> Recrutement partiel
    </span>
  );
};

const PublicJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [qText, setQText] = useState('');
  const [location, setLocation] = useState('');
  const [contractType, setContractType] = useState('');
  const [workflowType, setWorkflowType] = useState('');
  const [pageCursor, setPageCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const loadCompanies = async (companyIds) => {
    const unique = Array.from(new Set(companyIds)).filter(Boolean);
    const next = { ...companies };
    for (const id of unique) {
      if (!next[id]) {
        try {
          const snap = await getDoc(doc(db, 'companies', id));
          if (snap.exists()) next[id] = { id: snap.id, ...snap.data() };
        } catch (e) {
          // ignore
        }
      }
    }
    setCompanies(next);
  };

  const buildQuery = (firstPage = true) => {
    const base = [where('status', '==', 'published')];
    if (location) base.push(where('location', '==', location));
    if (contractType) base.push(where('contractType', '==', contractType));
    if (workflowType) base.push(where('workflowType', '==', workflowType));
    const col = collection(db, 'jobs');
    let qRef = query(col, ...base, orderBy('publishedAt', 'desc'), fsLimit(12));
    if (!firstPage && pageCursor) {
      qRef = query(col, ...base, orderBy('publishedAt', 'desc'), startAfter(pageCursor), fsLimit(12));
    }
    return qRef;
  };

  const fetchJobs = async (firstPage = true) => {
    setLoading(true);
    try {
      const qRef = buildQuery(firstPage);
      const snapshot = await getDocs(qRef);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data(), _doc: d }));
      const filtered = qText
        ? items.filter(j => (
            (j.title || '').toLowerCase().includes(qText.toLowerCase()) ||
            (j.description || '').toLowerCase().includes(qText.toLowerCase()) ||
            (j.skills || []).some(s => (s || '').toLowerCase().includes(qText.toLowerCase()))
          ))
        : items;
      setJobs(firstPage ? filtered : [...jobs, ...filtered]);
      setPageCursor(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 12);
      await loadCompanies(filtered.map(j => j.companyId));
    } catch (e) {
      console.error('Erreur chargement offres:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(true);
  }, [location, contractType, workflowType]);

  const JobCard = ({ job, index }) => {
    const c = companies[job.companyId];
    const logo = c?.logoUrl;
    const companyName = c?.name || 'Entreprise';
    
    return (
      <div 
        className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-blue-200 transition-all duration-500 overflow-hidden hover:shadow-xl"
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
        }}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-indigo-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:via-indigo-50/30 group-hover:to-purple-50/50 transition-all duration-500 pointer-events-none" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                {logo ? (
                  <img src={logo} alt={companyName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-7 h-7 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300 truncate">
                  {job.title}
                </h3>
                <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{companyName}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  <span className="inline-flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-500" /> 
                    {job.location || 'Non spécifié'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow badge hidden for applicants */}
          {/* <div className="mb-4">{workflowBadge(job.workflowType)}</div> */}

          <p className="text-gray-600 line-clamp-2 mb-5 leading-relaxed">
            {job.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {job.contractType && (
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
                {job.contractType}
              </span>
            )}
            {Array.isArray(job.skills) && job.skills.slice(0,3).map((s, i) => (
              <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-200">
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-500 inline-flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {formatRelative(job.publishedAt)}
              </div>
              <div className="text-xs text-gray-500 inline-flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {job.deadline ? `Jusqu'au ${new Date(job.deadline.seconds ? job.deadline.seconds*1000 : job.deadline).toLocaleDateString('fr-FR')}` : 'Ouvert'}
              </div>
            </div>
            <button
              onClick={() => navigate(`/offres/${job.id}`)}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Voir l'offre 
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }

        .floating-shape {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl floating-shape" style={{animationDelay: '0s'}} />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl floating-shape" style={{animationDelay: '2s'}} />
          <div className="absolute -bottom-12 left-1/3 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl floating-shape" style={{animationDelay: '4s'}} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6 animate-fade-in-up">
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold">Plateforme de recrutement PHRM</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 animate-fade-in-up animation-delay-100">
                Trouvez votre
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                  prochain emploi
                </span>
              </h1>
              <p className="text-lg text-white/90 max-w-2xl leading-relaxed mb-6 animate-fade-in-up animation-delay-200">
                Découvrez des opportunités exceptionnelles avec nos processus de recrutement complet et partiel. Postulez en quelques clics et suivez vos candidatures en temps réel.
              </p>
              <div className="flex flex-wrap items-center gap-6 animate-fade-in-up animation-delay-300">
                <div className="flex items-center space-x-2 hover:scale-110 transition-transform duration-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-white/90 font-medium">Mise à jour continue</span>
                </div>
                <div className="flex items-center space-x-2 hover:scale-110 transition-transform duration-200">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/90 font-medium">Offres vérifiées</span>
                </div>
                <div className="flex items-center space-x-2 hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/90 font-medium">Candidature rapide</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl animate-fade-in-up animation-delay-300 max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">{jobs.length}</div>
                  <div className="text-sm text-white/80">Offres disponibles</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Entreprises actives</span>
                  <span className="font-bold text-white">{new Set(jobs.map(j => j.companyId)).size}+</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Mis à jour</span>
                  <span className="font-bold text-white">{formatRelative(new Date())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="mt-12 animate-fade-in-up animation-delay-400">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-3 border border-white/50">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 flex items-center px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200">
                  <Search className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <input
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-500 font-medium"
                    placeholder="Rechercher par titre, compétences..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    onKeyDown={(e)=> { if (e.key==='Enter') fetchJobs(true); }}
                  />
                </div>
                
                <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <input 
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-500 font-medium" 
                    placeholder="Ville / Remote" 
                    value={location} 
                    onChange={(e)=>setLocation(e.target.value)} 
                  />
                </div>
                
                <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200">
                  <Filter className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <select 
                    className="outline-none bg-transparent text-gray-700 font-medium w-full cursor-pointer" 
                    value={contractType} 
                    onChange={(e)=>setContractType(e.target.value)}
                  >
                    <option value="">Tous contrats</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                
                {/* Workflow filter hidden for applicants */}
                {/*
                <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200">
                  <Briefcase className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <select className="outline-none bg-transparent text-gray-700 font-medium w/full cursor-pointer" value={workflowType} onChange={(e)=>setWorkflowType(e.target.value)}>
                    <option value="">Tous workflows</option>
                    <option value="partial">Recrutement partiel</option>
                    <option value="full">Recrutement complet</option>
                  </select>
                </div>
                */}
                
                <button 
                  onClick={()=>fetchJobs(true)} 
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center whitespace-nowrap"
                >
                  Rechercher 
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="text-lg font-semibold text-gray-700">
            {loading ? (
              <span className="inline-flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
                Chargement des offres
              </span>
            ) : (
              <span>
                <span className="text-3xl font-bold text-blue-600">{jobs.length}</span>
                <span className="ml-2 text-gray-600">offre{jobs.length > 1 ? 's' : ''} disponible{jobs.length > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="w-full flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Recherche en cours...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-600 max-w-md">
              Essayez de modifier vos critères de recherche ou d'élargir vos filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={()=>fetchJobs(false)} 
              className="group px-8 py-4 rounded-xl bg-white border-2 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-xl font-bold text-gray-700 hover:text-blue-600 inline-flex items-center transform hover:scale-105 transition-all duration-300"
            >
              Charger plus d'offres
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicJobs;