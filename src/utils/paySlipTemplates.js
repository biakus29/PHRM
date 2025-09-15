// // Configuration des modèles de fiches de paie
// import { computeNetPay, computeEffectiveDeductions, computeRoundedDeductions, formatCFA, computeSBT, computeSBC } from './payrollCalculations';

// export const PAYSLIP_TEMPLATE_CONFIGS = {
//   template1: {
//     name: 'Modèle Standard Camerounais',
//     layout: 'classic',
//     hasLogo: true,
//     sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'signature']
//   },
//   template2: {
//     name: 'Modèle Simplifié Moderne',
//     layout: 'modern',
//     hasLogo: true,
//     sections: ['header', 'employee', 'salary', 'summary', 'qr']
//   },
//   template3: {
//     name: 'Modèle Détaillé Complet',
//     layout: 'detailed',
//     hasLogo: true,
//     sections: ['header', 'employee', 'salary', 'deductions', 'history', 'notes', 'signature']
//   },
//   template4: {
//     name: 'Modèle Entreprise Premium',
//     layout: 'premium',
//     hasLogo: true,
//     sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'security', 'signature']
//   },
//   template5: {
//     name: 'Modèle CNPS Officiel',
//     layout: 'official',
//     hasLogo: true,
//     sections: ['header', 'employee', 'salary', 'cnps', 'deductions', 'validation', 'signature']
//   }
// };

// // Configuration des calculs CNPS et fiscaux (mise à jour selon réglementation camerounaise 2025)
// export const CNPS_CALCULATIONS = {
//   // Cotisations salariales
//   employeeRates: {
//     pvid: 0.042, // PVID 4,2%
//   },
//   // Cotisations patronales
//   employerRates: {
//     pvid: 0.049, // PVID 4,9%
//     pf: 0.07,    // Prestations Familiales 7%
//     rp: 0.025    // Risques Professionnels 2,5% (variable selon secteur)
//   },
//   // Impôts et taxes
//   taxRates: {
//     cfc: 0.01,   // CFC 1% du salaire brut
//     fne: 0.01,   // FNE Salarié 1%
//     fneEmp: 0.015 // FNE Employeur 1,5%
//   },
//   // Plafonds
//   ceilings: {
//     cnpsMax: 750000, // Plafond CNPS mensuel
//     irppThreshold: 62000 // Seuil d'exonération IRPP
//   },
//   // Barème IRPP progressif (mensuel)
//   irppBrackets: [
//     { min: 0, max: 166667, rate: 0.10 },
//     { min: 166667, max: 250000, rate: 0.15 },
//     { min: 250000, max: 416667, rate: 0.25 },
//     { min: 416667, max: Infinity, rate: 0.35 }
//   ],
//   // Abattement forfaitaire annuel
//   annualDeduction: 500000,
  
//   // Catégories professionnelles CNPS
//   categories: {
//     1: { min: 0, max: 50000, description: 'Manœuvre' },
//     2: { min: 50001, max: 100000, description: 'Ouvrier spécialisé' },
//     3: { min: 100001, max: 150000, description: 'Ouvrier qualifié' },
//     4: { min: 150001, max: 200000, description: 'Agent de maîtrise' },
//     5: { min: 200001, max: 250000, description: 'Technicien' },
//     6: { min: 250001, max: 300000, description: 'Employé' },
//     7: { min: 300001, max: 350000, description: 'Cadre junior' },
//     8: { min: 350001, max: 400000, description: 'Cadre' },
//     9: { min: 400001, max: 450000, description: 'Cadre supérieur' },
//     10: { min: 450001, max: 500000, description: 'Cadre dirigeant' },
//     11: { min: 500001, max: 550000, description: 'Cadre de direction' },
//     12: { min: 550001, max: 999999999, description: 'Cadre supérieur de direction' }
//   },
//   echelons: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
// };

// /**
//  * Formate un nombre avec des espaces comme séparateurs de milliers
//  */
// function formatCurrency(amount) {
//   if (!amount || isNaN(amount)) return '0';
//   return Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// }

