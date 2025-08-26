// src/utils/taxCalc.js
import { getSBT, getSBC, getCalculs } from "./cnpsCalc";

// Barème et paramètres impôts Cameroun (simplifiés comme dans le composant)
const ABATTEMENT_ANNUEL = 500_000; // FCFA
const ABATTEMENT_MENSUEL = ABATTEMENT_ANNUEL / 12;

export const computeTaxes = (
  selectedIds = [],
  formData = {},
  employerOptions = {},
  taxOptions = { cfcRate: 2.5, fneRate: 1.0 }
) => {
  const rows = [];
  let totals = { sbt: 0, sbc: 0, irpp: 0, cac: 0, cfc: 0, tdl: 0, fneSal: 0, fneEmp: 0 };

  selectedIds.forEach((id) => {
    const d = formData[id] || {};
    const c = getCalculs(d, employerOptions);
    const sbt = getSBT(d);
    const sbc = getSBC(d);
    const pvidSal = c.cotisSalarie || 0; // 4.2% PVID salarié

    // SNC mensuel = 70% SBT – PVID – 500000/12
    let snc = 0.7 * sbt - pvidSal - ABATTEMENT_MENSUEL;
    if (sbt < 62_000) snc = 0; // En dessous de 62 000, IRPP = 0
    snc = Math.max(0, snc);

    // Barème IRPP mensuel
    let irpp = 0;
    if (snc > 416_667) {
      irpp = 70_833.75 + (snc - 416_667) * 0.35;
    } else if (snc > 250_000) {
      irpp = 29_167 + (snc - 250_000) * 0.25;
    } else if (snc > 166_667) {
      irpp = 16_667 + (snc - 166_667) * 0.15;
    } else if (snc > 0) {
      irpp = snc * 0.10;
    } else {
      irpp = 0;
    }
    irpp = Math.round(irpp);

    const cac = Math.round(irpp * 0.10); // 10% de l'IRPP
    const tdl = Math.round(irpp * 0.10); // 10% de l'IRPP (Taxe de Développement Local)
    const cfc = Math.round(sbc * ((Number(taxOptions.cfcRate) || 2.5) / 100));
    const fneRate = Number(taxOptions.fneRate) || 1.0;
    const fneSal = Math.round(sbt * (fneRate / 100)); // salarié
    const fneEmp = Math.round(sbt * ((fneRate * 1.5) / 100)); // employeur = 1.5 × fneRate

    rows.push({ id, matricule: d.cnps, nom: d.nom, sbt, sbc, irpp, cac, tdl, cfc, fneSal, fneEmp });

    totals.sbt += sbt;
    totals.sbc += sbc;
    totals.irpp += irpp;
    totals.cac += cac;
    totals.tdl += tdl;
    totals.cfc += cfc;
    totals.fneSal += fneSal;
    totals.fneEmp += fneEmp;
  });

  const round0 = (n) => Math.round(n || 0);
  totals = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, round0(v)]));
  return { rows, totals };
};
