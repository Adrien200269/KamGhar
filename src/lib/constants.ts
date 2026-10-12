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

/* ── Worker Tier System (Bronze, Silver, Gold, Pro) ────────── */
export type WorkerTier = {
  tier: "PRO" | "GOLD" | "SILVER" | "BRONZE";
  label: string;
  labelNe: string;
  badgeClass: string;
  iconColor: string;
  minJobs: number;
  minRating: number;
  nextTier?: {
    name: string;
    jobsRemaining: number;
    targetRating: number;
  };
};

export function getWorkerTier(completedJobs: number, rating: number): WorkerTier {
  if (completedJobs >= 10 && rating >= 4.8) {
    return {
      tier: "PRO",
      label: "KamGhar Pro",
      labelNe: "कामघर प्रो",
      badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800/70",
      iconColor: "text-purple-600 dark:text-purple-400",
      minJobs: 10,
      minRating: 4.8,
    };
  }
  if (completedJobs >= 5 && rating >= 4.5) {
    return {
      tier: "GOLD",
      label: "Gold Tier",
      labelNe: "गोल्ड टियर",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800/70",
      iconColor: "text-amber-600 dark:text-amber-400",
      minJobs: 5,
      minRating: 4.5,
      nextTier: {
        name: "KamGhar Pro",
        jobsRemaining: Math.max(0, 10 - completedJobs),
        targetRating: 4.8,
      },
    };
  }
  if (completedJobs >= 2 && rating >= 4.0) {
    return {
      tier: "SILVER",
      label: "Silver Tier",
      labelNe: "सिल्भर टियर",
      badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
      iconColor: "text-slate-500 dark:text-slate-400",
      minJobs: 2,
      minRating: 4.0,
      nextTier: {
        name: "Gold Tier",
        jobsRemaining: Math.max(0, 5 - completedJobs),
        targetRating: 4.5,
      },
    };
  }
  return {
    tier: "BRONZE",
    label: "Bronze Tier",
    labelNe: "कांस्य टियर",
    badgeClass: "bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800/50",
    iconColor: "text-orange-600 dark:text-orange-400",
    minJobs: 0,
    minRating: 0,
    nextTier: {
      name: "Silver Tier",
      jobsRemaining: Math.max(0, 2 - completedJobs),
      targetRating: 4.0,
    },
  };
}

/* ── Role-Specific Quick Chat Templates (Recruiter vs Worker) ─ */
export type QuickChatTemplate = {
  category: string;
  categoryNe: string;
  nepali: string;
  english: string;
};

export const RECRUITER_QUICK_TEMPLATES: QuickChatTemplate[] = [
  {
    category: "Timing & Availability",
    categoryNe: "समय र उपलब्धता",
    nepali: "नमस्ते! के तपाईं आज यो कामको लागि उपलब्ध हुनुहुन्छ?",
    english: "Namaste! Are you available for this job today?",
  },
  {
    category: "Timing & Availability",
    categoryNe: "समय र उपलब्धता",
    nepali: "तपाईं कति बजे सम्म हाम्रो लोकेसनमा आइपुग्न सक्नुहुन्छ?",
    english: "What time can you arrive at our location?",
  },
  {
    category: "Location",
    categoryNe: "ठेगाना र लोकेसन",
    nepali: "मैले ठ्याक्कै ठेगाना र गुगल म्याप लोकेसन पठाएको छु, हेर्नुहोला।",
    english: "I have shared the exact address and location on map, please check.",
  },
  {
    category: "Location",
    categoryNe: "ठेगाना र लोकेसन",
    nepali: "घर पत्ता लगाउन कुनै समस्या भए मलाई सिधै फोन गर्नुहोला।",
    english: "Please call me directly if you have any trouble finding the place.",
  },
  {
    category: "Tools & Materials",
    categoryNe: "औजार र सामान",
    nepali: "कृपया कामको लागि आवश्यक सबै औजार र सामान साथमा ल्याउनुहोस्।",
    english: "Please bring all necessary tools and equipment for the job.",
  },
  {
    category: "Tools & Materials",
    categoryNe: "औजार र सामान",
    nepali: "के यो कामको लागि कुनै पार्टपुर्जा वा सामान बजारबाट किन्नुपर्छ?",
    english: "Do we need to buy any replacement parts or materials from the hardware store?",
  },
  {
    category: "Rates & Payment",
    categoryNe: "दर र भुक्तानी",
    nepali: "काम हेरेर अन्तिम दर/खर्च अनुमान कति हुन्छ भनिदिनुहोस्।",
    english: "Please give an estimated cost after inspecting the work.",
  },
  {
    category: "Rates & Payment",
    categoryNe: "दर र भुक्तानी",
    nepali: "हाम्रो बजेट रु. [बजेट] सम्मको हो, के यो तपाईंलाई मान्य छ?",
    english: "Our budget is around Rs. [budget], does this work for you?",
  },
  {
    category: "Completion",
    categoryNe: "काम सम्पन्न",
    nepali: "काम राम्रोसँग सम्पन्न भयो, धेरै धन्यवाद! मैले भुक्तानी गरिदिएँ।",
    english: "The work is well done, thank you! I have made the payment.",
  },
];