// /**
//  * Calcule l'IRPP selon le barème progressif camerounais
//  */
// function calculateIRPP(taxableSalary, employeePVID) {
//   // taxableSalary doit être le SBT (salaire brut taxable)
//   if (!taxableSalary || taxableSalary <= 0) return 0;
//   // IRPP est nul si SBT < seuil d'exonération (62 000 FCFA)
//   if (taxableSalary < CNPS_CALCULATIONS.ceilings.irppThreshold) return 0;
  
//   // Seuil d'exonération simple (si requis par la politique)
//   // On ne court-circuite pas si le taxableSalary dépasse le seuil, car l'abattement et la PVID seront appliqués dans le SNC
//   const monthlyDeduction = CNPS_CALCULATIONS.annualDeduction / 12;
//   const pvid = Math.max(0, Number(employeePVID) || 0);
  
//   // SNC: 70% du SBT - PVID - abattement mensuel
//   const snc = Math.max(0, (taxableSalary * 0.7) - pvid - monthlyDeduction);
  
//   let irpp = 0;
//   let remainingAmount = snc;
  
//   for (const bracket of CNPS_CALCULATIONS.irppBrackets) {
//     if (remainingAmount <= 0) break;
//     const width = bracket.max - bracket.min;
//     const taxableInBracket = Math.min(remainingAmount, width);
//     irpp += taxableInBracket * bracket.rate;
//     remainingAmount -= taxableInBracket;
//   }
  
//   return Math.round(irpp);
// }

// /**
//  * Calcule la RAV (redevance audio-visuelle) selon le brut mensuel
//  */
// function computeRAV(grossSalary) {
//   const g = Math.round(Number(grossSalary) || 0);
//   if (g < 50000) return 0;
//   if (g <= 100000) return 750;
//   if (g <= 200000) return 1950;
//   if (g <= 300000) return 3250;
//   if (g <= 400000) return 4550;
//   if (g <= 500000) return 5850;
//   if (g <= 600000) return 7150;
//   if (g <= 700000) return 8450;
//   if (g <= 800000) return 9750;
//   if (g <= 900000) return 11050;
//   if (g <= 1000000) return 12350;
//   return 13000;
// }

// /**
//  * Calcule toutes les déductions sociales et fiscales
//  */
// function calculateDeductions(grossSalary, baseSalary, options = {}) {
//   // Détermination des bases:
//   // - Base cotisable CNPS (SBC): par défaut, on utilise le salaire de base (plafonné)
//   // - Base imposable (SBT): inclut salaire de base + heures sup + primes imposables (on exclut transport/logement par défaut)
//   const safeNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
//   const transportAllowance = safeNum(options.transportAllowance);
//   const housingAllowance = safeNum(options.housingAllowance);
//   const responsibilityAllowance = safeNum(options.responsibilityAllowance);
//   const otherPrimes = safeNum(options.otherPrimes);
//   const overtimeTotal = safeNum(options.overtimeTotal);

//   // SBC: on prend par défaut le salaire de base (plus heures sup si imposables/cotisables selon tes règles)
//   // On reste conservateur: SBC = baseSalary
//   const rawSBC = safeNum(baseSalary);
//   const cnpsBase = Math.min(rawSBC, CNPS_CALCULATIONS.ceilings.cnpsMax);
//   const cnpsEmployee = Math.round(cnpsBase * CNPS_CALCULATIONS.employeeRates.pvid);

//   // SBT: base imposable
//   // Hypothèses par défaut: responsibilityAllowance et otherPrimes imposables; transport/housing non imposables; heures sup imposables
//   const sbt = safeNum(baseSalary) + overtimeTotal + responsibilityAllowance + otherPrimes;

//   // Cotisations patronales (pour information)
//   const cnpsEmployerPVID = Math.round(cnpsBase * CNPS_CALCULATIONS.employerRates.pvid);
//   const cnpsEmployerPF = Math.round(cnpsBase * CNPS_CALCULATIONS.employerRates.pf);
//   const cnpsEmployerRP = Math.round(cnpsBase * CNPS_CALCULATIONS.employerRates.rp);

