/* ── Nepal districts ──────────────────────────────────────── */
export const NEPAL_DISTRICTS = [
  "Kathmandu","Lalitpur","Bhaktapur","Pokhara","Chitwan",
  "Butwal","Nepalgunj","Dhangadhi","Biratnagar","Birgunj",
  "Hetauda","Janakpur","Dharan","Itahari","Bharatpur",
  "Gorkha","Baglung","Palpa","Dang","Surkhet",
  "Dolakha","Sindhupalchok","Kavre","Nuwakot","Rasuwa",
  "Makwanpur","Parsa","Bara","Rautahat","Sarlahi",
  "Mahottari","Dhanusha","Siraha","Udayapur","Morang",
  "Sunsari","Jhapa","Ilam","Taplejung","Panchthar",
  "Terhathum","Sankhuwasabha","Bhojpur","Solukhumbu","Okhaldhunga",
  "Khotang","Ramechhap","Sindhuli","Darchula","Bajhang",
  "Bajura","Humla","Mugu","Kalikot","Jumla","Dolpa","Mustang","Manang"
];

/* ── Skill categories ─────────────────────────────────────── */
export const SKILL_CATEGORIES = [
  { group: "Trades", skills: ["Electrician","Plumbing","Carpentry","Welding","Masonry","Painting","Tiling"] },
  { group: "Domestic", skills: ["Home Cleaning","Cooking","Laundry","Gardening","Babysitting","Elderly Care"] },
  { group: "Delivery & Moving", skills: ["Motorcycle Delivery","Van Delivery","House Moving","Logistics"] },
  { group: "Digital & Creative", skills: ["Graphic Design","Web Development","Video Editing","Photography","Data Entry","Social Media"] },
  { group: "Education", skills: ["Tutoring","Music Lessons","Spoken English","Math & Science","Arts & Crafts"] },
  { group: "Beauty & Wellness", skills: ["Hair Cutting","Makeup","Spa & Massage","Fitness Training"] },
  { group: "Repair & Maintenance", skills: ["Appliance Repair","AC Service","Vehicle Repair","Mobile Repair","Computer Repair"] },
];

/* ── District approximate coordinates for Nepal ───────────── */
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Kathmandu: { lat: 27.7172, lng: 85.324 },
  Lalitpur: { lat: 27.6644, lng: 85.3188 },
  Bhaktapur: { lat: 27.671, lng: 85.4298 },
  Pokhara: { lat: 28.2096, lng: 83.9856 },
  Chitwan: { lat: 27.5291, lng: 84.3542 },
  Bharatpur: { lat: 27.6833, lng: 84.4333 },
  Butwal: { lat: 27.7006, lng: 83.4484 },
  Biratnagar: { lat: 26.4525, lng: 87.2718 },
  Birgunj: { lat: 27.0104, lng: 84.8774 },
  Dharan: { lat: 26.8124, lng: 87.2834 },
  Hetauda: { lat: 27.4285, lng: 85.0309 },
  Nepalgunj: { lat: 28.05, lng: 81.6167 },
  Dhangadhi: { lat: 28.6944, lng: 80.5986 },
  Janakpur: { lat: 26.7288, lng: 85.9244 },
  Itahari: { lat: 26.6667, lng: 87.2833 },
  Gorkha: { lat: 28.0, lng: 84.6333 },
  Palpa: { lat: 27.8667, lng: 83.55 },
  Dang: { lat: 28.0333, lng: 82.3 },
  Surkhet: { lat: 28.6, lng: 81.6333 },
  Jhapa: { lat: 26.6333, lng: 87.9833 },
  Ilam: { lat: 26.9167, lng: 87.9333 },
  Kavre: { lat: 27.6167, lng: 85.55 },
};

export function getDistrictCoordinates(district: string) {
  return DISTRICT_COORDINATES[district] ?? { lat: 27.7172, lng: 85.324 };
}