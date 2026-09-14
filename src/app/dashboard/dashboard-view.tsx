"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  MapPin, Briefcase, Star, LogOut, Settings, Bell,
  Plus, ArrowRight, Zap, Users, CheckCircle2, Clock,
  ChevronRight, TrendingUp, User, Sparkles,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { signOutUser } from "@/app/actions/auth";

/* ── Types inferred from Prisma include ───────────────────── */
type Job = {
  id: string;
  title: string;
  address: string;
  status: string;
  createdAt: Date;
  category: string;
};

type Application = {
  id: string;
  status: string;
  createdAt: Date;
  job: { title: string; address: string; status: string };
};

type UserWithProfile = {
  id: string;
  email: string;
  role: string;
  workerProfile: {
    name: string;
    bio: string | null;
    skills: string[];
    hourlyRate: number | null;
    rating: number;
    reviewCount: number;
    address: string | null;
    profilePhotoUrl: string | null;
  } | null;
  recruiterProfile: {
    name: string;
    businessName: string | null;
    address: string | null;
    profilePhotoUrl: string | null;
  } | null;
  postedJobs: Job[];
  applications: Application[];
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED:   "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  ACCEPTED:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  DECLINED:  "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  OPEN:      "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  MATCHED:   "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  CLOSED:    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status.toLowerCase()}
    </span>
  );
}

export default function DashboardView({ user }: { user: UserWithProfile }) {
  const router = useRouter();
  const isWorker = user.role === "WORKER";
  const profile = isWorker ? user.workerProfile : user.recruiterProfile;
  const displayName = profile?.name ?? user.email.split("@")[0];
  const location = profile?.address;

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
    router.refresh();
  };

  const profileComplete = isWorker
    ? !!(user.workerProfile?.bio && user.workerProfile?.skills?.length && user.workerProfile?.address)
    : !!(user.recruiterProfile?.address);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 transition-all duration-200">
              <Image src="/logo.png" alt="KamGhar" width={120} height={40} priority className="h-8 w-auto object-contain" />
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* ── Profile incomplete banner ─────────────────── */}
          {!profileComplete && (
            <motion.div variants={fadeUp}>
              <Link href="/onboarding" className="group flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Complete your profile</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">A complete profile gets 3x more responses. Takes 1 minute.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </motion.div>
          )}

          {/* ── Welcome + Profile card ────────────────────── */}
          <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4">
            {/* Profile summary */}
            <div className="sm:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0 shadow-lg shadow-orange-500/20">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{displayName}</h2>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                      {isWorker ? "Worker" : "Recruiter"}{" "}
                      {isWorker && user.workerProfile?.hourlyRate
                        ? `• Rs. ${user.workerProfile.hourlyRate}/hr`
                        : ""}
                      {!isWorker && user.recruiterProfile?.businessName
                        ? `• ${user.recruiterProfile.businessName}`
                        : ""}
                    </p>
                  </div>
                  <Link href="/onboarding" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>

                {location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-orange-500 flex-shrink-0" />{location}, Nepal
                  </p>
                )}

                {isWorker && user.workerProfile?.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{user.workerProfile.bio}</p>
                )}

                {isWorker && (user.workerProfile?.skills?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {user.workerProfile!.skills.slice(0, 5).map((s) => (
                      <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800/50">
                        {s}
                      </span>
                    ))}
                    {(user.workerProfile?.skills.length ?? 0) > 5 && (
                      <span className="text-[10px] text-slate-400 self-center">+{user.workerProfile!.skills.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Stats</p>
              <div className="space-y-4 mt-3">
                {isWorker ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>Rating</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {user.workerProfile?.rating?.toFixed(1) ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                        <span>Applications</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{user.applications.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Accepted</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {user.applications.filter((a) => a.status === "ACCEPTED").length}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                        <span>Jobs Posted</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{user.postedJobs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>Open Jobs</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {user.postedJobs.filter((j) => j.status === "OPEN").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Completed</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {user.postedJobs.filter((j) => j.status === "COMPLETED").length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Quick Actions ─────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {isWorker ? (
                <>
                  <QuickAction icon={<Briefcase className="w-5 h-5" />} label="Browse Jobs" href="/jobs" color="orange" />
                  <QuickAction icon={<User className="w-5 h-5" />} label="Edit Profile" href="/onboarding" color="blue" />
                  <QuickAction icon={<TrendingUp className="w-5 h-5" />} label="My Applications" href="#applications" color="emerald" />
                  <QuickAction icon={<Zap className="w-5 h-5" />} label="Boost Profile" href="#boost" color="purple" />
                </>
              ) : (
                <>
                  <QuickAction icon={<Plus className="w-5 h-5" />} label="Post a Job" href="/jobs/new" color="orange" />
                  <QuickAction icon={<Users className="w-5 h-5" />} label="Find Workers" href="/workers" color="blue" />
                  <QuickAction icon={<Briefcase className="w-5 h-5" />} label="My Jobs" href="#jobs" color="emerald" />
                  <QuickAction icon={<Zap className="w-5 h-5" />} label="Boost a Job" href="#boost" color="purple" />
                </>
              )}
            </div>
          </motion.div>

          {/* ── Main content list ─────────────────────────── */}
          {isWorker ? (
            <motion.div variants={fadeUp} id="applications">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Applications</h3>
                <Link href="/jobs" className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
                  Browse jobs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {user.applications.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
                  title="No applications yet"
                  description="Browse available jobs near you and start applying."
                  action={{ label: "Browse Jobs", href: "/jobs" }}
                />
              ) : (
                <div className="space-y-3">
                  {user.applications.map((app) => (
                    <motion.div
                      key={app.id}
                      whileHover={{ x: 2 }}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center gap-4"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{app.job.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{app.job.address}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} id="jobs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Posted Jobs</h3>
                <Link href="/jobs/new" className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Post new
                </Link>
              </div>

              {user.postedJobs.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
                  title="No jobs posted yet"
                  description="Post your first job and get matched with nearby workers."
                  action={{ label: "Post a Job", href: "/jobs/new" }}
                />
              ) : (
                <div className="space-y-3">
                  {user.postedJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      whileHover={{ x: 2 }}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center gap-4"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{job.address}
                          <span className="mx-1">·</span>
                          <Clock className="w-3 h-3" />
                          {new Date(job.createdAt).toLocaleDateString("en-NP", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </motion.div>
      </main>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */
function QuickAction({ icon, label, href, color }: {
  icon: React.ReactNode; label: string; href: string;
  color: "orange" | "blue" | "emerald" | "purple";
}) {
  const colors = {
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/50",
    blue:   "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-950/50",
    emerald:"bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-950/50",
  };
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center font-semibold text-xs transition-colors ${colors[color]}`}>
      {icon}
      {label}
    </Link>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-dashed p-10 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">{description}</p>
      <Link
        href={action.href}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors"
      >
        {action.label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}