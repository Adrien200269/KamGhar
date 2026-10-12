"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Star,
  LogOut,
  Settings,
  Plus,
  ArrowRight,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  Trash2,
  Check,
  X,
  AlertCircle,
  Search,
  Eye,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  Camera,
  KeyRound,
  EyeOff,
  Upload,
  ExternalLink,
  Navigation,
  MessageCircle,
  Copy,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Award,
  Radio,
  Mic,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";
import NotificationDropdown from "@/components/notification-dropdown";
import { useLanguage } from "@/components/language-provider";
import LiveRouteTrackerModal from "@/components/live-route-tracker-modal";
import { VoiceNotePlayer } from "@/components/voice-note";
import UploadcareImageUploader from "@/components/uploadcare-image-uploader";
import { signOutUser } from "@/app/actions/auth";
import { updateJobStatus, deleteJob, updateApplicationStatus } from "@/app/actions/job";
import {
  updateUserProfileSettings,
  changeAccountPassword,
  uploadWorkerCV,
  removeWorkerCV,
  sendPhoneOtp,
  verifyPhoneOtp,
  toggleWorkerAvailability,
  submitKycVerification,
} from "@/app/actions/profile";
import ChatModal from "@/components/chat-modal";
import { getOrCreateConversation } from "@/app/actions/chat";
import { getWorkerTier } from "@/lib/constants";
type JobApplicant = {
  id: string;
  status: string;
  coverNote?: string | null;
  proposedRate?: number | null;
  audioUrl?: string | null;
  createdAt: Date;
  worker: {
    id: string;
    email: string;
    phone: string | null;
    phoneVerified?: boolean;
    workerProfile: {
      name: string;
      bio: string | null;
      skills: string[];
      hourlyRate: number | null;
      rating: number;
      reviewCount: number;
      address: string | null;
      profilePhotoUrl: string | null;
      cvUrl?: string | null;
      kycStatus?: string | null;
      completedJobs?: number;
    } | null;
  };
};

type Job = {
  id: string;
  title: string;
  address: string;
  status: string;
  category: string;
  urgency?: string;
  budget?: number | null;
  audioUrl?: string | null;
  createdAt: Date;
  applications?: JobApplicant[];
};

type Application = {
  id: string;
  status: string;
  createdAt: Date;
  proposedRate?: number | null;
  coverNote?: string | null;
  audioUrl?: string | null;
  job: {
    id: string;
    title: string;
    description?: string | null;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    audioUrl?: string | null;
    status: string;
    budget?: number | null;
    category?: string;
    urgency?: string;
    recruiter?: {
      id: string;
      email: string;
      phone: string | null;
      recruiterProfile: {
        name: string;
        businessName: string | null;
        address: string | null;
        profilePhotoUrl: string | null;
      } | null;
    } | null;
  };
};

type UserWithProfile = {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified?: boolean;
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
    cvUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    isAvailableNow?: boolean;
    kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    kycDocumentType?: "CITIZENSHIP" | "NATIONAL_ID" | "PAN_OR_LICENSE" | null;
    kycDocumentNumber?: string | null;
    kycDocumentUrl?: string | null;
    kycVerifiedAt?: Date | null;
  } | null;
  recruiterProfile: {
    name: string;
    businessName: string | null;
    address: string | null;
    profilePhotoUrl: string | null;
    kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    kycDocumentType?: "CITIZENSHIP" | "NATIONAL_ID" | "PAN_OR_LICENSE" | null;
    kycDocumentNumber?: string | null;
    kycDocumentUrl?: string | null;
    kycVerifiedAt?: Date | null;
  } | null;
  postedJobs: Job[];
  applications: Application[];
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  OPEN: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  MATCHED: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  CLOSED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}

