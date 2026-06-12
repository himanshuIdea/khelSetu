export const stateDistrictBars = [
  { district: "Sonipat", total: "14.2k", width: 100, segments: [46, 20, 16, 10, 8] },
  { district: "Rohtak", total: "12.8k", width: 90, segments: [38, 28, 14, 12, 8] },
  { district: "Hisar", total: "11.5k", width: 81, segments: [40, 26, 16, 10, 8] },
  { district: "Bhiwani", total: "10.9k", width: 77, segments: [52, 22, 12, 8, 6] },
  { district: "Jhajjar", total: "9.4k", width: 66, segments: [44, 22, 16, 10, 8] },
  { district: "Karnal", total: "8.7k", width: 61, segments: [30, 26, 22, 14, 8] },
];

export const sportLegend = [
  { label: "Wrestling", color: "#FF6B2C" },
  { label: "Boxing", color: "#2F6BFF" },
  { label: "Kabaddi", color: "#7C5CFC" },
  { label: "Athletics", color: "#12B886" },
  { label: "Other", color: "#9AA4B8" },
];

export const talentPipeline = [
  { name: "Rohit Sangwan", sport: "Wrestling · 65kg", district: "Sonipat", category: "Sub-junior", score: "8.9" },
  { name: "Priya Dahiya", sport: "Boxing · 54kg", district: "Bhiwani", category: "Junior", score: "8.7" },
  { name: "Sahil Malik", sport: "Athletics · 400m", district: "Hisar", category: "Senior", score: "8.5" },
  { name: "Anjali Sheoran", sport: "Wrestling · 57kg", district: "Rohtak", category: "Junior", score: "8.4" },
];

export const scoutingProspects = [
  { initials: "RS", color: "#FF6B2C", name: "Rohit Sangwan", detail: "Wrestling · 65kg", sport: "Wrestling", district: "Sonipat", score: "9.1", status: "green" as const, statusLabel: "Shortlisted" },
  { initials: "PD", color: "#7C5CFC", name: "Priya Dahiya", detail: "Boxing · 54kg", sport: "Boxing", district: "Bhiwani", score: "8.9", status: "green" as const, statusLabel: "Shortlisted" },
  { initials: "SM", color: "#12B886", name: "Sahil Malik", detail: "Athletics · 400m", sport: "Athletics", district: "Hisar", score: "8.7", status: "amber" as const, statusLabel: "In trials" },
  { initials: "AS", color: "#2F6BFF", name: "Anjali Sheoran", detail: "Wrestling · 57kg", sport: "Wrestling", district: "Rohtak", score: "8.6", status: "green" as const, statusLabel: "Shortlisted" },
  { initials: "KD", color: "#FF6B2C", name: "Kuldeep Dahiya", detail: "Kabaddi · Raider", sport: "Kabaddi", district: "Jhajjar", score: "8.5", status: "amber" as const, statusLabel: "In trials" },
  { initials: "NR", color: "#7C5CFC", name: "Neha Rani", detail: "Boxing · 60kg", sport: "Boxing", district: "Karnal", score: "8.3", status: "grey" as const, statusLabel: "Watchlist" },
];

export const fundSchemes = [
  { name: "Padak Lao, Pad Pao (medal cash)", detail: "Olympic & national medallists", beneficiaries: "318", disbursed: "₹14.2 Cr", util: 88, color: "#12B886" },
  { name: "Sports scholarships", detail: "Nursery & academy athletes", beneficiaries: "12,640", disbursed: "₹9.8 Cr", util: 82, color: "#12B886" },
  { name: "Diet allowance", detail: "Residential trainees", beneficiaries: "6,120", disbursed: "₹6.1 Cr", util: 76, color: "#2F6BFF" },
  { name: "Coach honorarium", detail: "3,210 NIS coaches", beneficiaries: "3,210", disbursed: "₹5.4 Cr", util: 91, color: "#12B886" },
  { name: "Nursery equipment grant", detail: "1,842 nurseries", beneficiaries: "1,842", disbursed: "₹2.4 Cr", util: 64, color: "#F5A623" },
  { name: "Athlete insurance premium", detail: "All registered athletes", beneficiaries: "670", disbursed: "₹0.7 Cr", util: 48, color: "#F5A623" },
];

export const nurseriesList = [
  { initials: "DS", color: "#FF6B2C", name: "Dronacharya Sports Academy", detail: "Sonipat · Wrestling", athletes: "248", status: "green" as const, statusLabel: "Verified" },
  { initials: "BK", color: "#2F6BFF", name: "Bhiwani Boxing Centre", detail: "Bhiwani · Boxing", athletes: "186", status: "green" as const, statusLabel: "Verified" },
  { initials: "HK", color: "#7C5CFC", name: "Hisar Kabaddi Nursery", detail: "Hisar · Kabaddi", athletes: "142", status: "amber" as const, statusLabel: "Pending" },
  { initials: "RA", color: "#12B886", name: "Rohtak Athletics Hub", detail: "Rohtak · Athletics", athletes: "198", status: "green" as const, statusLabel: "Verified" },
  { initials: "JS", color: "#F5A623", name: "Jhajjar Sports School", detail: "Jhajjar · Multi-sport", athletes: "94", status: "red" as const, statusLabel: "Flagged" },
];

export const athletesList = [
  { initials: "RS", color: "#FF6B2C", name: "Rohit Sangwan", detail: "HRWR-1042 · 16y", sport: "Wrestling · 65kg", district: "Sonipat", rating: "8.9" },
  { initials: "PD", color: "#7C5CFC", name: "Priya Dahiya", detail: "HRBX-0218 · 15y", sport: "Boxing · 54kg", district: "Bhiwani", rating: "8.7" },
  { initials: "SM", color: "#12B886", name: "Sahil Malik", detail: "HRAT-0091 · 17y", sport: "Athletics · 400m", district: "Hisar", rating: "8.5" },
  { initials: "NK", color: "#F5A623", name: "Neha Kadyan", detail: "HRKB-0153 · 16y", sport: "Kabaddi · Raider", district: "Jhajjar", rating: "8.2" },
];

export const districtsList = [
  { name: "Sonipat", nurseries: 142, athletes: "14.2k", verified: "98%", coaches: 186 },
  { name: "Rohtak", nurseries: 128, athletes: "12.8k", verified: "97%", coaches: 164 },
  { name: "Hisar", nurseries: 118, athletes: "11.5k", verified: "96%", coaches: 152 },
  { name: "Bhiwani", nurseries: 112, athletes: "10.9k", verified: "99%", coaches: 148 },
  { name: "Jhajjar", nurseries: 96, athletes: "9.4k", verified: "94%", coaches: 124 },
  { name: "Karnal", nurseries: 88, athletes: "8.7k", verified: "95%", coaches: 118 },
];
