import { getSBT, getSBC, CNPS_CAP } from "../cnpsCalc";

// Helper to ensure number casting similar to production utils
const num = (v) => Number(v || 0);

describe("Cameroon SBT/SBC compliance", () => {
  test("SBT = brut + primes imposables uniquement (exclut logement, transport, etc.)", () => {
    const data = {
      baseSalary: 400000,
      brut: 400000,
      // primes imposables
      bonusDisplay: 50000,
      // indemnités non imposables
      housingAllowanceDisplay: 80000,
      indemniteTransport: 30000,
      representationAllowanceDisplay: 20000,
      mealAllowanceDisplay: 10000,
      dirtAllowanceDisplay: 5000,
    };

    const sbt = getSBT(data);
    // SBT = 400000 + 50000 = 450000 (logement/transport/etc. exclus)
    expect(sbt).toBe(450000);
  });

  test("SBC = min(CNPS_CAP, SBT + indemnités cotisables (transport))", () => {
    const data = {
      baseSalary: 400000,
      brut: 400000,
      bonusDisplay: 50000,
      housingAllowanceDisplay: 80000,
      indemniteTransport: 30000,
      representationAllowanceDisplay: 20000,
      mealAllowanceDisplay: 10000,
      dirtAllowanceDisplay: 5000,
    };

    const sbt = getSBT(data); // 450000
    const sbc = getSBC(data); // min(750000, 450000 + 30000) = 480000

    expect(sbt).toBe(450000);
    expect(sbc).toBe(480000);
  });

  test("Housing (logement) non imposable: n'augmente pas SBT ni SBC (sauf si explicitement cotisable, non) ", () => {
    const data = {
      baseSalary: 300000,
      brut: 300000,
      housingAllowanceDisplay: 60000,
    };

    const sbt = getSBT(data); // 300000
    const sbc = getSBC(data); // 300000

    expect(sbt).toBe(300000);
    expect(sbc).toBe(300000);
  });

  test("CNPS cap applied inside getSBC at 750,000", () => {
    const data = {
      baseSalary: 700000,
      brut: 700000,
      bonusDisplay: 200000,
      indemniteTransport: 100000, // would push above cap
    };

    const sbt = getSBT(data); // 900000
    const sbc = getSBC(data); // min(750000, 900000 + 100000) = 750000

    expect(CNPS_CAP).toBe(750000);
    expect(sbt).toBe(900000);
    expect(sbc).toBe(750000);
  });
});
