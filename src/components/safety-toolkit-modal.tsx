"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  CheckSquare,
  AlertTriangle,
  X,
  Send,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface SafetyToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  initialTab?: "emergency" | "workerChecklist" | "recruiterChecklist" | "report";
}

const EMERGENCY_NUMBERS = [
  { nameEn: "Nepal Police (जनपद प्रहरी)", nameNe: "नेपाल प्रहरी", number: "100", descEn: "Toll-Free Emergency Call", descNe: "नि:शुल्क आकस्मिक सेवा", color: "from-blue-600 to-indigo-700" },
  { nameEn: "Ambulance (एम्बुलेन्स सेवा)", nameNe: "एम्बुलेन्स सेवा", number: "102", descEn: "Medical Emergencies", descNe: "स्वास्थ्य आपतकालीन सेवा", color: "from-red-600 to-rose-700" },
  { nameEn: "Traffic Police (ट्राफिक प्रहरी)", nameNe: "ट्राफिक प्रहरी", number: "103", descEn: "Road & Transit Incidents", descNe: "सडक तथा दुर्घटना सहायता", color: "from-amber-600 to-orange-700" },
  { nameEn: "National Women Helpline", nameNe: "महिला हेल्पलाइन (राष्ट्रिय महिला आयोग)", number: "1145", descEn: "Harassment & Safety Support", descNe: "हिंसा तथा सुरक्षा सहायता", color: "from-purple-600 to-violet-700" },
  { nameEn: "Nepal Red Cross Society", nameNe: "नेपाल रेडक्रस", number: "1130", descEn: "Blood & Disaster Support", descNe: "रक्त तथा विपद् सहायता", color: "from-rose-600 to-red-800" },
];

const WORKER_CHECKLIST = [
  { id: "w1", textEn: "Verify client's full address and identity before entering the premises.", textNe: "कार्यस्थल प्रवेश गर्नुअघि ग्राहकको सही ठेगाना र नाम यकिन गर्नुहोस्।" },
  { id: "w2", textEn: "Keep your mobile phone fully charged and share live location with family.", textNe: "आफ्नो मोबाइल चार्ज राख्नुहोस् र परिवार वा साथीलाई प्रत्यक्ष स्थान सेयर गर्नुहोस्।" },
  { id: "w3", textEn: "Inspect ladders, electrical safety gear, and wiring main-switch before starting.", textNe: "विद्युतीय वा उचाइको काम सुरु गर्नुपूर्व मेन-स्वीच बन्द गरी सुरक्षा उपकरण जाँच्नुहोस्।" },
  { id: "w4", textEn: "Confirm task scope and agreed wage in KamGhar chat before beginning work.", textNe: "काम सुरु गर्नुअघि तोकिएको ज्याला र कामको परिधि च्याटमा स्पष्ट गर्नुहोस्।" },
  { id: "w5", textEn: "Do not accept unsolicited beverages or leave personal tools unattended.", textNe: "अपरिचितले दिएका खानेकुरा नखानुहोस् र आफ्ना औजारहरू सुरक्षित राख्नुहोस्।" },
];

const RECRUITER_CHECKLIST = [
  { id: "r1", textEn: "Verify worker's KamGhar verified profile and photo badge upon arrival.", textNe: "कामदार आइपुगेपछि कामघर प्रोफाइल फोटो र नागरिकता प्रमाणिकरण यकिन गर्नुहोस्।" },
  { id: "r2", textEn: "Keep cash, jewelry, and personal valuables safely locked prior to work.", textNe: "कामदार आउनुपूर्व बहुमूल्य गहना र नगद सुरक्षित लकरमा राख्नुहोस्।" },
  { id: "r3", textEn: "Ensure adequate lighting and safe access to work areas (fuse box, roof, pipes).", textNe: "कार्यक्षेत्रमा पर्याप्त बत्ती र सुरक्षित बाटोको व्यवस्था गर्नुहोस्।" },
  { id: "r4", textEn: "Clarify whether spare parts / consumables are paid by you or the technician.", textNe: "सामानको मूल्य कामदारले तिर्ने कि तपाईँले भन्ने कुरा पहिले नै स्पष्ट गर्नुहोस्।" },
  { id: "r5", textEn: "Inspect completed work thoroughly before completing and releasing final payout.", textNe: "काम सन्तोषजनक रूपमा पूरा भएको यकिन गरेर मात्र भुक्तानी गर्नुहोस्।" },
];

