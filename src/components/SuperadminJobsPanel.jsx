import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { listSubmittedJobs, publishJob, rejectJob } from '../services/jobs';
import { FiCheck, FiX, FiRefreshCw, FiExternalLink } from 'react-icons/fi';

const SuperadminJobsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await listSubmittedJobs();
      setJobs(items);
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sendMail = async (payload) => {
    try {
      await addDoc(collection(db, 'mail'), payload);
    } catch (e) {
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
          await sendMail({
            to: [company.email],
            message: {
              subject: `Offre publiée - ${job.title}`,
              html: `<p>Votre offre <b>${job.title}</b> a été publiée.</p><p>Lien public: ${window.location.origin}/offres/${job.id}</p>`
            }
          });
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
          await sendMail({
            to: [company.email],
            message: {
              subject: `Offre refusée - ${job.title}`,
              html: `<p>Votre offre <b>${job.title}</b> a été refusée.</p><p>Motif: ${reason}</p>`
            }
          });
        }
      }
      await load();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Offres à valider</h2>
        <button onClick={load} className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-50">
          <FiRefreshCw className="mr-2" /> Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : jobs.length === 0 ? (
        <div className="text-gray-600">Aucune offre en attente.</div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="p-4 border rounded-xl flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{job.title}</div>
                <div className="text-sm text-gray-600">{job.location} • {job.contractType} • Workflow: {job.workflowType}</div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/offres/${job.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-gray-50">
                  <FiExternalLink className="mr-1" /> Voir
                </a>
                <button disabled={busy===job.id} onClick={()=>handlePublish(job)} className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                  <FiCheck className="mr-1" /> Publier
                </button>
                <button disabled={busy===job.id} onClick={()=>handleReject(job)} className="inline-flex items-center px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                  <FiX className="mr-1" /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperadminJobsPanel;
