import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Briefcase, MapPin, Calendar } from 'lucide-react';

const CandidateApplications = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const qRef = query(
          collection(db, 'applications'),
          where('candidateId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(qRef);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApps(items);

        // Load related jobs (simple pass)
        const jobMap = { ...jobs };
        for (const it of items) {
          if (it.jobId && !jobMap[it.jobId]) {
            // avoid heavy per-doc load: rely on PublicJobDetail on navigation
            jobMap[it.jobId] = true; // placeholder
          }
        }
        setJobs(jobMap);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const themeGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600';

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <p className="text-gray-700">Veuillez vous connecter pour voir vos candidatures.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${themeGradient} text-white`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mes candidatures</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="w-full flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement…
          </div>
        ) : (
          <div className="space-y-3">
            {apps.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-600">
                Aucune candidature pour le moment.
              </div>
            )}
            {apps.map(app => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900 inline-flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-gray-600" />
                    {app.jobTitle || 'Offre'}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                    {app.location && <span className="inline-flex items-center"><MapPin className="w-4 h-4 mr-1" /> {app.location}</span>}
                    {app.createdAt && <span className="inline-flex items-center"><Calendar className="w-4 h-4 mr-1" /> Envoyée</span>}
                    <span className="inline-flex items-center">Statut: <span className="ml-1 font-medium">{app.status}</span></span>
                  </div>
                </div>
                <button onClick={()=> navigate(`/offres/${app.jobId}`)} className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                  Voir l'offre <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateApplications;
