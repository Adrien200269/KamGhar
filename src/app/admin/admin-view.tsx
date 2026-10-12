"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
  ExternalLink,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  Zap,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Building,
  UserCheck,
  DollarSign,
  Calendar,
  Lock,
  MessageSquare,
  AlertTriangle,
  Scale,
  MapPin,
  Megaphone,
  Star,
  Layers,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Shield,
  Download,
  Send,
  Radio,
  TrendingUp,
  Award,
  CheckCheck,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { VoiceNotePlayer } from "@/components/voice-note";
import {
  updateUserRoleByAdmin,
  toggleUserPhoneVerifiedByAdmin,
  deleteUserByAdmin,
  updateJobStatusByAdmin,
  toggleJobBoostByAdmin,
  deleteJobByAdmin,
  reviewKycSubmission,
  updateTransactionStatusByAdmin,
  createManualTransactionByAdmin,
  toggleWorkerFeaturedByAdmin,
  issueWarningStrike,
  resolveDisputeJob,
  deleteReviewByAdmin,
  sendAdminBroadcast,
  type AuditLogEntry,
} from "@/app/actions/admin";
import { UserRole, JobStatus, UrgencyLevel, KycStatus, PaymentStatus, TransactionType, PaymentGateway } from "@prisma/client";

// =============================================================================
// Types
// =============================================================================

type AdminStats = {
  users: { total: number; workers: number; recruiters: number; admins: number };
  jobs: { total: number; open: number; boosted: number };
  kyc: { pendingTotal: number; pendingWorkers: number; pendingRecruiters: number };
  monetization: { totalTransactions: number; completedTransactions: number; totalRevenue: number; featuredWorkers: number };
};

type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  role: UserRole;
  createdAt: Date | string;
  workerProfile: {
    name: string;
    skills: string[];
    hourlyRate: number | null;
    rating: number;
    reviewCount: number;
    address: string | null;
    profilePhotoUrl: string | null;
    isFeatured: boolean;
    kycStatus: KycStatus;
  } | null;
  recruiterProfile: {
    name: string;
    businessName: string | null;
    address: string | null;
    profilePhotoUrl: string | null;
    kycStatus: KycStatus;
  } | null;
  _count: {
    postedJobs: number;
    applications: number;
    transactions: number;
  };
};

type AdminJob = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: UrgencyLevel;
  budget: number | null;
  address: string;
  status: JobStatus;
  isBoosted: boolean;
  boostedUntil: Date | string | null;
  audioUrl: string | null;
  createdAt: Date | string;
  recruiter: {
    id: string;
    email: string;
    phone: string | null;
    recruiterProfile: {
      name: string;
      businessName: string | null;
      profilePhotoUrl: string | null;
      kycStatus: KycStatus;
    } | null;
  };
  _count: {
    applications: number;
    conversations: number;
  };
};

type AdminKycItem = {
  profileId: string;
  userId: string;
  roleType: "WORKER" | "RECRUITER";
  name: string;
  businessName?: string | null;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  profilePhotoUrl: string | null;
  address: string | null;
  kycStatus: KycStatus;
  kycDocumentType: string | null;
  kycDocumentNumber: string | null;
  kycDocumentUrl: string | null;
  kycVerifiedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  skills: string[];
};

type AdminTransaction = {
  id: string;
  userId: string;
  jobId: string | null;
  type: TransactionType;
  amount: number;
  gateway: PaymentGateway;
  gatewayRef: string | null;
  status: PaymentStatus;
  createdAt: Date | string;
  user: {
    id: string;
    email: string;
    phone: string | null;
    role: UserRole;
    workerProfile: { name: string; profilePhotoUrl: string | null } | null;
    recruiterProfile: { name: string; businessName: string | null; profilePhotoUrl: string | null } | null;
  };
  job: {
    id: string;
    title: string;
    category: string;
    isBoosted: boolean;
    boostedUntil: Date | string | null;
  } | null;
};

type AdminDispute = {
  id: string;
  user1Id: string;
  user2Id: string;
  jobId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user1: {
    id: string;
    email: string;
    phone: string | null;
    phoneVerified: boolean;
    role: UserRole;
    workerProfile: { name: string; profilePhotoUrl: string | null; rating: number; kycStatus: KycStatus } | null;
    recruiterProfile: { name: string; businessName: string | null; profilePhotoUrl: string | null; kycStatus: KycStatus } | null;
  };
  user2: {
    id: string;
    email: string;
    phone: string | null;
    phoneVerified: boolean;
    role: UserRole;
    workerProfile: { name: string; profilePhotoUrl: string | null; rating: number; kycStatus: KycStatus } | null;
    recruiterProfile: { name: string; businessName: string | null; profilePhotoUrl: string | null; kycStatus: KycStatus } | null;
  };
  job: {
    id: string;
    title: string;
    category: string;
    budget: number | null;
    address: string;
    status: JobStatus;
    applications: Array<{
      id: string;
      workerId: string;
      proposedRate: number | null;
      coverNote: string | null;
      audioUrl: string | null;
      status: string;
      worker: { id: string; email: string; workerProfile: { name: string } | null };
    }>;
  } | null;
  messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    audioUrl: string | null;
    isRead: boolean;
    createdAt: Date | string;
  }>;
};

type AdminReview = {
  id: string;
  jobId: string;
  authorId: string;
  targetUserId: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  job: { id: string; title: string; category: string };
  author: {
    id: string;
    email: string;
    role: UserRole;
    workerProfile: { name: string } | null;
    recruiterProfile: { name: string; businessName: string | null } | null;
  };
  targetUser: {
    id: string;
    email: string;
    role: UserRole;
    workerProfile: { name: string; rating: number; reviewCount: number } | null;
    recruiterProfile: { name: string; businessName: string | null } | null;
  };
};

type HeatmapData = {
  jobs: Array<{
    id: string;
    title: string;
    category: string;
    urgency: UrgencyLevel;
    budget: number | null;
    latitude: number;
    longitude: number;
    address: string;
  }>;
  workers: Array<{
    id: string;
    name: string;
    skills: string[];
    hourlyRate: number | null;
    rating: number;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    isAvailableNow: boolean;
    kycStatus: KycStatus;
  }>;
  hubs: Array<{
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
    jobCount: number;
    workerCount: number;
    availableWorkerCount: number;
    deficitAlert: boolean;
  }>;
};

type FunnelAnalytics = {
  funnel: {
    totalApplications: number;
    acceptedApplications: number;
    completedJobs: number;
    conversionRate: number;
  };
  categories: Array<{
    category: string;
    jobCount: number;
    avgBudget: number;
  }>;
  topWorkers: Array<{
    id: string;
    name: string;
    skills: string[];
    rating: number;
    reviewCount: number;
    kycStatus: KycStatus;
  }>;
  topRecruiters: Array<{
    id: string;
    name: string;
    jobCount: number;
  }>;
} | null;

