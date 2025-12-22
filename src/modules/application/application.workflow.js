// Workflow de recrutement PHRM - Centralisé et sécurisé

export const APPLICATION_STATUSES = [
  { value: 'applied', label: 'Candidature reçue', color: 'blue' },
  { value: 'screening', label: 'En sélection', color: 'yellow' },
  { value: 'interview', label: 'Entretien', color: 'purple' },
  { value: 'offer', label: 'Offre', color: 'green' },
  { value: 'hired', label: 'Embauché', color: 'emerald' },
  { value: 'rejected', label: 'Refusé', color: 'red' }
];

export const getStatusMessage = (status) => {
  const messages = {
    'applied': 'Nous avons bien reçu votre candidature et l\'examinons avec attention.',
    'screening': 'Votre candidature est en cours de sélection par notre équipe.',
    'interview': 'Nous souhaitons vous rencontrer pour un entretien. Nous vous contacterons prochainement.',
    'offer': 'Nous sommes ravis de vous faire une offre d\'emploi !',
    'hired': 'Félicitations ! Vous avez été embauché. Bienvenue dans l\'équipe !',
    'rejected': 'Nous regrettons de vous informer que votre candidature n\'a pas été retenue.'
  };
  return messages[status] || '';
};

export const isValidTransition = (from, to) => {
  const flow = {
    'applied': ['screening', 'rejected'],
    'screening': ['interview', 'rejected'],
    'interview': ['offer', 'rejected'],
    'offer': ['hired', 'rejected'],
    'hired': [],
    'rejected': []
  };
  return flow[from]?.includes(to) || false;
};

export const getNextPossibleStatuses = (currentStatus) => {
  const flow = {
    'applied': ['screening', 'rejected'],
    'screening': ['interview', 'rejected'],
    'interview': ['offer', 'rejected'],
    'offer': ['hired', 'rejected'],
    'hired': [],
    'rejected': []
  };
  return flow[currentStatus] || [];
};