//   // IRPP sur SNC dérivé du SBT
//   const irpp = calculateIRPP(sbt, cnpsEmployee);
//   const cac = irpp > 0 ? Math.round(irpp * 0.10) : 0; // CAC = 10% de l'IRPP si IRPP>0
//   const tdl = irpp > 0 ? Math.round(irpp * 0.10) : 0; // TDL = 10% de l'IRPP si IRPP>0
//   const rav = computeRAV(grossSalary);                // RAV: barème fixe sur BRUT
//   const cfc = Math.round(grossSalary * CNPS_CALCULATIONS.taxRates.cfc); // CFC 1% du BRUT
//   const fne = Math.round(grossSalary * CNPS_CALCULATIONS.taxRates.fne); // FNE salarié 1% du BRUT

//   const totalEmployeeDeductions = cnpsEmployee + irpp + cac + cfc + fne + tdl + rav;

//   return {
//     employee: {
//       cnps: cnpsEmployee,
//       irpp: irpp,
//       cac: cac,
//       rav: rav,
//       cfc: cfc,
//       fne: fne,
//       tdl: tdl,
//       total: totalEmployeeDeductions
//     },
//     employer: {
//       cnpsPVID: cnpsEmployerPVID,
//       cnpsPF: cnpsEmployerPF,
//       cnpsRP: cnpsEmployerRP,
//       fne: Math.round(grossSalary * CNPS_CALCULATIONS.taxRates.fneEmp), // FNE employeur 1,5% du BRUT
//       total: cnpsEmployerPVID + cnpsEmployerPF + cnpsEmployerRP + Math.round(grossSalary * CNPS_CALCULATIONS.taxRates.fneEmp)
//     },
//     taxableBase: sbt,
//     cotisableBase: cnpsBase
//   };
// }

// // Fonction pour générer les données de fiche de paie selon le modèle
// export const generatePaySlipData = (employee, companyData, templateId, payPeriod) => {
//   const template = PAYSLIP_TEMPLATE_CONFIGS[templateId];
//   if (!template) {
//     throw new Error(`Modèle ${templateId} non trouvé`);
//   }

//   // Calculs de base
//   const baseSalary = employee.contract?.salaryBrut || 0;
//   const transportAllowance = employee.contract?.transportAllowance || 0;
//   const housingAllowance = employee.contract?.housingAllowance || 0;
//   const responsibilityAllowance = employee.contract?.responsibilityAllowance || 0;
//   const otherPrimes = employee.contract?.otherPrimes || 0;
  
//   // Heures travaillées
//   const daysWorked = employee.workDays?.actual || 22; // Jours ouvrés standards
//   const normalHours = daysWorked * 8;
//   const overtimeHours = employee.overtimeHours?.regular || 0;
//   const sundayHours = employee.overtimeHours?.sunday || 0;
//   const nightHours = employee.overtimeHours?.night || 0;
//   const holidayHours = employee.overtimeHours?.holiday || 0;

//   // Calculs de rémunération
//   const dailyRate = baseSalary / 22;
//   const hourlyRate = dailyRate / 8;
  
//   // Heures supplémentaires (selon Code du Travail camerounais)
//   const regularOvertimePay = overtimeHours * hourlyRate * 1.3; // 130% pour heures sup normales
//   const sundayOvertimePay = sundayHours * hourlyRate * 1.4;    // 140% pour dimanche
//   const nightOvertimePay = nightHours * hourlyRate * 1.5;      // 150% pour nuit
//   const holidayOvertimePay = holidayHours * hourlyRate * 2.0;  // 200% pour jours fériés
  
//   const totalOvertimePay = regularOvertimePay + sundayOvertimePay + nightOvertimePay + holidayOvertimePay;
//   const totalGross = baseSalary + transportAllowance + housingAllowance + responsibilityAllowance + 
//                      otherPrimes + totalOvertimePay;

//   // Calcul des déductions (on précise le contexte pour SBT/SBC)
//   const deductions = calculateDeductions(totalGross, baseSalary, {
//     transportAllowance,
//     housingAllowance,
//     responsibilityAllowance,
//     otherPrimes,
//     overtimeTotal: totalOvertimePay
//   });
//   const netSalary = totalGross - deductions.employee.total;

