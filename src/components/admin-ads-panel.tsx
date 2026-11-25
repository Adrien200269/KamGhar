"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  BarChart3,
  Pause,
  Play,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  Calendar,
} from "lucide-react";
import { AdAudience, AdPlacement } from "@prisma/client";
import UploadcareImageUploader from "@/components/uploadcare-image-uploader";
import { SponsoredAdCard } from "@/components/sponsored-ads-section";
import {
  createAdByAdmin,
  updateAdByAdmin,
  toggleAdActiveByAdmin,
  deleteAdByAdmin,
  type AdminAdItem,
} from "@/app/actions/ads";

type AdFormState = {
  sponsorName: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  ctaLabel: string;
  placement: AdPlacement;
  audience: AdAudience;
  badgeText: string;
  priority: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const EMPTY_FORM: AdFormState = {
  sponsorName: "",
  title: "",
  description: "",
  imageUrl: "",
  targetUrl: "https://",
  ctaLabel: "Learn More",
  placement: "BOTH",
  audience: "ALL",
  badgeText: "Sponsored",
  priority: "10",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function AdminAdsPanel({
  initialAds,
  showToast,
}: {
  initialAds: AdminAdItem[];
  showToast: (text: string, type?: "success" | "error") => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ads, setAds] = useState<AdminAdItem[]>(initialAds);
  const [placementFilter, setPlacementFilter] = useState<"ALL" | AdPlacement>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  const [editingAd, setEditingAd] = useState<AdminAdItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AdFormState>(EMPTY_FORM);
  const [previewMode, setPreviewMode] = useState<"wide" | "dashboard">("wide");
  const [deleteTarget, setDeleteTarget] = useState<AdminAdItem | null>(null);

  const metrics = useMemo(() => {
    const total = ads.length;
    const active = ads.filter((a) => a.isActive).length;
    const impressions = ads.reduce((sum, a) => sum + a.impressions, 0);
    const clicks = ads.reduce((sum, a) => sum + a.clicks, 0);
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";
    return { total, active, impressions, clicks, ctr };
  }, [ads]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (placementFilter !== "ALL" && ad.placement !== placementFilter) {
        return false;
      }
      if (statusFilter === "ACTIVE" && !ad.isActive) return false;
      if (statusFilter === "PAUSED" && ad.isActive) return false;
      return true;
    });
  }, [ads, placementFilter, statusFilter]);

  const openCreateForm = () => {
    setEditingAd(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (ad: AdminAdItem) => {
    setEditingAd(ad);
    setForm({
      sponsorName: ad.sponsorName,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl || "",
      targetUrl: ad.targetUrl,
      ctaLabel: ad.ctaLabel,
      placement: ad.placement,
      audience: ad.audience,
      badgeText: ad.badgeText,
      priority: String(ad.priority),
      isActive: ad.isActive,
      startsAt: toDateInputValue(ad.startsAt),
      endsAt: toDateInputValue(ad.endsAt),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      sponsorName: form.sponsorName,
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl.trim() || null,
      targetUrl: form.targetUrl,
      ctaLabel: form.ctaLabel,
      placement: form.placement,
      audience: form.audience,
      badgeText: form.badgeText,
      priority: Number(form.priority) || 0,
      isActive: form.isActive,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };

    startTransition(async () => {
      if (editingAd) {
        const res = await updateAdByAdmin(editingAd.id, payload);
        if (res.success && res.data) {
          setAds((prev) =>
            prev.map((a) => (a.id === editingAd.id ? res.data! : a))
          );
          setShowForm(false);
          setEditingAd(null);
          showToast(`Updated ad "${res.data.title}"`);
          router.refresh();
        } else {
          showToast(res.error || "Failed to update ad", "error");
        }
      } else {
        const res = await createAdByAdmin(payload);
        if (res.success && res.data) {
          setAds((prev) => [res.data!, ...prev]);
          setShowForm(false);
          setForm(EMPTY_FORM);
          showToast(`Published ad "${res.data.title}"`);
          router.refresh();
        } else {
          showToast(res.error || "Failed to create ad", "error");
        }
      }
    });
  };

  const handleToggleActive = (ad: AdminAdItem) => {
    startTransition(async () => {
      const res = await toggleAdActiveByAdmin(ad.id, !ad.isActive);
      if (res.success && res.data) {
        setAds((prev) => prev.map((a) => (a.id === ad.id ? res.data! : a)));
        showToast(
          res.data.isActive
            ? `Activated "${ad.title}"`
            : `Paused "${ad.title}"`
        );
        router.refresh();
      } else {
        showToast(res.error || "Failed to update ad status", "error");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const targetTitle = deleteTarget.title;
    startTransition(async () => {
      const res = await deleteAdByAdmin(targetId);
      if (res.success) {
        setAds((prev) => prev.filter((a) => a.id !== targetId));
        setDeleteTarget(null);
        showToast(`Deleted ad "${targetTitle}"`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete ad", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-600" />
            <span>Sponsored Advertisements Manager</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Post and manage paid sponsor banners displayed on the Landing Page (/) and User Dashboard (/dashboard).
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Ad</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Campaigns</span>
            <Megaphone className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.total}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            {metrics.active} active right now
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.impressions.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Impressions served</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Clicks</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.clicks.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sponsor link clicks</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Average CTR</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.ctr}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Clicks per view</p>
        </div>
      </div>

      {/* Create / Edit Ad Builder */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 shadow-xl p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {editingAd ? "Edit Advertisement" : "Create New Sponsored Ad"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAd(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form Fields */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sponsor / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={form.sponsorName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, sponsorName: e.target.value }))
                      }
                      placeholder="e.g. Himalayan Hardware"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={form.badgeText}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, badgeText: e.target.value }))
                      }
                      placeholder="Sponsored"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Headline *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. 20% Off Bosch Drills & Electrical Kits in Kathmandu"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={320}
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Short persuasive copy explaining the offer..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Destination URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.targetUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, targetUrl: e.target.value }))
                      }
                      placeholder="https://example.com or /rate-guide"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={form.ctaLabel}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, ctaLabel: e.target.value }))
                      }
                      placeholder="Shop Offer"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Image URL + Uploadcare uploader */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Banner / Photo URL (Optional)
                    </label>
                    <UploadcareImageUploader
                      label="Upload Ad Banner"
                      onUpload={(url) =>
                        setForm((p) => ({ ...p, imageUrl: url }))
                      }
                    />
                  </div>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    placeholder="https://... (or click Upload Ad Banner above)"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* Placement, Audience, Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Show Where
                    </label>
                    <select
                      value={form.placement}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          placement: e.target.value as AdPlacement,
                        }))
                      }
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="BOTH">Landing &amp; Dashboard</option>
                      <option value="LANDING">Landing Page (/)</option>
                      <option value="DASHBOARD">Dashboard Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Dashboard Audience
                    </label>
                    <select
                      value={form.audience}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          audience: e.target.value as AdAudience,
                        }))
                      }
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="ALL">All Users</option>
                      <option value="WORKER">Workers Only</option>
                      <option value="RECRUITER">Recruiters Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Priority (0–999)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={form.priority}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, priority: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Schedule Window & Active Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={form.startsAt}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, startsAt: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={form.endsAt}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, endsAt: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isActive: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Active (show immediately within schedule)</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAd(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{editingAd ? "Save Changes" : "Publish Ad"}</span>
                  </button>
                </div>
              </div>

              {/* Right Live Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Live Preview
                  </span>
                  <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("wide")}
                      className={`px-2.5 py-1 rounded-md cursor-pointer ${
                        previewMode === "wide"
                          ? "bg-white dark:bg-slate-900 text-orange-600 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      Landing
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("dashboard")}
                      className={`px-2.5 py-1 rounded-md cursor-pointer ${
                        previewMode === "dashboard"
                          ? "bg-white dark:bg-slate-900 text-orange-600 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      Dashboard
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800">
                  <SponsoredAdCard
                    previewOnly
                    layout={previewMode === "dashboard" ? "dashboard" : "grid"}
                    ad={{
                      id: "preview",
                      sponsorName: form.sponsorName || "Sponsor Brand",
                      title: form.title || "Your Advertisement Headline",
                      description:
                        form.description ||
                        "Short sponsor offer description will appear here.",
                      imageUrl: form.imageUrl.trim() || null,
                      targetUrl: form.targetUrl || "https://example.com",
                      ctaLabel: form.ctaLabel || "Learn More",
                      placement: form.placement,
                      audience: form.audience,
                      badgeText: form.badgeText || "Sponsored",
                    }}
                  />
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", "LANDING", "DASHBOARD", "BOTH"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlacementFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                placementFilter === p
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {p === "ALL"
                ? "All Placements"
                : p === "BOTH"
                ? "Landing + Dashboard"
                : p === "LANDING"
                ? "Landing Only"
                : "Dashboard Only"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(["ALL", "ACTIVE", "PAUSED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Paused"}
            </button>
          ))}
        </div>
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 mx-auto flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
            No advertisements posted yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &ldquo;Post New Ad&rdquo; above to add your first sponsored partner banner for the Landing Page or User Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAds.map((ad) => {
            const ctr =
              ad.impressions > 0
                ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                : "0.0";

            return (
              <div
                key={ad.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-600 shrink-0">
                      <Megaphone className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          ad.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {ad.isActive ? "Active" : "Paused"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/50">
                        {ad.placement}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {ad.audience}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Priority {ad.priority}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      {ad.sponsorName} • {ad.badgeText}
                    </p>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                      {ad.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {ad.description}
                    </p>
                  </div>
                </div>

                {/* Stats & Link Row */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        {ad.impressions.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
                        {ad.clicks.toLocaleString()}
                      </span>
                      <span className="text-slate-400">CTR {ctr}%</span>
                    </div>

                    {(ad.startsAt || ad.endsAt) && (
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ad.startsAt ? ad.startsAt.slice(0, 10) : "Now"} →{" "}
                        {ad.endsAt ? ad.endsAt.slice(0, 10) : "Open"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-slate-500 hover:text-orange-600 inline-flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ad.targetUrl}</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(ad)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        {ad.isActive ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-emerald-600" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditForm(ad)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(ad)}
                        aria-label="Delete ad"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <h4 className="text-base font-extrabold text-rose-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>Delete Advertisement</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Permanently remove &ldquo;{deleteTarget.title}&rdquo; by{" "}
                <span className="font-bold">{deleteTarget.sponsorName}</span>?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Deleting..." : "Delete Ad"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
