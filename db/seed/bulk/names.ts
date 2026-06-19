/** Curated North Indian first names and surnames for deterministic seed data. */

const FIRST_NAMES = [
  "Monaal", "Deepanshu", "Harshita", "Manan", "Karamjit", "Tarsem", "Rohit", "Priya",
  "Aman", "Sahil", "Neha", "Vikas", "Manju", "Deepak", "Naveen", "Sunita", "Vikram",
  "Jagdeep", "Ritu", "Sarita", "Ramesh", "Om", "Ankit", "Pooja", "Varun", "Kavita",
  "Gurpreet", "Harpreet", "Simran", "Navdeep", "Lovepreet", "Jasleen", "Arjun", "Kiran",
  "Sandeep", "Meena", "Rajesh", "Suman", "Ajay", "Rekha", "Sunil", "Anju", "Ravi",
  "Geeta", "Suresh", "Poonam", "Amit", "Nisha", "Rahul", "Shweta", "Vivek", "Anita",
  "Mohit", "Seema", "Nitin", "Renu", "Yogesh", "Sonia", "Pankaj", "Divya", "Ashok",
  "Kusum", "Sanjay", "Mamta", "Dinesh", "Lata", "Vinod", "Usha", "Mahesh", "Kamla",
  "Rakesh", "Sunita", "Balbir", "Harjeet", "Gurmeet", "Manpreet", "Harleen", "Inderjit",
  "Balwinder", "Parminder", "Jaswinder", "Kuldeep", "Mandeep", "Randeep", "Sukhdeep",
  "Tejinder", "Amandeep", "Bhupinder", "Charanjit", "Dalbir", "Ekam", "Fateh", "Gagan",
  "Harman", "Ishita", "Jatin", "Kartik", "Lakshay", "Mihir", "Nakul", "Ojas", "Parth",
  "Quasar", "Raghav", "Sakshi", "Tanvi", "Uday", "Vidhi", "Yash", "Zorawar", "Abhinav",
  "Bhavna", "Chirag", "Daksh", "Esha", "Farhan", "Gauri", "Himanshu", "Ishaan", "Jyoti",
  "Kunal", "Lavanya", "Mayank", "Nidhi", "Omkar", "Pranav", "Riya", "Siddharth", "Tanya",
  "Utkarsh", "Vanya", "Yuvraj", "Zara", "Aditya", "Bhavika", "Chandan", "Devika",
  "Eklavya", "Falguni", "Girish", "Hema", "Indira", "Jagriti", "Keshav", "Lalit",
  "Madhuri", "Naveena", "Ojasvi", "Pallavi", "Raghavi", "Shivani", "Trisha", "Urmila",
  "Vedant", "Waseem", "Xena", "Yamini", "Zubin", "Aarav", "Bhumika", "Chirayu",
  "Dimple", "Eshwar", "Fiza", "Gunjan", "Harsh", "Ira", "Jhanvi", "Kavya", "Lokesh",
  "Mansi", "Naman", "Oorja", "Prachi", "Rishabh", "Shruti", "Tarun", "Urvashi",
  "Vansh", "Wamiq", "Yatin", "Zainab", "Akhil", "Bhavesh", "Chhavi", "Dharmesh",
  "Ekta", "Firoz", "Guneet", "Hitesh", "Ishani", "Jasbir", "Komal", "Lakshmi",
  "Mukesh", "Nandini", "Omesh", "Priyanka", "Rajan", "Shilpa", "Tushar", "Umesh",
  "Vandana", "Wasim", "Yogita", "Zahid", "Anmol", "Babita", "Charu", "Darshan",
  "Eshita", "Gopal", "Hina", "Inder", "Juhi", "Kirti", "Lalita", "Mohan", "Nupur",
  "Oshin", "Pramod", "Radha", "Sachin", "Tripti", "Udit", "Vimal", "Wahid",
] as const;