//   return {
//     template: template,
//     employer: {
//       name: companyData.name || 'VIGILCAM SECURITY & SERVICES SARL',
//       address: companyData.address || 'BP 16194 Yaoundé',
//       phone: companyData.phone || '22214081',
//       cnpsNumber: companyData.cnpsNumber || 'J123456789',
//       logo: companyData.logo || null,
//       siret: companyData.siret || null,
//       email: companyData.email || null
//     },
//     employee: {
//       matricule: employee.matricule || 'N/A',
//       fullName: employee.name || 'N/A',
//       dateOfBirth: employee.dateOfBirth || 'N/A',
//       placeOfBirth: employee.lieuNaissance || 'N/A',
//       hireDate: employee.contract?.hireDate || 'N/A',
//       position: employee.poste || 'N/A',
//       cnpsCategory: employee.professionalCategory || 'N/A',
//       cnpsEchelon: employee.echelon || 'N/A',
//       cnpsNumber: employee.cnpsNumber || 'N/A',
//       department: employee.department || 'N/A',
//       service: employee.service || 'N/A',
//       supervisor: employee.supervisor || 'N/A',
//       bankAccount: employee.bankAccount || 'N/A',
//       taxNumber: employee.taxNumber || 'N/A'
//     },
//     workPeriod: {
//       period: payPeriod,
//       daysWorked: daysWorked,
//       normalHours: normalHours,
//       overtimeHours: {
//         regular: overtimeHours,
//         sunday: sundayHours,
//         night: nightHours,
//         holiday: holidayHours,
//         total: overtimeHours + sundayHours + nightHours + holidayHours
//       },
//       seniority: employee.seniority || 0,
//       childrenCount: employee.childrenCount || 0,
//       leaveDays: employee.contract?.leaveDays || 18,
//       sickDays: employee.workDays?.sick || 0,
//       absentDays: employee.workDays?.absent || 0
//     },
//     remuneration: {
//       baseSalary: baseSalary,
//       transportAllowance: transportAllowance,
//       housingAllowance: housingAllowance,
//       responsibilityAllowance: responsibilityAllowance,
//       otherPrimes: otherPrimes,
//       overtime: {
//         regular: regularOvertimePay,
//         sunday: sundayOvertimePay,
//         night: nightOvertimePay,
//         holiday: holidayOvertimePay,
//         total: totalOvertimePay
//       },
//       totalGross: totalGross,
//       // Formatage pour affichage
//       formatted: {
//         baseSalary: formatCurrency(baseSalary),
//         transportAllowance: formatCurrency(transportAllowance),
//         housingAllowance: formatCurrency(housingAllowance),
//         responsibilityAllowance: formatCurrency(responsibilityAllowance),
//         otherPrimes: formatCurrency(otherPrimes),
//         totalOvertimePay: formatCurrency(totalOvertimePay),
//         totalGross: formatCurrency(totalGross)
//       }
//     },
//     deductions: {
//       employee: {
//         cnps: deductions.employee.cnps,
//         irpp: deductions.employee.irpp,
//         cac: deductions.employee.cac,
//         cfc: deductions.employee.cfc,
//         fne: deductions.employee.fne,
//         total: deductions.employee.total,
//         // Formatage pour affichage
//         formatted: {
//           cnps: formatCurrency(deductions.employee.cnps),
//           irpp: formatCurrency(deductions.employee.irpp),
//           cac: formatCurrency(deductions.employee.cac),
//           cfc: formatCurrency(deductions.employee.cfc),
//           fne: formatCurrency(deductions.employee.fne),
//           total: formatCurrency(deductions.employee.total)
//         }
//       },
//       employer: {
//         cnpsPVID: deductions.employer.cnpsPVID,
//         cnpsPF: deductions.employer.cnpsPF,
//         cnpsRP: deductions.employer.cnpsRP,
//         fne: deductions.employer.fne,
//         total: deductions.employer.total,
//         // Formatage pour affichage
//         formatted: {
//           cnpsPVID: formatCurrency(deductions.employer.cnpsPVID),
//           cnpsPF: formatCurrency(deductions.employer.cnpsPF),
//           cnpsRP: formatCurrency(deductions.employer.cnpsRP),
//           fne: formatCurrency(deductions.employer.fne),
//           total: formatCurrency(deductions.employer.total)
//         }
//       }
//     },
//     summary: {
//       taxableSalary: deductions.taxableBase,
//       netSalary: netSalary,
//       amountInWords: numberToWords(netSalary),
//       // Formatage pour affichage
//       formatted: {
//         taxableSalary: formatCurrency(deductions.taxableBase),
//         netSalary: formatCurrency(netSalary)
//       }
//     },
//     calculations: {
//       rates: CNPS_CALCULATIONS,
//       cnpsBase: Math.min(totalGross, CNPS_CALCULATIONS.ceilings.cnpsMax),
//       formatted: {
//         cnpsBase: formatCurrency(Math.min(totalGross, CNPS_CALCULATIONS.ceilings.cnpsMax))
//       }
//     },
//     generatedAt: new Date().toISOString(),
//     generatedDate: new Date().toLocaleDateString('fr-FR', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   };
// };

