// src/components/DocumentsManager/index.jsx
// Fichier principal du gestionnaire de documents (< 150 lignes)

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Hooks personnalisés
import { useDocuments } from '../../hooks/useDocuments';
import { useDocumentFilters } from '../../hooks/useDocumentFilters';
import { useDocumentForm } from '../../hooks/useDocumentForm';

// Composants
import DocumentHeader from './DocumentHeader';
import DocumentFilters from './DocumentFilters';
import DocumentTabs from './DocumentTabs';
import EmptyDocumentsState from './EmptyDocumentsState';
import DocumentsList from './DocumentsList';
import DocumentForm from './DocumentForm';

// Utils
import { generateDocumentPDF } from '../../utils/pdfGenerators';
import { DOCUMENT_TYPES } from '../../config/documentConfig';
import { createJob } from '../../services/jobs';

/**
 * Gestionnaire de documents RH - Version refactorisée
 */
const DocumentsManager = ({ companyId, userRole = 'admin', companyData = null, employees = [] }) => {
  const [activeTab, setActiveTab] = useState('offers');
  const [showTextCustomization, setShowTextCustomization] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Hooks personnalisés
  const { 
    documents, 
    loading, 
    documentsLoaded,
    fetchDocuments, 
    createDocument, 
    updateDocument, 
    deleteDocument,
    resetLoadedState,
    isTabLoaded
  } = useDocuments(companyId);

  const {
    viewMode,
    selectedEmployee,
    searchTerm,
    departmentFilter,
    setViewMode,
    setSelectedEmployee,
    setSearchTerm,
    setDepartmentFilter,
    filteredDocuments,
    filteredEmployees,
    departments,
    filterStats
  } = useDocumentFilters(documents[activeTab] || [], employees);

  const {
    showForm,
    formData,
    isEditing,
    openCreateForm,
    openEditForm,
    closeForm,
    updateField,
    validateForm
  } = useDocumentForm(activeTab, companyData, selectedEmployee);

  // Réinitialiser l'état de chargement au changement d'onglet
  useEffect(() => {
    if (!isTabLoaded(activeTab)) {
      resetLoadedState();
    }
  }, [activeTab, isTabLoaded, resetLoadedState]);

  // Handlers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLoadDocuments = () => {
    fetchDocuments(activeTab);
  };

  const handleSubmit = async (data) => {
    const fields = DOCUMENT_TYPES[activeTab].fields;
    if (!validateForm(fields)) return;

    const success = isEditing 
      ? await updateDocument(activeTab, formData.id, data)
      : await createDocument(activeTab, data);
    
    if (success) closeForm();
  };

  const handleDelete = async (document) => {
    await deleteDocument(activeTab, document.id);
  };

  const handleGeneratePDF = (document) => {
    try {
      generateDocumentPDF(document, activeTab);
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleSubmitOffer = async (offerDoc) => {
    if (!companyId || offerDoc.submittedJobId) {
      toast.info(offerDoc.submittedJobId ? "Offre déjà soumise" : "Entreprise introuvable");
      return;
    }
    
    try {
      const payload = {
        workflowType: offerDoc.workflowType || 'partial',
        title: offerDoc.title,
        description: offerDoc.description || '',
        location: offerDoc.location || offerDoc.city || '',
        contractType: offerDoc.contractType || '',
        salaryRange: offerDoc.salary ? `${offerDoc.salary} FCFA` : '',
        skills: [],
        experienceMin: null,
        languages: [],
        deadline: offerDoc.responseDeadline ? new Date(offerDoc.responseDeadline) : null,
        contactsEntretiens: [],
        processusEntreprise: ''
      };
      
      const jobId = await createJob(companyId, payload, auth.currentUser?.uid || null);
      await updateDoc(doc(db, 'documents', offerDoc.id), { 
        submittedJobId: jobId, 
        submittedAt: new Date() 
      });
      toast.success('Offre soumise au SuperAdmin');
      fetchDocuments(activeTab);
    } catch (error) {
      console.error('Erreur soumission offre:', error);
      toast.error("Échec de la soumission");
    }
  };

  return (
    <div className="space-y-6">
      <DocumentHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCreateNew={openCreateForm}
        onOpenSettings={() => setShowTextCustomization(true)}
        documents={documents}
        employeesCount={employees.length}
      />

      <DocumentFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedEmployee={selectedEmployee}
        onEmployeeSelect={setSelectedEmployee}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        employees={employees}
        filteredEmployees={filteredEmployees}
        departments={departments}
        filterStats={filterStats}
      />

      <DocumentTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        documents={documents}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6">
          {!documentsLoaded ? (
            <EmptyDocumentsState
              onLoadDocuments={handleLoadDocuments}
              isLoading={loading}
              documentType={activeTab}
            />
          ) : (
            <DocumentsList
              documents={filteredDocuments}
              documentType={activeTab}
              loading={loading}
              onPreview={(doc) => { setPreviewData(doc); setShowPreview(true); }}
              onGeneratePDF={handleGeneratePDF}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onSubmit={activeTab === 'offers' ? handleSubmitOffer : null}
              onCreate={openCreateForm}
              onRefresh={handleLoadDocuments}
              viewMode={viewMode}
              selectedEmployee={selectedEmployee}
            />
          )}
        </div>
      </div>

      {showForm && (
        <DocumentForm
          documentType={activeTab}
          formData={formData}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isEditing={isEditing}
          loading={loading}
        />
      )}
    </div>
  );
};

export default DocumentsManager;
