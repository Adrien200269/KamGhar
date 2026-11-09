/**
 * KamGhar Market Rate Estimator Data (कति पर्ला? Rate Guide)
 * Standard market price benchmarks for informal gig work across Nepal.
 */

export type ServiceTask = {
  id: string;
  nameEn: string;
  nameNe: string;
  baseMin: number;
  baseMax: number;
  unitEn: string;
  unitNe: string;
  estimatedHours: string;
  materialsNoteEn: string;
  materialsNoteNe: string;
};

export type CategoryRateData = {
  category: string;
  categoryNe: string;
  iconName: string;
  descriptionEn: string;
  descriptionNe: string;
  tasks: ServiceTask[];
};

export const NEPAL_RATE_CATEGORIES: CategoryRateData[] = [
  {
    category: "Electrician",
    categoryNe: "इलेक्ट्रीसियन",
    iconName: "Zap",
    descriptionEn: "Wiring, circuit breakers, fan mounting, and short-circuit troubleshooting.",
    descriptionNe: "वायरिङ, MCB परिवर्तन, पंखा जडान र सर्ट सर्किट मर्मत।",
    tasks: [
      {
        id: "el-point",
        nameEn: "Light / Switch Point Wiring (per point)",
        nameNe: "बत्ती / स्विच पोइन्ट वायरिङ (प्रति पोइन्ट)",
        baseMin: 180,
        baseMax: 260,
        unitEn: "per point",
        unitNe: "प्रति पोइन्ट",
        estimatedHours: "0.5 – 1 hr",
        materialsNoteEn: "Wires & switch boards supplied by client",
        materialsNoteNe: "तार तथा स्विच बोर्ड ग्राहकले उपलब्ध गराउनुपर्ने",
      },
      {
        id: "el-mcb",
        nameEn: "MCB / Distribution Board Installation",
        nameNe: "MCB / मुख्य बोर्ड जडान तथा मर्मत",
        baseMin: 600,
        baseMax: 1000,
        unitEn: "per board",
        unitNe: "प्रति बोर्ड",
        estimatedHours: "1 – 2 hrs",
        materialsNoteEn: "MCB switches excluded",
        materialsNoteNe: "MCB स्विचको मूल्य बाहेक",
      },
      {
        id: "el-fan",
        nameEn: "Ceiling Fan Repair & Mounting",
        nameNe: "सिलिङ पंखा मर्मत तथा जडान",
        baseMin: 350,
        baseMax: 550,
        unitEn: "per fan",
        unitNe: "प्रति पंखा",
        estimatedHours: "45 mins",
        materialsNoteEn: "Capacitor / bearings extra if needed",
        materialsNoteNe: "क्यापासिटर आवश्यक परेमा थप लाग्ने",
      },
      {
        id: "el-inverter",
        nameEn: "Inverter & Battery Backup Connection",
        nameNe: "इन्भर्टर तथा ब्याट्री सेटअप",
        baseMin: 800,
        baseMax: 1400,
        unitEn: "per setup",
        unitNe: "प्रति सेटअप",
        estimatedHours: "1.5 – 2.5 hrs",
        materialsNoteEn: "Cables & lugs included in quote if agreed",
        materialsNoteNe: "केबल तथा ब्याट्री ग्राहकको",
      },
      {
        id: "el-trouble",
        nameEn: "Emergency Short-Circuit Diagnosis",
        nameNe: "सर्ट सर्किट तथा लाइन समस्या पत्ता लगाउने",
        baseMin: 500,
        baseMax: 900,
        unitEn: "per callout",
        unitNe: "प्रति कल",
        estimatedHours: "1 – 2 hrs",
        materialsNoteEn: "Diagnosis fee; parts charged separately",
        materialsNoteNe: "समस्या पत्ता लगाउने शुल्क",
      },
    ],
  },
  {
    category: "Plumbing",
    categoryNe: "प्लम्बिङ",
    iconName: "Wrench",
    descriptionEn: "Pipe leaks, commode installations, tap repair, and water tank cleaning.",
    descriptionNe: "पाइप लिक, कमोड जडान, धारा मर्मत र पानी ट्याङ्की सफाइ।",
    tasks: [
      {
        id: "pl-tap",
        nameEn: "Tap / Faucet Replacement & Leak Fix",
        nameNe: "धारा / कक मर्मत तथा नयाँ जडान",
        baseMin: 300,
        baseMax: 500,
        unitEn: "per tap",
        unitNe: "प्रति धारा",
        estimatedHours: "30 – 45 mins",
        materialsNoteEn: "Tap and teflon tape excluded",
        materialsNoteNe: "धारा र टेफ्लन टेप ग्राहकको",
      },
      {
        id: "pl-commode",
        nameEn: "Commode / Toilet Sanitary Fitting",
        nameNe: "कमोड / ट्वाइलेट प्यान जडान",
        baseMin: 1500,
        baseMax: 2500,
        unitEn: "per commode",
        unitNe: "प्रति कमोड",
        estimatedHours: "2 – 3.5 hrs",
        materialsNoteEn: "White cement, wax ring, bolts needed",
        materialsNoteNe: "सिमेन्ट र फिटिङ सामान बाहेक",
      },
      {
        id: "pl-tank",
        nameEn: "Overhead Water Tank Deep Cleaning (500L – 1500L)",
        nameNe: "छतको पानी ट्याङ्की सफाइ (५०० – १५०० लिटर)",
        baseMin: 1000,
        baseMax: 1800,
        unitEn: "per tank",
        unitNe: "प्रति ट्याङ्की",
        estimatedHours: "1.5 – 2.5 hrs",
        materialsNoteEn: "Bleach / detergent supplied by technician",
        materialsNoteNe: "सफाइ केमिकल कामदारले ल्याउने",
      },
      {
        id: "pl-drain",
        nameEn: "Kitchen Sink Drain Unblocking & Trap Fix",
        nameNe: "किचन सिंक तथा ड्रेन ब्लक खुलाउने",
        baseMin: 450,
        baseMax: 800,
        unitEn: "per drain",
        unitNe: "प्रति ड्रेन",
        estimatedHours: "1 hr",
        materialsNoteEn: "Pipe replacement charged if cracked",
        materialsNoteNe: "पाइप फुटेको भए नयाँ आवश्यक",
      },
      {
        id: "pl-motor",
        nameEn: "Submersible / Surface Water Motor Servicing",
        nameNe: "पानी तान्ने मोटर मर्मत तथा जडान",
        baseMin: 700,
        baseMax: 1300,
        unitEn: "per motor",
        unitNe: "प्रति मोटर",
        estimatedHours: "1.5 – 2 hrs",
        materialsNoteEn: "Check valve and piping excluded",
        materialsNoteNe: "भल्भ तथा पाइप सामान बाहेक",
      },
    ],
  },
  {
    category: "Painting & Masonry",
    categoryNe: "पेन्टिङ तथा निर्माण",
    iconName: "Paintbrush",
    descriptionEn: "Interior, exterior wall painting, touch-ups, and plaster repairs.",
    descriptionNe: "भित्ता पेन्टिङ, पुटिङ, प्लास्टर र रंगरोगन।",
    tasks: [
      {
        id: "pa-sqft",
        nameEn: "Interior Painting: Primer + 2 Coats (per sq. ft)",
        nameNe: "भित्री पेन्टिङ: प्राइमर + २ कोट (प्रति वर्गफिट)",
        baseMin: 18,
        baseMax: 28,
        unitEn: "per sq. ft",
        unitNe: "प्रति वर्गफिट",
        estimatedHours: "1 – 3 days",
        materialsNoteEn: "Labor only; paint & primer provided by client",
        materialsNoteNe: "श्रम मात्र; रंग र प्राइमर ग्राहकको",
      },
      {
        id: "pa-room",
        nameEn: "Single Room Complete Repaint (12x12 Room)",
        nameNe: "एउटा कोठा पूरै पेन्टिङ (१२x१२ कोठा)",
        baseMin: 3500,
        baseMax: 5500,
        unitEn: "per room",
        unitNe: "प्रति कोठा",
        estimatedHours: "1.5 days",
        materialsNoteEn: "Surface sanding and 2 coats included",
        materialsNoteNe: "खाक्सी लगाउने र २ कोट रंग",
      },
      {
        id: "pa-door",
        nameEn: "Wooden Door Enamel Polish / Paint",
        nameNe: "काठको ढोका इनमेल / पोलिस",
        baseMin: 600,
        baseMax: 1000,
        unitEn: "per door",
        unitNe: "प्रति ढोका",
        estimatedHours: "2 – 3 hrs",
        materialsNoteEn: "Sandpaper & thinner included",
        materialsNoteNe: "ढोका सफा गरी रंग लगाउने",
      },
    ],
  },
  {
    category: "Home Cleaning",
    categoryNe: "घर सरसफाइ",
    iconName: "Sparkles",
    descriptionEn: "Full house deep cleaning, bathroom sanitization, and sofa shampoo.",
    descriptionNe: "घर पूरै सरसफाइ, बाथरुम सफाइ र सोफा स्याम्पु।",
    tasks: [
      {
        id: "cl-1bhk",
        nameEn: "1BHK Flat Deep Cleaning",
        nameNe: "१BHK फ्ल्याट पूरै डिप क्लिनिङ",
        baseMin: 3500,
        baseMax: 5000,
        unitEn: "per flat",
        unitNe: "प्रति फ्ल्याट",
        estimatedHours: "4 – 6 hrs",
        materialsNoteEn: "Cleaning equipment & chemicals included",
        materialsNoteNe: "सफाइ उपकरण तथा केमिकल सहित",
      },
      {
        id: "cl-2bhk",
        nameEn: "2BHK / 3BHK Flat Deep Cleaning",
        nameNe: "२BHK / ३BHK फ्ल्याट पूर्ण सरसफाइ",
        baseMin: 5500,
        baseMax: 8500,
        unitEn: "per flat",
        unitNe: "प्रति फ्ल्याट",
        estimatedHours: "6 – 8 hrs",
        materialsNoteEn: "Team of 2-3 cleaners with machine",
        materialsNoteNe: "२-३ जना कामदार मेसिनसहित",
      },
      {
        id: "cl-bath",
        nameEn: "Bathroom Acid Wash & Tile Descaling",
        nameNe: "बाथरुम टायल तथा कसिङ्गर विशेष सफाइ",
        baseMin: 800,
        baseMax: 1400,
        unitEn: "per bathroom",
        unitNe: "प्रति बाथरुम",
        estimatedHours: "1.5 – 2 hrs",
        materialsNoteEn: "Tile acid, scrubber, sanitizing spray",
        materialsNoteNe: "टायल क्लिनर सहित",
      },
      {
        id: "cl-sofa",
        nameEn: "5-Seater Sofa Vacuum & Shampoo Clean",
        nameNe: "५ सिटे सोफा भ्याकुम तथा स्याम्पु सफाइ",
        baseMin: 1500,
        baseMax: 2500,
        unitEn: "per sofa set",
        unitNe: "प्रति सोफा सेट",
        estimatedHours: "2 hrs",
        materialsNoteEn: "Wet vacuum extraction included",
        materialsNoteNe: "ड्राई भ्याकुम मेसिन सहित",
      },
    ],
  },
  {
    category: "Appliance Repair",
    categoryNe: "उपकरण मर्मत",
    iconName: "Laptop",
    descriptionEn: "Washing machines, refrigerators, microwave ovens, and AC service.",
    descriptionNe: "वाशिङ मेसिन, फ्रिज, माइक्रोवेभ र एसी मर्मत।",
    tasks: [
      {
        id: "ap-ac",
        nameEn: "Split AC Jet Wash & Gas Pressure Check",
        nameNe: "स्प्लिट एसी जेट वास र ग्यास चेक",
        baseMin: 1200,
        baseMax: 1800,
        unitEn: "per AC",
        unitNe: "प्रति एसी",
        estimatedHours: "1 – 1.5 hrs",
        materialsNoteEn: "Filter wash & indoor/outdoor coil clean",
        materialsNoteNe: "ग्यास थप्नुपरेमा थप शुल्क",
      },
      {
        id: "ap-fridge",
        nameEn: "Refrigerator Gas Refill & Thermostat Check",
        nameNe: "फ्रिज ग्यास रिफिल र चिसो नहुने समस्या",
        baseMin: 1500,
        baseMax: 2500,
        unitEn: "per fridge",
        unitNe: "प्रति फ्रिज",
        estimatedHours: "1.5 hrs",
        materialsNoteEn: "Refrigerant gas included in quote",
        materialsNoteNe: "ग्यास सहित",
      },
      {
        id: "ap-wash",
        nameEn: "Washing Machine Drum / Motor Diagnosis",
        nameNe: "वाशिङ मेसिन ड्रम वा पानी ननिस्कने समस्या",
        baseMin: 700,
        baseMax: 1200,
        unitEn: "per machine",
        unitNe: "प्रति मेसिन",
        estimatedHours: "1 – 2 hrs",
        materialsNoteEn: "Diagnosis & labor; spare parts separate",
        materialsNoteNe: "पार्ट्स आवश्यक परे थप लाग्ने",
      },
    ],
  },
  {
    category: "Carpentry",
    categoryNe: "काष्ठकला तथा फर्निचर",
    iconName: "Briefcase",
    descriptionEn: "Door locks, modular kitchen hinges, and custom woodwork repair.",
    descriptionNe: "ढोकाको लक, कब्जा मर्मत र फर्निचर जडान।",
    tasks: [
      {
        id: "ca-lock",
        nameEn: "Mortise Door Lock Installation",
        nameNe: "ढोकाको लक / हेन्डल जडान",
        baseMin: 450,
        baseMax: 750,
        unitEn: "per lock",
        unitNe: "प्रति लक",
        estimatedHours: "45 mins",
        materialsNoteEn: "Lock set provided by client",
        materialsNoteNe: "लक सेट ग्राहकको",
      },
      {
        id: "ca-hinge",
        nameEn: "Modular Kitchen Cabinet Hinge Alignment",
        nameNe: "किचन क्याबिनेट कब्जा तथा च्यानल मर्मत",
        baseMin: 400,
        baseMax: 700,
        unitEn: "per visit",
        unitNe: "प्रति भिजिट",
        estimatedHours: "1 hr",
        materialsNoteEn: "Soft-close hinges extra if replaced",
        materialsNoteNe: "कब्जा फेर्नुपरेमा थप",
      },
      {
        id: "ca-bed",
        nameEn: "Bed / Wardrobe Assembly & Fitting",
        nameNe: "खाट / दराज एसेम्बली तथा जडान",
        baseMin: 800,
        baseMax: 1500,
        unitEn: "per unit",
        unitNe: "प्रति सामान",
        estimatedHours: "1.5 – 3 hrs",
        materialsNoteEn: "Screws & fixtures included",
        materialsNoteNe: "किला र पेच सहित",
      },
    ],
  },
];

/**
 * Calculate rate estimate with location and urgency multipliers
 */
export function calculateEstimatedRate(params: {
  task: ServiceTask;
  district?: string;
  isUrgent?: boolean;
}): {
  minNpr: number;
  maxNpr: number;
  recommendedNpr: number;
  estimatedHours: string;
} {
  const { task, district = "Kathmandu", isUrgent = false } = params;

  let locationFactor = 1.0;
  const valleyDistricts = ["Kathmandu", "Lalitpur", "Bhaktapur"];
  if (!valleyDistricts.includes(district)) {
    locationFactor = 0.9;
  }

  const urgencyFactor = isUrgent ? 1.3 : 1.0;

  const min = Math.round((task.baseMin * locationFactor * urgencyFactor) / 50) * 50;
  const max = Math.round((task.baseMax * locationFactor * urgencyFactor) / 50) * 50;
  const recommended = Math.round(((min + max) / 2) / 50) * 50;

  return {
    minNpr: min,
    maxNpr: max,
    recommendedNpr: recommended,
    estimatedHours: task.estimatedHours,
  };
}