export default function DashboardView({ user }: { user: UserWithProfile }) {
  const { lang, t, tx } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const justPosted = searchParams.get("posted") === "true";
  const broadcastCount = searchParams.get("broadcast");
  const workerPostRestricted = searchParams.get("error") === "worker_post_restricted";

  const [showPostedBanner, setShowPostedBanner] = useState(justPosted);
  const [showRestrictedBanner, setShowRestrictedBanner] = useState(workerPostRestricted);
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  const [jobFilter, setJobFilter] = useState<"ALL" | "OPEN" | "COMPLETED">("ALL");
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Live Route Tracking state
  const [activeLiveRoute, setActiveLiveRoute] = useState<{
    jobTitle: string;
    jobAddress: string;
    jobCoords: { lat: number; lng: number };
    worker: {
      id: string;
      name: string;
      phone?: string | null;
      photoUrl?: string | null;
      coords?: { lat: number; lng: number } | null;
      isVerified?: boolean;
      rating?: number;
      completedJobs?: number;
    };
    onOpenChat?: () => void;
  } | null>(null);

  // Worker Accepted Job Actions (Map & Direct Communication)
  const [expandedAppMapId, setExpandedAppMapId] = useState<string | null>(null);
  const [chatModalApp, setChatModalApp] = useState<Application | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  // In-App Chat Modal state
  const [activeChat, setActiveChat] = useState<{
    conversationId: string;
    recipientName: string;
    recipientRole?: string;
    recipientPhoto?: string | null;
    recipientPhone?: string | null;
    recipientVerified?: boolean;
  } | null>(null);

  const handleOpenChat = async (
    targetUserId: string,
    targetName: string,
    role?: string,
    photo?: string | null,
    phone?: string | null,
    verified?: boolean,
    jobId?: string | null
  ) => {
    try {
      const convoId = await getOrCreateConversation(targetUserId, jobId);
      setActiveChat({
        conversationId: convoId,
        recipientName: targetName,
        recipientRole: role,
        recipientPhoto: photo,
        recipientPhone: phone,
        recipientVerified: verified,
      });
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  // Derived role helpers — used in initial state below
  const isWorker = user.role === "WORKER";
  const profile = isWorker ? user.workerProfile : user.recruiterProfile;
  const displayName = profile?.name ?? user.email.split("@")[0];
  const location = profile?.address;

  // Profile Settings Modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "documents" | "kyc" | "password">("profile");

  // Worker live "Available Now" state
  const [isAvailableNow, setIsAvailableNow] = useState(user.workerProfile?.isAvailableNow ?? false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  // KYC state
  const userKycStatus = (isWorker ? user.workerProfile?.kycStatus : user.recruiterProfile?.kycStatus) ?? "UNVERIFIED";
  const [kycStatus, setKycStatus] = useState<"UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED">(userKycStatus as any);
  const [kycDocType, setKycDocType] = useState<"CITIZENSHIP" | "NATIONAL_ID" | "PAN_OR_LICENSE">(
    (isWorker ? user.workerProfile?.kycDocumentType : user.recruiterProfile?.kycDocumentType) ?? "CITIZENSHIP"
  );
  const [kycDocNumber, setKycDocNumber] = useState(
    (isWorker ? user.workerProfile?.kycDocumentNumber : user.recruiterProfile?.kycDocumentNumber) ?? ""
  );
  const [kycDocUrl, setKycDocUrl] = useState(
    (isWorker ? user.workerProfile?.kycDocumentUrl : user.recruiterProfile?.kycDocumentUrl) ?? ""
  );
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycSuccess, setKycSuccess] = useState<string | null>(null);

  // Phone OTP Verification state
  const [isPhoneVerified, setIsPhoneVerified] = useState(user.phoneVerified ?? false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneOtpSuccess, setPhoneOtpSuccess] = useState<string | null>(null);

  // CV Upload state (for workers)
  const [currentCvUrl, setCurrentCvUrl] = useState<string | null>(user.workerProfile?.cvUrl ?? null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvRemoving, setCvRemoving] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvSuccess, setCvSuccess] = useState<string | null>(null);
  const [settingsPhotoUrl, setSettingsPhotoUrl] = useState(profile?.profilePhotoUrl ?? "");
  const [settingsPhone, setSettingsPhone] = useState<string>(user.phone ?? "");
  const [settingsName, setSettingsName] = useState(profile?.name ?? "");
  const [settingsBio, setSettingsBio] = useState(isWorker ? (user.workerProfile?.bio ?? "") : "");
  const [settingsAddress, setSettingsAddress] = useState(profile?.address ?? "");
  const [settingsHourlyRate, setSettingsHourlyRate] = useState(
    isWorker ? (user.workerProfile?.hourlyRate?.toString() ?? "") : ""
  );
  const [settingsBusinessName, setSettingsBusinessName] = useState(
    !isWorker ? (user.recruiterProfile?.businessName ?? "") : ""
  );
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Handlers for Phone OTP Verification
  const handleSendPhoneOtp = async () => {
    if (!settingsPhone.trim()) {
      setPhoneOtpError("Please enter a valid phone number first.");
      return;
    }
    setPhoneOtpSending(true);
    setPhoneOtpError(null);
    setPhoneOtpSuccess(null);
    try {
      const res = await sendPhoneOtp(settingsPhone.trim());
      if (res.success) {
        setPhoneOtpSent(true);
        setPhoneOtpSuccess("OTP sent via SMS! Please check your phone.");
      } else {
        setPhoneOtpError(res.error || "Failed to send OTP. Please try again.");
      }
    } catch {
      setPhoneOtpError("Failed to dispatch OTP. Please check your connection.");
    } finally {
      setPhoneOtpSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode.trim() || phoneOtpCode.trim().length < 4) {
      setPhoneOtpError("Please enter the 6-digit OTP code received.");
      return;
    }
    setPhoneOtpVerifying(true);
    setPhoneOtpError(null);
    setPhoneOtpSuccess(null);
    try {
      const res = await verifyPhoneOtp(settingsPhone.trim(), phoneOtpCode.trim());
      if (res.success) {
        setIsPhoneVerified(true);
        setPhoneOtpSent(false);
        setPhoneOtpSuccess("Phone number successfully verified!");
        router.refresh();
      } else {
        setPhoneOtpError(res.error || "Invalid OTP code. Please try again.");
      }
    } catch {
      setPhoneOtpError("Verification error. Please retry.");
    } finally {
      setPhoneOtpVerifying(false);
    }
  };

  // Handlers for CV Upload & Removal
  const handleUploadCV = async () => {
    if (!cvFile) {
      setCvError("Please select a PDF file first.");
      return;
    }
    if (cvFile.type !== "application/pdf") {
      setCvError("Only PDF files are allowed.");
      return;
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      setCvError("File size must be less than 5MB.");
      return;
    }

    setCvUploading(true);
    setCvError(null);
    setCvSuccess(null);
    try {
      const fd = new FormData();
      fd.append("cv", cvFile);
      const res = await uploadWorkerCV(fd);
      if (res.success && res.cvUrl) {
        setCurrentCvUrl(res.cvUrl);
        setCvFile(null);
        setCvSuccess("CV uploaded successfully! Clients can now review your resume.");
        router.refresh();
      } else {
        setCvError(res.error || "Upload failed. Please ensure 'cvs' bucket exists in Supabase Storage.");
      }
    } catch {
      setCvError("An error occurred during upload. Please try again.");
    } finally {
      setCvUploading(false);
    }
  };

  const handleRemoveCV = async () => {
    if (!confirm("Are you sure you want to remove your CV?")) return;
    setCvRemoving(true);
    setCvError(null);
    setCvSuccess(null);
    try {
      const res = await removeWorkerCV();
      if (res.success) {
        setCurrentCvUrl(null);
        setCvSuccess("CV removed successfully.");
        router.refresh();
      } else {
        setCvError(res.error || "Failed to remove CV.");
      }
    } catch {
      setCvError("An error occurred while removing CV.");
    } finally {
      setCvRemoving(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
    router.refresh();
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    setUpdatingJobId(jobId);
    try {
      await updateJobStatus(jobId, newStatus);
      router.refresh();
    } finally {
      setUpdatingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    setUpdatingJobId(jobId);
    try {
      await deleteJob(jobId);
      router.refresh();
    } finally {
      setUpdatingJobId(null);
    }
  };

  const handleApplicationStatusChange = async (
    applicationId: string,
    status: "ACCEPTED" | "DECLINED"
  ) => {
    setUpdatingAppId(applicationId);
    try {
      const res = await updateApplicationStatus(applicationId, status);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to update application status");
      }
    } catch {
      alert("An unexpected error occurred while updating the application.");
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleSaveProfileSettings = async () => {
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const payload: Parameters<typeof updateUserProfileSettings>[0] = {
        name: settingsName.trim() || undefined,
        phone: settingsPhone,
        profilePhotoUrl: settingsPhotoUrl,
        address: settingsAddress,
        ...(isWorker
          ? {
              bio: settingsBio,
              hourlyRate: settingsHourlyRate ? parseFloat(settingsHourlyRate) : null,
            }
          : {
              businessName: settingsBusinessName,
            }),
      };
      const res = await updateUserProfileSettings(payload);
      if (res.success) {
        setSettingsSuccess("Profile updated successfully!");
        router.refresh();
      } else {
        setSettingsError(res.error || "Failed to save changes.");
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await changeAccountPassword(newPassword);
      if (res.success) {
        setPasswordSuccess("Password changed successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res.error || "Failed to change password.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      const res = await toggleWorkerAvailability();
      if (res.success && res.isAvailableNow !== undefined) {
        setIsAvailableNow(res.isAvailableNow);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);
    setKycSuccess(null);
    if (!kycDocNumber.trim()) {
      setKycError("Please provide your ID / document number.");
      return;
    }
    setKycSubmitting(true);
    try {
      const res = await submitKycVerification({
        documentType: kycDocType,
        documentNumber: kycDocNumber.trim(),
        documentUrl: kycDocUrl.trim() || null,
      });
      if (res.success) {
        setKycStatus("VERIFIED");
        setKycSuccess("KYC Verified! You now hold the official KamGhar Verified badge.");
        router.refresh();
      } else {
        setKycError(res.error || "Failed to submit KYC verification.");
      }
    } catch {
      setKycError("Something went wrong during submission.");
    } finally {
      setKycSubmitting(false);
    }
  };

  const profileComplete = isWorker
    ? !!(
        user.workerProfile &&
        ((user.workerProfile.skills && user.workerProfile.skills.length > 0) ||
          user.workerProfile.bio) &&
        user.workerProfile.address
      )
    : !!(user.recruiterProfile && (user.recruiterProfile.address || user.recruiterProfile.businessName));

  const filteredJobs = user.postedJobs.filter((job) => {
    if (jobFilter === "OPEN") return job.status === "OPEN";
    if (jobFilter === "COMPLETED") return job.status === "COMPLETED";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 transition-all duration-200">
              <Image src="/logo.png" alt="KamGhar" width={120} height={40} priority className="h-8 w-auto object-contain" />
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isWorker ? (
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{tx("Find Jobs", "काम खोज्नुहोस्")}</span>
              </Link>
            ) : (
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tx("Post a Job", "काम पोस्ट गर्नुहोस्")}</span>
              </Link>
            )}

            <NotificationDropdown onOpenChat={(chat) => setActiveChat(chat)} />
            <ThemeToggle />
            <LanguageToggle />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tx("Sign out", "लग आउट")}</span>
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Recruiter Success Banner when newly posted */}
        <AnimatePresence>
          {showPostedBanner && !isWorker && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {broadcastCount ? "Urgent Job Broadcasted Live! ⚡" : "Job Posted Successfully! 🎉"}
                  </p>
                  <p className="text-xs text-emerald-100">
                    {broadcastCount
                      ? `Successfully broadcasted to ${broadcastCount} verified & nearby technicians within a 5 km radius!`
                      : "Your requirement is live. Skilled workers in your district can now view and apply."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPostedBanner(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Worker Restricted Banner if attempted to access post */}
          {showRestrictedBanner && isWorker && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Worker Account Notice</p>
                  <p className="text-xs text-amber-100">
                    Posting jobs is reserved for recruiter accounts. As a skilled worker, you can search and apply for open gigs below!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRestrictedBanner(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {/* ── Profile incomplete banner ─────────────────── */}
          {!profileComplete && !profileBannerDismissed && (
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Complete your profile</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                    {isWorker
                      ? "Add your skills, hourly rate, and district so recruiters can discover and hire you."
                      : "Add your organization details and location to start hiring workers."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSettingsTab("profile");
                    setShowSettingsModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setProfileBannerDismissed(true)}
                  className="p-1 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors cursor-pointer"
                  title="Dismiss notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Welcome + Profile card ────────────────────── */}
          <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4">
            {/* Profile summary */}
            <div className="sm:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex items-start gap-4 shadow-sm">
              {/* Avatar with photo and camera badge */}
              <div className="relative group flex-shrink-0">
                {profile?.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={displayName}
                    className="w-14 h-14 rounded-2xl object-cover shadow-md border border-orange-200 dark:border-orange-800/50"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-orange-500/20">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => {
                    setSettingsTab("profile");
                    setShowSettingsModal(true);
                  }}
                  className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer"
                  title="Update photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        {displayName}
                      </h2>
                      {isWorker && (() => {
                        const acceptedJobsCount = user.applications.filter((a) => a.status === "ACCEPTED").length;
                        const workerTier = getWorkerTier(acceptedJobsCount, user.workerProfile?.rating || 5.0);
                        return (
                          <>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${workerTier.badgeClass}`}>
                              <Award className={`w-3.5 h-3.5 ${workerTier.iconColor}`} />
                              <span>{lang === "ne" ? workerTier.labelNe : workerTier.label}</span>
                            </span>
                            {workerTier.nextTier && (
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                Next: {workerTier.nextTier.name} ({workerTier.nextTier.jobsRemaining} {workerTier.nextTier.jobsRemaining === 1 ? "job" : "jobs"} to unlock)
                              </span>
                            )}
                          </>
                        );
                      })()}
                      {kycStatus === "VERIFIED" ? (
                        <span
                          title="KamGhar Verified - Citizenship / KYC Confirmed"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Verified</span>
                        </span>
                      ) : kycStatus === "PENDING" ? (
                        <span
                          title="KYC Document Submitted - Verification in progress by operator"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>KYC Under Review</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsTab("kyc");
                            setShowSettingsModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                          <span>Get Verified</span>
                        </button>
                      )}
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                        {isWorker ? "Worker / Service Provider" : "Recruiter / Client"}{" "}
                        {isWorker && user.workerProfile?.hourlyRate
                          ? `• Rs. ${user.workerProfile.hourlyRate}/hr`
                          : ""}
                        {!isWorker && user.recruiterProfile?.businessName
                          ? `• ${user.recruiterProfile.businessName}`
                          : ""}
                      </p>
                      {isWorker && (
                        <button
                          type="button"
                          disabled={togglingAvailability}
                          onClick={handleToggleAvailability}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            isAvailableNow
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAvailableNow ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{isAvailableNow ? "Available Now (Active)" : "Off-Duty"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSettingsTab("profile"); setShowSettingsModal(true); }}
                    title="Account Settings"
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      {location}, Nepal
                    </span>
                  )}
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {user.phone}
                    </span>
                  )}
                </div>

                {isWorker && user.workerProfile?.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {user.workerProfile.bio}
                  </p>
                )}

                {isWorker && (user.workerProfile?.skills?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {user.workerProfile!.skills.slice(0, 6).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-semibold px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800/50"
                      >
                        {s}
                      </span>
                    ))}
                    {(user.workerProfile?.skills.length ?? 0) > 6 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{user.workerProfile!.skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isWorker ? tx("Worker Stats", "कामदार विवरण") : tx("Recruiter Activity", "नियोक्ता गतिविधि")}
              </p>

              {isWorker ? (
                <div className="space-y-4 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      <span>{tx("Applications Sent", "पठाइएका आवेदनहरू")}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user.applications.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{tx("Accepted Gigs", "स्वीकृत कामहरू")}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user.applications.filter((a) => a.status === "ACCEPTED").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>{tx("Rating", "मूल्याङ्कन")}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user.workerProfile?.rating ? user.workerProfile.rating.toFixed(1) : "5.0"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      <span>{tx("Jobs Posted", "पोस्ट गरिएका कामहरू")}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user.postedJobs.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{tx("Open Gigs", "खुला कामहरू")}</span>
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
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Role-Tailored Quick Shortcuts ──────────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {tx("Quick Shortcuts", "द्रुत सर्टकटहरू")}
              </h3>
            </div>

            {isWorker ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickAction
                  icon={<Search className="w-5 h-5" />}
                  label={tx("Find a Job", "काम खोज्नुहोस्")}
                  href="/jobs"
                  color="orange"
                />
                <QuickAction
                  icon={<User className="w-5 h-5" />}
                  label={tx("Profile & Photo", "प्रोफाइल र फोटो")}
                  onClick={() => {
                    setSettingsTab("profile");
                    setShowSettingsModal(true);
                  }}
                  color="blue"
                />
                <QuickAction
                  icon={<Briefcase className="w-5 h-5" />}
                  label={tx("My Applications", "मेरा आवेदनहरू")}
                  href="#applications"
                  color="emerald"
                />
                <QuickAction
                  icon={<KeyRound className="w-5 h-5" />}
                  label={tx("Change Password", "पासवर्ड परिवर्तन")}
                  onClick={() => {
                    setSettingsTab("password");
                    setShowSettingsModal(true);
                  }}
                  color="purple"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickAction
                  icon={<Plus className="w-5 h-5" />}
                  label={tx("Post a Job", "काम पोस्ट गर्नुहोस्")}
                  href="/jobs/new"
                  color="orange"
                />
                <QuickAction
                  icon={<Users className="w-5 h-5" />}
                  label={tx("Find Workers", "कामदार खोज्नुहोस्")}
                  href="/workers"
                  color="blue"
                />
                <QuickAction
                  icon={<User className="w-5 h-5" />}
                  label={tx("Profile & Details", "प्रोफाइल विवरण")}
                  onClick={() => {
                    setSettingsTab("profile");
                    setShowSettingsModal(true);
                  }}
                  color="emerald"
                />
                <QuickAction
                  icon={<KeyRound className="w-5 h-5" />}
                  label={tx("Change Password", "पासवर्ड परिवर्तन")}
                  onClick={() => {
                    setSettingsTab("password");
                    setShowSettingsModal(true);
                  }}
                  color="purple"
                />
              </div>
            )}
          </motion.div>

          {/* ── WORKER VIEW: Discovery & Applications ───────── */}
          {isWorker ? (
            <div className="space-y-6">
              {/* Find Work Banner */}
              <motion.div variants={fadeUp}>
                <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      <span>Ready to take on new work?</span>
                    </h3>
                    <p className="text-xs text-orange-100 max-w-lg leading-relaxed">
                      Clients in Kathmandu and across Nepal are posting daily repair, trade, and freelance gigs. Browse and apply now.
                    </p>
                  </div>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl text-xs font-bold shadow-md hover:bg-orange-50 transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Explore Open Gigs</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Public Profile Visibility Preview */}
              <motion.div variants={fadeUp}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <Eye className="w-4 h-4 text-orange-500" />
                      <span>How Recruiters See Your Post in the Worker Directory</span>
                    </div>
                    <Link
                      href="/workers"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      View All Workers →
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{displayName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Available for Hire
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        {location ? `${location}, Nepal` : "Nepal"}
                        {user.workerProfile?.hourlyRate && (
                          <>
                            <span>•</span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              Rs. {user.workerProfile.hourlyRate}/hr
                            </strong>
                          </>
                        )}
                      </p>
                      {user.workerProfile?.skills && user.workerProfile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {user.workerProfile.skills.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-semibold px-2 py-0.5 bg-orange-100/70 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/onboarding"
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      Edit Listing
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Worker Applications Section */}
              <motion.div variants={fadeUp} id="applications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Your Job Applications
                  </h3>
                  <Link
                    href="/jobs"
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Browse more jobs</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {user.applications.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-dashed p-10 text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">No applications yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-5">
                      Explore open requirements matching your trade skills and send your first application.
                    </p>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Browse Open Gigs</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.applications.map((app) => {
                      const isAccepted = app.status === "ACCEPTED";
                      const recruiter = app.job.recruiter;
                      const recruiterName =
                        recruiter?.recruiterProfile?.name ||
                        recruiter?.email?.split("@")[0] ||
                        "Client";
                      const recruiterBusiness = recruiter?.recruiterProfile?.businessName;
                      const recruiterPhoto = recruiter?.recruiterProfile?.profilePhotoUrl;
                      const recruiterPhone = recruiter?.phone;
                      const recruiterEmail = recruiter?.email;

                      // Map query string
                      const hasCoords =
                        app.job.latitude !== null &&
                        app.job.latitude !== undefined &&
                        app.job.longitude !== null &&
                        app.job.longitude !== undefined &&
                        (app.job.latitude !== 0 || app.job.longitude !== 0);

                      const mapQuery = hasCoords
                        ? `${app.job.latitude},${app.job.longitude}`
                        : encodeURIComponent(`${app.job.address}, Nepal`);

                      const googleDirectionsUrl = hasCoords
                        ? `https://www.google.com/maps/dir/?api=1&destination=${app.job.latitude},${app.job.longitude}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(app.job.address + ", Nepal")}`;

                      const isMapExpanded = expandedAppMapId === app.id;

                      if (!isAccepted) {
                        return (
                          <div
                            key={app.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-xs"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {app.job.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                {app.job.address}
                                {app.job.budget && (
                                  <>
                                    <span>•</span>
                                    <span>Rs. {app.job.budget.toLocaleString()}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <StatusBadge status={app.status} />
                          </div>
                        );
                      }

                      // Accepted Application: Rich Card with Map & Recruiter Communication
                      return (
                        <div
                          key={app.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/40 p-5 space-y-4 shadow-sm"
                        >
                          {/* Top Row: Job Title, Rate & Hired Badge */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wide">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Accepted & Hired</span>
                                </span>
                                {app.job.category && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {app.job.category}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">
                                {app.job.title}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                <span>{app.job.address}, Nepal</span>
                                {app.job.budget && (
                                  <>
                                    <span>•</span>
                                    <strong className="text-emerald-600 dark:text-emerald-400">
                                      Budget: Rs. {app.job.budget.toLocaleString()}
                                    </strong>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Recruiter Communication Card */}
                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {recruiterPhoto ? (
                                <img
                                  src={recruiterPhoto}
                                  alt={recruiterName}
                                  className="w-11 h-11 rounded-xl object-cover border border-orange-200 dark:border-orange-800/50 shadow-xs flex-shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs">
                                  {recruiterName[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {recruiterName}
                                  </span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                                    Client / Recruiter
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {recruiterBusiness ? `${recruiterBusiness} • ` : ""}
                                  {recruiterPhone ? recruiterPhone : recruiterEmail || "Contact via KamGhar"}
                                </p>
                              </div>
                            </div>

                            {/* Communication Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                              {recruiterPhone ? (
                                <>
                                  <a
                                    href={`tel:${recruiterPhone}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Call Client</span>
                                  </a>

                                  {(() => {
                                    const raw = recruiterPhone.replace(/[^0-9]/g, "");
                                    const waNum = raw.startsWith("977") ? raw : raw.length === 10 ? `977${raw}` : null;
                                    if (!waNum) return null;
                                    return (
                                      <a
                                        href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                                          `Namaste ${recruiterName}, this is ${displayName} from KamGhar regarding '${app.job.title}'. I am preparing to start work.`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                                      >
                                        <span>WhatsApp</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    );
                                  })()}
                                </>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLiveRoute({
                                    jobTitle: app.job.title,
                                    jobAddress: app.job.address,
                                    jobCoords: {
                                      lat: app.job.latitude || 27.7172,
                                      lng: app.job.longitude || 85.324,
                                    },
                                    worker: {
                                      id: user.id,
                                      name: displayName,
                                      phone: user.phone,
                                      photoUrl: user.workerProfile?.profilePhotoUrl,
                                      coords: user.workerProfile?.latitude && user.workerProfile?.longitude ? { lat: user.workerProfile.latitude, lng: user.workerProfile.longitude } : null,
                                      isVerified: kycStatus === "VERIFIED",
                                      rating: user.workerProfile?.rating,
                                      completedJobs: user.applications.filter((a) => a.status === "ACCEPTED").length,
                                    },
                                    onOpenChat: () => {
                                      if (app.job.recruiter?.id) {
                                        handleOpenChat(
                                          app.job.recruiter.id,
                                          recruiterName,
                                          "RECRUITER",
                                          app.job.recruiter.recruiterProfile?.profilePhotoUrl,
                                          recruiterPhone,
                                          false,
                                          app.job.id
                                        );
                                      }
                                    },
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                <Radio className="w-3.5 h-3.5 animate-pulse" />
                                <span>Live Route &amp; GPS</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (app.job.recruiter?.id) {
                                    handleOpenChat(
                                      app.job.recruiter.id,
                                      recruiterName,
                                      "RECRUITER",
                                      app.job.recruiter.recruiterProfile?.profilePhotoUrl,
                                      recruiterPhone,
                                      false,
                                      app.job.id
                                    );
                                  } else {
                                    setChatModalApp(app);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>In-App Chat</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAppMapId(isMapExpanded ? null : app.id)
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5 text-orange-500" />
                                <span>{isMapExpanded ? "Hide Map" : "View Exact Map"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Exact Location Map */}
                          <AnimatePresence>
                            {isMapExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22 }}
                                className="space-y-2 overflow-hidden pt-1"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                    <span>Exact Job Location: {app.job.address}</span>
                                  </span>
                                  <a
                                    href={googleDirectionsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                  >
                                    <span>Open Turn-by-Turn in Google Maps</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>

                                <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-inner">
                                  <iframe
                                    src={`https://maps.google.com/maps?q=${mapQuery}&hl=en&z=15&output=embed`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Location of ${app.job.title}`}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            /* ── RECRUITER VIEW: Posted Requirements Hub ─────── */
            <motion.div variants={fadeUp} id="jobs" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Your Posted Requirements
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage applications, adjust status, and review active listings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                    {(["ALL", "OPEN", "COMPLETED"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setJobFilter(filter)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          jobFilter === filter
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {filter === "ALL" ? "All Jobs" : filter === "OPEN" ? "Active" : "Completed"}
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/jobs/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Job</span>
                  </Link>
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-dashed p-10 text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    No {jobFilter === "OPEN" ? "active" : jobFilter === "COMPLETED" ? "completed" : ""} jobs found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-5">
                    Need work done? Post your requirement now and skilled local workers in your area will reach out.
                  </p>
                  <Link
                    href="/jobs/new"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post a Job Requirement</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      whileHover={{ y: -1 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                              {job.category}
                            </span>
                            <StatusBadge status={job.status} />
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {job.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {job.status === "OPEN" ? (
                            <button
                              disabled={updatingJobId === job.id}
                              onClick={() => handleStatusChange(job.id, "COMPLETED")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Completed</span>
                            </button>
                          ) : job.status === "MATCHED" ? (
                            <>
                              <button
                                disabled={updatingJobId === job.id}
                                onClick={() => handleStatusChange(job.id, "COMPLETED")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete Task</span>
                              </button>
                              <button
                                disabled={updatingJobId === job.id}
                                onClick={() => handleStatusChange(job.id, "OPEN")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors cursor-pointer"
                              >
                                <span>Re-open</span>
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={updatingJobId === job.id}
                              onClick={() => handleStatusChange(job.id, "OPEN")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors cursor-pointer"
                            >
                              <span>Re-open</span>
                            </button>
                          )}

                          <button
                            disabled={updatingJobId === job.id}
                            onClick={() => handleDeleteJob(job.id)}
                            title="Delete Job"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            {job.address}
                          </span>
                          <span>•</span>
                          <span>
                            Budget:{" "}
                            <strong className="text-slate-900 dark:text-white">
                              {job.budget ? `Rs. ${job.budget.toLocaleString()}` : "Negotiable"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(job.createdAt).toLocaleDateString("en-NP", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Applicants Action Button / Direct Worker Search */}
                        <div>
                          {job.applications && job.applications.length > 0 ? (
                            <button
                              onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                expandedJobId === job.id
                                  ? "bg-orange-600 text-white shadow-sm shadow-orange-600/20"
                                  : "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800"
                              }`}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {expandedJobId === job.id
                                  ? "Hide Applicants"
                                  : `View Applicants (${job.applications.length})`}
                              </span>
                              {expandedJobId === job.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <Link
                              href={`/workers?search=${encodeURIComponent(job.category)}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>0 Applicants • Find Workers →</span>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Expandable Applicants Drawer */}
                      <AnimatePresence>
                        {expandedJobId === job.id && job.applications && job.applications.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden pt-3 border-t border-slate-200/80 dark:border-slate-800"
                          >
                            <div className="bg-slate-50/80 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                  <Users className="w-4 h-4 text-orange-500" />
                                  <span>Candidates Who Applied ({job.applications.length})</span>
                                </h5>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                                  Review skills, proposed rates & contact directly
                                </span>
                              </div>

                              <div className="space-y-3">
                                {job.applications.map((app) => {
                                  const workerName =
                                    app.worker.workerProfile?.name || app.worker.email.split("@")[0];
                                  const workerAddress = app.worker.workerProfile?.address;
                                  const workerSkills = app.worker.workerProfile?.skills || [];
                                  const workerRating = app.worker.workerProfile?.rating ?? 5.0;
                                  const isUpdating = updatingAppId === app.id;

                                  return (
                                    <div
                                      key={app.id}
                                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs"
                                    >
                                      {/* Top Row: Worker info & Status */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                          {app.worker.workerProfile?.profilePhotoUrl ? (
                                            <img
                                              src={app.worker.workerProfile.profilePhotoUrl}
                                              alt={workerName}
                                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-xs border border-orange-200 dark:border-orange-800/50"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                                              {workerName[0]?.toUpperCase()}
                                            </div>
                                          )}
                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                                {workerName}
                                              </span>
                                              {(() => {
                                                const cTier = getWorkerTier(
                                                  (app.worker.workerProfile as any)?.completedJobs || 0,
                                                  workerRating || 5.0
                                                );
                                                return (
                                                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cTier.badgeClass}`}>
                                                    <Award className={`w-3 h-3 ${cTier.iconColor}`} />
                                                    <span>{lang === "ne" ? cTier.labelNe : cTier.label}</span>
                                                  </span>
                                                );
                                              })()}
                                              {app.worker.phoneVerified && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60" title="Verified Phone Number">
                                                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                  <span>Verified</span>
                                                </span>
                                              )}
                                              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                                                <Star className="w-3 h-3 fill-amber-400" />
                                                <span>{workerRating > 0 ? workerRating.toFixed(1) : "5.0"}</span>
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                              {workerAddress && (
                                                <span className="flex items-center gap-1">
                                                  <MapPin className="w-3 h-3 text-orange-500" />
                                                  {workerAddress}
                                                </span>
                                              )}
                                              <span>•</span>
                                              <span>
                                                Applied{" "}
                                                {new Date(app.createdAt).toLocaleDateString("en-NP", {
                                                  month: "short",
                                                  day: "numeric",
                                                })}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={app.status} />
                                        </div>
                                      </div>

                                      {/* Middle Row: Rates & Skills */}
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {app.proposedRate ? (
                                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold">
                                            Proposed Rate: Rs. {app.proposedRate.toLocaleString()}
                                          </span>
                                        ) : app.worker.workerProfile?.hourlyRate ? (
                                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                                            Standard Rate: Rs. {app.worker.workerProfile.hourlyRate}/hr
                                          </span>
                                        ) : null}

                                        {workerSkills.length > 0 && (
                                          <div className="flex flex-wrap gap-1 items-center">
                                            {workerSkills.map((skill) => (
                                              <span
                                                key={skill}
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                              >
                                                {skill}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Cover note / pitch message if provided */}
                                      {app.coverNote && (
                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                                            <span>Applicant&apos;s Message / Pitch:</span>
                                          </div>
                                          <p className="leading-relaxed italic">&ldquo;{app.coverNote}&rdquo;</p>
                                        </div>
                                      )}

                                      {/* Candidate Audio Pitch / Voice Proposal */}
                                      {app.audioUrl && (
                                        <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/50 space-y-1.5">
                                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                                            <Mic className="w-3.5 h-3.5" />
                                            <span>Voice Proposal / Audio Pitch:</span>
                                          </div>
                                          <VoiceNotePlayer audioUrl={app.audioUrl} />
                                        </div>
                                      )}

                                      {/* Bottom Row: Direct Contact & Decision Actions */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenChat(
                                                app.worker.id,
                                                workerName,
                                                "WORKER",
                                                app.worker.workerProfile?.profilePhotoUrl,
                                                app.worker.phone,
                                                app.worker.phoneVerified,
                                                job.id
                                              )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-all cursor-pointer shadow-xs"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>Chat</span>
                                          </button>
                                          {app.worker.phone && (
                                            <>
                                              <a
                                                href={`tel:${app.worker.phone}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                                              >
                                                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Call {app.worker.phone}</span>
                                              </a>

                                              {(() => {
                                                const raw = app.worker.phone.replace(/[^0-9]/g, "");
                                                const waNum = raw.startsWith("977") ? raw : raw.length === 10 ? `977${raw}` : null;
                                                if (!waNum) return null;
                                                return (
                                                  <a
                                                    href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                                                      `Namaste ${workerName}, I am contacting you regarding your application for '${job.title}' on KamGhar.`
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] dark:text-[#25D366] transition-colors cursor-pointer"
                                                  >
                                                    <span>WhatsApp</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                );
                                              })()}
                                            </>
                                          )}
                                          {app.worker.workerProfile?.cvUrl && (
                                            <a
                                              href={app.worker.workerProfile.cvUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-colors cursor-pointer shadow-xs"
                                            >
                                              <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                              <span>View CV (PDF)</span>
                                            </a>
                                          )}
                                          <a
                                            href={`mailto:${app.worker.email}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                                          >
                                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                                            <span>Email</span>
                                          </a>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                          {app.status === "APPLIED" && (
                                            <>
                                              <button
                                                disabled={isUpdating}
                                                onClick={() => handleApplicationStatusChange(app.id, "ACCEPTED")}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
                                              >
                                                {isUpdating ? (
                                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                  <Check className="w-3.5 h-3.5" />
                                                )}
                                                <span>Accept & Hire</span>
                                              </button>

                                              <button
                                                disabled={isUpdating}
                                                onClick={() => handleApplicationStatusChange(app.id, "DECLINED")}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-60"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Decline</span>
                                              </button>
                                            </>
                                          )}

                                          {app.status === "ACCEPTED" && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveLiveRoute({
                                                    jobTitle: job.title,
                                                    jobAddress: job.address,
                                                    jobCoords: {
                                                      lat: (job as any).latitude || 27.7172,
                                                      lng: (job as any).longitude || 85.324,
                                                    },
                                                    worker: {
                                                      id: app.worker.id,
                                                      name: workerName,
                                                      phone: app.worker.phone,
                                                      photoUrl: app.worker.workerProfile?.profilePhotoUrl,
                                                      isVerified: app.worker.workerProfile?.kycStatus === "VERIFIED" || app.worker.phoneVerified,
                                                      rating: app.worker.workerProfile?.rating,
                                                      completedJobs: (app.worker.workerProfile as any)?.completedJobs || 1,
                                                    },
                                                    onOpenChat: () => {
                                                      handleOpenChat(
                                                        app.worker.id,
                                                        workerName,
                                                        "WORKER",
                                                        app.worker.workerProfile?.profilePhotoUrl,
                                                        app.worker.phone,
                                                        app.worker.phoneVerified,
                                                        job.id
                                                      );
                                                    },
                                                  });
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-xs"
                                              >
                                                <Radio className="w-3.5 h-3.5 animate-pulse" />
                                                <span>Track Live Arrival</span>
                                              </button>

                                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Hired Candidate</span>
                                              </span>
                                              <button
                                                disabled={isUpdating}
                                                onClick={() => handleApplicationStatusChange(app.id, "DECLINED")}
                                                className="text-[11px] text-slate-400 hover:text-red-500 underline ml-1 cursor-pointer"
                                              >
                                                Change to Decline
                                              </button>
                                            </div>
                                          )}

                                          {app.status === "DECLINED" && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-semibold text-slate-400">
                                                Application Declined
                                              </span>
                                              <button
                                                disabled={isUpdating}
                                                onClick={() => handleApplicationStatusChange(app.id, "ACCEPTED")}
                                                className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                                              >
                                                Re-accept
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* ── Direct Communication / Chat Modal ─────────────────── */}
      <AnimatePresence>
        {chatModalApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Contact Recruiter
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChatModalApp(null);
                    setCopiedPhone(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Recruiter details card */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                  {chatModalApp.job.recruiter?.recruiterProfile?.profilePhotoUrl ? (
                    <img
                      src={chatModalApp.job.recruiter.recruiterProfile.profilePhotoUrl}
                      alt="Recruiter"
                      className="w-12 h-12 rounded-xl object-cover border border-orange-200 dark:border-orange-800/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {(chatModalApp.job.recruiter?.recruiterProfile?.name ||
                        chatModalApp.job.recruiter?.email ||
                        "R")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {chatModalApp.job.recruiter?.recruiterProfile?.name ||
                        chatModalApp.job.recruiter?.email?.split("@")[0] ||
                        "Client"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Job: {chatModalApp.job.title}
                    </p>
                    {chatModalApp.job.recruiter?.phone && (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{chatModalApp.job.recruiter.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick message presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Quick Preset Messages (नेपाली / English):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: "म आउँदै छु / On my way",
                        text: "म कार्यस्थलमा आउँदै छु, १०-१५ मिनेटमा आइपुग्छु। (I am on my way to the site, will arrive in 10-15 minutes.)",
                      },
                      {
                        label: "भोलिको समय / Tomorrow time",
                        text: "भोलि कति बजे सम्म आइपुग्नु पर्ने हो? (What time should I arrive tomorrow?)",
                      },
                      {
                        label: "ल्यान्डमार्क / Landmark",
                        text: "कृपया कुनै मुख्य ल्यान्डमार्क वा घर/गेट नम्बर भनिदिनुहोस्। (Please share any landmark or gate number.)",
                      },
                      {
                        label: "आइपुगें / Arrived",
                        text: "म तपाईंको लोकेसनमा आइपुगें, कृपया बाहिर आउनुहोला! (I have reached the location, please come outside!)",
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setChatMessage(preset.text)}
                        title={preset.text}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors cursor-pointer text-left"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Message:
                  </label>
                  <textarea
                    rows={3}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message or coordination note..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-1">
                  {/* WhatsApp Direct Chat */}
                  {chatModalApp.job.recruiter?.phone ? (
                    <a
                      href={`https://wa.me/${chatModalApp.job.recruiter.phone.replace(/[^0-9]/g, "").startsWith("977") ? chatModalApp.job.recruiter.phone.replace(/[^0-9]/g, "") : "977" + chatModalApp.job.recruiter.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(chatMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat via WhatsApp</span>
                    </a>
                  ) : null}

                  {/* Direct Phone Call */}
                  {chatModalApp.job.recruiter?.phone ? (
                    <div className="flex gap-2">
                      <a
                        href={`tel:${chatModalApp.job.recruiter.phone}`}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call ({chatModalApp.job.recruiter.phone})</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (chatModalApp.job.recruiter?.phone) {
                            navigator.clipboard.writeText(chatModalApp.job.recruiter.phone);
                            setCopiedPhone(true);
                            setTimeout(() => setCopiedPhone(false), 2000);
                          }
                        }}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedPhone ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiedPhone ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Email */}
                  {chatModalApp.job.recruiter?.email && (
                    <a
                      href={`mailto:${chatModalApp.job.recruiter.email}?subject=${encodeURIComponent("KamGhar: " + chatModalApp.job.title)}&body=${encodeURIComponent(chatMessage)}`}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                    >
                      <Mail className="w-3.5 h-3.5 text-orange-500" />
                      <span>Send Direct Email to Recruiter</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Profile Settings Modal ────────────────────────────── */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Account Settings</h2>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSettingsError(null);
                    setSettingsSuccess(null);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200/80 dark:border-slate-800 px-6">
                <button
                  onClick={() => setSettingsTab("profile")}
                  className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    settingsTab === "profile"
                      ? "border-orange-600 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Profile & Contact
                </button>
                {isWorker && (
                  <button
                    onClick={() => setSettingsTab("documents")}
                    className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      settingsTab === "documents"
                        ? "border-orange-600 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    CV & Documents
                  </button>
                )}
                <button
                  onClick={() => setSettingsTab("kyc")}
                  className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    settingsTab === "kyc"
                      ? "border-orange-600 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Citizenship & KYC
                </button>
                <button
                  onClick={() => setSettingsTab("password")}
                  className={`flex items-center gap-1.5 px-1 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    settingsTab === "password"
                      ? "border-orange-600 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Change Password
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {settingsTab === "documents" && isWorker ? (
                  /* ── Documents & CV Tab ── */
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span>Curriculum Vitae (CV / Resume)</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Upload your updated resume or CV in PDF format. Recruiters reviewing your job applications will be able to review your full background and qualifications directly.
                      </p>
                    </div>

                    {/* Current CV status */}
                    {currentCvUrl ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">Active CV on Profile</p>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Available for recruiter inspection</p>
                            </div>
                          </div>
                          <a
                            href={currentCvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                          >
                            <span>Preview</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex justify-end">
                          <button
                            type="button"
                            disabled={cvRemoving}
                            onClick={handleRemoveCV}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            {cvRemoving && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Remove Current CV</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No CV Uploaded Yet</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Upload a PDF CV to increase your chances of being hired.</p>
                      </div>
                    )}

                    {/* Upload new / replace CV */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {currentCvUrl ? "Replace with New CV (PDF)" : "Select CV Document (PDF)"}
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <label className="w-full sm:flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer overflow-hidden transition-colors">
                          <Upload className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="truncate">{cvFile ? cvFile.name : "Choose PDF file (max 5MB)..."}</span>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== "application/pdf") {
                                  setCvError("Only PDF format is supported.");
                                  return;
                                }
                                if (file.size > 5 * 1024 * 1024) {
                                  setCvError("File size must be less than 5MB.");
                                  return;
                                }
                                setCvFile(file);
                                setCvError(null);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!cvFile || cvUploading}
                          onClick={handleUploadCV}
                          className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          {cvUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload CV</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {cvError && (
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 rounded-xl">
                        {cvError}
                      </p>
                    )}
                    {cvSuccess && (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-xl">
                        {cvSuccess}
                      </p>
                    )}
                  </div>
                ) : settingsTab === "profile" ? (
                  <>
                    {/* Photo URL */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        <Camera className="w-3.5 h-3.5 inline-block mr-1 text-orange-500" />
                        Profile Photo URL
                      </label>
                      <input
                        type="url"
                        value={settingsPhotoUrl}
                        onChange={(e) => setSettingsPhotoUrl(e.target.value)}
                        placeholder="https://example.com/your-photo.jpg"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />

                      <div className="flex items-center gap-3 pt-2">
                        <UploadcareImageUploader
                          onUpload={(cdnUrl) => {
                            setSettingsPhotoUrl(cdnUrl);
                            setSettingsError(null);
                          }}
                          label="Upload with Uploadcare"
                        />
                        {settingsPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setSettingsPhotoUrl("")}
                            className="text-xs text-red-500 hover:underline cursor-pointer"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>

                      {settingsPhotoUrl && (
                        <div className="mt-3 flex items-center gap-3">
                          <img
                            src={settingsPhotoUrl}
                            alt="Preview"
                            className="w-14 h-14 rounded-2xl object-cover border border-orange-200 dark:border-orange-800/50 shadow-md"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                          <div className="text-[11px] text-slate-400 leading-tight">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Photo preview</span>
                            <p>Will be shown across your dashboard and profile card</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={settingsName}
                        onChange={(e) => setSettingsName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 inline-block mr-1 text-orange-500" />
                          Phone Number
                        </label>
                        {isPhoneVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Not Verified</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={settingsPhone}
                          onChange={(e) => {
                            setSettingsPhone(e.target.value);
                            if (e.target.value !== user.phone) {
                              setIsPhoneVerified(false);
                            }
                          }}
                          placeholder="e.g. 9841234567"
                          className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                        {!isPhoneVerified && settingsPhone.trim() && (
                          <button
                            type="button"
                            disabled={phoneOtpSending}
                            onClick={handleSendPhoneOtp}
                            className="px-3 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            {phoneOtpSending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>{phoneOtpSent ? "Resend OTP" : "Verify Phone"}</span>
                          </button>
                        )}
                      </div>

                      {/* OTP verification box */}
                      {phoneOtpSent && !isPhoneVerified && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/60 space-y-2">
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            Enter the 6-digit SMS verification code sent to <strong className="text-slate-900 dark:text-white">{settingsPhone}</strong>:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={phoneOtpCode}
                              onChange={(e) => setPhoneOtpCode(e.target.value)}
                              placeholder="123456"
                              className="w-36 px-3 py-1.5 text-sm tracking-widest font-bold text-center rounded-xl border border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                            />
                            <button
                              type="button"
                              disabled={phoneOtpVerifying || phoneOtpCode.length < 4}
                              onClick={handleVerifyPhoneOtp}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {phoneOtpVerifying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Confirm Code</span>
                            </button>
                          </div>
                          {phoneOtpError && (
                            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{phoneOtpError}</p>
                          )}
                          {phoneOtpSuccess && (
                            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{phoneOtpSuccess}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* District / Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 inline-block mr-1 text-orange-500" />
                        District / Location
                      </label>
                      <input
                        type="text"
                        value={settingsAddress}
                        onChange={(e) => setSettingsAddress(e.target.value)}
                        placeholder="e.g. Kathmandu"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {isWorker ? (
                      <>
                        {/* Bio */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Short Bio / Introduction
                          </label>
                          <textarea
                            value={settingsBio}
                            onChange={(e) => setSettingsBio(e.target.value)}
                            rows={3}
                            placeholder="Briefly describe your experience and expertise..."
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                          />
                        </div>
                        {/* Hourly Rate */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Hourly Rate (Rs.)
                          </label>
                          <input
                            type="number"
                            value={settingsHourlyRate}
                            onChange={(e) => setSettingsHourlyRate(e.target.value)}
                            placeholder="e.g. 500"
                            min={0}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                        </div>
                      </>
                    ) : (
                      /* Business Name for Recruiters */
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Business / Organization Name
                        </label>
                        <input
                          type="text"
                          value={settingsBusinessName}
                          onChange={(e) => setSettingsBusinessName(e.target.value)}
                          placeholder="e.g. Sharma Construction Pvt. Ltd."
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    )}

                    {/* Feedback Messages */}
                    {settingsError && (
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 rounded-xl">
                        {settingsError}
                      </p>
                    )}
                    {settingsSuccess && (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-xl">
                        {settingsSuccess}
                      </p>
                    )}

                    <button
                      onClick={handleSaveProfileSettings}
                      disabled={settingsSaving}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {settingsSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </>
                ) : settingsTab === "kyc" ? (
                  /* ── Citizenship & KYC Verification Tab ── */
                  <form onSubmit={handleSubmitKyc} className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>KamGhar Verified Credentials</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Verify your identity with official Nepalese government identification (Citizenship, National ID, or PAN) to receive the official <span className="font-semibold text-blue-600 dark:text-blue-400">KamGhar Verified</span> badge.
                      </p>
                    </div>

                    {/* Verification Status Banner */}
                    {kycStatus === "VERIFIED" ? (
                      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                            Identity Verified (KamGhar Verified)
                          </p>
                          <p className="text-[11px] text-blue-700 dark:text-blue-300">
                            Your credentials are valid. Recruiters and workers see your verified blue badge.
                          </p>
                        </div>
                      </div>
                    ) : kycStatus === "PENDING" ? (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Document Under Review
                          </p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            Your identity document has been submitted and is currently being verified by KamGhar platform operators.
                          </p>
                        </div>
                      </div>
                    ) : kycStatus === "REJECTED" ? (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                            Document Rejected
                          </p>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300">
                            Your previous document submission could not be verified. Please ensure the document is clear and matches your legal name, then submit again below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          Your profile is currently <span className="font-bold">Unverified</span>. Submit your details below to earn your trust badge.
                        </p>
                      </div>
                    )}

                    {/* Document Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Document Type
                      </label>
                      <select
                        value={kycDocType}
                        onChange={(e) => setKycDocType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                      >
                        <option value="CITIZENSHIP">Nepali Citizenship (नागरिकता प्रमाणपत्र)</option>
                        <option value="NATIONAL_ID">National Identity Card (राष्ट्रिय परिचयपत्र)</option>
                        <option value="PAN_OR_LICENSE">PAN Card / Driver's License</option>
                      </select>
                    </div>

                    {/* Document Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Document / Registration Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={kycDocNumber}
                        onChange={(e) => setKycDocNumber(e.target.value)}
                        placeholder="e.g. 27-01-78-12345 or NID number"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {/* Document Photo / Scan URL */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Document Photo / Scan (Optional image URL or Uploadcare link)
                      </label>
                      <input
                        type="url"
                        value={kycDocUrl}
                        onChange={(e) => setKycDocUrl(e.target.value)}
                        placeholder="https://example.com/document-scan.jpg"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                      <div className="mt-2">
                        <UploadcareImageUploader
                          onUpload={(cdnUrl) => setKycDocUrl(cdnUrl)}
                          label="Upload Document Scan"
                        />
                      </div>
                    </div>

                    {/* Error / Success Feedback */}
                    {kycError && (
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 rounded-xl">
                        {kycError}
                      </p>
                    )}
                    {kycSuccess && (
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-3 py-2 rounded-xl">
                        {kycSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={kycSubmitting}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      {kycSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{kycStatus === "VERIFIED" ? "Update KYC Details" : "Submit for Verification"}</span>
                    </button>
                  </form>
                ) : (
                  /* ── Password Tab ── */
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {passwordError && (
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 rounded-xl">
                        {passwordError}
                      </p>
                    )}
                    {passwordSuccess && (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-xl">
                        {passwordSuccess}
                      </p>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {passwordSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      Update Password
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Real-Time In-App Chat Modal ─────────────────────── */}
      {activeChat && (
        <ChatModal
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          conversationId={activeChat.conversationId}
          recipientName={activeChat.recipientName}
          recipientRole={activeChat.recipientRole}
          recipientPhoto={activeChat.recipientPhoto}
          recipientPhone={activeChat.recipientPhone}
          recipientVerified={activeChat.recipientVerified}
          currentUserId={user.id}
          currentUserRole={isWorker ? "WORKER" : "RECRUITER"}
        />
      )}

      {/* ── Live Route & Arrival Tracker Modal ─────────────── */}
      {activeLiveRoute && (
        <LiveRouteTrackerModal
          isOpen={!!activeLiveRoute}
          onClose={() => setActiveLiveRoute(null)}
          jobTitle={activeLiveRoute.jobTitle}
          jobAddress={activeLiveRoute.jobAddress}
          jobCoords={activeLiveRoute.jobCoords}
          worker={activeLiveRoute.worker}
          onOpenChat={activeLiveRoute.onOpenChat}
        />
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */
function QuickAction({
  icon,
  label,
  href,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  color: "orange" | "blue" | "emerald" | "purple";
}) {
  const colors = {
    orange:
      "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/50",
    blue:
      "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/50",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
    purple:
      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/50",
  };

  const className = `flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center font-semibold text-xs transition-all cursor-pointer ${colors[color]}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link href={href || "#"} className={className}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}