export const WORKER_QUICK_TEMPLATES: QuickChatTemplate[] = [
  {
    category: "ETA & Arrival",
    categoryNe: "आगमन र बाटो",
    nepali: "म बाटोमा छु, १०-१५ मिनेट भित्र आइपुग्छु।",
    english: "I am on the way, will arrive within 10-15 minutes.",
  },
  {
    category: "ETA & Arrival",
    categoryNe: "आगमन र बाटो",
    nepali: "म तपाईंको ठेगाना/लोकेसनमा आइपुगें, बाहिर आउन सक्नुहुन्छ?",
    english: "I have arrived at your location, could you please come outside?",
  },
  {
    category: "Details & Photos",
    categoryNe: "विवरण र फोटो",
    nepali: "नमस्ते! समस्या भएको भाग वा कामको फोटो/भिडियो पठाउनुहोस् न।",
    english: "Namaste! Could you please send a photo or video of the issue?",
  },
  {
    category: "Details & Photos",
    categoryNe: "विवरण र फोटो",
    nepali: "यो कामका लागि केही सामान/पार्ट्स हार्डवेयरबाट किन्नुपर्ने हुन्छ।",
    english: "Some replacement parts/materials will need to be purchased for this work.",
  },
  {
    category: "Rates & Inspection",
    categoryNe: "दर र समय",
    nepali: "म आइपुगेर प्रत्यक्ष काम हेरेपछि दर र समय निश्चित गरौंला, हुन्छ?",
    english: "Let's inspect the work in person and confirm the rate and timing, okay?",
  },
  {
    category: "Rates & Inspection",
    categoryNe: "दर र समय",
    nepali: "मेरो प्रति घण्टा दर रु. [दर] हो, थप सामानको खर्च छुट्टै लाग्नेछ।",
    english: "My hourly rate is Rs. [rate], material costs will be separate.",
  },
  {
    category: "Done & Review",
    categoryNe: "काम सम्पन्न र समीक्षा",
    nepali: "मैले काम सकिसकें, कृपया चेक गरेर भुक्तानी गरिदिनुहोला।",
    english: "I have finished the work, please inspect and proceed with payment.",
  },
  {
    category: "Done & Review",
    categoryNe: "काम सम्पन्न र समीक्षा",
    nepali: "काम सफलतापूर्वक सम्पन्न भयो! कृपया कामघरमा ५-तारे समीक्षा दिनुहोला।",
    english: "Task completed successfully! Please leave a 5-star review on KamGhar.",
  },
];

/* ── Fallback Common Templates ──────────────────────────────── */
export const QUICK_TEMPLATES = [
  ...RECRUITER_QUICK_TEMPLATES.slice(0, 3),
  ...WORKER_QUICK_TEMPLATES.slice(0, 3),
];