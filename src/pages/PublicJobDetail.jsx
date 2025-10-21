import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Building2, MapPin, Briefcase, Clock, Calendar, Users, BadgeCheck, ArrowLeft, ArrowRight } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString('fr-FR');
};

const PublicJobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const js = await getDoc(doc(db, 'jobs', jobId));
        if (js.exists()) {
          const jobData = { id: js.id, ...js.data() };
          setJob(jobData);
          if (jobData.companyId) {
            const cs = await getDoc(doc(db, 'companies', jobData.companyId));
            if (cs.exists()) setCompany({ id: cs.id, ...cs.data() });
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Erreur chargement offre:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const themeGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600';

  const workflowBadge = (wf) => {
    if (wf === 'full') return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
        <BadgeCheck className="w-3 h-3 mr-1" /> Recrutement complet
      </span>
    );
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        <Users className="w-3 h-3 mr-1" /> Recrutement partiel
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Chargement…</div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Offre introuvable</div>
    );
  }

  const logo = company?.logoUrl;
  const companyName = company?.name || 'Entreprise';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${themeGradient} text-white`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={()=>navigate('/offres')} className="inline-flex items-center text-white/90 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux offres
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
                {logo ? <img src={logo} alt={companyName} className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-white/70" />}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{job.title}</h1>
                <div className="text-white/90 text-sm flex items-center gap-3 mt-1">
                  <span className="font-medium">{companyName}</span>
                  <span>•</span>
                  <span className="inline-flex items-center"><MapPin className="w-4 h-4 mr-1" /> {job.location || '—'}</span>
                  <span>•</span>
                  <span className="inline-flex items-center"><Briefcase className="w-4 h-4 mr-1" /> {job.contractType || '—'}</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">{workflowBadge(job.workflowType)}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>

            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Compétences requises</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {job.salaryRange && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Rémunération</h3>
                <p className="text-gray-700">{job.salaryRange}</p>
              </div>
            )}

            {job.workflowType === 'full' && (
              <div className="mt-6 p-4 rounded-xl border bg-purple-50 border-purple-200">
                <h3 className="text-base font-semibold text-purple-800 mb-1">Prestation complète</h3>
                <p className="text-sm text-purple-800/90">Cette offre est gérée de bout en bout par notre équipe. Vous serez recontacté avec un profil prêt à signer si votre candidature est retenue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Informations</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-gray-500" /> Publiée le {formatDate(job.publishedAt)}</li>
              {job.deadline && <li className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-500" /> Jusqu'au {formatDate(job.deadline)}</li>}
              {job.experienceMin != null && <li className="flex items-center"><Users className="w-4 h-4 mr-2 text-gray-500" /> Expérience min: {job.experienceMin} an(s)</li>}
            </ul>
            <button
              onClick={() => navigate(`/postuler/${job.id}`)}
              className="mt-5 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Postuler maintenant <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">À propos de l'entreprise</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {logo ? <img src={logo} alt={companyName} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-gray-400" />}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{companyName}</div>
                {company?.sector && <div className="text-xs text-gray-600">Secteur: {company.sector}</div>}
              </div>
            </div>
            {company?.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-700">Visiter le site</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicJobDetail;
