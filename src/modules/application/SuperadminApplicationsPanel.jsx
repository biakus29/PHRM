// SuperadminApplicationsPanel - Version refactorée et stable

import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiMail, FiExternalLink, FiDownload, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { getApplications, enrichApplications, updateApplicationStatus } from './applications.service';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { APPLICATION_STATUSES, getNextPossibleStatuses } from './application.workflow';

const SuperadminApplicationsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [busy, setBusy] = useState('');
  const [expandedApp, setExpandedApp] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Charger les jobs pour les filtres
  const loadJobs = async () => {
    try {
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erreur chargement jobs:', error);
    }
  };

  // Charger les candidatures
  const loadApplications = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedJob) filters.jobId = selectedJob;
      if (selectedStatus) filters.status = selectedStatus;

      const apps = await getApplications(filters);
      const enriched = await enrichApplications(apps);
      setApplications(enriched);
    } catch (error) {
      console.error('Erreur chargement candidatures:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadApplications();
  }, [selectedJob, selectedStatus]);

  // Gérer le changement de statut
  const handleStatusChange = async (application, newStatus) => {
    if (busy === application.id) return;

    setBusy(application.id);
    try {
      const result = await updateApplicationStatus(application, newStatus);
      
      if (result.success) {
        await loadApplications(); // Recharger pour voir les changements
        if (!result.emailSent) {
          console.warn('Statut mis à jour mais email non envoyé');
        }
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setBusy('');
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    const statusConfig = APPLICATION_STATUSES.find(s => s.value === status);
    return statusConfig ? `bg-${statusConfig.color}-100 text-${statusConfig.color}-800` : 'bg-gray-100 text-gray-800';
  };

  // Obtenir le label du statut
  const getStatusLabel = (status) => {
    const statusConfig = APPLICATION_STATUSES.find(s => s.value === status);
    return statusConfig ? statusConfig.label : status;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Candidatures</h2>
        <button
          onClick={loadApplications}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
        >
          <option value="">Toutes les offres</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
        >
          <option value="">Tous les statuts</option>
          {APPLICATION_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Liste des candidatures */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Chargement...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 text-gray-600">Aucune candidature trouvée</div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="border rounded-xl overflow-hidden">
              {/* En-tête */}
              <div 
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {app._job?.title || 'Offre non spécifiée'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {app.candidateSnapshot?.fullname || app.candidateSnapshot?.email || 'Candidat'}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {app.createdAt?.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : ''}
                </div>
              </div>

              {/* Détails expandables */}
              {expandedApp === app.id && (
                <div className="border-t p-4 bg-gray-50 space-y-4">
                  {/* Infos candidat */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Informations du candidat</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">Nom:</span> {app.candidateSnapshot?.fullname || 'N/A'}</div>
                      <div><span className="text-gray-600">Email:</span> {app.candidateSnapshot?.email || 'N/A'}</div>
                      <div><span className="text-gray-600">Téléphone:</span> {app.candidateSnapshot?.phone || 'N/A'}</div>
                      <div><span className="text-gray-600">Localisation:</span> {app.candidateSnapshot?.location || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {app.resume?.url && (
                      <a 
                        href={app.resume.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-white text-sm"
                      >
                        <FiDownload className="mr-1" /> Télécharger CV
                      </a>
                    )}

                    {/* Changement de statut */}
                    <div className="ml-auto flex items-center gap-2">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app, e.target.value)}
                        disabled={busy === app.id}
                        className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-blue-500"
                      >
                        {APPLICATION_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
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
