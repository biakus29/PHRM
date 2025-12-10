import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { listSubmittedJobs, publishJob, rejectJob } from '../services/jobs';
import { FiCheck, FiX, FiRefreshCw, FiExternalLink, FiPlus } from 'react-icons/fi';
import emailjs from '@emailjs/browser';

const SuperadminJobsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    contractType: 'CDI',
    salaryRange: '',
    skills: '',
    experienceMin: 0,
    workflowType: 'partial',
    companyId: ''
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Charger TOUTES les offres (submitted + published)
      const snap = await getDocs(collection(db, 'jobs'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Trier par date de création (plus récent en premier)
      items.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setJobs(items);
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // Charger les entreprises
  const loadCompanies = async () => {
    try {
      const snap = await getDocs(collection(db, 'companies'));
      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Erreur chargement entreprises:', e);
    }
  };

  useEffect(() => {
    load();
    loadCompanies();
  }, []);

  const sendMail = async (email, subject, htmlContent) => {
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID, 
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID, 
        {
          to_email: email,
          to_name: 'Entreprise',
          job_title: subject,
          message: htmlContent,
          from_name: 'PHRM',
          from_email: 'tonybiakus@gmail.com'
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY 
      );
    } catch (e) {
      console.error('Erreur EmailJS complète:', e);
      alert('Erreur EmailJS: ' + (e.text || e.message || 'Erreur inconnue'));
      // non bloquant
    }
  };

  const handlePublish = async (job) => {
    try {
      setBusy(job.id);
      await publishJob(job.id);
      // notif client
      if (job.companyId) {
        const cs = await getDoc(doc(db, 'companies', job.companyId));
        const company = cs.exists() ? cs.data() : null;
        if (company?.email) {
          await sendMail(
            company.email,
            `Offre publiée - ${job.title}`,
            `<p>Votre offre <b>${job.title}</b> a été publiée.</p><p>Lien public: ${window.location.origin}/offres/${job.id}</p>`
          );
        }
      }
      await load();
    } finally {
      setBusy('');
    }
  };

  const handleReject = async (job) => {
    const reason = window.prompt('Motif du refus ?');
    if (reason === null) return;
    try {
      setBusy(job.id);
      await rejectJob(job.id, reason);
      // notif client
      if (job.companyId) {
        const cs = await getDoc(doc(db, 'companies', job.companyId));
        const company = cs.exists() ? cs.data() : null;
        if (company?.email) {
          await sendMail(
            company.email,
            `Offre refusée - ${job.title}`,
            `<p>Votre offre <b>${job.title}</b> a été refusée.</p><p>Motif: ${reason}</p>`
          );
        }
      }
      await load();
    } finally {
      setBusy('');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Titre et description obligatoires');
      return;
    }

    try {
      setBusy('create');
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const jobRef = await addDoc(collection(db, 'jobs'), {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        contractType: formData.contractType,
        salaryRange: formData.salaryRange,
        skills: skillsArray,
        experienceMin: parseInt(formData.experienceMin) || 0,
        workflowType: formData.workflowType,
        companyId: formData.companyId,
        status: 'published',
        source: 'superadmin',
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Notifier l'entreprise si sélectionnée
      if (formData.companyId) {
        const cs = await getDoc(doc(db, 'companies', formData.companyId));
        const company = cs.exists() ? cs.data() : null;
        if (company?.email) {
          await sendMail(
            company.email,
            `Nouvelle offre créée - ${formData.title}`,
            `<p>Une nouvelle offre <b>${formData.title}</b> a été créée et publiée.</p><p>Lien public: ${window.location.origin}/offres/${jobRef.id}</p>`
          );
        }
      }

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        location: '',
        contractType: 'CDI',
        salaryRange: '',
        skills: '',
        experienceMin: 0,
        workflowType: 'partial',
        companyId: ''
      });
      setShowCreateForm(false);
      await load();
    } catch (e) {
      alert('Erreur: ' + e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Création d'Offre */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Créer une Offre</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <FiPlus className="mr-2" /> {showCreateForm ? 'Annuler' : 'Nouvelle Offre'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateJob} className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Titre de l'offre *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner une entreprise</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              rows="4"
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Localisation"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
              </select>
              <input
                type="text"
                placeholder="Salaire"
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Compétences (séparées par virgule)"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Expérience min (ans)"
                value={formData.experienceMin}
                onChange={(e) => setFormData({ ...formData, experienceMin: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <select
                value={formData.workflowType}
                onChange={(e) => setFormData({ ...formData, workflowType: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="partial">Recrutement Partiel</option>
                <option value="full">Recrutement Complet</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy === 'create'}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy === 'create' ? 'Création...' : 'Créer l\'Offre'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section Toutes les Offres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Toutes les offres d'emploi</h2>
          <button onClick={load} className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-50">
            <FiRefreshCw className="mr-2" /> Rafraîchir
          </button>
        </div>

        {loading ? (
          <div className="text-gray-600">Chargement…</div>
        ) : jobs.length === 0 ? (
          <div className="text-gray-600">Aucune offre d'emploi.</div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => {
              const isSubmitted = job.status === 'submitted';
              const isPublished = job.status === 'published';
              const isRejected = job.status === 'rejected';
              
              return (
                <div 
                  key={job.id} 
                  className={`p-4 border rounded-xl flex items-center justify-between ${
                    isSubmitted ? 'border-yellow-300 bg-yellow-50' :
                    isPublished ? 'border-green-300 bg-green-50' :
                    isRejected ? 'border-red-300 bg-red-50' :
                    'border-gray-300'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-600">{job.location} • {job.contractType} • Workflow: {job.workflowType}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isSubmitted ? 'bg-yellow-200 text-yellow-800' :
                        isPublished ? 'bg-green-200 text-green-800' :
                        isRejected ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {isSubmitted ? 'En attente' : isPublished ? 'Publiée' : isRejected ? 'Refusée' : job.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/offres/${job.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-gray-50">
                      <FiExternalLink className="mr-1" /> Voir
                    </a>
                    {isSubmitted && (
                      <>
                        <button disabled={busy===job.id} onClick={()=>handlePublish(job)} className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                          <FiCheck className="mr-1" /> Publier
                        </button>
                        <button disabled={busy===job.id} onClick={()=>handleReject(job)} className="inline-flex items-center px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                          <FiX className="mr-1" /> Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperadminJobsPanel;
