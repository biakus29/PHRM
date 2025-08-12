import React, { useState } from 'react';
import { Tabs, Tab, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { FileText, Download, Eye, X } from 'lucide-react';
import PaySlipTemplates from './PaySlipTemplates';
import ContractTemplates from './ContractTemplates';
import TemplatePreview from './TemplatePreview';

const TemplateSelector = ({ 
  isOpen, 
  onClose, 
  onSelectPaySlipTemplate, 
  onSelectContractTemplate,
  selectedPaySlipTemplate,
  selectedContractTemplate 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePaySlipPreview = (template) => {
    setPreviewTemplate(template);
    setPreviewType('payslip');
  };

  const handlePaySlipDownload = (template) => {
    // Logique pour télécharger le modèle de fiche de paie
    console.log('Téléchargement fiche de paie:', template);
    // Ici vous pouvez générer et télécharger le PDF
  };

  const handleContractPreview = (template) => {
    setPreviewTemplate(template);
    setPreviewType('contract');
  };

  const handleContractDownload = (template) => {
    // Logique pour télécharger le modèle de contrat
    console.log('Téléchargement contrat:', template);
    // Ici vous pouvez générer et télécharger le PDF
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            maxHeight: '90vh',
            minHeight: '70vh'
          }
        }}
      >
        <DialogTitle className="flex items-center justify-between bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Sélection de Modèles</h2>
          </div>
          <Button
            onClick={onClose}
            variant="text"
            size="small"
            startIcon={<X className="w-4 h-4" />}
          >
            Fermer
          </Button>
        </DialogTitle>

        <DialogContent className="p-0">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              className="bg-gray-50"
            >
              <Tab 
                label={
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Fiches de Paie</span>
                  </div>
                }
                className="py-4"
              />
              <Tab 
                label={
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Contrats</span>
                  </div>
                }
                className="py-4"
              />
            </Tabs>
          </Box>

          <div className="p-6">
            {activeTab === 0 && (
              <PaySlipTemplates
                onSelectTemplate={onSelectPaySlipTemplate}
                selectedTemplate={selectedPaySlipTemplate}
                onPreview={handlePaySlipPreview}
                onDownload={handlePaySlipDownload}
              />
            )}
            
            {activeTab === 1 && (
              <ContractTemplates
                onSelectTemplate={onSelectContractTemplate}
                selectedTemplate={selectedContractTemplate}
                onPreview={handleContractPreview}
                onDownload={handleContractDownload}
              />
            )}
          </div>
        </DialogContent>

        <DialogActions className="bg-gray-50 border-t p-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {activeTab === 0 && selectedPaySlipTemplate && (
                <span>Modèle fiche de paie sélectionné : <strong className="text-blue-600">
                  {selectedPaySlipTemplate}
                </strong></span>
              )}
              {activeTab === 1 && selectedContractTemplate && (
                <span>Modèle contrat sélectionné : <strong className="text-green-600">
                  {selectedContractTemplate}
                </strong></span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="outlined"
                color="inherit"
              >
                Annuler
              </Button>
              <Button
                onClick={onClose}
                variant="contained"
                color="primary"
                startIcon={<Download className="w-4 h-4" />}
              >
                Confirmer la sélection
              </Button>
            </div>
          </div>
        </DialogActions>
      </Dialog>

      {/* Modal de prévisualisation */}
      <TemplatePreview
        isOpen={previewTemplate !== null}
        onClose={() => {
          setPreviewTemplate(null);
          setPreviewType(null);
        }}
        template={previewTemplate}
        type={previewType}
      />
    </>
  );
};

export default TemplateSelector; 