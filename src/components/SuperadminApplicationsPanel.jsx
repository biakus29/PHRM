import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc } from 'firebase/firestore';
import { FiRefreshCw, FiMail, FiExternalLink } from 'react-icons/fi';

const SuperadminApplicationsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [busy, setBusy] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

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
      const qRef = selectedJob
        ? query(collection(db, 'applications'), where('jobId', '==', selectedJob), ...base)
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
  }, [selectedJob]);

  const sendReply = async () => {
    if (!replyTo?.email || !replyText.trim()) return;
    try {
      setBusy('mail');
      await addDoc(collection(db, 'mail'), {
        to: [replyTo.email],
        message: {
          subject: `Réponse à votre candidature - ${replyTo.jobTitle || ''}`,
          html: replyText
        }
      });
      setReplyText('');
      setReplyTo(null);
      alert('E-mail programmé pour envoi.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 border rounded-lg"
            value={selectedJob}
            onChange={(e)=>setSelectedJob(e.target.value)}
          >
            <option value="">Toutes les offres</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title || j.id}</option>
            ))}
          </select>
          <button onClick={load} className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-50">
            <FiRefreshCw className="mr-2" /> Rafraîchir
          </button>
        </div>
        {replyTo && (
          <div className="flex items-center gap-2">
            <input
              className="px-3 py-2 border rounded-lg w-80"
              placeholder={`Répondre à ${replyTo.name || replyTo.email}`}
              value={replyText}
              onChange={(e)=>setReplyText(e.target.value)}
            />
            <button disabled={busy==='mail'} onClick={sendReply} className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
              <FiMail className="mr-2" /> Envoyer
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : apps.length === 0 ? (
        <div className="text-gray-600">Aucune candidature.</div>
      ) : (
        <div className="space-y-3">
          {apps.map(a => (
            <div key={a.id} className="p-4 border rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{a._job?.title || 'Offre'}</div>
                <div className="text-sm text-gray-600">{a._candidate?.name || a._candidate?.email || a.candidateId}</div>
                <div className="text-xs text-gray-500">Statut: {a.status} • {a.createdAt?.seconds ? new Date(a.createdAt.seconds*1000).toLocaleString() : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {a.resumeUrl && (
                  <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-gray-50">
                    <FiExternalLink className="mr-1" /> CV
                  </a>
                )}
                <button onClick={()=> setReplyTo({ email: a._candidate?.email, name: a._candidate?.name, jobTitle: a._job?.title })} className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-50">
                  <FiMail className="mr-1" /> Répondre
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperadminApplicationsPanel;
