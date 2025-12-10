import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FiRefreshCw, FiMail, FiExternalLink, FiCheck, FiX, FiClock, FiDownload } from 'react-icons/fi';
import emailjs from '@emailjs/browser';

const SuperadminApplicationsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [busy, setBusy] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);

  const loadJobs = async () => {
    const qs = await getDocs(query(collection(db, 'jobs')));
    setJobs(qs.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const enrich = async (list) => {
    // Attach candidate and job info to each application
    const out = [];
    for (const a of list) {
      let candidate = null;
      let job = null;
      try {
        if (a.candidateId) {
          const cs = await getDoc(doc(db, 'candidates', a.candidateId));
          if (cs.exists()) candidate = { id: cs.id, ...cs.data() };
        }
      } catch {}
      try {
        if (a.jobId) {
          const js = await getDoc(doc(db, 'jobs', a.jobId));
          if (js.exists()) job = { id: js.id, ...js.data() };
        }
      } catch {}
      out.push({ ...a, _candidate: candidate, _job: job });
    }
    return out;
  };

  const load = async () => {
    setLoading(true);
    try {
      const base = [orderBy('createdAt', 'desc')];
      const filters = [];
      
      if (selectedJob) filters.push(where('jobId', '==', selectedJob));
      if (selectedStatus) filters.push(where('status', '==', selectedStatus));
      
      const qRef = filters.length > 0
        ? query(collection(db, 'applications'), ...filters, ...base)
        : query(collection(db, 'applications'), ...base);
      
      const snap = await getDocs(qRef);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const withInfo = await enrich(items);
      setApps(withInfo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    load();
  }, [selectedJob, selectedStatus]);

  const sendReply = async () => {
    if (!replyTo?.email || !replyText.trim()) return;
    try {
      setBusy('mail');
      
      // Debug - vérifier les variables d'environnement
      console.log('EmailJS Config:', {
        serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
        templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      });
      
      if (!process.env.REACT_APP_EMAILJS_SERVICE_ID) {
        throw new Error('Service ID non défini');
      }
      if (!process.env.REACT_APP_EMAILJS_TEMPLATE_ID) {
        throw new Error('Template ID non défini');
      }
      if (!process.env.REACT_APP_EMAILJS_PUBLIC_KEY) {
        throw new Error('Public Key non définie');
      }
      
      // Utiliser EmailJS
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID, 
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID, 
        {
          to_email: replyTo.email,
          to_name: replyTo.name || 'Candidat',
          job_title: replyTo.jobTitle || 'Offre',
          message: replyText,
          from_name: 'PHRM',
          from_email: 'tonybiakus@gmail.com'
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY 
      );
      
      setReplyText('');
      setReplyTo(null);
      alert('E-mail envoyé avec succès.');
    } catch (e) {
      console.error('Erreur EmailJS complète:', e);
      alert('Erreur: ' + (e.text || e.message || 'Erreur inconnue'));
    } finally {
      setBusy('');
    }
  };

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      setBusy(appId);
      
      // Récupérer les détails de la candidature
      const appDoc = await getDoc(doc(db, 'applications', appId));
      const appData = appDoc.data();
      
      // Demander au super admin de personnaliser le message
      const candidateName = appData._candidate?.name || appData.candidateInfo?.fullname || 'Candidat';
      const jobTitle = appData._job?.title || 'Offre d\'emploi';
      
      const statusMessages = {
        'applied': 'Nous avons bien reçu votre candidature.',
        'screening': 'Votre candidature est en cours de sélection.',
        'interview': 'Nous souhaitons vous rencontrer pour un entretien.',
        'offer': 'Nous sommes heureux de vous faire une offre d\'emploi.',
        'hired': 'Félicitations ! Vous avez été embauché.',
        'rejected': 'Nous regrettons de vous informer que votre candidature n\'a pas été retenue.'
      };
      
      // Demander la personnalisation du message
      const defaultMessage = statusMessages[newStatus];
      const customMessage = window.prompt(
        `Message pour ${candidateName} - ${jobTitle}\n\nMessage par défaut:\n${defaultMessage}\n\nPersonnalisez le message (ou laissez vide pour utiliser le défaut):`,
        defaultMessage
      );
      
      // Mettre à jour le statut
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Envoyer l'email au candidat
      const candidateEmail = appData._candidate?.email || appData.candidateInfo?.email;
      
      if (candidateEmail) {
        const statusColors = {
          'applied': '#3B82F6',
          'screening': '#F59E0B',
          'interview': '#8B5CF6',
          'offer': '#10B981',
          'hired': '#059669',
          'rejected': '#EF4444'
        };
        
        // Utiliser EmailJS pour envoyer l'email
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID, 
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID, 
          {
            to_email: candidateEmail,
            to_name: candidateName,
            job_title: jobTitle,
            status: newStatus === 'applied' ? 'Candidature reçue' :
                   newStatus === 'screening' ? 'En sélection' :
                   newStatus === 'interview' ? 'Entretien' :
                   newStatus === 'offer' ? 'Offre' :
                   newStatus === 'hired' ? 'Embauché' :
                   newStatus === 'rejected' ? 'Refusé' : newStatus,
            message: customMessage || defaultMessage,
            from_name: 'PHRM',
            from_email: 'tonybiakus@gmail.com'
          },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY 
        );
      }
      
      await load();
    } catch (e) {
      console.error('Erreur EmailJS complète:', e);
      alert('Erreur: ' + (e.text || e.message || 'Erreur inconnue'));
    } finally {
      setBusy('');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800',
      'screening': 'bg-yellow-100 text-yellow-800',
      'interview': 'bg-purple-100 text-purple-800',
      'offer': 'bg-green-100 text-green-800',
      'hired': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Candidatures Reçues</h2>
        <button onClick={load} className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-50">
          <FiRefreshCw className="mr-2" /> Rafraîchir
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 mb-4">
        <select
          className="px-3 py-2 border rounded-lg text-sm"
          value={selectedJob}
          onChange={(e)=>setSelectedJob(e.target.value)}
        >
          <option value="">Toutes les offres</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.title || j.id}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm"
          value={selectedStatus}
          onChange={(e)=>setSelectedStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="applied">Candidature reçue</option>
          <option value="screening">En sélection</option>
          <option value="interview">Entretien</option>
          <option value="offer">Offre</option>
          <option value="hired">Embauché</option>
          <option value="rejected">Rejeté</option>
        </select>
      </div>

      {/* Zone de réponse */}
      {replyTo && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-blue-900">Répondre à {replyTo.name || replyTo.email}</div>
            <button onClick={() => setReplyTo(null)} className="text-blue-600 hover:text-blue-800">✕</button>
          </div>
          <textarea
            className="w-full px-3 py-2 border rounded-lg mb-2"
            placeholder="Votre message..."
            value={replyText}
            onChange={(e)=>setReplyText(e.target.value)}
            rows="4"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setReplyTo(null)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
              Annuler
            </button>
            <button disabled={busy==='mail'} onClick={sendReply} className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
              <FiMail className="mr-2" /> Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Liste des candidatures */}
      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : apps.length === 0 ? (
        <div className="text-gray-600 text-center py-8">Aucune candidature.</div>
      ) : (
        <div className="space-y-3">
          {apps.map(a => (
            <div key={a.id} className="border rounded-xl overflow-hidden">
              {/* En-tête cliquable */}
              <div 
                onClick={() => setExpandedApp(expandedApp === a.id ? null : a.id)}
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{a._job?.title || 'Offre'}</div>
                      <div className="text-sm text-gray-600">{a._candidate?.name || a._candidate?.email || a.candidateId}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {a.createdAt?.seconds ? new Date(a.createdAt.seconds*1000).toLocaleDateString('fr-FR') : ''}
                </div>
              </div>

              {/* Détails (expandable) */}
              {expandedApp === a.id && (
                <div className="border-t p-4 bg-gray-50 space-y-3">
                  {/* Infos candidat */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Informations du candidat</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">Nom:</span> {a._candidate?.name || 'N/A'}</div>
                      <div><span className="text-gray-600">Email:</span> {a._candidate?.email || a.candidateInfo?.email || 'N/A'}</div>
                      <div><span className="text-gray-600">Téléphone:</span> {a._candidate?.phone || a.candidateInfo?.phone || 'N/A'}</div>
                      <div><span className="text-gray-600">Localisation:</span> {a._candidate?.location || a.candidateInfo?.location || 'N/A'}</div>
                      {a.candidateInfo?.expectedSalary && <div><span className="text-gray-600">Salaire attendu:</span> {a.candidateInfo.expectedSalary}</div>}
                      {a.candidateInfo?.availability && <div><span className="text-gray-600">Disponibilité:</span> {a.candidateInfo.availability}</div>}
                    </div>
                  </div>

                  {/* Lettre de motivation */}
                  {a.candidateInfo?.coverLetter && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Lettre de motivation</h4>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border">{a.candidateInfo.coverLetter}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {a.resumeUrl && (
                      <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-white text-sm">
                        <FiDownload className="mr-1" /> Télécharger CV
                      </a>
                    )}
                    <button 
                      onClick={()=> setReplyTo({ email: a._candidate?.email || a.candidateInfo?.email, name: a._candidate?.name, jobTitle: a._job?.title, appId: a.id })} 
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-100 text-sm"
                    >
                      <FiMail className="mr-1" /> Répondre
                    </button>

                    {/* Changement de statut */}
                    <div className="ml-auto flex items-center gap-2">
                      <select
                        value={a.status}
                        onChange={(e) => updateApplicationStatus(a.id, e.target.value)}
                        disabled={busy === a.id}
                        className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="applied">Candidature reçue</option>
                        <option value="screening">En sélection</option>
                        <option value="interview">Entretien</option>
                        <option value="offer">Offre</option>
                        <option value="hired">Embauché</option>
                        <option value="rejected">Rejeté</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperadminApplicationsPanel;
