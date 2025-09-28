import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { X, Download, FileText } from 'lucide-react';

const TemplatePreview = ({ isOpen, onClose, template, type }) => {
  if (!template) return null;

  const renderPaySlipPreview = () => (
    <div className="bg-white border rounded-lg p-6 max-w-4xl mx-auto">
      {/* En-tête avec logo */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">VIGILCAM SECURITY & SERVICES SARL</h1>
            <p className="text-sm text-gray-600">BP 16194 Yaoundé • Tél: 22214081</p>
            <p className="text-sm text-gray-600">N° CNPS: J123456789</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-blue-600">FICHE DE PAIE</h2>
          <p className="text-sm text-gray-600">Période : Janvier 2024</p>
        </div>
      </div>
      
      {/* Informations employé */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Informations Employé</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Matricule:</span>
              <span className="font-medium">EMP001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nom & Prénoms:</span>
              <span className="font-medium">Jean Dupont</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date de naissance:</span>
              <span className="font-medium">15/03/1990</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lieu de naissance:</span>
              <span className="font-medium">Douala, Cameroun</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date d'embauche:</span>
              <span className="font-medium">01/01/2023</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Poste:</span>
              <span className="font-medium">Développeur</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Catégorie CNPS:</span>
              <span className="font-medium">Catégorie 9</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Échelon CNPS:</span>
              <span className="font-medium">Échelon A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Département:</span>
              <span className="font-medium">Informatique</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">Développement</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Superviseur:</span>
              <span className="font-medium">Marie Martin</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Période de Travail</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Jours travaillés:</span>
              <span className="font-medium">22 jours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heures normales:</span>
              <span className="font-medium">176 heures</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heures supplémentaires:</span>
              <span className="font-medium">8 heures</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heures dimanche:</span>
              <span className="font-medium">4 heures</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heures nuit:</span>
              <span className="font-medium">2 heures</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ancienneté:</span>
              <span className="font-medium">1 an</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre d'enfants:</span>
              <span className="font-medium">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Congés acquis:</span>
              <span className="font-medium">18 jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rémunération */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Rémunération</h3>
        <div className="space-y-4 text-sm">
          {/* Salaire de base */}
          <div className="flex justify-between">
            <span className="text-gray-700">Salaire de base</span>
            <span className="font-medium">250,000 FCFA</span>
          </div>

          {/* Indemnités */}
          <div>
            <h4 className="text-gray-800 font-medium mb-2">Indemnités</h4>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Indemnité de transport</span><span className="font-medium">15,000 FCFA</span></div>
              <div className="flex justify-between"><span>Indemnité de logement</span><span className="font-medium">30,000 FCFA</span></div>
              <div className="flex justify-between"><span>Indemnité de représentation</span><span className="font-medium">10,000 FCFA</span></div>
              <div className="flex justify-between"><span>Prime de salissures</span><span className="font-medium">5,000 FCFA</span></div>
              <div className="flex justify-between"><span>Prime de panier</span><span className="font-medium">5,000 FCFA</span></div>
            </div>
          </div>

          {/* Primes */}
          <div>
            <h4 className="text-gray-800 font-medium mb-2">Primes</h4>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Heures supplémentaires</span><span className="font-medium">12,000 FCFA</span></div>
              <div className="flex justify-between"><span>Prime/Bonus</span><span className="font-medium">20,000 FCFA</span></div>
            </div>
          </div>

          {/* SBT */}
          <div className="border-t pt-2 flex justify-between text-sm">
            <span className="font-semibold">SBT (Taxable)</span>
            <span className="font-semibold">342,000 FCFA</span>
          </div>
        </div>
      </div>

      {/* Déductions */}
      <div className="bg-red-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Déductions Sociales et Fiscales</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">CNPS (6.25%)</span>
              <span className="text-sm font-medium">21,188 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">IRPP</span>
              <span className="text-sm font-medium">15,000 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">CAC (1%)</span>
              <span className="text-sm font-medium">3,390 FCFA</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">CFC (1%)</span>
              <span className="text-sm font-medium">3,390 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">RAV (2.5%)</span>
              <span className="text-sm font-medium">8,475 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">TDL (1%)</span>
              <span className="text-sm font-medium">3,390 FCFA</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Total déductions</span>
              <span className="font-semibold">54,833 FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé final */}
      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Net à Payer</h3>
            <p className="text-sm text-gray-600">Salaire imposable: 284,167 FCFA</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-2xl text-green-600">284,167 FCFA</span>
            <p className="text-xs text-gray-500">Arrêté à la somme de: Deux cent quatre-vingt-quatre mille cent soixante-sept francs CFA</p>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="flex justify-between items-end pt-4 border-t">
        <div className="text-center">
          <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded mb-2"></div>
          <p className="text-xs text-gray-600">Signature employé</p>
        </div>
        <div className="text-center">
          <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded mb-2"></div>
          <p className="text-xs text-gray-600">Signature employeur</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded mb-2"></div>
          <p className="text-xs text-gray-600">Cachet</p>
        </div>
      </div>
    </div>
  );

  const renderContractPreview = () => (
    <div className="bg-white border rounded-lg p-6 max-w-3xl mx-auto">
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">CONTRAT DE TRAVAIL</h1>
        <p className="text-sm text-gray-600">{template.type} - {template.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-medium text-gray-800 mb-2">Employeur</h4>
          <p className="text-sm text-gray-600">Entreprise Example SARL</p>
          <p className="text-sm text-gray-600">123 Rue de la Paix, Douala</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-medium text-gray-800 mb-2">Employé</h4>
          <p className="text-sm text-gray-600">Jean Dupont</p>
          <p className="text-sm text-gray-600">Né le: 15/03/1990</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-medium text-gray-800">Article 1 - Engagement</h4>
          <p className="text-sm text-gray-600 mt-1">
            L'employeur engage l'employé en qualité de {template.type === 'CDI' ? 'salarié à durée indéterminée' : 
            template.type === 'CDD' ? 'salarié à durée déterminée' : 
            template.type === 'STAGE' ? 'stagiaire' : 'prestataire de services'}.
          </p>
        </div>
        
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-medium text-gray-800">Article 2 - Fonctions</h4>
          <p className="text-sm text-gray-600 mt-1">
            L'employé exercera les fonctions de Développeur sous l'autorité hiérarchique du responsable concerné.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-medium text-gray-800">Article 3 - Rémunération</h4>
          <p className="text-sm text-gray-600 mt-1">
            La rémunération mensuelle brute est fixée à 250,000 FCFA, payable le dernier jour ouvrable du mois.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle className="flex items-center justify-between bg-gray-50 border-b">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Aperçu - {template.name}
          </h2>
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

      <DialogContent className="p-6">
        <div className="overflow-y-auto max-h-96">
          {type === 'payslip' ? renderPaySlipPreview() : renderContractPreview()}
        </div>
      </DialogContent>

      <DialogActions className="bg-gray-50 border-t p-4">
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-600">
            <span>Modèle : <strong className="text-blue-600">{template.name}</strong></span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
            >
              Fermer
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download className="w-4 h-4" />}
            >
              Utiliser ce modèle
            </Button>
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default TemplatePreview; 