const SURNAMES = [
  "Sherawat", "Jakhar", "Rohilla", "Sharma", "Anmol", "Singh", "Kadyan", "Phogat",
  "Malik", "Sangwan", "Dahiya", "Sheoran", "Kundu", "Rani", "Antil", "Saini", "Hooda",
  "Yadav", "Rana", "Saini", "Chahal", "Gehlot", "Godara", "Nain", "Punia", "Dalal",
  "Balyan", "Birla", "Chautala", "Dabas", "Farman", "Gulia", "Hissar", "Jangra",
  "Kadian", "Lathar", "Mor", "Nandal", "Ohlan", "Pahal", "Rathi", "Sihag", "Tokas",
  "Vats", "Wadhwa", "Bansal", "Chopra", "Dhankhar", "Gill", "Hundal", "Jindal",
  "Kapoor", "Lamba", "Mittal", "Nagpal", "Oberoi", "Puri", "Rastogi", "Sethi",
  "Tandon", "Uppal", "Verma", "Walia", "Ahlawat", "Bhardwaj", "Chauhan", "Dahiya",
  "Grewal", "Hans", "Joon", "Khatri", "Lohan", "Mann", "Nehra", "Pannu", "Rai",
  "Sandhu", "Thakur", "Uppal", "Virk", "Waraich", "Bains", "Cheema", "Dhillon",
  "Goswami", "Hayer", "Jaggi", "Kaler", "Luthra", "Maan", "Nijjar", "Pannu",
  "Randhawa", "Sohal", "Toor", "Uppal", "Vohra", "Waraich", "Bajwa", "Chahal",
  "Duggal", "Garg", "Handa", "Jaggi", "Khanna", "Luthra", "Mehta", "Nanda",
  "Pandey", "Rana", "Saxena", "Tiwari", "Uniyal", "Vashisht", "Wadhawan", "Bisht",
  "Chandel", "Dobhal", "Gairola", "Joshi", "Kandpal", "Lakhera", "Negi", "Pant",
  "Rawat", "Semwal", "Tomer", "Uniyal", "Bahuguna", "Chauhan", "Dangwal", "Gusain",
  "Kandari", "Maithani", "Nautiyal", "Purohit", "Raturi", "Satyal", "Tolia", "Bhatt",
  "Chib", "Dogra", "Gandotra", "Jamwal", "Koul", "Mahajan", "Nehru", "Pandita",
  "Raina", "Sharma", "Tickoo", "Wani", "Bhat", "Chib", "Dar", "Ganai", "Kaul",
  "Lone", "Mir", "Nazir", "Parvez", "Qadri", "Rather", "Shah", "Tramboo", "Wani",
  "Bhat", "Choudhary", "Devi", "Garg", "Hooda", "Jakhar", "Khatkar", "Lakra",
  "Mirdha", "Nehra", "Ola", "Poonia", "Rohilla", "Sangwan", "Tokas", "Yadav",
] as const;

function hashSeed(academyIndex: number, personIndex: number, salt: number): number {
  let h = academyIndex * 374761393 + personIndex * 668265263 + salt * 982451653;
  h = (h ^ (h >>> 16)) * 0x7feb352d;
  h = (h ^ (h >>> 15)) * 0x846ca68b;
  return (h ^ (h >>> 16)) >>> 0;
}

export function pickName(academyIndex: number, personIndex: number, salt = 0): string {
  const h = hashSeed(academyIndex, personIndex, salt);
  const first = FIRST_NAMES[h % FIRST_NAMES.length];
  const last = SURNAMES[(h >>> 8) % SURNAMES.length];
  return `${first} ${last}`;
}

export function pickUniqueNames(
  academyIndex: number,
  count: number,
  saltBase = 0
): string[] {
  const used = new Set<string>();
  const names: string[] = [];
  let salt = saltBase;

  while (names.length < count) {
    const name = pickName(academyIndex, names.length, salt);
    salt += 1;
    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
  }

  return names;
}

export function pickSupportStaffName(academyIndex: number, roleIndex: number): string {
  return pickName(academyIndex, 100 + roleIndex, roleIndex * 17);
}
