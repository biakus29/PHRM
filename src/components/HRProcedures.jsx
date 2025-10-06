// src/components/HRProcedures.jsx
import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiEye, FiClipboard, FiCheckSquare, FiFileText } from 'react-icons/fi';
import Card from './Card';
import Button from '../compoments/Button';
import Modal from './Modal';

const HRProcedures = ({ companyData, employees, setEmployees, actionLoading, setActionLoading }) => {
  const [activeTab, setActiveTab] = useState('audit-grid');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // État pour la grille d'audit
  const [auditGridData, setAuditGridData] = useState({
    processName: '',
    responsible: '',
    finality: '',
    auditDate: '',
    auditor: '',
    evaluationScale: '3',
    sections: {
      documentation: { score: 0, comments: '' },
      interfaces: { score: 0, comments: '' },
      resources: { score: 0, comments: '' }
    }
  });

  // État pour le check-list d'audit
  const [checklistData, setChecklistData] = useState({
    title: '',
    questions: [
      { question: 'Pouvez-vous décrire votre processus de recrutement et de sélection des candidats ?', response: '' },
      { question: 'Quels critères utilisez-vous pour sélectionner les candidats lors des entretiens ?', response: '' },
      { question: 'Comment évaluez-vous les compétences et l\'adéquation culturelle d\'un candidat à votre organisation ?', response: '' },
      { question: 'Comment gérez-vous la diversité dans vos processus de recrutement ?', response: '' },
      { question: 'Quels outils ou tests de sélection utilisez-vous pour évaluer les compétences techniques des candidats ?', response: '' },
      { question: 'Quel type de programme de formation proposez-vous à vos employés ?', response: '' },
      { question: 'Comment identifiez-vous les besoins en formation au sein de l\'organisation ?', response: '' },
      { question: 'Quelle est votre approche pour développer les compétences des employés à long terme ?', response: '' },
      { question: 'Avez-vous un processus pour suivre l\'efficacité des programmes de formation ?', response: '' },
      { question: 'Comment gérez-vous les carrières et les plans de développement individuel ?', response: '' },
      { question: 'Quelle est la procédure pour évaluer la performance des employés ?', response: '' },
      { question: 'Quels critères utilisez-vous pour mesurer la performance des employés ?', response: '' },
      { question: 'Comment gérez-vous les feedbacks et les évaluations de performance ?', response: '' },
      { question: 'Quelle est la fréquence des entretiens de performance dans votre organisation ?', response: '' },
      { question: 'Comment gérez-vous les objectifs et les attentes des employés par rapport à leurs performances ?', response: '' },
      { question: 'Quelle est votre politique en matière de rémunération et d\'avantages sociaux ?', response: '' },
      { question: 'Comment définissez-vous les critères de rémunération pour vos employés ?', response: '' },
      { question: 'Avez-vous un système de bonus ou d\'incitations en place ?', response: '' },
      { question: 'Comment évaluez-vous la compétitivité de vos packages de rémunération par rapport au marché ?', response: '' },
      { question: 'Quels avantages supplémentaires offrez-vous à vos employés (assurances, tickets restaurant, etc.) ?', response: '' },
      { question: 'Comment mesurez-vous le bien-être des employés dans l\'organisation ?', response: '' },
      { question: 'Quelles actions prenez-vous pour améliorer la satisfaction des employés ?', response: '' },
      { question: 'Comment gérez-vous les conflits entre employés ou entre employés et managers ?', response: '' },
      { question: 'Quelle est votre politique pour maintenir un bon équilibre entre vie professionnelle et personnelle ?', response: '' },
      { question: 'Quels types d\'initiatives mettez-vous en place pour favoriser un environnement de travail positif ?', response: '' },
      { question: 'Comment gérez-vous la communication interne entre les différentes équipes ?', response: '' },
      { question: 'Quelles sont vos pratiques pour maintenir une bonne relation avec les syndicats ou les représentants du personnel ?', response: '' },
      { question: 'Comment gérez-vous les négociations sociales, notamment en période de changements importants dans l\'organisation ?', response: '' },
      { question: 'Comment évaluez-vous l\'engagement des employés envers l\'organisation ?', response: '' },
      { question: 'Quelle est votre approche pour encourager la coopération et le travail d\'équipe ?', response: '' },
      { question: 'Comment assurez-vous la conformité avec les lois et réglementations du travail en vigueur ?', response: '' },
      { question: 'Quelles procédures avez-vous mises en place pour la gestion des absences et des congés ?', response: '' },
      { question: 'Comment gérez-vous les audits internes liés aux processus RH ?', response: '' },
      { question: 'Quelles mesures prenez-vous pour garantir la protection des données personnelles des employés ?', response: '' },
      { question: 'Comment assurez-vous le respect des normes relatives à la santé et la sécurité au travail ?', response: '' }
    ]
  });

  // État pour le formulaire de conformité
  const [complianceData, setComplianceData] = useState({
    title: '',
    items: [
      { item: '', oui: false, non: false }
    ]
  });

  const tabs = [
    { id: 'audit-grid', label: 'Grille d\'Audit', icon: FiClipboard },
    { id: 'checklist', label: 'Check-list Audit', icon: FiCheckSquare },
    { id: 'compliance', label: 'Conformité', icon: FiFileText }
  ];

  const handleSave = useCallback(async (type, data) => {
    try {
      setActionLoading(true);
      // Ici on sauvegarderait dans Firebase
      toast.success(`${type} sauvegardée avec succès !`);
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      toast.error(`Erreur lors de la sauvegarde : ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading]);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      setActionLoading(true);
      // Ici on supprimerait de Firebase
      toast.success('Élément supprimé avec succès !');
    } catch (error) {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [setActionLoading]);

  const renderAuditGridForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du processus *
          </label>
          <input
            type="text"
            value={auditGridData.processName}
            onChange={(e) => setAuditGridData({...auditGridData, processName: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Recrutement, Formation..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsable *
          </label>
          <input
            type="text"
            value={auditGridData.responsible}
            onChange={(e) => setAuditGridData({...auditGridData, responsible: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom du responsable"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Finalité du processus *
          </label>
          <input
            type="text"
            value={auditGridData.finality}
            onChange={(e) => setAuditGridData({...auditGridData, finality: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Objectif du processus"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de l'audit *
          </label>
          <input
            type="date"
            value={auditGridData.auditDate}
            onChange={(e) => setAuditGridData({...auditGridData, auditDate: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auditeur(s)/Évaluateur(s) *
          </label>
          <input
            type="text"
            value={auditGridData.auditor}
            onChange={(e) => setAuditGridData({...auditGridData, auditor: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom des auditeurs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Échelle d'évaluation
          </label>
          <select
            value={auditGridData.evaluationScale}
            onChange={(e) => setAuditGridData({...auditGridData, evaluationScale: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3">0-3 (Pas réalisé, Partiellement, Totalement)</option>
            <option value="5">0-5 (Échelle classique)</option>
          </select>
        </div>
      </div>

      {/* Sections d'évaluation */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Sections d'évaluation</h3>

        {/* Documentation */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Documentation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (0-{auditGridData.evaluationScale})
              </label>
              <input
                type="number"
                min="0"
                max={auditGridData.evaluationScale}
                value={auditGridData.sections.documentation.score}
                onChange={(e) => setAuditGridData({
                  ...auditGridData,
                  sections: {
                    ...auditGridData.sections,
                    documentation: {...auditGridData.sections.documentation, score: parseInt(e.target.value) || 0}
                  }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commentaires
              </label>
              <textarea
                value={auditGridData.sections.documentation.comments}
                onChange={(e) => setAuditGridData({
                  ...auditGridData,
                  sections: {
                    ...auditGridData.sections,
                    documentation: {...auditGridData.sections.documentation, comments: e.target.value}
                  }
                })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observations et commentaires..."
              />
            </div>
          </div>
        </div>

        {/* Interfaces/Exigences */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Interfaces/Exigences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (0-{auditGridData.evaluationScale})
              </label>
              <input
                type="number"
                min="0"
                max={auditGridData.evaluationScale}
                value={auditGridData.sections.interfaces.score}
                onChange={(e) => setAuditGridData({
                  ...auditGridData,
                  sections: {
                    ...auditGridData.sections,
                    interfaces: {...auditGridData.sections.interfaces, score: parseInt(e.target.value) || 0}
                  }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commentaires
              </label>
              <textarea
                value={auditGridData.sections.interfaces.comments}
                onChange={(e) => setAuditGridData({
                  ...auditGridData,
                  sections: {
                    ...auditGridData.sections,
                    interfaces: {...auditGridData.sections.interfaces, comments: e.target.value}
                  }
                })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observations et commentaires..."
              />
            </div>
          </div>
        </div>

        {/* Moyens/Ressources */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Moyens/Ressources</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (0-{auditGridData.evaluationScale})
              </label>
              <input
                type="number"
                min="0"
                max={auditGridData.evaluationScale}
                value={auditGridData.sections.resources.score}
                onChange={(e) => setAuditGridData({
                  ...auditGridData,
                  sections: {
                    ...auditGridData.sections,
                    resources: {...auditGridData.sections.resources, score: parseInt(e.target.value) || 0}
                  }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commentaires
              </label>
              <textarea
                value={auditGridData.sections.resources.comments}
                onChange={(e) => setAuditGridData({
                  ...auditGridData,
                  sections: {
                    ...auditGridData.sections,
                    resources: {...auditGridData.sections.resources, comments: e.target.value}
                  }
                })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observations et commentaires..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChecklistForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre du check-list *
        </label>
        <input
          type="text"
          value={checklistData.title}
          onChange={(e) => setChecklistData({...checklistData, title: e.target.value})}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Audit RH - Recrutement et Formation"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
        {checklistData.questions.map((item, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question {index + 1}
                </label>
                <textarea
                  value={item.question}
                  onChange={(e) => {
                    const newQuestions = [...checklistData.questions];
                    newQuestions[index] = {...item, question: e.target.value};
                    setChecklistData({...checklistData, questions: newQuestions});
                  }}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Question à poser..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réponse attendue
                </label>
                <textarea
                  value={item.response}
                  onChange={(e) => {
                    const newQuestions = [...checklistData.questions];
                    newQuestions[index] = {...item, response: e.target.value};
                    setChecklistData({...checklistData, questions: newQuestions});
                  }}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Réponse attendue ou critères d'évaluation..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComplianceForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre du formulaire de conformité *
        </label>
        <input
          type="text"
          value={complianceData.title}
          onChange={(e) => setComplianceData({...complianceData, title: e.target.value})}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Conformité RGPD - Données Employés"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Éléments à vérifier</h3>
        {complianceData.items.map((item, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Élément à vérifier
                </label>
                <input
                  type="text"
                  value={item.item}
                  onChange={(e) => {
                    const newItems = [...complianceData.items];
                    newItems[index] = {...item, item: e.target.value};
                    setComplianceData({...complianceData, items: newItems});
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Consentement explicite pour traitement des données..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conformité
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`compliance-${index}`}
                      checked={item.oui}
                      onChange={() => {
                        const newItems = [...complianceData.items];
                        newItems[index] = {...item, oui: true, non: false};
                        setComplianceData({...complianceData, items: newItems});
                      }}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">OUI</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`compliance-${index}`}
                      checked={item.non}
                      onChange={() => {
                        const newItems = [...complianceData.items];
                        newItems[index] = {...item, oui: false, non: true};
                        setComplianceData({...complianceData, items: newItems});
                      }}
                      className="mr-2 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">NON</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button
          onClick={() => {
            setComplianceData({
              ...complianceData,
              items: [...complianceData.items, { item: '', oui: false, non: false }]
            });
          }}
          className="bg-gray-600 text-white hover:bg-gray-700"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Ajouter un élément
        </Button>
      </div>
    </div>
  );

  const renderForm = () => {
    switch (activeTab) {
      case 'audit-grid':
        return renderAuditGridForm();
      case 'checklist':
        return renderChecklistForm();
      case 'compliance':
        return renderComplianceForm();
      default:
        return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let dataToSave;
    let typeName;

    switch (activeTab) {
      case 'audit-grid':
        dataToSave = auditGridData;
        typeName = 'Grille d\'audit';
        break;
      case 'checklist':
        dataToSave = checklistData;
        typeName = 'Check-list d\'audit';
        break;
      case 'compliance':
        dataToSave = complianceData;
        typeName = 'Formulaire de conformité';
        break;
      default:
        return;
    }

    handleSave(typeName, dataToSave);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec onglets */}
      <Card>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestion des Procédures RH
            </h2>
            <p className="text-gray-600">
              Créez et gérez vos grilles d'audit, check-lists et formulaires de conformité
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Nouveau formulaire
          </Button>
        </div>
      </Card>

      {/* Liste des formulaires existants */}
      <Card title="Formulaires existants">
        <div className="space-y-4">
          {/* Exemple d'éléments - à remplacer par les vraies données */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiClipboard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Grille d'audit - Recrutement</h3>
                <p className="text-sm text-gray-600">Créée le 15/10/2024</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleEdit({ id: 1, type: 'audit-grid' })}
                className="bg-gray-600 text-white hover:bg-gray-700"
                size="sm"
              >
                <FiEdit2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDelete(1)}
                className="bg-red-600 text-white hover:bg-red-700"
                size="sm"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal pour créer/éditer */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
          setFormData({});
        }}
        title={`${editingItem ? 'Modifier' : 'Créer'} un formulaire`}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderForm()}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={actionLoading}
            >
              {editingItem ? 'Modifier' : 'Créer'} le formulaire
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRProcedures;

