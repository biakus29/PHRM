import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  Building2, ArrowLeft, Upload, FileText, Mail, Phone, User, 
  Loader2, CheckCircle2, Chrome, X, ChevronDown 
} from 'lucide-react';

const PublicApply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Form states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});

  // Additional info (collapsible)
  const [showMore, setShowMore] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availability, setAvailability] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Auth
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const jobSnap = await getDoc(doc(db, 'jobs', jobId));
        if (!jobSnap.exists()) {
          navigate('/offres');
          return;
        }
        const jobData = { id: jobSnap.id, ...jobSnap.data() };
        setJob(jobData);

        if (jobData.companyId) {
          const companySnap = await getDoc(doc(db, 'companies', jobData.companyId));
          if (companySnap.exists()) setCompany({ id: companySnap.id, ...companySnap.data() });
        }
      } catch (err) {
        console.error(err);
        navigate('/offres');
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [jobId, navigate]);

  // Load candidate profile when logged in
  useEffect(() => {
    if (auth.currentUser) {
      const loadProfile = async () => {
        const snap = await getDoc(doc(db, 'candidates', auth.currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          setFullname(d.name || auth.currentUser.displayName || '');
          setEmail(d.email || auth.currentUser.email || '');
          setPhone(d.phone || '');
          setLocation(d.location || '');
          setCoverLetter(d.coverLetter || '');
          setExpectedSalary(d.expectedSalary || '');
          setAvailability(d.availability || '');
          setLinkedIn(d.linkedIn || '');
          setPortfolio(d.portfolio || '');
        }
      };
      loadProfile();
    }
  }, [auth.currentUser]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const cRef = doc(db, 'candidates', user.uid);
      const snap = await getDoc(cRef);
      if (!snap.exists()) {
        await setDoc(cRef, {
          userId: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          phone: '',
          location: '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('Connexion échouée. Réessayez.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!fullname.trim()) e.fullname = "Nom requis";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email invalide";
    if (!resumeFile) e.resume = "CV obligatoire";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

 const uploadResume = async (uid) => {
  if (!resumeFile) throw new Error("Aucun fichier CV");
  const ext = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf';
  const fileRef = ref(storage, `candidates/${uid}/resumes/${Date.now()}.${ext}`);
  const snapshot = await uploadBytes(fileRef, resumeFile);
  return await getDownloadURL(snapshot.ref);
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!auth.currentUser) {
      alert("Vous devez être connecté pour postuler");
      return;
    }

    setSubmitting(true);
    try {
      const resumeUrl = await uploadResume(auth.currentUser.uid);

      await addDoc(collection(db, 'applications'), {
        jobId,
        companyId: job.companyId || null,
        candidateId: auth.currentUser.uid,
        resumeUrl,
        status: 'applied',
        source: 'public',
        createdAt: serverTimestamp(),
        candidateInfo: {
          fullname, email, phone, location,
          coverLetter, expectedSalary, availability,
          linkedIn, portfolio
        }
      });

      // Update candidate profile
      await setDoc(doc(db, 'candidates', auth.currentUser.uid), {
        name: fullname,
        email,
        phone,
        location,
        coverLetter,
        expectedSalary,
        availability,
        linkedIn,
        portfolio,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setDone(true);
      setTimeout(() => navigate(`/offres/${jobId}`), 4000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!job) return null;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Link to={`/offres/${jobId}`} className="inline-flex items-center text-white/80 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour à l'offre
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/30">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-9 h-9" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Postuler chez {company?.name || 'l\'entreprise'}</h1>
              <p className="text-xl font-medium mt-1 opacity-95">{job.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 -mt-6">
        {/* Success */}
        {done && <SuccessMessage />}

        {/* Auth Gate */}
        {!auth.currentUser && !done && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Connectez-vous pour postuler</h2>
            <p className="text-gray-600 mb-8">Votre profil sera pré-rempli automatiquement</p>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 border border-gray-300 rounded-xl transition-all shadow-sm"
            >
              <Chrome className="w-6 h-6" />
              {googleLoading ? "Connexion..." : "Continuer avec Google"}
            </button>
          </div>
        )}

        {/* Form - Only if logged in */}
        {auth.currentUser && !done && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Vos informations</h3>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <Input label="Nom complet *" icon={<User className="w-5 h-5" />} 
                       value={fullname} onChange={setFullname} error={errors.fullname} />
                <Input label="Email *" type="email" icon={<Mail className="w-5 h-5" />} 
                       value={email} onChange={setEmail} error={errors.email} />
                <Input label="Téléphone" icon={<Phone className="w-5 h-5" />} 
                       value={phone} onChange={setPhone} placeholder="+237 ..." />
                <Input label="Ville / Pays" value={location} onChange={setLocation} />
              </div>

              {/* Resume Upload */}
              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Votre CV (PDF, DOC) *</label>
                <label className={`block border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-all
                  ${errors.resume ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-indigo-400 bg-gray-50'}`}
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                      <FileText className="w-5 h-5" />
                      {resumeFile.name}
                      <button type="button" onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                              className="ml-2 text-red-600 hover:text-red-800">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600">Glissez-déposez ou cliquez pour uploader</p>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" 
                         onChange={(e) => e.target.files?.[0] && setResumeFile(e.target.files[0])} />
                </label>
                {errors.resume && <p className="text-red-600 text-sm mt-2">{errors.resume}</p>}
              </div>
            </div>

            {/* Additional Info - Collapsible */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">
                  Informations complémentaires (optionnel)
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </button>

              {showMore && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-200 pt-6">
                  <Textarea label="Lettre de motivation" value={coverLetter} onChange={setCoverLetter}
                            placeholder="Pourquoi êtes-vous le candidat idéal ?" rows={5} />
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input label="Salaire attendu" value={expectedSalary} onChange={setExpectedSalary}
                           placeholder="Ex: 450 000 FCFA" />
                    <Select label="Disponibilité" value={availability} onChange={setAvailability}
                            options={[
                              { value: "", label: "Sélectionner..." },
                              { value: "immediate", label: "Immédiate" },
                              { value: "2weeks", label: "Dans 2 semaines" },
                              { value: "1month", label: "Dans 1 mois" },
                              { value: "3months+", label: "3 mois ou plus" }
                            ]} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input label="LinkedIn" value={linkedIn} onChange={setLinkedIn}
                           placeholder="https://linkedin.com/in/..." />
                    <Input label="Portfolio / Site" value={portfolio} onChange={setPortfolio}
                           placeholder="https://..." />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg px-10 py-5 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>Envoi en cours... <Loader2 className="w-6 h-6 animate-spin" /></>
                ) : (
                  <>Envoyer ma candidature</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

// Reusable Components
const Input = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} focus-within:border-indigo-500 transition-colors`}>
      {icon && <span className="text-gray-500">{icon}</span>}
      <input className="flex-1 outline-none text-gray-900" {...props} />
    </div>
    {error && <p className="text-red-600 text-xs mt-1 ml-1">{error}</p>}
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
    <textarea className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 outline-none resize-none" {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
    <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 outline-none bg-white" {...props}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Chargement de l'offre...</p>
    </div>
  </div>
);

const SuccessMessage = () => (
  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-10 text-center shadow-2xl">
    <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
    <h2 className="text-3xl font-bold mb-2">Candidature envoyée !</h2>
    <p className="text-lg opacity-95">Nous avons bien reçu votre dossier. Vous recevrez un email de confirmation.</p>
  </div>
);

export default PublicApply;