"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Wrench,
  Paintbrush,
  Sparkles,
  Laptop,
  Briefcase,
  Search,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Clock,
  Info,
  CheckCircle2,
  TrendingUp,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import AppHeader from "@/components/app-header";
import { useLanguage } from "@/components/language-provider";
import {
  NEPAL_RATE_CATEGORIES,
  calculateEstimatedRate,
  type ServiceTask,
} from "@/lib/rate-data";

const ICON_MAP: Record<string, any> = {
  Zap,
  Wrench,
  Paintbrush,
  Sparkles,
  Laptop,
  Briefcase,
};

export default function RateGuideView() {
  const { tx, lang } = useLanguage();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    NEPAL_RATE_CATEGORIES[0].category
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [districtType, setDistrictType] = useState<"valley" | "other">("valley");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [taskQuantities, setTaskQuantities] = useState<Record<string, number>>({});

  const activeCategoryData = useMemo(() => {
    return (
      NEPAL_RATE_CATEGORIES.find((c) => c.category === selectedCategory) ||
      NEPAL_RATE_CATEGORIES[0]
    );
  }, [selectedCategory]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeCategoryData.tasks;
    }
    const q = searchQuery.toLowerCase().trim();
    // Search across all categories if query is provided
    const allMatching: { task: ServiceTask; categoryName: string }[] = [];
    NEPAL_RATE_CATEGORIES.forEach((cat) => {
      cat.tasks.forEach((t) => {
        if (
          t.nameEn.toLowerCase().includes(q) ||
          t.nameNe.toLowerCase().includes(q) ||
          t.materialsNoteEn.toLowerCase().includes(q) ||
          t.materialsNoteNe.toLowerCase().includes(q) ||
          cat.category.toLowerCase().includes(q) ||
          cat.categoryNe.toLowerCase().includes(q)
        ) {
          allMatching.push({ task: t, categoryName: cat.category });
        }
      });
    });
    return allMatching.map((item) => item.task);
  }, [searchQuery, activeCategoryData]);

  const handleQuantityChange = (taskId: string, delta: number) => {
    setTaskQuantities((prev) => {
      const current = prev[taskId] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [taskId]: updated };
    });
  };

  const handlePostWithBudget = (task: ServiceTask, totalBudget: number) => {
    const params = new URLSearchParams({
      category: selectedCategory,
      budget: totalBudget.toString(),
      title: `${task.nameEn} service`,
    });
    router.push(`/jobs/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <AppHeader badgeText="कति पर्ला? Rate Guide" badgeTextNe="कति पर्ला? दर निर्देशिका" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent pt-12 pb-8 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-bold tracking-wide">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            {tx(
              "Nepal Market Price Benchmarks • २०२६",
              "नेपाल बजार मूल्य निर्देशिका • २०८२"
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {tx("कति पर्ला?", "कति पर्ला?")}{" "}
            <span className="text-orange-600 dark:text-orange-500 font-extrabold">
              {tx("Market Rate Estimator", "नेपाली निष्पक्ष दर क्याल्कुलेटर")}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {tx(
              "Standard benchmark labor and service rates across Kathmandu Valley and Nepal. Avoid being overcharged and ensure fair wages for informal workers.",
              "काठमाडौं उपत्यका र नेपालभरका प्राविधिक तथा श्रम दरहरूको मानक गाइड। न धेरै तिर्नुहोस्, न कामदारको श्रम अवमूल्यन गर्नुहोस्।"
            )}
          </p>

          {/* Quick Search */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={tx(
                  "Search any service (e.g. tap leak, AC jet wash, fan, switch)...",
                  "कुनै पनि सेवा खोज्नुहोस् (जस्तै: धारा मर्मत, एसी, पंखा, बत्ती)..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Controls Bar: Multipliers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {tx("Target Location", "स्थान छनोट")}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {tx("Rates vary slightly outside valley", "उपत्यका बाहिर दर केही फरक हुन सक्छ")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDistrictType("valley")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  districtType === "valley"
                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tx("Kathmandu Valley", "काठमाडौं उपत्यका")}
              </button>
              <button
                onClick={() => setDistrictType("other")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  districtType === "other"
                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tx("Outside Valley (-10%)", "उपत्यका बाहिर (-१०%)")}
              </button>
            </div>

            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isUrgent
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>⚡</span>
              <span>{tx("Emergency / Same-Day (+30%)", "आपतकालीन / आजै सेवा (+३०%)")}</span>
            </button>
          </div>
        </div>

        {/* Category Pills (Visible when not actively searching across everything) */}
        {!searchQuery && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {NEPAL_RATE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.category;
              const IconComp = ICON_MAP[cat.iconName] || Wrench;
              return (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-slate-700"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{lang === "ne" ? cat.categoryNe : cat.category}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {cat.tasks.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Category Header info */}
        {!searchQuery && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === "ne" ? activeCategoryData.categoryNe : activeCategoryData.category}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === "ne"
                  ? activeCategoryData.descriptionNe
                  : activeCategoryData.descriptionEn}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                {tx("Base Benchmark", "मानक दर")}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {tx("Labor Verified", "प्रमाणित ज्याला दर")}
              </span>
            </div>
          </div>
        )}

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {tx("No services matched your search", "कुनै सेवा फेला परेन")}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {tx(
                  "Try searching for another keyword or browse our trade categories directly.",
                  "अन्य शब्द खोज्नुहोस् वा माथिका विधामध्ये कुनै एक छान्नुहोस्।"
                )}
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors"
              >
                {tx("Show All Categories", "सबै क्याटलग हेर्नुहोस्")}
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const qty = taskQuantities[task.id] || 1;
              const estimate = calculateEstimatedRate({
                task,
                district: districtType === "valley" ? "Kathmandu" : "Outside",
                isUrgent,
              });

              const totalMin = estimate.minNpr * qty;
              const totalMax = estimate.maxNpr * qty;
              const totalRecommended = estimate.recommendedNpr * qty;

              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {lang === "ne" ? task.nameNe : task.nameEn}
                        </h3>
                        <div className="text-xs text-slate-400 font-medium">
                          {lang === "ne" ? task.nameEn : task.nameNe}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                        {lang === "ne" ? task.unitNe : task.unitEn}
                      </span>
                    </div>

                    {/* Rate Display */}
                    <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                          {tx("Estimated Fair Range", "अनुमानित निष्पक्ष दर")}
                        </span>
                        <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                          रू {totalMin.toLocaleString()} – {totalMax.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
                          {tx("Recommended", "सिफारिश बजेट")}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          रू {totalRecommended.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{estimate.estimatedHours}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {lang === "ne" ? task.materialsNoteNe : task.materialsNoteEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & CTA Row */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                    {/* Quantity counter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {tx("Qty:", "संख्या:")}
                      </span>
                      <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(task.id, -1)}
                          disabled={qty <= 1}
                          className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-900 dark:text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(task.id, 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Post with this budget button */}
                    <button
                      type="button"
                      onClick={() => handlePostWithBudget(task, totalRecommended)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <span>{tx("Post with this Budget", "यो बजेटमा पोस्ट गर्नुहोस्")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fair Wage & Transparency Principles */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg sm:text-xl font-bold">
              {tx(
                "KamGhar Fair Wage Guarantee & Guidelines",
                "कामघर निष्पक्ष ज्याला तथा सुरक्षा मार्गदर्शन"
              )}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {tx("No Hidden Middleman Cuts", "कुनै बिचौलिया कटौती छैन")}
              </div>
              <p className="text-slate-400 text-xs">
                {tx(
                  "100% of the agreed wage goes directly to the informal technician or laborer upon task completion.",
                  "कामदारले कमाएको सम्पूर्ण रकम सीधै कामदारको हातमा पुग्छ। कामघरले कामदारबाट कुनै कमिसन काट्दैन।"
                )}
              </p>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {tx("Materials Clarification", "सामानको स्पष्टता")}
              </div>
              <p className="text-slate-400 text-xs">
                {tx(
                  "Rates shown above represent labor charges. Always clarify whether spare parts or materials are provided by you before starting.",
                  "माथिका दरहरू श्रम शुल्क हुन्। सामान ग्राहकले दिने वा कामदारले ल्याउने भन्ने कुरा काम सुरु हुनु अगावै स्पष्ट गर्नुहोस्।"
                )}
              </p>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {tx("Emergency Transparency", "आपतकालीन स्पष्टता")}
              </div>
              <p className="text-slate-400 text-xs">
                {tx(
                  "Immediate night-time or emergency call-outs reasonably carry a 20-30% premium due to rapid transit and urgent response.",
                  "रातिको समय वा आकस्मिक मर्मतमा कामदार तत्काल पुग्नुपर्ने हुँदा सामान्य भन्दा २०-३०% सम्म अतिरिक्त शुल्क स्वाभाविक हुन्छ।"
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
