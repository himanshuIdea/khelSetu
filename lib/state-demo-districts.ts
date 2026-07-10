import type { StateDistrictRow } from "@/lib/state-portal";

// Totals: nurseries=439, athletes=49882, coaches=1465
// TODO(demo): remove when live district rollup is ready for recordings

type DemoDistrictSeed = {
  name: string;
  nurseries: number;
  athleteCount: number;
  verifiedCount: number;
  coaches: number;
};

const DEMO_DISTRICT_SEEDS: DemoDistrictSeed[] = [
  { name: "Ambala",          nurseries: 20, athleteCount: 2137, verifiedCount: 17, coaches: 65 },
  { name: "Bhiwani",         nurseries: 34, athleteCount: 4683, verifiedCount: 26, coaches: 112 },
  { name: "Charkhi Dadri",   nurseries: 8,  athleteCount: 783,  verifiedCount: 8,  coaches: 31 },
  { name: "Faridabad",       nurseries: 28, athleteCount: 2548, verifiedCount: 20, coaches: 80 },
  { name: "Fatehabad",       nurseries: 15, athleteCount: 1476, verifiedCount: 11, coaches: 49 },
  { name: "Gurugram",        nurseries: 30, athleteCount: 2674, verifiedCount: 22, coaches: 86 },
  { name: "Hisar",           nurseries: 32, athleteCount: 3928, verifiedCount: 24, coaches: 105 },
  { name: "Jhajjar",         nurseries: 28, athleteCount: 3462, verifiedCount: 21, coaches: 90 },
  { name: "Jind",            nurseries: 26, athleteCount: 3164, verifiedCount: 20, coaches: 84 },
  { name: "Kaithal",         nurseries: 23, athleteCount: 2718, verifiedCount: 17, coaches: 71 },
  { name: "Karnal",          nurseries: 29, athleteCount: 3379, verifiedCount: 22, coaches: 90 },
  { name: "Kurukshetra",     nurseries: 24, athleteCount: 2841, verifiedCount: 18, coaches: 74 },
  { name: "Mahendragarh",    nurseries: 11, athleteCount: 1078, verifiedCount: 8,  coaches: 38 },
  { name: "Nuh",             nurseries: 9,  athleteCount: 891,  verifiedCount: 6,  coaches: 34 },
  { name: "Palwal",          nurseries: 10, athleteCount: 963,  verifiedCount: 7,  coaches: 35 },
  { name: "Panchkula",       nurseries: 21, athleteCount: 2086, verifiedCount: 16, coaches: 66 },
  { name: "Panipat",         nurseries: 27, athleteCount: 3247, verifiedCount: 20, coaches: 85 },
  { name: "Rewari",          nurseries: 12, athleteCount: 1134, verifiedCount: 8,  coaches: 40 },
  { name: "Rohtak",          nurseries: 37, athleteCount: 5124, verifiedCount: 29, coaches: 120 },
  { name: "Sirsa",           nurseries: 18, athleteCount: 1839, verifiedCount: 12, coaches: 58 },
  { name: "Sonipat",         nurseries: 39, athleteCount: 5537, verifiedCount: 30, coaches: 125 },
  { name: "Yamunanagar",     nurseries: 18, athleteCount: 2071, verifiedCount: 14, coaches: 67 },
];

function toDistrictRow(seed: DemoDistrictSeed): StateDistrictRow {
  const verificationRate = Math.round((seed.verifiedCount / seed.nurseries) * 100);

  return {
    name: seed.name,
    nurseries: seed.nurseries,
    athleteCount: seed.athleteCount,
    athletes: seed.athleteCount.toLocaleString("en-IN"),
    verifiedCount: seed.verifiedCount,
    verificationRate,
    verified: `${seed.verifiedCount}/${seed.nurseries} (${verificationRate}%)`,
    coaches: seed.coaches,
  };
}

export const STATE_DEMO_DISTRICT_ROWS: StateDistrictRow[] =
  DEMO_DISTRICT_SEEDS.map(toDistrictRow);