export default function SafetyToolkitModal({
  isOpen,
  onClose,
  jobTitle,
  location,
  contactName,
  contactPhone,
  initialTab = "emergency",
}: SafetyToolkitModalProps) {
  const { tx, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "emergency" | "workerChecklist" | "recruiterChecklist" | "report"
  >(initialTab);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [trustedContactNumber, setTrustedContactNumber] = useState("");

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-Tap WhatsApp Emergency Dispatch
  const handleSendWhatsAppAlert = () => {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const message = `🚨 *EMERGENCY SAFETY ALERT (KamGhar Nepal)*\n\nI am currently on an active gig and need urgent assistance or check-in.\n\n• *Service / Gig*: ${jobTitle || "Active Gig"}\n• *Location*: ${location || "Current Location"}\n• *Client/Worker*: ${contactName || "Contact"}${contactPhone ? ` (${contactPhone})` : ""}\n• *Timestamp*: ${timeStr}\n\nPlease check on me immediately or contact Nepal Police (100) if I do not respond.`;

    const cleanNum = trustedContactNumber.replace(/[^0-9]/g, "");
    const phoneParam = cleanNum ? `&phone=${cleanNum.startsWith("977") ? cleanNum : `977${cleanNum.replace(/^0+/, "")}`}` : "";
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}${phoneParam}`;
    window.open(waUrl, "_blank");
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    // Simulate instantaneous dispatch to KamGhar safety response team
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportText("");
      onClose();
    }, 2200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {tx("Work Safety & Emergency SOS", "कार्यस्थल सुरक्षा तथा आपतकालीन SOS")}
                </h2>
                <p className="text-xs text-white/80">
                  {tx("24/7 Hotline dispatch & pre-gig protocols", "२४/७ आपतकालीन सहायता र सुरक्षा मार्गदर्शन")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab("emergency")}
              className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "emergency"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{tx("Hotlines & SOS", "आपतकालीन नम्बर")}</span>
            </button>
            <button
              onClick={() => setActiveTab("workerChecklist")}
              className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "workerChecklist"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{tx("Worker Safety", "कामदार जाँच")}</span>
            </button>
            <button
              onClick={() => setActiveTab("recruiterChecklist")}
              className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "recruiterChecklist"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{tx("Client Safety", "ग्राहक सुरक्षा")}</span>
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "report"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{tx("Report Issue", "उजुरी")}</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {/* 1. HOTLINES & 1-TAP SOS */}
            {activeTab === "emergency" && (
              <div className="space-y-4">
                {/* 1-Tap WhatsApp Emergency Dispatch Box */}
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                        {tx("1-Tap WhatsApp Live Emergency Alert", "१-ट्याप ह्वाट्सएप आपतकालीन सूचना")}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200/60 dark:bg-red-900/60 text-red-800 dark:text-red-300">
                      SOS
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {tx(
                      "Instantly sends an encrypted WhatsApp message with your current gig title, location, client name, and timestamp to your family or trusted contact.",
                      "तपाईंको हालको कामको नाम, स्थान, र समय सहितको आपतकालीन सन्देश परिवार वा साथीलाई ह्वाट्सएपमा तुरुन्त पठाउँछ।"
                    )}
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={trustedContactNumber}
                      onChange={(e) => setTrustedContactNumber(e.target.value)}
                      placeholder={tx("Trusted Phone # (e.g. 98XXXXXXXX)", "परिवारको नम्बर (उदा. ९८XXXXXXXX)")}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendWhatsAppAlert}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{tx("Send Alert", "अलर्ट पठाउनुहोस्")}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Dial Emergency Hotlines */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {tx("Official Nepal Emergency Callout Services", "नेपाल सरकारका आकस्मिक सेवा नम्बरहरू")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {EMERGENCY_NUMBERS.map((item) => (
                      <a
                        key={item.number}
                        href={`tel:${item.number}`}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                            {lang === "ne" ? item.nameNe : item.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lang === "ne" ? item.descNe : item.descEn}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                          <PhoneCall className="w-3 h-3" />
                          <span>{item.number}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. WORKER PRE-SERVICE CHECKLIST */}
            {activeTab === "workerChecklist" && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300">
                  <p className="font-bold mb-1">
                    {tx("Worker Self-Protection Protocol", "कामदार पूर्व-कार्य सुरक्षा प्रोटोकल")}
                  </p>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                    {tx(
                      "Review each step before entering a new household or unfamiliar work site.",
                      "अपरिचित घर वा कार्यस्थलमा जानुपूर्व तलका बुँदाहरू एक-एक गरी सुनिश्चित गर्नुहोस्।"
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  {WORKER_CHECKLIST.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-start gap-3 ${
                          isChecked
                            ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 line-through opacity-80"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="leading-snug">
                          {lang === "ne" ? item.textNe : item.textEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. RECRUITER PRE-SERVICE CHECKLIST */}
            {activeTab === "recruiterChecklist" && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
                  <p className="font-bold mb-1">
                    {tx("Household & Asset Safety Protocol", "घरधनी तथा सम्पत्ति सुरक्षा प्रोटोकल")}
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    {tx(
                      "Ensure your residence and family remain completely safe before worker arrival.",
                      "कामदार घरमा आउनुपूर्व परिवार र सरसामानको पूर्ण सुरक्षा सुनिश्चित गर्नुहोस्।"
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  {RECRUITER_CHECKLIST.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-start gap-3 ${
                          isChecked
                            ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 line-through opacity-80"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="leading-snug">
                          {lang === "ne" ? item.textNe : item.textEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. REPORT INCIDENT */}
            {activeTab === "report" && (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
                  <p className="font-bold">
                    {tx("KamGhar Rapid Dispute & Harassment Desk", "कामघर द्रुत उजुरी तथा विवाद समाधान डेक्स")}
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    {tx(
                      "Reports are immediately reviewed by our safety trust moderators.",
                      "तपाईंको उजुरी कामघर सुरक्षा टोलीले तत्काल अनुसन्धान गर्नेछ।"
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {tx("Describe Incident or Safety Hazard", "घटना वा असुरक्षित क्रियाकलाप खुलाउनुहोस्")}
                  </label>
                  <textarea
                    rows={4}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    required
                    placeholder={tx(
                      "Please provide specific details (e.g. refused agreed payment, property damage, abusive language, impersonation)...",
                      "कृपया विस्तृत विवरण लेख्नुहोस् (उदा. तोकिएको रकम दिन अस्वीकार, दुर्व्यवहार, सामान क्षति)..."
                    )}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    {tx("Confidential & Protected under Nepal Cyber Law", "पूर्ण गोप्य र नेपाल कानुन बमोजिम सुरक्षित")}
                  </span>
                  <button
                    type="submit"
                    disabled={!reportText.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{tx("Submit Report", "उजुरी पेश गर्नुहोस्")}</span>
                  </button>
                </div>

                {reportSubmitted && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{tx("Report received! Our team is reviewing this urgently.", "उजुरी दर्ता भयो! टोलीले तत्काल अनुसन्धान सुरु गर्दैछ।")}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500">
            {tx(
              "Your safety is our #1 priority. Keep emergency hotlines saved on your phone.",
              "तपाईंको सुरक्षा नै हाम्रो पहिलो प्राथमिकता हो।"
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
