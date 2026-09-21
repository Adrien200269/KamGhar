"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  X,
  Loader2,
  Users,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { getPublicWorkers } from "@/app/actions/profile";
import { NEPAL_DISTRICTS } from "@/lib/constants";

const POPULAR_SKILLS = [
  "ALL",
  "Electrician",
  "Plumbing",
  "Painting",
  "Carpentry",
  "Home Cleaning",
  "Appliance Repair",
  "Tutoring",
  "Motorcycle Delivery",
  "Graphic Design",
  "Web Development",
];

type WorkerItem = {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  skills: string[];
  hourlyRate: number | null;
  rating: number;
  reviewCount: number;
  address: string | null;
  profilePhotoUrl: string | null;
  isFeatured: boolean;
  user: {
    email: string;
    phone: string | null;
  };
};

export default function WorkersFeed({
  initialWorkers,
}: {
  initialWorkers: WorkerItem[];
}) {
  const [workers, setWorkers] = useState<WorkerItem[]>(initialWorkers);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");

  const [selectedWorkerForContact, setSelectedWorkerForContact] = useState<WorkerItem | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (
    newSearch = search,
    newSkill = selectedSkill,
    newDist = selectedDistrict
  ) => {
    startTransition(async () => {
      const updated = await getPublicWorkers({
        search: newSearch,
        skill: newSkill,
        district: newDist,
      });
      setWorkers(updated as unknown as WorkerItem[]);
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedSkill("ALL");
    setSelectedDistrict("ALL");
    handleFilterChange("", "ALL", "ALL");
  };

  const hasActiveFilters =
    search.trim() !== "" || selectedSkill !== "ALL" || selectedDistrict !== "ALL";

  return (
    <div className="space-y-8">
      {/* ── Search & Filter Panel ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Verified Local Talent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Find Skilled Workers & Technicians
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified technicians, trade experts, and freelance professionals available for direct hire across Nepal.
          </p>
        </div>

        {/* Search Input + District Dropdown */}
        <div className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange(e.target.value);
              }}
              placeholder="Search by worker name, skill, or area (e.g. Electrician, Lalitpur)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                handleFilterChange(search, selectedSkill, e.target.value);
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
            >
              <option value="ALL">All Districts (Nepal)</option>
              {NEPAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Popular Skills Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {POPULAR_SKILLS.map((skill) => {
            const active = selectedSkill === skill;
            return (
              <button
                key={skill}
                onClick={() => {
                  setSelectedSkill(skill);
                  handleFilterChange(search, skill);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {skill === "ALL" ? "All Skills" : skill}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Feed Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-white">{workers.length}</strong> available worker{workers.length === 1 ? "" : "s"}
        </span>
        {isPending && (
          <span className="flex items-center gap-1.5 text-orange-600 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating workers...
          </span>
        )}
      </div>

      {/* ── Workers Cards Grid ─────────────────────────────── */}
      {workers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 border-dashed p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No workers found for this selection
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-6">
            Try searching for a different skill, expanding to all districts, or clearing your search term.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((worker) => {
            const initial = worker.name ? worker.name[0].toUpperCase() : "W";
            return (
              <motion.div
                key={worker.id}
                layout
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-800/80 transition-all"
              >
                <div className="space-y-4">
                  {/* Top Profile Summary */}
                  <div className="flex items-start gap-3.5">
                    {worker.profilePhotoUrl ? (
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.name}
                        className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-md border border-orange-200 dark:border-orange-800/50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20">
                        {initial}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                          {worker.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 whitespace-nowrap">
                          Available
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="truncate">{worker.address ? `${worker.address}, Nepal` : "Nepal"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {worker.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {worker.bio}
                    </p>
                  )}

                  {/* Skills Tags */}
                  {worker.skills && worker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {worker.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60"
                        >
                          {s}
                        </span>
                      ))}
                      {worker.skills.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{worker.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Info & Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <strong>{worker.rating ? worker.rating.toFixed(1) : "5.0"}</strong>
                      <span className="text-slate-400">({worker.reviewCount})</span>
                    </span>

                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {worker.hourlyRate ? `Rs. ${worker.hourlyRate}/hr` : "Rate on Request"}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedWorkerForContact(worker)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Worker</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Contact Worker Modal ────────────────────────────── */}
      <AnimatePresence>
        {selectedWorkerForContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedWorkerForContact.profilePhotoUrl ? (
                    <img
                      src={selectedWorkerForContact.profilePhotoUrl}
                      alt={selectedWorkerForContact.name}
                      className="w-12 h-12 rounded-2xl object-cover shadow-md border border-orange-200 dark:border-orange-800/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                      {selectedWorkerForContact.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedWorkerForContact.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedWorkerForContact.address ? `${selectedWorkerForContact.address}, Nepal` : "Nepal"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkerForContact(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Direct Contact Information
                </p>

                {selectedWorkerForContact.user.phone ? (
                  <a
                    href={`tel:${selectedWorkerForContact.user.phone}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>{selectedWorkerForContact.user.phone}</span>
                    </div>
                    <span className="text-xs font-semibold underline">Call Now</span>
                  </a>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone number not provided yet</span>
                  </div>
                )}

                <a
                  href={`mailto:${selectedWorkerForContact.user.email}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span>{selectedWorkerForContact.user.email}</span>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 underline">Send Email</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedWorkerForContact(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