// =============================================================================
// Main AdminView Component
// =============================================================================

export default function AdminView({
  currentUser,
  stats: initialStats,
  users: initialUsers,
  jobs: initialJobs,
  kycList: initialKycList,
  transactions: initialTransactions,
  disputes: initialDisputes = [],
  reviews: initialReviews = [],
  heatmapData: initialHeatmapData,
  analyticsData: initialAnalyticsData,
  auditLogs: initialAuditLogs = [],
}: {
  currentUser: { id: string; email: string; role: UserRole };
  stats: AdminStats;
  users: AdminUser[];
  jobs: AdminJob[];
  kycList: AdminKycItem[];
  transactions: AdminTransaction[];
  disputes?: AdminDispute[];
  reviews?: AdminReview[];
  heatmapData?: HeatmapData;
  analyticsData?: FunnelAnalytics;
  auditLogs?: AuditLogEntry[];
}) {
  const router = useRouter();
  const { tx } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // Navigation Tabs: Grouped for clarity
  type TabType =
    | "kyc"
    | "users"
    | "jobs"
    | "disputes"
    | "heatmap"
    | "broadcast"
    | "reviews"
    | "categories"
    | "analytics"
    | "monetization"
    | "reconciliation"
    | "audit";

  const [activeTab, setActiveTab] = useState<TabType>("kyc");

  // Notifications / Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Users Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userKycFilter, setUserKycFilter] = useState<string>("ALL");
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: AdminUser; newRole: UserRole } | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter((u) => {
      const name = u.workerProfile?.name || u.recruiterProfile?.name || "";
      const business = u.recruiterProfile?.businessName || "";
      const matchesSearch =
        !userSearch ||
        name.toLowerCase().includes(userSearch.toLowerCase()) ||
        business.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch));

      const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      const kycStatus = u.workerProfile?.kycStatus || u.recruiterProfile?.kycStatus || "UNVERIFIED";
      const matchesKyc = userKycFilter === "ALL" || kycStatus === userKycFilter;

      return matchesSearch && matchesRole && matchesKyc;
    });
  }, [initialUsers, userSearch, userRoleFilter, userKycFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Jobs Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("ALL");
  const [jobUrgencyFilter, setJobUrgencyFilter] = useState<string>("ALL");
  const [jobBoostFilter, setJobBoostFilter] = useState<boolean>(false);
  const [deleteJobTarget, setDeleteJobTarget] = useState<AdminJob | null>(null);

  const filteredJobs = useMemo(() => {
    return initialJobs.filter((j) => {
      const matchesSearch =
        !jobSearch ||
        j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.description.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.category.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.address.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.recruiter.email.toLowerCase().includes(jobSearch.toLowerCase());

      const matchesStatus = jobStatusFilter === "ALL" || j.status === jobStatusFilter;
      const matchesUrgency = jobUrgencyFilter === "ALL" || j.urgency === jobUrgencyFilter;
      const matchesBoost = !jobBoostFilter || j.isBoosted;

      return matchesSearch && matchesStatus && matchesUrgency && matchesBoost;
    });
  }, [initialJobs, jobSearch, jobStatusFilter, jobUrgencyFilter, jobBoostFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. KYC Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [kycSearch, setKycSearch] = useState("");
  const [kycStatusFilter, setKycStatusFilter] = useState<string>("PENDING");
  const [kycRoleFilter, setKycRoleFilter] = useState<string>("ALL");
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [rejectKycTarget, setRejectKycTarget] = useState<AdminKycItem | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const filteredKycList = useMemo(() => {
    return initialKycList.filter((item) => {
      const matchesSearch =
        !kycSearch ||
        item.name.toLowerCase().includes(kycSearch.toLowerCase()) ||
        item.email.toLowerCase().includes(kycSearch.toLowerCase()) ||
        (item.kycDocumentNumber && item.kycDocumentNumber.includes(kycSearch)) ||
        (item.phone && item.phone.includes(kycSearch));

      const matchesStatus = kycStatusFilter === "ALL" || item.kycStatus === kycStatusFilter;
      const matchesRole = kycRoleFilter === "ALL" || item.roleType === kycRoleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [initialKycList, kycSearch, kycStatusFilter, kycRoleFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Disputes & Chat Inspection Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(
    initialDisputes.length > 0 ? initialDisputes[0] : null
  );
  const [disputeSearch, setDisputeSearch] = useState("");
  const [strikeModalUser, setStrikeModalUser] = useState<{ id: string; name: string } | null>(null);
  const [strikeReason, setStrikeReason] = useState("");
  const [resolveJobModal, setResolveJobModal] = useState<AdminDispute | null>(null);
  const [resolveStatus, setResolveStatus] = useState<JobStatus>("COMPLETED");
  const [resolveNotes, setResolveNotes] = useState("");

  const filteredDisputes = useMemo(() => {
    return initialDisputes.filter((d) => {
      const user1Name = d.user1.workerProfile?.name || d.user1.recruiterProfile?.name || d.user1.email;
      const user2Name = d.user2.workerProfile?.name || d.user2.recruiterProfile?.name || d.user2.email;
      const jobTitle = d.job?.title || "";
      const q = disputeSearch.toLowerCase();
      return (
        !disputeSearch ||
        user1Name.toLowerCase().includes(q) ||
        user2Name.toLowerCase().includes(q) ||
        jobTitle.toLowerCase().includes(q)
      );
    });
  }, [initialDisputes, disputeSearch]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Broadcast Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL" | "WORKERS" | "RECRUITERS">("ALL");
  const [broadcastTitleEn, setBroadcastTitleEn] = useState("");
  const [broadcastTitleNe, setBroadcastTitleNe] = useState("");
  const [broadcastMessageEn, setBroadcastMessageEn] = useState("");
  const [broadcastMessageNe, setBroadcastMessageNe] = useState("");
  const [broadcastLink, setBroadcastLink] = useState("/jobs");
  const [broadcastSuccessInfo, setBroadcastSuccessInfo] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Reviews Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number>(0);
  const [deleteReviewTarget, setDeleteReviewTarget] = useState<AdminReview | null>(null);

  const filteredReviews = useMemo(() => {
    return initialReviews.filter((r) => {
      return reviewRatingFilter === 0 || r.rating === reviewRatingFilter;
    });
  }, [initialReviews, reviewRatingFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Categories Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const initialCategoryList = [
    { id: "cat-1", name: "Plumbing", nameNe: "प्लम्बिङ", rate: 600, active: true },
    { id: "cat-2", name: "Electrical", nameNe: "विद्युत मर्मत", rate: 650, active: true },
    { id: "cat-3", name: "House Painting", nameNe: "घर रङ्गरोगन", rate: 550, active: true },
    { id: "cat-4", name: "Carpentry", nameNe: "काठको काम", rate: 700, active: true },
    { id: "cat-5", name: "Cleaning & Housekeeping", nameNe: "सरसफाइ", rate: 450, active: true },
    { id: "cat-6", name: "EV & Auto Mechanic", nameNe: "सवारी मर्मत", rate: 750, active: true },
    { id: "cat-7", name: "Masonry & Construction", nameNe: "निर्माण काम", rate: 800, active: true },
    { id: "cat-8", name: "Solar Installation", nameNe: "सोलार जडान", rate: 850, active: true },
    { id: "cat-9", name: "Home Appliances", nameNe: "घरायसी उपकरण", rate: 600, active: true },
    { id: "cat-10", name: "Gardening & Landscaping", nameNe: "बगैंचा", rate: 500, active: true },
  ];
  const [categoriesList, setCategoriesList] = useState(initialCategoryList);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: "", nameNe: "", rate: 500 });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Monetization & Reconciliation Tab State
  // ─────────────────────────────────────────────────────────────────────────────
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState<string>("ALL");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("ALL");
  const [txGatewayFilter, setTxGatewayFilter] = useState<string>("ALL");
  const [showManualTxModal, setShowManualTxModal] = useState(false);
  const [showVatReceiptModal, setShowVatReceiptModal] = useState<AdminTransaction | null>(null);
  const [boostPricingForm, setBoostPricingForm] = useState({
    boost3Days: 250,
    boost7Days: 500,
    feature30Days: 1500,
  });

  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((tx) => {
      const userName = tx.user.workerProfile?.name || tx.user.recruiterProfile?.name || "";
      const matchesSearch =
        !txSearch ||
        userName.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.user.email.toLowerCase().includes(txSearch.toLowerCase()) ||
        (tx.gatewayRef && tx.gatewayRef.toLowerCase().includes(txSearch.toLowerCase())) ||
        (tx.job?.title && tx.job.title.toLowerCase().includes(txSearch.toLowerCase()));

      const matchesStatus = txStatusFilter === "ALL" || tx.status === txStatusFilter;
      const matchesType = txTypeFilter === "ALL" || tx.type === txTypeFilter;
      const matchesGateway = txGatewayFilter === "ALL" || tx.gateway === txGatewayFilter;

      return matchesSearch && matchesStatus && matchesType && matchesGateway;
    });
  }, [initialTransactions, txSearch, txStatusFilter, txTypeFilter, txGatewayFilter]);

  // CSV Export Generator
  const handleExportTransactionsCsv = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "User Name",
      "User Email",
      "Perk Type",
      "Target Job",
      "Amount (NPR)",
      "Gateway",
      "Gateway Ref",
      "Status",
    ];

    const rows = filteredTransactions.map((t) => {
      const userName = t.user.workerProfile?.name || t.user.recruiterProfile?.name || "N/A";
      const targetJob = t.job?.title || "N/A";
      return [
        t.id,
        new Date(t.createdAt).toISOString().split("T")[0],
        `"${userName.replace(/"/g, '""')}"`,
        t.user.email,
        t.type,
        `"${targetJob.replace(/"/g, '""')}"`,
        t.amount,
        t.gateway,
        t.gatewayRef || "N/A",
        t.status,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kamghar_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Transaction reconciliation CSV downloaded! 📊");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleUpdateRole = async () => {
    if (!roleChangeTarget) return;
    startTransition(async () => {
      const res = await updateUserRoleByAdmin(roleChangeTarget.user.id, roleChangeTarget.newRole);
      if (res.success) {
        showToast(`Role updated to ${roleChangeTarget.newRole}`);
        setRoleChangeTarget(null);
        router.refresh();
      } else {
        showToast(res.error || "Failed to update role", "error");
      }
    });
  };

  const handleTogglePhoneVerified = async (user: AdminUser) => {
    startTransition(async () => {
      const res = await toggleUserPhoneVerifiedByAdmin(user.id, !user.phoneVerified);
      if (res.success) {
        showToast(`Phone verification updated for ${user.email}`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to toggle phone", "error");
      }
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    startTransition(async () => {
      const res = await deleteUserByAdmin(deleteUserTarget.id);
      if (res.success) {
        showToast("User account permanently deleted");
        setDeleteUserTarget(null);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete user", "error");
      }
    });
  };

  const handleJobStatusChange = async (jobId: string, newStatus: JobStatus) => {
    startTransition(async () => {
      const res = await updateJobStatusByAdmin(jobId, newStatus);
      if (res.success) {
        showToast(`Job status changed to ${newStatus}`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to update job status", "error");
      }
    });
  };

  const handleToggleJobBoost = async (job: AdminJob) => {
    startTransition(async () => {
      const nextBoostState = !job.isBoosted;
      const res = await toggleJobBoostByAdmin(job.id, nextBoostState, 7);
      if (res.success) {
        showToast(nextBoostState ? "Job boosted for 7 days! 🚀" : "Job boost removed.");
        router.refresh();
      } else {
        showToast(res.error || "Failed to toggle boost", "error");
      }
    });
  };

  const handleDeleteJob = async () => {
    if (!deleteJobTarget) return;
    startTransition(async () => {
      const res = await deleteJobByAdmin(deleteJobTarget.id);
      if (res.success) {
        showToast("Job removed from marketplace");
        setDeleteJobTarget(null);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete job", "error");
      }
    });
  };

  const handleReviewKyc = async (
    item: AdminKycItem,
    decision: "VERIFIED" | "REJECTED" | "PENDING",
    feedback?: string
  ) => {
    startTransition(async () => {
      const res = await reviewKycSubmission({
        userId: item.userId,
        roleType: item.roleType,
        decision,
        feedback,
      });
      if (res.success) {
        showToast(
          decision === "VERIFIED"
            ? `Verified KYC for ${item.name}! 🛡️`
            : decision === "REJECTED"
            ? `Rejected KYC for ${item.name}.`
            : `KYC reset to pending.`
        );
        setRejectKycTarget(null);
        setRejectFeedback("");
        router.refresh();
      } else {
        showToast(res.error || "Failed to review KYC", "error");
      }
    });
  };

  const handleIssueWarningStrike = async () => {
    if (!strikeModalUser || !strikeReason.trim()) return;
    startTransition(async () => {
      const res = await issueWarningStrike({
        userId: strikeModalUser.id,
        reason: strikeReason.trim(),
        jobId: selectedDispute?.jobId || undefined,
      });
      if (res.success) {
        showToast(`Warning strike delivered to ${strikeModalUser.name} ⚠️`);
        setStrikeModalUser(null);
        setStrikeReason("");
        router.refresh();
      } else {
        showToast(res.error || "Failed to issue warning", "error");
      }
    });
  };

  const handleResolveDispute = async () => {
    if (!resolveJobModal || !resolveJobModal.jobId) return;
    startTransition(async () => {
      const res = await resolveDisputeJob({
        jobId: resolveJobModal.jobId!,
        newStatus: resolveStatus,
        resolutionNotes: resolveNotes.trim() || "Mediated and resolved by KamGhar platform operators.",
      });
      if (res.success) {
        showToast(`Dispute resolved! Job marked as ${resolveStatus}. ⚖️`);
        setResolveJobModal(null);
        setResolveNotes("");
        router.refresh();
      } else {
        showToast(res.error || "Failed to resolve dispute", "error");
      }
    });
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewTarget) return;
    startTransition(async () => {
      const res = await deleteReviewByAdmin(deleteReviewTarget.id);
      if (res.success) {
        showToast("Review shielded and removed. Target rating recomputed! ⭐");
        setDeleteReviewTarget(null);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete review", "error");
      }
    });
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitleEn.trim() || !broadcastMessageEn.trim()) {
      showToast("Title and message are required", "error");
      return;
    }

    startTransition(async () => {
      const res = await sendAdminBroadcast({
        audience: broadcastAudience,
        titleEn: broadcastTitleEn.trim(),
        titleNe: broadcastTitleNe.trim() || broadcastTitleEn.trim(),
        messageEn: broadcastMessageEn.trim(),
        messageNe: broadcastMessageNe.trim() || broadcastMessageEn.trim(),
        link: broadcastLink.trim() || "/dashboard",
      });

      if (res.success && res.data) {
        showToast(`Broadcast delivered to ${res.data.recipientCount} active accounts! 📢`);
        setBroadcastSuccessInfo(`Broadcast successfully delivered to ${res.data.recipientCount} users.`);
        setBroadcastTitleEn("");
        setBroadcastTitleNe("");
        setBroadcastMessageEn("");
        setBroadcastMessageNe("");
        router.refresh();
      } else {
        showToast(res.error || "Failed to deliver broadcast", "error");
      }
    });
  };

  const handleUpdateTransaction = async (txId: string, status: PaymentStatus) => {
    startTransition(async () => {
      const res = await updateTransactionStatusByAdmin(txId, status, 7);
      if (res.success) {
        showToast(`Transaction marked as ${status}!`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to update transaction", "error");
      }
    });
  };

  const handleToggleWorkerFeatured = async (userId: string, currentFeatured: boolean) => {
    startTransition(async () => {
      const nextFeatured = !currentFeatured;
      const res = await toggleWorkerFeaturedByAdmin(userId, nextFeatured, 7);
      if (res.success) {
        showToast(nextFeatured ? "Worker profile featured for 7 days! ⭐" : "Worker feature removed.");
        router.refresh();
      } else {
        showToast(res.error || "Failed to toggle worker featured", "error");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center">
              <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 transition-all">
                <Image
                  src="/logo.png"
                  alt="KamGhar"
                  width={120}
                  height={40}
                  priority
                  className="h-8 w-auto object-contain"
                />
              </div>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>{tx("Admin Console", "प्रशासक कन्सोल")}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageToggle />

            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {tx("User Dashboard", "प्रयोगकर्ता ड्यासबोर्ड")}
            </Link>

            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
                toastMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-800"
              }`}
            >
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overview Metrics Grid ───────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{tx("Total Accounts", "कुल खाताहरू")}</span>
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {initialStats.users.total}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {initialStats.users.workers} {tx("Workers", "श्रमिक")}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {initialStats.users.recruiters} {tx("Recruiters", "नियोक्ता")}
              </span>
            </div>
          </div>

          {/* Active Job Postings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{tx("Job Postings", "कामका विज्ञापन")}</span>
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {initialStats.jobs.total}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {initialStats.jobs.open} {tx("Open", "खुला")}
              </span>
              <span>•</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                <Zap className="w-3 h-3" />
                {initialStats.jobs.boosted} {tx("Boosted", "बूस्ट गरिएको")}
              </span>
            </div>
          </div>

          {/* Pending KYC Reviews */}
          <div
            onClick={() => {
              setActiveTab("kyc");
              setKycStatusFilter("PENDING");
            }}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
              initialStats.kyc.pendingTotal > 0
                ? "border-amber-300 dark:border-amber-800/80 hover:ring-2 hover:ring-amber-500/20"
                : "border-slate-200/80 dark:border-slate-800"
            } shadow-xs`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{tx("Pending KYC", "बाँकी केवाइसी")}</span>
              <div
                className={`p-2 rounded-xl ${
                  initialStats.kyc.pendingTotal > 0
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {initialStats.kyc.pendingTotal}
              </p>
              {initialStats.kyc.pendingTotal > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {tx("Needs Review", "समीक्षा आवश्यक")}
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {initialStats.kyc.pendingWorkers} {tx("Workers", "श्रमिक")}, {initialStats.kyc.pendingRecruiters}{" "}
              {tx("Recruiters", "नियोक्ता")}
            </p>
          </div>

          {/* Monetization & Revenue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{tx("Featured Revenue", "फिचर्ड आम्दानी")}</span>
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Rs. {initialStats.monetization.totalRevenue.toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {initialStats.monetization.completedTransactions} {tx("Payments", "भुक्तानीहरू")}
              </span>
              <span>•</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />
                {initialStats.monetization.featuredWorkers} {tx("Featured", "फिचर्ड")}
              </span>
            </div>
          </div>
        </section>

        {/* ── Operator Navigation Tabs (Expanded) ──────────────────────── */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
          {/* KYC */}
          <button
            onClick={() => setActiveTab("kyc")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "kyc"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{tx("KYC Review", "केवाइसी")}</span>
            {initialStats.kyc.pendingTotal > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "kyc" ? "bg-white text-orange-600" : "bg-amber-500 text-white"
                }`}
              >
                {initialStats.kyc.pendingTotal}
              </span>
            )}
          </button>

          {/* Disputes */}
          <button
            onClick={() => setActiveTab("disputes")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "disputes"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{tx("Dispute Center", "विवाद समाधान")}</span>
            <span className="text-[10px] opacity-75">({initialDisputes.length})</span>
          </button>

          {/* Heatmap */}
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "heatmap"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{tx("Supply Heatmap", "नक्सा तथा माग")}</span>
          </button>

          {/* Broadcast */}
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "broadcast"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{tx("Broadcasts", "सूचना सम्प्रेषण")}</span>
          </button>

          {/* Users */}
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "users"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{tx("Users", "उपभोक्ता")}</span>
            <span className="text-[10px] opacity-75">({initialUsers.length})</span>
          </button>

          {/* Jobs */}
          <button
            onClick={() => setActiveTab("jobs")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "jobs"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{tx("Jobs", "विज्ञापनहरू")}</span>
            <span className="text-[10px] opacity-75">({initialJobs.length})</span>
          </button>

          {/* Reviews */}
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "reviews"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>{tx("Reviews", "समीक्षाहरू")}</span>
            <span className="text-[10px] opacity-75">({initialReviews.length})</span>
          </button>

          {/* Categories */}
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tx("Categories", "विधाहरू")}</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{tx("Funnel Analytics", "विश्लेषण")}</span>
          </button>

          {/* Monetization */}
          <button
            onClick={() => setActiveTab("monetization")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "monetization"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{tx("Payments", "भुक्तानी")}</span>
          </button>

          {/* Reconciliation */}
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "reconciliation"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{tx("CSV & Invoicing", "हिसाब मिलान")}</span>
          </button>

          {/* Audit Logs */}
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-orange-600 text-white shadow-sm shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{tx("Audit Logs", "अडिट लग")}</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: KYC VERIFICATION                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "kyc" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={tx("Search by name, document number, email...", "नाम, कागजात नम्बर, इमेल खोज्नुहोस्...")}
                  value={kycSearch}
                  onChange={(e) => setKycSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  {["PENDING", "VERIFIED", "REJECTED", "ALL"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setKycStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        kycStatusFilter === st
                          ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {st === "PENDING"
                        ? tx("Pending Review", "समीक्षा बाँकी")
                        : st === "VERIFIED"
                        ? tx("Verified", "प्रमाणित")
                        : st === "REJECTED"
                        ? tx("Rejected", "अस्वीकृत")
                        : tx("All Statuses", "सबै")}
                    </button>
                  ))}
                </div>

                <select
                  value={kycRoleFilter}
                  onChange={(e) => setKycRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{tx("All User Types", "सबै प्रकारका")}</option>
                  <option value="WORKER">{tx("Workers Only", "श्रमिक मात्र")}</option>
                  <option value="RECRUITER">{tx("Recruiters Only", "नियोक्ता मात्र")}</option>
                </select>
              </div>
            </div>

            {filteredKycList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {tx("No KYC records found", "कुनै केवाइसी रेकर्ड फेला परेन")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {kycStatusFilter === "PENDING"
                    ? tx("No pending KYC verification requests at this time. All caught up!", "अहिले कुनै बाँकी केवाइसी अनुरोध छैन। सबै कार्य सम्पन्न छ!")
                    : tx("Try adjusting your search filters above.", "माथिका खोज फिल्टरहरू परिवर्तन गरी हेर्नुहोस्।")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKycList.map((item) => {
                  const isPending = item.kycStatus === "PENDING";
                  const isVerified = item.kycStatus === "VERIFIED";
                  const isRejected = item.kycStatus === "REJECTED";

                  return (
                    <div
                      key={item.profileId}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{item.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.roleType === "WORKER"
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                    : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                                }`}
                              >
                                {item.roleType === "WORKER" ? tx("Worker", "श्रमिक") : tx("Recruiter", "नियोक्ता")}
                              </span>
                            </div>
                            {item.businessName && (
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3" />
                                {item.businessName}
                              </p>
                            )}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                              isVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : isRejected
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isPending && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                            {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>{item.kycStatus}</span>
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </p>
                          {item.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{item.phone}</span>
                              {item.phoneVerified && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Verified
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">{tx("Document Type:", "कागजात प्रकार:")}</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.kycDocumentType || "CITIZENSHIP"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">{tx("Document No:", "कागजात नम्बर:")}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {item.kycDocumentNumber || "Not recorded"}
                            </span>
                          </div>
                          {item.kycVerifiedAt && (
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span>Verified on:</span>
                              <span>{new Date(item.kycVerifiedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {item.kycDocumentUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl(item.kycDocumentUrl)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tx("Inspect Document Proof", "कागजात प्रमाण हेर्नुहोस्")}</span>
                          </button>
                        ) : (
                          <div className="text-center py-1.5 text-[11px] text-slate-400 italic">
                            {tx("No uploaded file attached", "कागजातको फाइल संलग्न छैन")}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending && isVerified}
                          onClick={() => handleReviewKyc(item, "VERIFIED")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{tx("Approve", "स्वीकृत")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectKycTarget(item)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{tx("Reject", "अस्वीकृत")}</span>
                        </button>

                        {item.kycStatus !== "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleReviewKyc(item, "PENDING")}
                            title={tx("Reset to Pending review", "समीक्षामा फर्काउनुहोस्")}
                            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: DISPUTE & CONFLICT RESOLUTION CENTER                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "disputes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-orange-600" />
                  <span>{tx("Dispute & Conflict Mediation Center", "विवाद तथा असमझदारी समाधान कन्सोल")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect matched communications, verify agreements, review voice notes, and issue administrative strikes or settlements.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={tx("Filter by user or job title...", "प्रयोगकर्ता वा काम खोज्नुहोस्...")}
                  value={disputeSearch}
                  onChange={(e) => setDisputeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {filteredDisputes.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <Scale className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {tx("No conversations or dispute threads found", "कुनै कुराकानी वा विवाद फेला परेन")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Active negotiations between matched recruiters and workers will appear here for transparency and review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Dispute List */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="max-h-[600px] overflow-y-auto space-y-2.5 pr-1">
                    {filteredDisputes.map((d) => {
                      const isSelected = selectedDispute?.id === d.id;
                      const user1Name = d.user1.workerProfile?.name || d.user1.recruiterProfile?.name || d.user1.email;
                      const user2Name = d.user2.workerProfile?.name || d.user2.recruiterProfile?.name || d.user2.email;
                      const jobTitle = d.job?.title || "Direct Connection";

                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDispute(d)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {d.job?.status || "MATCHED"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(d.updatedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 mb-1">
                            {jobTitle}
                          </h5>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{user1Name}</span>{" "}
                            &bull; <span className="font-semibold text-slate-800 dark:text-slate-200">{user2Name}</span>
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>{d.messages.length} messages</span>
                            {d.job?.budget && <span className="font-bold text-slate-800 dark:text-slate-200">Rs. {d.job.budget}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Inspection & Actions Panel */}
                <div className="lg:col-span-7">
                  {selectedDispute ? (
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
                      {/* Job Banner */}
                      {selectedDispute.job ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {selectedDispute.job.title}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {selectedDispute.job.category} &bull; {selectedDispute.job.address}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Rs. {selectedDispute.job.budget?.toLocaleString() || "Negotiable"}
                            </span>
                          </div>

                          {/* Operator mediation actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            <button
                              type="button"
                              onClick={() => setResolveJobModal(selectedDispute)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Mediate & Resolve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setStrikeModalUser({
                                  id: selectedDispute.user1.id,
                                  name:
                                    selectedDispute.user1.workerProfile?.name ||
                                    selectedDispute.user1.recruiterProfile?.name ||
                                    selectedDispute.user1.email,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Strike Party A</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setStrikeModalUser({
                                  id: selectedDispute.user2.id,
                                  name:
                                    selectedDispute.user2.workerProfile?.name ||
                                    selectedDispute.user2.recruiterProfile?.name ||
                                    selectedDispute.user2.email,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Strike Party B</span>
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Chat Messages Log */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          Communication Transcript ({selectedDispute.messages.length} messages)
                        </h5>

                        <div className="max-h-[360px] overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-3">
                          {selectedDispute.messages.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-6">
                              No written chat messages recorded between these accounts.
                            </p>
                          ) : (
                            selectedDispute.messages.map((m) => {
                              const isFromUser1 = m.senderId === selectedDispute.user1.id;
                              const senderName = isFromUser1
                                ? selectedDispute.user1.workerProfile?.name ||
                                  selectedDispute.user1.recruiterProfile?.name ||
                                  "Party A"
                                : selectedDispute.user2.workerProfile?.name ||
                                  selectedDispute.user2.recruiterProfile?.name ||
                                  "Party B";

                              return (
                                <div
                                  key={m.id}
                                  className={`flex flex-col ${isFromUser1 ? "items-start" : "items-end"}`}
                                >
                                  <span className="text-[10px] font-semibold text-slate-400 mb-0.5">
                                    {senderName} &bull; {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  <div
                                    className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs ${
                                      isFromUser1
                                        ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                        : "bg-orange-600 text-white"
                                    }`}
                                  >
                                    <p className="leading-relaxed">{m.content}</p>
                                    {m.audioUrl && (
                                      <div className="mt-2 pt-2 border-t border-white/20">
                                        <VoiceNotePlayer audioUrl={m.audioUrl} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: LIVE GEOGRAPHIC SUPPLY & DEMAND HEATMAP                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "heatmap" && initialHeatmapData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span>{tx("Live Nepal Supply & Demand Radar", "नेपाल लाइभ माग तथा आपूर्ती रडार")}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time geographic distribution of active job openings vs. verified and available skilled workers.
              </p>
            </div>

            {/* Hubs Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {initialHeatmapData.hubs.map((hub) => (
                <div
                  key={hub.name}
                  className={`p-5 rounded-2xl border transition-all ${
                    hub.deficitAlert
                      ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                      : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                  } shadow-xs`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{hub.name}</h4>
                    {hub.deficitAlert ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 animate-pulse">
                        🚨 Deficit Alert
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Balanced
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Open Jobs (Demand):</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{hub.jobCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Workers (Supply):</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{hub.workerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Available Right Now:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {hub.availableWorkerCount}
                      </span>
                    </div>
                  </div>

                  {hub.deficitAlert && (
                    <p className="mt-3 text-[11px] font-medium text-rose-700 dark:text-rose-300 leading-tight">
                      High job demand with low worker availability. Recommended for targeted SMS/FB recruitment.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Visual Heatmap Distribution List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Jobs Plotted */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-orange-600" />
                    <span>Mapped Open Gigs ({initialHeatmapData.jobs.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Nepal Coordinates</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2">
                  {initialHeatmapData.jobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{j.title}</p>
                        <p className="text-[11px] text-slate-500">{j.address} &bull; {j.category}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 font-semibold">
                        {j.latitude.toFixed(2)}, {j.longitude.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Workers Plotted */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Mapped Workers ({initialHeatmapData.workers.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Available Locations</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2">
                  {initialHeatmapData.workers.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{w.name}</span>
                          {w.isAvailableNow && (
                            <span className="text-[9px] font-extrabold px-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Online
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">{w.address || "Nepal"} &bull; {w.skills.join(", ") || "General"}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 font-semibold">
                        {w.latitude ? w.latitude.toFixed(2) : "--"}, {w.longitude ? w.longitude.toFixed(2) : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: BROADCAST & PUSH ANNOUNCEMENT SYSTEM                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "broadcast" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                <span>{tx("Broadcast & Push Announcement System", "सूचना तथा सन्देश प्रसारण कन्सोल")}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send official bilingual alerts directly to active user notification trays across Nepal.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Compose Form */}
              <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                {broadcastSuccessInfo && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>{broadcastSuccessInfo}</span>
                  </div>
                )}

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  {/* Target Audience */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Target Audience
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "ALL", label: "All Users (सबै)", count: initialStats.users.total },
                        { id: "WORKERS", label: "Workers (श्रमिक मात्र)", count: initialStats.users.workers },
                        { id: "RECRUITERS", label: "Recruiters (नियोक्ता मात्र)", count: initialStats.users.recruiters },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBroadcastAudience(item.id as any)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            broadcastAudience === item.id
                              ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <p>{item.label}</p>
                          <p className="text-[10px] opacity-75 font-normal mt-0.5">{item.count} recipients</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Quick Nepali Templates:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          titleEn: "🚨 High Gig Demand in Kathmandu Valley",
                          titleNe: "🚨 काठमाडौँ उपत्यकामा कामको उच्च माग",
                          msgEn: "Over 20+ urgent gig opportunities are waiting in plumbing and electrics. Check open jobs now!",
                          msgNe: "काठमाडौँ र ललितपुरमा प्लम्बिङ र विजुलीका नयाँ कामहरू उपलब्ध छन्। अहिले नै आवेदन दिनुहोस्!",
                        },
                        {
                          titleEn: "🛡️ Complete KYC for Blue Verified Badge",
                          titleNe: "🛡️ प्रमाणित ब्लु ब्याज पाउन केवाइसी पूरा गर्नुहोस्",
                          msgEn: "Upload your citizenship card to get instant trust badge and rank 3x higher in search.",
                          msgNe: "आफ्नो नागरिकता कार्ड अपलोड गरी प्रमाणित ब्याज प्राप्त गर्नुहोस् र बढी काम पाउनुहोस्।",
                        },
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setBroadcastTitleEn(tmpl.titleEn);
                            setBroadcastTitleNe(tmpl.titleNe);
                            setBroadcastMessageEn(tmpl.msgEn);
                            setBroadcastMessageNe(tmpl.msgNe);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          + {tmpl.titleEn.split(" ")[1] || "Template"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Title (English)
                      </label>
                      <input
                        type="text"
                        required
                        value={broadcastTitleEn}
                        onChange={(e) => setBroadcastTitleEn(e.target.value)}
                        placeholder="e.g. Safety Guidelines Reminder"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Title (नेपाली)
                      </label>
                      <input
                        type="text"
                        value={broadcastTitleNe}
                        onChange={(e) => setBroadcastTitleNe(e.target.value)}
                        placeholder="उदा: सुरक्षा सल्लाह तथा निर्देशन"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Message Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Message Body (English)
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={broadcastMessageEn}
                        onChange={(e) => setBroadcastMessageEn(e.target.value)}
                        placeholder="Detailed announcement content..."
                        className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Message Body (नेपाली)
                      </label>
                      <textarea
                        rows={3}
                        value={broadcastMessageNe}
                        onChange={(e) => setBroadcastMessageNe(e.target.value)}
                        placeholder="विस्तृत सूचना सन्देश..."
                        className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-500">Destination link:</span>
                      <input
                        type="text"
                        value={broadcastLink}
                        onChange={(e) => setBroadcastLink(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{tx("Send Announcement", "सूचना पठाउनुहोस्")}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Card */}
              <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  User Tray Preview
                </h4>

                <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                      KG
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {broadcastTitleEn || "KamGhar Official Announcement"}
                      </p>
                      <p className="text-[10px] text-slate-400">Just now &bull; System Notice</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {broadcastMessageEn || "Your notification preview will appear here as users will see it in their mobile or web notification dropdown."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: REVIEW & RATING MODERATION                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>{tx("Review & Rating Moderation Console", "समीक्षा तथा मूल्याङ्कन मध्यस्थता")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Shield workers and recruiters from malicious or harassment 1-star reviews. Recalculates user ratings in real-time.
                </p>
              </div>

              {/* Rating Star Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                {[0, 1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRatingFilter(star)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      reviewRatingFilter === star
                        ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {star === 0 ? "All Reviews" : `${star} ★`}
                  </button>
                ))}
              </div>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {tx("No reviews recorded yet", "कुनै समीक्षा रेकर्ड गरिएको छैन")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Completed job reviews will appear here for quality and spite moderation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReviews.map((rev) => {
                  const authorName = rev.author.workerProfile?.name || rev.author.recruiterProfile?.name || rev.author.email;
                  const targetName = rev.targetUser.workerProfile?.name || rev.targetUser.recruiterProfile?.name || rev.targetUser.email;

                  return (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                            ))}
                            {[...Array(5 - rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Job: {rev.job.title}
                        </p>

                        <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          &ldquo;{rev.comment || "No comment provided."}&rdquo;
                        </p>

                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p>
                            From: <span className="font-semibold text-slate-700 dark:text-slate-300">{authorName}</span>
                          </p>
                          <p>
                            Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{targetName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteReviewTarget(rev)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        >
                          Shield / Delete Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: DYNAMIC SKILL & CATEGORY MANAGER                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-600" />
                  <span>{tx("Dynamic Skill & Category Manager", "विधा तथा सीप व्यवस्थापक")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure skill classifications and recommended hourly rate benchmarks in Rs. (NPR).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>+ Add New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriesList.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <span className="text-xs font-normal text-slate-400">({cat.nameNe})</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Benchmark: <span className="font-extrabold text-slate-900 dark:text-white">Rs. {cat.rate}/hr</span>
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: MARKETPLACE FUNNEL & CONVERSION ANALYTICS                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "analytics" && initialAnalyticsData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span>{tx("Marketplace Funnel & Conversion Analytics", "बजार रूपान्तरण विश्लेषण")}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Key conversion funnel metrics, category share, and top marketplace performers.
              </p>
            </div>

            {/* Funnel Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Applications Submitted</span>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {initialAnalyticsData.funnel.totalApplications}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Matches Accepted</span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {initialAnalyticsData.funnel.acceptedApplications}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Hire Conversion Rate</span>
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                  {initialAnalyticsData.funnel.conversionRate}%
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Completed Jobs</span>
                <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                  {initialAnalyticsData.funnel.completedJobs}
                </p>
              </div>
            </div>

            {/* Category Demand Share */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Category Demand Share & Average Budget
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialAnalyticsData.categories.map((c) => (
                  <div
                    key={c.category}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{c.category}</p>
                      <p className="text-[11px] text-slate-500">{c.jobCount} job posts recorded</p>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Avg Rs. {c.avgBudget.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: MONETIZATION & FEATURED PAYMENTS                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "monetization" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={tx("Search by user, ref number, job title...", "प्रयोगकर्ता, सन्दर्भ नम्बर खोज्नुहोस्...")}
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{tx("All Statuses", "सबै भुक्तानी स्थिति")}</option>
                  <option value="COMPLETED">{tx("COMPLETED", "सम्पन्न")}</option>
                  <option value="PENDING">{tx("PENDING", "प्रतीक्षारत")}</option>
                  <option value="FAILED">{tx("FAILED", "असफल")}</option>
                </select>

                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{tx("All Types", "सबै प्रकार")}</option>
                  <option value="BOOST_JOB">{tx("Boost Job", "काम बूस्ट")}</option>
                  <option value="FEATURE_PROFILE">{tx("Feature Profile", "प्रोफाइल फिचर्ड")}</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowManualTxModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{tx("Record / Boost", "रेकर्ड / बूस्ट")}</span>
                </button>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {tx("No transactions recorded yet", "कुनै भुक्तानी फेला परेन")}
                </h3>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">{tx("User / Recruiter", "प्रयोगकर्ता / नियोक्ता")}</th>
                        <th className="py-3.5 px-4">{tx("Type / Item", "प्रकार / वस्तु")}</th>
                        <th className="py-3.5 px-4">{tx("Amount", "रकम")}</th>
                        <th className="py-3.5 px-4">{tx("Gateway & Ref", "गेटवे र सन्दर्भ")}</th>
                        <th className="py-3.5 px-4">{tx("Status", "स्थिति")}</th>
                        <th className="py-3.5 px-4 text-right">{tx("Action", "कार्य")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredTransactions.map((txItem) => {
                        const userName =
                          txItem.user.workerProfile?.name ||
                          txItem.user.recruiterProfile?.name ||
                          txItem.user.email.split("@")[0];

                        return (
                          <tr key={txItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-extrabold text-slate-900 dark:text-white">{userName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{txItem.user.email}</p>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  txItem.type === "BOOST_JOB"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                    : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                }`}
                              >
                                {txItem.type}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                              Rs. {txItem.amount.toLocaleString()}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold mr-1.5">{txItem.gateway}</span>
                              <span className="font-mono text-slate-500 text-[11px]">{txItem.gatewayRef || "N/A"}</span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[11px]">{txItem.status}</span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setShowVatReceiptModal(txItem)}
                                  className="px-2 py-1 text-slate-600 hover:text-orange-600 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold"
                                >
                                  VAT Receipt
                                </button>
                                {txItem.status === "PENDING" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTransaction(txItem.id, "COMPLETED")}
                                    className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg"
                                  >
                                    Approve
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: FINANCIAL RECONCILIATION & CSV EXPORT                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "reconciliation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>{tx("Financial Reconciliation & Tax Export", "वित्तीय हिसाब मिलान तथा कर विवरण")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Reconcile eSewa and Khalti gateway references and download Excel/CSV reports for accounting.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportTransactionsCsv}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Reconciliation CSV</span>
              </button>
            </div>

            {/* Gateway Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">eSewa Nepal Volume</span>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  Rs. {initialTransactions
                    .filter((t) => t.gateway === "ESEWA" && t.status === "COMPLETED")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Direct digital wallet</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Khalti Nepal Volume</span>
                <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                  Rs. {initialTransactions
                    .filter((t) => t.gateway === "KHALTI" && t.status === "COMPLETED")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">SDK & web checkout</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Configurable Boost Pricing</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
                  7-Day Boost: Rs. {boostPricingForm.boost7Days} &bull; 30-Day Feature: Rs. {boostPricingForm.feature30Days}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: OPERATOR AUDIT LOGS & RBAC                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <span>{tx("Operator Security Audit Logs (RBAC)", "प्रशासक अडिट लग तथा सुरक्षा")}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cryptographic security log tracking which operator performed administrative actions.
              </p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator Email</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {initialAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.adminEmail}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{log.target}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{log.details || "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: USERS MANAGEMENT & MODERATION (PRESERVED)                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={tx("Search by name, email, phone...", "नाम, इमेल, फोन खोज्नुहोस्...")}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{tx("All Roles", "सबै भूमिकाहरू")}</option>
                  <option value="WORKER">{tx("Workers", "श्रमिकहरू")}</option>
                  <option value="RECRUITER">{tx("Recruiters", "नियोक्ताहरू")}</option>
                  <option value="ADMIN">{tx("Admins", "प्रशासकहरू")}</option>
                </select>

                <select
                  value={userKycFilter}
                  onChange={(e) => setUserKycFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{tx("All KYC Statuses", "सबै केवाइसी अवस्था")}</option>
                  <option value="VERIFIED">{tx("Verified", "प्रमाणित")}</option>
                  <option value="PENDING">{tx("Pending Review", "समीक्षा बाँकी")}</option>
                  <option value="UNVERIFIED">{tx("Unverified", "अप्रमाणित")}</option>
                  <option value="REJECTED">{tx("Rejected", "अस्वीकृत")}</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">{tx("User / Identity", "उपभोक्ता / पहिचान")}</th>
                    <th className="py-3.5 px-4">{tx("Role", "भूमिका")}</th>
                    <th className="py-3.5 px-4">{tx("KYC Status", "केवाइसी अवस्था")}</th>
                    <th className="py-3.5 px-4">{tx("Contact / Phone", "सम्पर्क / फोन")}</th>
                    <th className="py-3.5 px-4">{tx("Activity", "गतिविधि")}</th>
                    <th className="py-3.5 px-4 text-right">{tx("Actions", "कार्यहरू")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredUsers.map((user) => {
                    const name = user.workerProfile?.name || user.recruiterProfile?.name || user.email.split("@")[0];
                    const kycStatus = user.workerProfile?.kycStatus || user.recruiterProfile?.kycStatus || "UNVERIFIED";
                    const isFeatured = user.workerProfile?.isFeatured || false;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                <span>{name}</span>
                                {isFeatured && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                    ⭐ Featured
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[11px]">
                            {user.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            {kycStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span>{user.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePhoneVerified(user)}
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800"
                              >
                                {user.phoneVerified ? "✓ Verified" : "Unverified"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {user._count.postedJobs} jobs &bull; {user._count.applications} apps
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setRoleChangeTarget({
                                  user,
                                  newRole: user.role === "WORKER" ? "RECRUITER" : user.role === "RECRUITER" ? "ADMIN" : "WORKER",
                                })
                              }
                              className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-orange-600 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold"
                            >
                              Role
                            </button>
                            {user.role === "WORKER" && (
                              <button
                                type="button"
                                onClick={() => handleToggleWorkerFeatured(user.id, isFeatured)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600"
                                title="Toggle Featured"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {user.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() => setDeleteUserTarget(user)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: JOB POSTINGS MODERATION (PRESERVED)                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={tx("Search jobs by title, recruiter, category...", "शीर्षक, नियोक्ता, विधा खोज्नुहोस्...")}
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="MATCHED">MATCHED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>

                <button
                  type="button"
                  onClick={() => setJobBoostFilter(!jobBoostFilter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                    jobBoostFilter ? "bg-orange-600 text-white" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Boosted Only</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{job.title}</h4>
                      <p className="text-xs text-slate-500">{job.category} &bull; {job.address}</p>
                    </div>

                    <select
                      value={job.status}
                      onChange={(e) => handleJobStatusChange(job.id, e.target.value as JobStatus)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="MATCHED">MATCHED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{job.description}</p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-extrabold">Rs. {job.budget || "Negotiable"}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleJobBoost(job)}
                        className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg"
                      >
                        {job.isBoosted ? "Boosted" : "Boost (7d)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteJobTarget(job)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* Warning Strike Modal */}
      <AnimatePresence>
        {strikeModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Issue Administrative Warning Strike</span>
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Deliver an official warning strike to <span className="font-bold">{strikeModalUser.name}</span> for
                breach of agreement or marketplace guidelines.
              </p>

              <div>
                <label className="block text-xs font-bold mb-1">Reason for Warning Strike</label>
                <textarea
                  rows={3}
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  placeholder="e.g. Worker did not show up without notification; Refused agreed payment..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStrikeModalUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleIssueWarningStrike}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl"
                >
                  Confirm Strike
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mediate & Resolve Job Modal */}
      <AnimatePresence>
        {resolveJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-orange-600">
                <Scale className="w-5 h-5" />
                <span>Mediate & Settle Gig Dispute</span>
              </h4>

              <div>
                <label className="block text-xs font-bold mb-1">Set Settled Job Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as JobStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="COMPLETED">COMPLETED (Gig delivered, mark finished)</option>
                  <option value="CLOSED">CLOSED (Cancelled / Refunded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Official resolution notes explaining the decision to both parties..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveJobModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveDispute}
                  className="px-4 py-2 text-xs font-bold bg-orange-600 text-white rounded-xl"
                >
                  Apply Settlement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VAT / PAN Receipt Modal */}
      <AnimatePresence>
        {showVatReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  KamGhar Platform Tax Receipt (PAN / VAT)
                </h4>
                <button type="button" onClick={() => setShowVatReceiptModal(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p><span className="font-bold">Receipt ID:</span> {showVatReceiptModal.id}</p>
                <p><span className="font-bold">Issued To:</span> {showVatReceiptModal.user.email}</p>
                <p><span className="font-bold">Item:</span> {showVatReceiptModal.type} (7 Days)</p>
                <p><span className="font-bold">Gateway Ref:</span> {showVatReceiptModal.gatewayRef || "N/A"}</p>
                <p><span className="font-bold">Amount:</span> Rs. {showVatReceiptModal.amount} NPR</p>
                <p><span className="font-bold">Status:</span> {showVatReceiptModal.status}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 text-xs font-bold bg-orange-600 text-white rounded-xl"
                >
                  Print Voucher
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KYC Proof Preview Modal */}
      <AnimatePresence>
        {previewDocUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Document Proof Preview</span>
                </h4>
                <button type="button" onClick={() => setPreviewDocUrl(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950 max-h-[70vh] overflow-auto">
                <img src={previewDocUrl} alt="KYC Document Preview" className="max-h-[60vh] w-auto object-contain rounded-lg shadow-sm" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
