"use client";

import { useRouter } from "next/navigation";
import { LiquidGlassModalShell } from "@/components/liquid-glass-modal-shell";
import JobPostForm from "./job-post-form";

export default function LiquidGlassNewJobPopup({
  defaultDistrict,
}: {
  defaultDistrict: string;
}) {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <LiquidGlassModalShell
      titleId="direct-liquid-post-job-title"
      badgeText="New Requirement"
      title="Post a Job Requirement"
      subtitle="Connect with verified local workers and technicians in your area."
      onClose={handleClose}
    >
      <JobPostForm
        isModal
        defaultDistrict={defaultDistrict}
        onClose={handleClose}
      />
    </LiquidGlassModalShell>
  );
}
