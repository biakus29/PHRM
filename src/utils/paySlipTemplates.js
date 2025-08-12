// Configuration des modèles de fiches de paie
export const PAYSLIP_TEMPLATE_CONFIGS = {
  template1: {
    name: 'Modèle Standard Camerounais',
    layout: 'classic',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'signature']
  },
  template2: {
    name: 'Modèle Simplifié Moderne',
    layout: 'modern',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'summary', 'qr']
  },
  template3: {
    name: 'Modèle Détaillé Complet',
    layout: 'detailed',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'history', 'notes', 'signature']
  },
  template4: {
    name: 'Modèle Entreprise Premium',
    layout: 'premium',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'security', 'signature']
  },
  template5: {
    name: 'Modèle CNPS Officiel',
    layout: 'official',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'cnps', 'deductions', 'validation', 'signature']
  }
};

// Configuration des calculs CNPS et fiscaux
export const CNPS_CALCULATIONS = {
  employeeRate: 0.0625, // 6.25%
  employerRate: 0.125, // 12.5%
  cacRate: 0.01, // 1%
  cfcRate: 0.01, // 1%
  ravRate: 0.025, // 2.5%
  tdlRate: 0.01, // 1%
  categories: {
    1: { min: 0, max: 50000 },
    2: { min: 50001, max: 100000 },
    3: { min: 100001, max: 150000 },
    4: { min: 150001, max: 200000 },
    5: { min: 200001, max: 250000 },
    6: { min: 250001, max: 300000 },
    7: { min: 300001, max: 350000 },
    8: { min: 350001, max: 400000 },
    9: { min: 400001, max: 450000 },
    10: { min: 450001, max: 500000 },
    11: { min: 500001, max: 550000 },
    12: { min: 550001, max: 999999999 }
  },
  echelons: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
};

// Fonction pour générer les données de fiche de paie selon le modèle
export const generatePaySlipData = (employee, companyData, templateId, payPeriod) => {
  const template = PAYSLIP_TEMPLATE_CONFIGS[templateId];
  if (!template) {
    throw new Error(`Modèle ${templateId} non trouvé`);
  }

  // Calculs de base
  const baseSalary = employee.contract?.salaryBrut || 0;
  const transportAllowance = employee.contract?.transportAllowance || 0;
  const daysWorked = 22;
  const normalHours = daysWorked * 8;
  const overtimeHours = employee.overtimeHours?.regular || 0;
  const sundayHours = employee.overtimeHours?.sunday || 0;
  const nightHours = employee.overtimeHours?.night || 0;

  // Calculs de rémunération
  const dailyRate = baseSalary / 22;
  const hourlyRate = dailyRate / 8;
  const overtimePay = overtimeHours * hourlyRate * 1.5;
  const sundayPay = sundayHours * hourlyRate * 2;
  const nightPay = nightHours * hourlyRate * 1.3;
  const totalGross = baseSalary + transportAllowance + overtimePay + sundayPay + nightPay;

  // Calculs de déductions
  const cnpsDeduction = totalGross * CNPS_CALCULATIONS.employeeRate;
  const cacDeduction = totalGross * CNPS_CALCULATIONS.cacRate;
  const cfcDeduction = totalGross * CNPS_CALCULATIONS.cfcRate;
  const ravDeduction = totalGross * CNPS_CALCULATIONS.ravRate;
  const tdlDeduction = totalGross * CNPS_CALCULATIONS.tdlRate;
  const irppDeduction = Math.max(0, (totalGross - 50000) * 0.1);
  
  const totalDeductions = cnpsDeduction + irppDeduction + cacDeduction + cfcDeduction + ravDeduction + tdlDeduction;
  const netSalary = totalGross - totalDeductions;

  return {
    template: template,
    employer: {
      name: companyData.name || 'VIGILCAM SECURITY & SERVICES SARL',
      address: companyData.address || 'BP 16194 Yaoundé',
      phone: companyData.phone || '22214081',
      cnpsNumber: companyData.cnpsNumber || 'J123456789',
      logo: companyData.logo || null
    },
    employee: {
      matricule: employee.matricule || 'N/A',
      fullName: employee.name || 'N/A',
      dateOfBirth: employee.dateOfBirth || 'N/A',
      placeOfBirth: employee.lieuNaissance || 'N/A',
      hireDate: employee.contract?.hireDate || 'N/A',
      position: employee.poste || 'N/A',
      cnpsCategory: employee.professionalCategory || 'N/A',
      cnpsEchelon: employee.echelon || 'N/A',
      department: employee.department || 'N/A',
      service: employee.service || 'N/A',
      supervisor: employee.supervisor || 'N/A'
    },
    workPeriod: {
      period: payPeriod,
      daysWorked: daysWorked,
      normalHours: normalHours,
      overtimeHours: overtimeHours,
      sundayHours: sundayHours,
      nightHours: nightHours,
      seniority: employee.seniority || 0,
      childrenCount: employee.childrenCount || 0,
      leaveDays: employee.contract?.leaveDays || 18
    },
    remuneration: {
      baseSalary: baseSalary,
      transportAllowance: transportAllowance,
      housingAllowance: employee.contract?.housingAllowance || 0,
      responsibilityAllowance: employee.contract?.responsibilityAllowance || 0,
      otherPrimes: employee.contract?.otherPrimes || 0,
      normalOvertime: overtimePay,
      sundayOvertime: sundayPay,
      nightOvertime: nightPay,
      totalGross: totalGross
    },
    deductions: {
      cnps: cnpsDeduction,
      irpp: irppDeduction,
      cac: cacDeduction,
      cfc: cfcDeduction,
      rav: ravDeduction,
      tdl: tdlDeduction,
      totalDeductions: totalDeductions
    },
    summary: {
      taxableSalary: totalGross - cnpsDeduction,
      netSalary: netSalary,
      amountInWords: numberToWords(netSalary)
    },
    generatedAt: new Date().toISOString()
  };
};

// Fonction utilitaire pour convertir les nombres en mots
function numberToWords(num) {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    if (num % 10 === 0) return tens[Math.floor(num / 10)];
    if (num < 70) return tens[Math.floor(num / 10)] + '-' + units[num % 10];
    if (num < 80) return 'soixante-' + teens[num - 60];
    return 'quatre-vingt-' + units[num % 10];
  }
  if (num < 1000) {
    if (num % 100 === 0) return units[Math.floor(num / 100)] + ' cent';
    return units[Math.floor(num / 100)] + ' cent ' + numberToWords(num % 100);
  }
  if (num < 1000000) {
    if (num % 1000 === 0) return numberToWords(Math.floor(num / 1000)) + ' mille';
    return numberToWords(Math.floor(num / 1000)) + ' mille ' + numberToWords(num % 1000);
  }
  
  return 'nombre trop grand';
} 