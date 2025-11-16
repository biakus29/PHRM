import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FiCheck, FiX, FiClock, FiDownload, FiEye, FiSearch } from "react-icons/fi";

export default function ProfessionalRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState("");

  // Récupérer toutes les demandes de tous les employés
  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const clientsSnapshot = await getDocs(collection(db, "clients"));
      const allRequests = [];

      for (const clientDoc of clientsSnapshot.docs) {
        const clientId = clientDoc.id;
        const employeesSnapshot = await getDocs(
          collection(db, "clients", clientId, "employees")
        );

        for (const employeeDoc of employeesSnapshot.docs) {
          const employeeData = employeeDoc.data();
          const employeeRequests = employeeData.professionalRequests || [];
          
          // Ajouter les informations client et employé à chaque demande
          const requestsWithMeta = employeeRequests.map(request => ({
            ...request,
            id: request.id,
            clientId,
            employeeId: employeeDoc.id,
            employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
            employeeEmail: employeeData.email,
            clientName: clientDoc.data().name
          }));
          
          allRequests.push(...requestsWithMeta);
        }
      }

      // Trier par date de création (du plus récent au plus ancien)
      allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(allRequests);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes :", error);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le statut d'une demande
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const employeeRef = doc(db, "clients", request.clientId, "employees", request.employeeId);
      const employeeDoc = await getDoc(employeeRef);
      
      if (!employeeDoc.exists()) return;

      const employeeData = employeeDoc.data();
      const updatedRequests = employeeData.professionalRequests.map(req => 
        req.id === requestId ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } : req
      );

      await updateDoc(employeeRef, {
        professionalRequests: updatedRequests
      });

      // Mettre à jour l'état local
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus, updatedAt: new Date().toISOString() }
            : req
        )
      );

      // Fermer la modale de détail
      setSelectedRequest(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande :", error);
    }
  };

  // Filtrer les demandes
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "Tous" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des demandes</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Tous">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours de traitement</option>
            <option value="Approuvé">Approuvé</option>
            <option value="Refusé">Refusé</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.employeeName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.employeeEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.clientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {request.subject}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {request.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === "En attente"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "Approuvé"
                            ? "bg-green-100 text-green-800"
                            : request.status === "Refusé"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Voir les détails"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      {request.status === "En attente" && (
                        <>
                          <button
                            onClick={() => updateRequestStatus(request.id, "Approuvé")}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Approuver"
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => updateRequestStatus(request.id, "Refusé")}
                            className="text-red-600 hover:text-red-900"
                            title="Refuser"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune demande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détail de la demande */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Détails de la demande</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employé</p>
                  <p className="font-medium">
                    {selectedRequest.employeeName}
                    <span className="block text-sm text-gray-500">
                      {selectedRequest.employeeEmail}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{selectedRequest.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedRequest.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de création</p>
                  <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedRequest.status === "En attente"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedRequest.status === "Approuvé"
                        ? "bg-green-100 text-green-800"
                        : selectedRequest.status === "Refusé"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Sujet</p>
                <p className="font-medium">{selectedRequest.subject}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="whitespace-pre-line">{selectedRequest.description}</p>
              </div>

              {selectedRequest.startDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date de début</p>
                    <p>{formatDate(selectedRequest.startDate)}</p>
                  </div>
                  {selectedRequest.endDate && (
                    <div>
                      <p className="text-sm text-gray-500">Date de fin</p>
                      <p>{formatDate(selectedRequest.endDate)}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.attachments?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Pièces jointes</p>
                  <div className="space-y-2">
                    {selectedRequest.attachments.map((file, index) => (
                      <div key={index} className="flex items-center">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <FiDownload className="mr-2" />
                          {file.name}
                        </a>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.status === "En attente" && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Actions</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, "Approuvé")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FiCheck className="mr-2 h-4 w-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, "Refusé")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiX className="mr-2 h-4 w-4" />
                      Refuser
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, "En cours")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiClock className="mr-2 h-4 w-4" />
                      Mettre en cours
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
