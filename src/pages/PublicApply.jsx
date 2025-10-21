import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Building2, ArrowLeft, Upload, FileText, Mail, Phone, User, Loader2, CheckCircle2 } from 'lucide-react';

const PublicApply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Candidate info gate
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const js = await getDoc(doc(db, 'jobs', jobId));
        if (js.exists()) {
          const jd = { id: js.id, ...js.data() };
          setJob(jd);
          if (jd.companyId) {
            const cs = await getDoc(doc(db, 'companies', jd.companyId));
            if (cs.exists()) setCompany({ id: cs.id, ...cs.data() });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const validate = () => {
    const e = {};
    if (!fullname.trim()) e.fullname = "Le nom complet est requis";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email invalide";
    if (!resumeFile) e.resume = "CV requis (PDF/DOC)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const ensureCandidateProfile = async (uidOrEmail) => {
    // If user is logged in, use uid, else fallback to email-based doc id (hashed path avoided for simplicity in MVP)
    const candidateId = uidOrEmail;
    const cRef = doc(db, 'candidates', candidateId);
    const snap = await getDoc(cRef);
    if (!snap.exists()) {
      await setDoc(cRef, {
        userId: candidateId,
        name: fullname,
        email,
        phone,
        location: location || '',
        resumes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update basic fields if changed
      await setDoc(cRef, {
        ...snap.data(),
        name: fullname,
        email,
        phone,
        location: location || '',
        updatedAt: serverTimestamp(),
      });
    }
    return candidateId;
  };

  const uploadResume = async (candidateId, file) => {
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const fileRef = ref(storage, `candidates/${candidateId}/resumes/${Date.now()}.${ext}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  const sendMailDoc = async (payload) => {
    try {
      await addDoc(collection(db, 'mail'), payload);
    } catch (e) {
      // Non bloquant
      // eslint-disable-next-line no-console
      console.error('Email queue error:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Identify candidate
      const user = auth.currentUser;
      const candidateId = await ensureCandidateProfile(user?.uid || email);

      // Upload resume
      const resumeUrl = await uploadResume(candidateId, resumeFile);

      // Create application
      const appRef = await addDoc(collection(db, 'applications'), {
        jobId,
        companyId: job?.companyId || null,
        candidateId,
        resumeUrl,
        status: 'applied',
        source: 'public',
        createdAt: serverTimestamp(),
        history: [
          { at: serverTimestamp(), action: 'applied', by: candidateId }
        ]
      });

      // Emails (Firebase Trigger Email extension expects 'to' & 'message')
      // Accusé au candidat
      await sendMailDoc({
        to: [email],
        message: {
          subject: `Candidature reçue - ${job?.title || 'Offre'}`,
          html: `<p>Bonjour ${fullname},</p>
                 <p>Nous avons bien reçu votre candidature pour <b>${job?.title || ''}</b>.</p>
                 <p>Nous vous tiendrons informé des suites.</p>`
        }
      });

      // Notification entreprise (si email connu côté company)
      if (company?.email) {
        await sendMailDoc({
          to: [company.email],
          message: {
            subject: `Nouvelle candidature - ${job?.title || ''}`,
            html: `<p>Une nouvelle candidature a été soumise pour <b>${job?.title || ''}</b>.</p>
                   <p>Candidat: ${fullname} (${email})</p>`
          }
        });
      }

      setDone(true);
      // Redirect after short delay
      setTimeout(() => navigate(`/offres/${jobId}`), 2000);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Erreur lors de l'envoi de votre candidature. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Chargement…</div>;
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Offre introuvable</div>;
  }

  const themeGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600';
  const companyName = company?.name || 'Entreprise';
  const logo = company?.logoUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${themeGradient} text-white`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to={`/offres/${jobId}`} className="inline-flex items-center text-white/90 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour à l'offre
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
              {logo ? <img src={logo} alt={companyName} className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-white/70" />}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Postuler à {job.title}</h1>
              <p className="text-white/90 text-sm">{companyName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {done ? (
          <div className="bg-white border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h2 className="mt-3 text-xl font-bold text-gray-900">Candidature envoyée !</h2>
            <p className="text-gray-600 mt-1">Un accusé de réception a été envoyé à votre adresse email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Nom complet</label>
              <div className={`flex items-center px-3 py-2 rounded-lg border ${errors.fullname ? 'border-red-300' : 'border-gray-300'}`}>
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <input value={fullname} onChange={(e)=>setFullname(e.target.value)} className="w-full outline-none" placeholder="Ex: Jean Dupont" />
              </div>
              {errors.fullname && <p className="text-xs text-red-600 mt-1">{errors.fullname}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                <div className={`flex items-center px-3 py-2 rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-300'}`}>
                  <Mail className="w-4 h-4 text-gray-500 mr-2" />
                  <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full outline-none" placeholder="vous@example.com" />
                </div>
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Téléphone (optionnel)</label>
                <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
                  <Phone className="w-4 h-4 text-gray-500 mr-2" />
                  <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full outline-none" placeholder="+237 6 XX XX XX XX" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Localisation (optionnel)</label>
              <input value={location} onChange={(e)=>setLocation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none" placeholder="Ville / Pays" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Votre CV</label>
              <label className={`flex items-center justify-between px-4 py-3 rounded-xl border-dashed border-2 ${errors.resume ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'} cursor-pointer`}> 
                <div className="flex items-center gap-3 text-gray-700">
                  <Upload className="w-5 h-5" />
                  {resumeFile ? (
                    <span className="font-medium">{resumeFile.name}</span>
                  ) : (
                    <span>Choisir un fichier (PDF/DOC)</span>
                  )}
                </div>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e)=> setResumeFile(e.target.files?.[0] || null)} />
                <FileText className="w-5 h-5 text-gray-500" />
              </label>
              {errors.resume && <p className="text-xs text-red-600 mt-1">{errors.resume}</p>}
            </div>

            <div className="pt-2">
              <button disabled={submitting} className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">
                {submitting ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi…</>) : 'Envoyer ma candidature'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicApply;
