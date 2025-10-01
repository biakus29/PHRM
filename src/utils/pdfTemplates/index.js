// Index central des templates de bulletins de paie
// Tous les templates sont maintenant modularisés dans des fichiers séparés

import { renderClassicPayslip } from './classic';
import { renderBulletinPaieTemplate } from './bulletin_paie';
import { renderEneoPayslip } from './eneo';
import { renderComptaOnlineTemplate } from './compta_online';
import { renderEnterpriseTemplate } from './enterprise';

// Registre central des templates de bulletins de paie
export const PAYSLIP_TEMPLATE_REGISTRY = {
  eneo: { label: 'ENEO (officiel)', renderer: renderEneoPayslip },
  classic: { label: 'Classique', renderer: renderClassicPayslip },
  bulletin_paie: { label: 'Bulletin de Paie', renderer: renderBulletinPaieTemplate },
  compta_online: { label: 'Compta Online', renderer: renderComptaOnlineTemplate },
  enterprise: { label: 'Enterprise', renderer: renderEnterpriseTemplate },
};

/**
 * Récupère le renderer pour un template donné
 * @param {string} key - Clé du template (eneo, classic, bulletin_paie, etc.)
 * @returns {Function} Fonction de rendu du template
 */
export function getPayslipRenderer(key = 'eneo') {
  const k = String(key || 'eneo').toLowerCase();
  return (PAYSLIP_TEMPLATE_REGISTRY[k]?.renderer) || PAYSLIP_TEMPLATE_REGISTRY['classic'].renderer;
}

/**
 * Récupère la liste de tous les templates disponibles
 * @returns {Array} Liste des templates avec {value, label}
 */
export function getPayslipTemplates() {
  return Object.entries(PAYSLIP_TEMPLATE_REGISTRY).map(([value, meta]) => ({ value, label: meta.label }));
}

// Exports individuels pour imports directs
export { renderClassicPayslip } from './classic';
export { renderBulletinPaieTemplate } from './bulletin_paie';
export { renderEneoPayslip } from './eneo';
export { renderComptaOnlineTemplate } from './compta_online';
export { renderEnterpriseTemplate } from './enterprise';

// Export des utilitaires partagés
export * from './shared';

export default {
  PAYSLIP_TEMPLATE_REGISTRY,
  getPayslipRenderer,
  getPayslipTemplates,
  renderClassicPayslip,
  renderBulletinPaieTemplate,
  renderEneoPayslip,
  renderComptaOnlineTemplate,
  renderEnterpriseTemplate
};