// // Fonction utilitaire améliorée pour convertir les nombres en mots (français)
// function numberToWords(num) {
//   if (!num || isNaN(num) || num < 0) return 'zéro';
  
//   const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
//   const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 
//                  'dix-sept', 'dix-huit', 'dix-neuf'];
//   const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 
//                 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
//   const convertGroup = (n) => {
//     if (n === 0) return '';
//     if (n < 10) return units[n];
//     if (n < 20) return teens[n - 10];
//     if (n < 100) {
//       const tenDigit = Math.floor(n / 10);
//       const unitDigit = n % 10;
      
//       if (tenDigit === 7) {
//         return unitDigit === 0 ? 'soixante-dix' : `soixante-${teens[unitDigit]}`;
//       }
//       if (tenDigit === 8) {
//         return unitDigit === 0 ? 'quatre-vingts' : `quatre-vingt-${units[unitDigit]}`;
//       }
//       if (tenDigit === 9) {
//         return `quatre-vingt-${teens[unitDigit]}`;
//       }
      
//       return unitDigit === 0 ? tens[tenDigit] : `${tens[tenDigit]}-${units[unitDigit]}`;
//     }
    
//     const hundreds = Math.floor(n / 100);
//     const remainder = n % 100;
//     let result = hundreds === 1 ? 'cent' : `${units[hundreds]} cent`;
    
//     if (remainder > 0) {
//       result += ` ${convertGroup(remainder)}`;
//     } else if (hundreds > 1) {
//       result += 's'; // "cents" au pluriel
//     }
    
//     return result;
//   };
  
//   const integerPart = Math.floor(num);
  
//   if (integerPart === 0) return 'zéro';
//   if (integerPart < 1000) return convertGroup(integerPart);
//   if (integerPart < 1000000) {
//     const thousands = Math.floor(integerPart / 1000);
//     const remainder = integerPart % 1000;
    
//     let result = thousands === 1 ? 'mille' : `${convertGroup(thousands)} mille`;
//     if (remainder > 0) {
//       result += ` ${convertGroup(remainder)}`;
//     }
//     return result;
//   }
//   if (integerPart < 1000000000) {
//     const millions = Math.floor(integerPart / 1000000);
//     const remainder = integerPart % 1000000;
    
//     let result = millions === 1 ? 'un million' : `${convertGroup(millions)} millions`;
//     if (remainder > 0) {
//       if (remainder < 1000) {
//         result += ` ${convertGroup(remainder)}`;
//       } else {
//         const thousands = Math.floor(remainder / 1000);
//         const units = remainder % 1000;
//         result += ` ${convertGroup(thousands)} mille`;
//         if (units > 0) {
//           result += ` ${convertGroup(units)}`;
//         }
//       }
//     }
//     return result;
//   }
  
//   return 'nombre trop élevé';
// }

// // Export des utilitaires
// export { formatCurrency, calculateDeductions, calculateIRPP, numberToWords };